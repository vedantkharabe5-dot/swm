from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database
from app.api.deps import get_current_user, require_operator
from app.models.bin import BinCreate, BinResponse, BinUpdate, BinSensorUpdate, SensorData, BinStatus

router = APIRouter(prefix="/bins", tags=["Smart Bins"])


def bin_doc_to_response(doc):
    doc["id"] = str(doc["_id"])
    if "sensor_data" not in doc:
        doc["sensor_data"] = SensorData().model_dump()
    return BinResponse(**doc)


@router.get("/", response_model=list[BinResponse])
async def list_bins(
    zone_id: str = None,
    status: str = None,
    bin_type: str = None,
    min_fill: float = None,
    limit: int = Query(default=200, le=500),
    user=Depends(get_current_user)
):
    db = get_database()
    query = {}
    if zone_id:
        query["zone_id"] = zone_id
    if status:
        query["status"] = status
    if bin_type:
        query["bin_type"] = bin_type
    if min_fill is not None:
        query["sensor_data.fill_level"] = {"$gte": min_fill}

    cursor = db.bins.find(query).sort("sensor_data.fill_level", -1).limit(limit)
    bins = []
    async for doc in cursor:
        bins.append(bin_doc_to_response(doc))
    return bins


@router.get("/stats")
async def get_bin_stats(user=Depends(get_current_user)):
    db = get_database()
    total = await db.bins.count_documents({})
    active = await db.bins.count_documents({"status": "active"})
    full = await db.bins.count_documents({"sensor_data.fill_level": {"$gte": 80}})
    maintenance = await db.bins.count_documents({"status": "maintenance"})
    offline = await db.bins.count_documents({"status": "offline"})

    pipeline = [
        {"$group": {
            "_id": None,
            "avg_fill": {"$avg": "$sensor_data.fill_level"},
            "avg_battery": {"$avg": "$sensor_data.battery_level"},
        }}
    ]
    agg_result = await db.bins.aggregate(pipeline).to_list(1)
    avg_fill = round(agg_result[0]["avg_fill"], 1) if agg_result else 0
    avg_battery = round(agg_result[0]["avg_battery"], 1) if agg_result else 0

    # By type
    type_pipeline = [{"$group": {"_id": "$bin_type", "count": {"$sum": 1}}}]
    type_result = await db.bins.aggregate(type_pipeline).to_list(10)
    by_type = {r["_id"]: r["count"] for r in type_result}

    # By zone
    zone_pipeline = [
        {"$group": {
            "_id": "$zone_id",
            "count": {"$sum": 1},
            "avg_fill": {"$avg": "$sensor_data.fill_level"}
        }}
    ]
    zone_result = await db.bins.aggregate(zone_pipeline).to_list(50)
    by_zone = [{"zone_id": r["_id"], "bins": r["count"], "avg_fill": round(r["avg_fill"], 1)} for r in zone_result]

    return {
        "total": total,
        "active": active,
        "full": full,
        "maintenance": maintenance,
        "offline": offline,
        "avg_fill_level": avg_fill,
        "avg_battery_level": avg_battery,
        "by_type": by_type,
        "by_zone": by_zone
    }


@router.get("/{bin_id}", response_model=BinResponse)
async def get_bin(bin_id: str, user=Depends(get_current_user)):
    db = get_database()
    doc = await db.bins.find_one({"bin_id": bin_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Bin not found")
    return bin_doc_to_response(doc)


@router.post("/", response_model=BinResponse, status_code=201)
async def create_bin(bin_data: BinCreate, user=Depends(require_operator)):
    db = get_database()
    existing = await db.bins.find_one({"bin_id": bin_data.bin_id})
    if existing:
        raise HTTPException(status_code=400, detail="Bin ID already exists")

    doc = {
        **bin_data.model_dump(),
        "location": bin_data.location.model_dump(),
        "status": BinStatus.ACTIVE.value,
        "sensor_data": SensorData().model_dump(),
        "last_collected": None,
        "collection_count": 0,
        "created_at": datetime.now(timezone.utc),
    }
    # Convert datetime to serializable
    doc["sensor_data"]["last_reading"] = datetime.now(timezone.utc)
    result = await db.bins.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return BinResponse(**doc)


@router.put("/{bin_id}", response_model=BinResponse)
async def update_bin(bin_id: str, update_data: BinUpdate, user=Depends(require_operator)):
    db = get_database()
    update_fields = {k: v for k, v in update_data.model_dump().items() if v is not None}
    if not update_fields:
        raise HTTPException(status_code=400, detail="No fields to update")

    result = await db.bins.find_one_and_update(
        {"bin_id": bin_id},
        {"$set": update_fields},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Bin not found")
    return bin_doc_to_response(result)


@router.put("/{bin_id}/sensor", response_model=BinResponse)
async def update_sensor_data(bin_id: str, sensor_data: BinSensorUpdate):
    """Endpoint for IoT devices to push sensor data (no auth for device compatibility)."""
    db = get_database()
    update_fields = {}
    for k, v in sensor_data.model_dump().items():
        if v is not None:
            update_fields[f"sensor_data.{k}"] = v
    update_fields["sensor_data.last_reading"] = datetime.now(timezone.utc)

    # Auto-set status based on fill level
    if sensor_data.fill_level is not None and sensor_data.fill_level >= 90:
        update_fields["status"] = BinStatus.FULL.value

    result = await db.bins.find_one_and_update(
        {"bin_id": bin_id},
        {"$set": update_fields},
        return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Bin not found")
    return bin_doc_to_response(result)


@router.delete("/{bin_id}")
async def delete_bin(bin_id: str, user=Depends(require_operator)):
    db = get_database()
    result = await db.bins.delete_one({"bin_id": bin_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Bin not found")
    return {"message": "Bin deleted successfully"}
