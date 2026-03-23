from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database
from app.api.deps import get_current_user
from app.models.alert import CitizenReport, CitizenReportResponse, SchedulePickup, RewardResponse

router = APIRouter(prefix="/citizens", tags=["Citizen Engagement"])


@router.post("/reports", response_model=CitizenReportResponse, status_code=201)
async def submit_report(report: CitizenReport, user=Depends(get_current_user)):
    db = get_database()
    reward_points = {"overflow": 10, "illegal_dump": 20, "damaged_bin": 5, "suggestion": 5}
    points = reward_points.get(report.report_type, 5)

    doc = {
        "user_id": user["id"],
        "report_type": report.report_type,
        "description": report.description,
        "status": "pending",
        "location": report.location,
        "bin_id": report.bin_id,
        "reward_points_earned": points,
        "created_at": datetime.now(timezone.utc),
        "resolved_at": None,
    }
    result = await db.citizen_reports.insert_one(doc)
    doc["id"] = str(result.inserted_id)

    # Award points
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$inc": {"reward_points": points}}
    )

    return CitizenReportResponse(**doc)


@router.get("/reports", response_model=list[CitizenReportResponse])
async def get_my_reports(user=Depends(get_current_user)):
    db = get_database()
    cursor = db.citizen_reports.find({"user_id": user["id"]}).sort("created_at", -1).limit(50)
    reports = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        reports.append(CitizenReportResponse(**doc))
    return reports


@router.get("/reports/all", response_model=list[CitizenReportResponse])
async def get_all_reports(status: str = None, user=Depends(get_current_user)):
    """Admin endpoint to view all reports."""
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    cursor = db.citizen_reports.find(query).sort("created_at", -1).limit(100)
    reports = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        reports.append(CitizenReportResponse(**doc))
    return reports


@router.post("/pickups", status_code=201)
async def schedule_pickup(pickup: SchedulePickup, user=Depends(get_current_user)):
    db = get_database()
    doc = {
        "user_id": user["id"],
        "address": pickup.address,
        "waste_type": pickup.waste_type,
        "estimated_weight_kg": pickup.estimated_weight_kg,
        "preferred_date": pickup.preferred_date,
        "notes": pickup.notes,
        "status": "scheduled",
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.pickups.insert_one(doc)

    # Award points for scheduling
    await db.users.update_one(
        {"_id": ObjectId(user["id"])},
        {"$inc": {"reward_points": 15}}
    )

    return {
        "id": str(result.inserted_id),
        "status": "scheduled",
        "message": "Pickup scheduled successfully! You earned 15 reward points.",
        "reward_points_earned": 15
    }


@router.get("/rewards", response_model=RewardResponse)
async def get_my_rewards(user=Depends(get_current_user)):
    db = get_database()
    reports_count = await db.citizen_reports.count_documents({"user_id": user["id"]})
    pickups_count = await db.pickups.count_documents({"user_id": user["id"]})
    points = user.get("reward_points", 0)

    # Calculate level
    if points >= 1000:
        level = "Platinum Eco-Warrior"
    elif points >= 500:
        level = "Gold Recycler"
    elif points >= 200:
        level = "Silver Sorter"
    elif points >= 50:
        level = "Bronze Collector"
    else:
        level = "Eco Newbie"

    # Badges
    badges = []
    if reports_count >= 1:
        badges.append("First Report")
    if reports_count >= 10:
        badges.append("Watchful Citizen")
    if pickups_count >= 1:
        badges.append("Scheduled First Pickup")
    if pickups_count >= 5:
        badges.append("Regular Recycler")
    if points >= 100:
        badges.append("Century Club")
    if points >= 500:
        badges.append("Eco Champion")

    # Rank
    total_users = await db.users.count_documents({"role": "citizen"})
    higher_ranked = await db.users.count_documents({
        "role": "citizen",
        "reward_points": {"$gt": points}
    })
    rank = higher_ranked + 1

    return RewardResponse(
        user_id=user["id"],
        total_points=points,
        level=level,
        reports_submitted=reports_count,
        pickups_scheduled=pickups_count,
        recycling_score=min(100, points / 10),
        badges=badges,
        rank=rank
    )


@router.get("/leaderboard")
async def leaderboard(limit: int = 20, user=Depends(get_current_user)):
    db = get_database()
    cursor = db.users.find(
        {"role": "citizen", "reward_points": {"$gt": 0}},
        {"name": 1, "reward_points": 1, "zone_id": 1}
    ).sort("reward_points", -1).limit(limit)

    leaders = []
    rank = 1
    async for u in cursor:
        leaders.append({
            "rank": rank,
            "name": u["name"],
            "points": u.get("reward_points", 0),
            "zone_id": u.get("zone_id"),
        })
        rank += 1
    return leaders
