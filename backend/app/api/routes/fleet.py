from fastapi import APIRouter, HTTPException, Depends, Query
from datetime import datetime, timezone
from bson import ObjectId
from app.core.database import get_database
from app.api.deps import get_current_user, require_operator
from app.models.route import (
    RouteCreate, RouteResponse, RouteStatus, RouteWaypoint,
    VehicleCreate, VehicleResponse, VehicleUpdate, VehicleStatus
)

router = APIRouter(prefix="/fleet", tags=["Fleet Management"])


# ─────────── VEHICLES ───────────

@router.get("/vehicles", response_model=list[VehicleResponse])
async def list_vehicles(status: str = None, user=Depends(get_current_user)):
    db = get_database()
    query = {}
    if status:
        query["status"] = status
    cursor = db.vehicles.find(query).sort("created_at", -1)
    vehicles = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        vehicles.append(VehicleResponse(**doc))
    return vehicles


@router.post("/vehicles", response_model=VehicleResponse, status_code=201)
async def create_vehicle(data: VehicleCreate, user=Depends(require_operator)):
    db = get_database()
    existing = await db.vehicles.find_one({"vehicle_id": data.vehicle_id})
    if existing:
        raise HTTPException(status_code=400, detail="Vehicle ID already exists")

    doc = {
        **data.model_dump(),
        "status": VehicleStatus.AVAILABLE.value,
        "current_location": None,
        "fuel_level": 100,
        "total_collections": 0,
        "total_distance_km": 0,
        "current_route_id": None,
        "created_at": datetime.now(timezone.utc),
    }
    result = await db.vehicles.insert_one(doc)
    doc["id"] = str(result.inserted_id)
    return VehicleResponse(**doc)


@router.get("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def get_vehicle(vehicle_id: str, user=Depends(get_current_user)):
    db = get_database()
    doc = await db.vehicles.find_one({"vehicle_id": vehicle_id})
    if not doc:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    doc["id"] = str(doc["_id"])
    return VehicleResponse(**doc)


@router.put("/vehicles/{vehicle_id}", response_model=VehicleResponse)
async def update_vehicle(vehicle_id: str, update: VehicleUpdate, user=Depends(require_operator)):
    db = get_database()
    fields = {k: v for k, v in update.model_dump().items() if v is not None}
    if not fields:
        raise HTTPException(status_code=400, detail="No fields to update")
    result = await db.vehicles.find_one_and_update(
        {"vehicle_id": vehicle_id}, {"$set": fields}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    result["id"] = str(result["_id"])
    return VehicleResponse(**result)


@router.delete("/vehicles/{vehicle_id}")
async def delete_vehicle(vehicle_id: str, user=Depends(require_operator)):
    db = get_database()
    result = await db.vehicles.delete_one({"vehicle_id": vehicle_id})
    if result.deleted_count == 0:
        raise HTTPException(status_code=404, detail="Vehicle not found")
    return {"message": "Vehicle deleted"}


@router.get("/vehicles/stats/overview")
async def vehicle_stats(user=Depends(get_current_user)):
    db = get_database()
    total = await db.vehicles.count_documents({})
    available = await db.vehicles.count_documents({"status": "available"})
    on_route = await db.vehicles.count_documents({"status": "on_route"})
    maintenance = await db.vehicles.count_documents({"status": "maintenance"})
    return {
        "total": total,
        "available": available,
        "on_route": on_route,
        "maintenance": maintenance,
    }


# ─────────── ROUTES ───────────

@router.get("/routes", response_model=list[RouteResponse])
async def list_routes(
    zone_id: str = None,
    status: str = None,
    limit: int = Query(50, le=200),
    user=Depends(get_current_user)
):
    db = get_database()
    query = {}
    if zone_id:
        query["zone_id"] = zone_id
    if status:
        query["status"] = status
    cursor = db.routes.find(query).sort("created_at", -1).limit(limit)
    routes = []
    async for doc in cursor:
        doc["id"] = str(doc["_id"])
        routes.append(RouteResponse(**doc))
    return routes


@router.post("/routes/optimize", response_model=RouteResponse, status_code=201)
async def create_optimized_route(data: RouteCreate, user=Depends(require_operator)):
    db = get_database()
    from app.services.route_optimizer import optimize_route

    # Get bins in the zone that need collection (fill > 60%)
    bins_cursor = db.bins.find({
        "zone_id": data.zone_id,
        "status": {"$in": ["active", "full"]},
        "sensor_data.fill_level": {"$gte": 60}
    })
    bins = await bins_cursor.to_list(100)

    if not bins:
        raise HTTPException(status_code=400, detail="No bins need collection in this zone")

    # Optimize route
    optimized = optimize_route(bins)

    import uuid
    route_doc = {
        "route_id": f"RT-{uuid.uuid4().hex[:8].upper()}",
        "zone_id": data.zone_id,
        "vehicle_id": data.vehicle_id,
        "status": RouteStatus.PLANNED.value,
        "priority": data.priority,
        "waypoints": optimized["waypoints"],
        "total_bins": len(optimized["waypoints"]),
        "collected_bins": 0,
        "total_distance_km": optimized["total_distance_km"],
        "estimated_duration_min": optimized["estimated_duration_min"],
        "scheduled_date": data.scheduled_date,
        "started_at": None,
        "completed_at": None,
        "created_at": datetime.now(timezone.utc),
    }

    # Get driver name if vehicle assigned
    if data.vehicle_id:
        vehicle = await db.vehicles.find_one({"vehicle_id": data.vehicle_id})
        if vehicle:
            route_doc["driver_name"] = vehicle.get("driver_name")

    result = await db.routes.insert_one(route_doc)
    route_doc["id"] = str(result.inserted_id)
    return RouteResponse(**route_doc)


@router.put("/routes/{route_id}/status")
async def update_route_status(route_id: str, new_status: str, user=Depends(require_operator)):
    db = get_database()
    update = {"status": new_status}
    if new_status == "in_progress":
        update["started_at"] = datetime.now(timezone.utc)
    elif new_status == "completed":
        update["completed_at"] = datetime.now(timezone.utc)

    result = await db.routes.find_one_and_update(
        {"route_id": route_id}, {"$set": update}, return_document=True
    )
    if not result:
        raise HTTPException(status_code=404, detail="Route not found")
    result["id"] = str(result["_id"])
    return RouteResponse(**result)
