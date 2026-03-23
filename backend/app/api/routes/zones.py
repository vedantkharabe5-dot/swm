from fastapi import APIRouter, HTTPException, Depends
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database
from app.api.deps import get_current_user, require_operator
from app.models.alert import ZoneCreate, ZoneResponse, ZoneUpdate

router = APIRouter(prefix="/zones", tags=["Zone Management"])


@router.get("/", response_model=list[ZoneResponse])
async def list_zones(user=Depends(get_current_user)):
    db = get_database()
    cursor = db.zones.find({}).sort("zone_id", 1)
    zones = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        # Calculate live stats
        total = await db.bins.count_documents({"zone_id": doc["zone_id"]})
        active = await db.bins.count_documents({"zone_id": doc["zone_id"], "status": "active"})
        fill_pipeline = [
            {"$match": {"zone_id": doc["zone_id"]}},
            {"$group": {"_id": None, "avg": {"$avg": "$sensor_data.fill_level"}}}
        ]
        fill_result = await db.bins.aggregate(fill_pipeline).to_list(1)
        doc["total_bins"] = total
        doc["active_bins"] = active
        doc["avg_fill_level"] = round(fill_result[0]["avg"], 1) if fill_result else 0
        zones.append(ZoneResponse(**doc))
    return zones


@router.post("/", response_model=ZoneResponse, status_code=201)
async def create_zone(data: ZoneCreate, user=Depends(require_operator)):
    db = get_database()
    existing = await db.zones.find_one({"zone_id": data.zone_id})
    if existing:
        raise HTTPException(status_code=400, detail="Zone ID already exists")

    doc = {
        **data.model_dump(),
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.zones.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    doc["total_bins"] = 0
    doc["active_bins"] = 0
    doc["avg_fill_level"] = 0
    return ZoneResponse(**doc)


@router.get("/{zone_id}", response_model=ZoneResponse)
async def get_zone(zone_id: str, user=Depends(get_current_user)):
    db = get_database()
    doc = await db.zones.find_one({"zone_id": zone_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Zone not found")
    doc["id"] = str(doc["_id"])
    total = await db.bins.count_documents({"zone_id": zone_id})
    active = await db.bins.count_documents({"zone_id": zone_id, "status": "active"})
    fill_pipeline = [
        {"$match": {"zone_id": zone_id}},
        {"$group": {"_id": None, "avg": {"$avg": "$sensor_data.fill_level"}}}
    ]
    fill_result = await db.bins.aggregate(fill_pipeline).to_list(1)
    doc["total_bins"] = total
    doc["active_bins"] = active
    doc["avg_fill_level"] = round(fill_result[0]["avg"], 1) if fill_result else 0
    return ZoneResponse(**doc)


@router.put("/{zone_id}", response_model=ZoneResponse)
async def update_zone(zone_id: str, update: ZoneUpdate, user=Depends(require_operator)):
    db = get_database()
    fields = {k: v for k, v in update.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.zones.find_one_and_update(
        {"zone_id": zone_id}, {"$set": fields}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Zone not found")
    result["id"] = str(result["_id"])
    result["total_bins"] = 0
    result["active_bins"] = 0
    result["avg_fill_level"] = 0
    return ZoneResponse(**result)


@router.delete("/{zone_id}")
async def delete_zone(zone_id: str, user=Depends(require_operator)):
    db = get_database()
    bins = await db.bins.count_documents({"zone_id": zone_id})
    if bins > 0:
        raise HTTPException(status_code=400, detail=f"Cannot delete zone with {bins} bins. Remove bins first.")
    result = await db.zones.delete_one({"zone_id": zone_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Zone not found")
    return {"message": "Zone deleted"}
