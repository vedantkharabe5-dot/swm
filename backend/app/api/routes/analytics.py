from fastapi import APIRouter, Depends, Query
from datetime import datetime, timezone, timedelta
from app.core.database import get_database
from app.api.deps import get_current_user

router = APIRouter(prefix="/analytics", tags=["Analytics & Predictions"])


@router.get("/dashboard")
async def dashboard_stats(user=Depends(get_current_user)):
    """Main dashboard KPI data."""
    db = get_database()

    total_bins = await db.bins.count_documents({})
    active_bins = await db.bins.count_documents({"status": "active"})
    full_bins = await db.bins.count_documents({"sensor_data.fill_level": {"$gte": 80}})
    total_vehicles = await db.vehicles.count_documents({})
    active_alerts = await db.alerts.count_documents({"status": "active"})
    total_collections = await db.collections.count_documents({})

    # Average fill level
    fill_pipeline = [{"$group": {"_id": None, "avg": {"$avg": "$sensor_data.fill_level"}}}]
    fill_result = await db.bins.aggregate(fill_pipeline).to_list(1)
    avg_fill = round(fill_result[0]["avg"], 1) if fill_result else 0

    # Total waste collected (kg)
    weight_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$weight_kg"}}}]
    weight_result = await db.collections.aggregate(weight_pipeline).to_list(1)
    total_waste_kg = round(weight_result[0]["total"], 1) if weight_result else 0

    # Recycling rate (recyclable / total)
    recyclable_bins = await db.bins.count_documents({"bin_type": "recyclable"})
    recycling_rate = round((recyclable_bins / total_bins * 100), 1) if total_bins > 0 else 0

    return {
        "total_bins": total_bins,
        "active_bins": active_bins,
        "full_bins": full_bins,
        "total_vehicles": total_vehicles,
        "active_alerts": active_alerts,
        "total_collections": total_collections,
        "avg_fill_level": avg_fill,
        "total_waste_kg": total_waste_kg,
        "recycling_rate": recycling_rate,
        "co2_saved_kg": round(total_waste_kg * 0.23, 1),  # Rough CO2 offset per kg recycled
    }


@router.get("/trends")
async def collection_trends(days: int = Query(default=30, le=90), user=Depends(get_current_user)):
    """Daily collection trends over time."""
    db = get_database()
    start_date = datetime.now(timezone.utc) - timedelta(days=days)

    pipeline = [
        {"$match": {"timestamp": {"$gte": start_date}}},
        {"$group": {
            "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$timestamp"}},
            "collections": {"$sum": 1},
            "total_weight": {"$sum": "$weight_kg"},
            "avg_fill_before": {"$avg": "$fill_level_before"}
        }},
        {"$sort": {"_id": 1}}
    ]
    results = await db.collections.aggregate(pipeline).to_list(90)
    return {
        "period_days": days,
        "data": [
            {
                "date": r["_id"],
                "collections": r["collections"],
                "weight_kg": round(r["total_weight"], 1),
                "avg_fill_before": round(r["avg_fill_before"], 1)
            }
            for r in results
        ]
    }


@router.get("/zone-performance")
async def zone_performance(user=Depends(get_current_user)):
    """Performance metrics per zone."""
    db = get_database()

    pipeline = [
        {"$group": {
            "_id": "$zone_id",
            "total_bins": {"$sum": 1},
            "avg_fill": {"$avg": "$sensor_data.fill_level"},
            "full_bins": {"$sum": {"$cond": [{"$gte": ["$sensor_data.fill_level", 80]}, 1, 0]}},
            "avg_battery": {"$avg": "$sensor_data.battery_level"}
        }},
        {"$sort": {"avg_fill": -1}}
    ]
    bin_stats = await db.bins.aggregate(pipeline).to_list(50)

    # Get zone names
    zones = {}
    async for z in db.zones.find({}):
        zones[z["zone_id"]] = z.get("name", z["zone_id"])

    return [
        {
            "zone_id": s["_id"],
            "zone_name": zones.get(s["_id"], s["_id"]),
            "total_bins": s["total_bins"],
            "avg_fill_level": round(s["avg_fill"], 1),
            "full_bins": s["full_bins"],
            "avg_battery": round(s["avg_battery"], 1),
            "efficiency_score": round(max(0, 100 - s["avg_fill"]), 1)
        }
        for s in bin_stats
    ]


@router.get("/predictions")
async def fill_predictions(zone_id: str = None, user=Depends(get_current_user)):
    """Predict when bins will be full based on historical fill rates."""
    db = get_database()
    from app.services.prediction import predict_fill_times

    query = {"status": "active"}
    if zone_id:
        query["zone_id"] = zone_id

    bins = await db.bins.find(query).to_list(200)
    collections = await db.collections.find({}).sort("timestamp", -1).limit(1000).to_list(1000)

    predictions = predict_fill_times(bins, collections)
    return {
        "predictions": predictions,
        "generated_at": datetime.now(timezone.utc).isoformat(),
    }


@router.get("/waste-composition")
async def waste_composition(user=Depends(get_current_user)):
    """Waste composition breakdown by type."""
    db = get_database()
    pipeline = [
        {"$group": {
            "_id": "$bin_type",
            "count": {"$sum": 1},
            "avg_fill": {"$avg": "$sensor_data.fill_level"}
        }}
    ]
    results = await db.bins.aggregate(pipeline).to_list(10)
    total = sum(r["count"] for r in results)
    return [
        {
            "type": r["_id"],
            "count": r["count"],
            "percentage": round(r["count"] / total * 100, 1) if total > 0 else 0,
            "avg_fill": round(r["avg_fill"], 1)
        }
        for r in results
    ]


@router.get("/environmental-impact")
async def environmental_impact(user=Depends(get_current_user)):
    """Calculate environmental impact metrics."""
    db = get_database()

    weight_pipeline = [{"$group": {"_id": None, "total": {"$sum": "$weight_kg"}}}]
    result = await db.collections.aggregate(weight_pipeline).to_list(1)
    total_waste = result[0]["total"] if result else 0

    total_routes = await db.routes.count_documents({"status": "completed"})
    dist_pipeline = [
        {"$match": {"status": "completed"}},
        {"$group": {"_id": None, "total": {"$sum": "$total_distance_km"}}}
    ]
    dist_result = await db.routes.aggregate(dist_pipeline).to_list(1)
    total_distance = dist_result[0]["total"] if dist_result else 0

    recyclable_count = await db.bins.count_documents({"bin_type": "recyclable"})
    total_bins = await db.bins.count_documents({})

    return {
        "total_waste_collected_kg": round(total_waste, 1),
        "total_routes_completed": total_routes,
        "total_distance_optimized_km": round(total_distance, 1),
        "co2_saved_kg": round(total_waste * 0.23, 1),
        "trees_equivalent": round(total_waste * 0.23 / 21.77, 1),  # Avg tree absorbs 21.77kg CO2/year
        "fuel_saved_liters": round(total_distance * 0.15, 1),  # ~15% fuel savings from route optimization
        "recycling_rate": round((recyclable_count / total_bins * 100), 1) if total_bins else 0,
        "landfill_diverted_kg": round(total_waste * 0.35, 1),  # Estimated 35% diversion
    }
