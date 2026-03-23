import math
import random
from datetime import datetime


def haversine_distance(coord1, coord2):
    """Calculate distance between two points (lat, lon) in km."""
    R = 6371  # Earth radius in km
    lat1, lon1 = math.radians(coord1[1]), math.radians(coord1[0])
    lat2, lon2 = math.radians(coord2[1]), math.radians(coord2[0])

    dlat = lat2 - lat1
    dlon = lon2 - lon1
    a = math.sin(dlat / 2) ** 2 + math.cos(lat1) * math.cos(lat2) * math.sin(dlon / 2) ** 2
    c = 2 * math.asin(math.sqrt(a))
    return R * c


def optimize_route(bins):
    """
    Greedy nearest-neighbor route optimization with priority weighting.
    Bins with higher fill levels are prioritized.
    Returns optimized waypoint order with estimated distance and duration.
    """
    if not bins:
        return {"waypoints": [], "total_distance_km": 0, "estimated_duration_min": 0}

    # Sort by priority (fill level * urgency weight)
    scored_bins = []
    for b in bins:
        fill = b.get("sensor_data", {}).get("fill_level", 0)
        priority_score = fill
        if fill >= 90:
            priority_score *= 1.5  # Critical urgency
        elif fill >= 80:
            priority_score *= 1.2
        scored_bins.append((priority_score, b))

    scored_bins.sort(key=lambda x: -x[0])

    # Nearest-neighbor algorithm
    unvisited = [b for _, b in scored_bins]
    route = [unvisited.pop(0)]
    total_distance = 0

    while unvisited:
        current = route[-1]
        current_coords = current.get("location", {}).get("coordinates", [0, 0])

        best_dist = float("inf")
        best_idx = 0

        for i, b in enumerate(unvisited):
            b_coords = b.get("location", {}).get("coordinates", [0, 0])
            dist = haversine_distance(current_coords, b_coords)

            # Weight by fill level urgency
            fill = b.get("sensor_data", {}).get("fill_level", 0)
            urgency_factor = max(0.3, 1 - (fill / 200))  # Higher fill = lower cost factor
            weighted_dist = dist * urgency_factor

            if weighted_dist < best_dist:
                best_dist = weighted_dist
                best_idx = i

        actual_dist = haversine_distance(
            current.get("location", {}).get("coordinates", [0, 0]),
            unvisited[best_idx].get("location", {}).get("coordinates", [0, 0])
        )
        total_distance += actual_dist
        route.append(unvisited.pop(best_idx))

    # Build waypoints
    waypoints = []
    for i, b in enumerate(route):
        waypoints.append({
            "bin_id": b["bin_id"],
            "order": i + 1,
            "estimated_arrival": None,
            "actual_arrival": None,
            "collected": False,
        })

    # Estimate duration: avg speed 25 km/h in city + 3 min per bin for collection
    drive_time = (total_distance / 25) * 60  # minutes
    collection_time = len(route) * 3  # 3 min per bin
    estimated_duration = drive_time + collection_time

    return {
        "waypoints": waypoints,
        "total_distance_km": round(total_distance, 2),
        "estimated_duration_min": round(estimated_duration, 1),
    }
