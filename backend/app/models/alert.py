from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class AlertPriority(str, Enum):
    LOW = "low"
    MEDIUM = "medium"
    HIGH = "high"
    CRITICAL = "critical"


class AlertType(str, Enum):
    OVERFLOW = "overflow"
    MAINTENANCE = "maintenance"
    ANOMALY = "anomaly"
    BATTERY_LOW = "battery_low"
    TEMPERATURE = "temperature"
    METHANE = "methane"
    OFFLINE = "offline"
    COLLECTION_MISSED = "collection_missed"


class AlertStatus(str, Enum):
    ACTIVE = "active"
    ACKNOWLEDGED = "acknowledged"
    RESOLVED = "resolved"
    DISMISSED = "dismissed"


class AlertResponse(BaseModel):
    id: str
    alert_id: str
    alert_type: AlertType
    priority: AlertPriority
    status: AlertStatus
    title: str
    message: str
    bin_id: Optional[str] = None
    zone_id: Optional[str] = None
    vehicle_id: Optional[str] = None
    acknowledged_by: Optional[str] = None
    resolved_by: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None


class ZoneCreate(BaseModel):
    zone_id: str
    name: str
    city: str = ""
    description: Optional[str] = None
    boundary: Optional[List[List[float]]] = None
    collection_frequency: str = "daily"
    assigned_vehicles: List[str] = []


class ZoneResponse(BaseModel):
    id: str
    zone_id: str
    name: str
    city: str
    description: Optional[str] = None
    total_bins: int = 0
    active_bins: int = 0
    avg_fill_level: float = 0
    collection_frequency: str
    assigned_vehicles: List[str] = []
    boundary: Optional[List[List[float]]] = None
    created_at: datetime


class ZoneUpdate(BaseModel):
    name: Optional[str] = None
    city: Optional[str] = None
    description: Optional[str] = None
    collection_frequency: Optional[str] = None
    assigned_vehicles: Optional[List[str]] = None
    boundary: Optional[List[List[float]]] = None


class CollectionRecord(BaseModel):
    id: str
    bin_id: str
    vehicle_id: str
    route_id: Optional[str] = None
    zone_id: str
    weight_kg: float = 0
    fill_level_before: float = 0
    fill_level_after: float = 0
    collected_by: Optional[str] = None
    timestamp: datetime
    notes: Optional[str] = None


class CitizenReport(BaseModel):
    report_type: str = Field(..., description="overflow, illegal_dump, damaged_bin, suggestion")
    description: str
    location: Optional[dict] = None
    bin_id: Optional[str] = None


class CitizenReportResponse(BaseModel):
    id: str
    user_id: str
    report_type: str
    description: str
    status: str = "pending"
    location: Optional[dict] = None
    bin_id: Optional[str] = None
    reward_points_earned: int = 0
    created_at: datetime
    resolved_at: Optional[datetime] = None


class SchedulePickup(BaseModel):
    address: str
    waste_type: str
    estimated_weight_kg: float = 0
    preferred_date: datetime
    notes: Optional[str] = None


class RewardResponse(BaseModel):
    user_id: str
    total_points: int
    level: str
    reports_submitted: int
    pickups_scheduled: int
    recycling_score: float
    badges: List[str] = []
    rank: int = 0
