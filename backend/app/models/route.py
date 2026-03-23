from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class RouteStatus(str, Enum):
    PLANNED = "planned"
    IN_PROGRESS = "in_progress"
    COMPLETED = "completed"
    CANCELLED = "cancelled"


class RouteWaypoint(BaseModel):
    bin_id: str
    order: int
    estimated_arrival: Optional[datetime] = None
    actual_arrival: Optional[datetime] = None
    collected: bool = False


class RouteCreate(BaseModel):
    zone_id: str
    vehicle_id: Optional[str] = None
    priority: int = Field(1, ge=1, le=5)
    scheduled_date: datetime


class RouteResponse(BaseModel):
    id: str
    route_id: str
    zone_id: str
    vehicle_id: Optional[str] = None
    driver_name: Optional[str] = None
    status: RouteStatus
    priority: int
    waypoints: List[RouteWaypoint] = []
    total_bins: int = 0
    collected_bins: int = 0
    total_distance_km: float = 0
    estimated_duration_min: float = 0
    scheduled_date: datetime
    started_at: Optional[datetime] = None
    completed_at: Optional[datetime] = None
    created_at: datetime


class VehicleStatus(str, Enum):
    AVAILABLE = "available"
    ON_ROUTE = "on_route"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"


class VehicleCreate(BaseModel):
    vehicle_id: str
    name: str
    vehicle_type: str = "truck"
    capacity_kg: float = 5000
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None


class VehicleResponse(BaseModel):
    id: str
    vehicle_id: str
    name: str
    vehicle_type: str
    capacity_kg: float
    status: VehicleStatus
    current_location: Optional[dict] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    fuel_level: float = 100
    total_collections: int = 0
    total_distance_km: float = 0
    current_route_id: Optional[str] = None
    created_at: datetime


class VehicleUpdate(BaseModel):
    name: Optional[str] = None
    vehicle_type: Optional[str] = None
    capacity_kg: Optional[float] = None
    status: Optional[VehicleStatus] = None
    driver_name: Optional[str] = None
    driver_phone: Optional[str] = None
    fuel_level: Optional[float] = None
    current_location: Optional[dict] = None
