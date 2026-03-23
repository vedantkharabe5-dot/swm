from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database
from app.api.deps import get_current_user, require_operator
from app.models.alert import AlertResponse, AlertStatus

router = APIRouter(prefix="/alerts", tags=["Alerts & Notifications"])


@router.get("/", response_model=list[AlertResponse])
async def list_alerts(
    status: str = None,
    priority: str = None,
    limit: int = Query(50, le=200),
    user=Depends(get_current_user)
):
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    if priority:
        query["priority"] = priority

    cursor = db.alerts.find(query).sort([("priority", -1), ("created_at", -1)]).limit(limit)
    alerts = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        alerts.append(AlertResponse(**doc))
    return alerts


@router.get("/stats")
async def alert_stats(user=Depends(get_current_user)):
    db = get_database()
    total = await db.alerts.count_documents({})
    active = await db.alerts.count_documents({"status": "active"})
    critical = await db.alerts.count_documents({"status": "active", "priority": "critical"})
    high = await db.alerts.count_documents({"status": "active", "priority": "high"})
    resolved_today = await db.alerts.count_documents({
        "status": "resolved",
        "updated_at": {"$gte": datetime.now(timezone.utc).replace(hour=0, minute=0, second=0)}
    })

    # By type
    type_pipeline = [
        {"$match": {"status": "active"}},
        {"$group": {"_id": "$alert_type", "count": {"$sum": 1}}}
    ]
    type_result = await db.alerts.aggregate(type_pipeline).to_list(10)

    return {
        "total": total,
        "active": active,
        "critical": critical,
        "high": high,
        "resolved_today": resolved_today,
        "by_type": {r["_id"]: r["count"] for r in type_result}
    }


@router.put("/{alert_id}/acknowledge")
async def acknowledge_alert(alert_id: str, user=Depends(require_operator)):
    db = get_database()
    result = await db.alerts.find_one_and_update(
        {"alert_id": alert_id},
        {"$set": {
            "status": AlertStatus.ACKNOWLEDGED.value,
            "acknowledged_by": user["name"],
            "updated_at": datetime.now(timezone.utc)
        }},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    result["id"] = str(result["_id"])
    return AlertResponse(**result)


@router.put("/{alert_id}/resolve")
async def resolve_alert(alert_id: str, user=Depends(require_operator)):
    db = get_database()
    result = await db.alerts.find_one_and_update(
        {"alert_id": alert_id},
        {"$set": {
            "status": AlertStatus.RESOLVED.value,
            "resolved_by": user["name"],
            "updated_at": datetime.now(timezone.utc)
        }},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    result["id"] = str(result["_id"])
    return AlertResponse(**result)


@router.put("/{alert_id}/dismiss")
async def dismiss_alert(alert_id: str, user=Depends(require_operator)):
    db = get_database()
    result = await db.alerts.find_one_and_update(
        {"alert_id": alert_id},
        {"$set": {
            "status": AlertStatus.DISMISSED.value,
            "updated_at": datetime.now(timezone.utc)
        }},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Alert not found")
    result["id"] = str(result["_id"])
    return AlertResponse(**result)
