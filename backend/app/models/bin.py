from pydantic import BaseModel, Field
from typing import Optional, List
from datetime import datetime
from enum import Enum


class BinType(str, Enum):
    GENERAL = "general"
    RECYCLABLE = "recyclable"
    ORGANIC = "organic"
    HAZARDOUS = "hazardous"
    E_WASTE = "e-waste"


class BinStatus(str, Enum):
    ACTIVE = "active"
    MAINTENANCE = "maintenance"
    OFFLINE = "offline"
    FULL = "full"


class Location(BaseModel):
    type: str = "Point"
    coordinates: List[float] = Field(..., description="[longitude, latitude]")


class SensorData(BaseModel):
    fill_level: float = Field(0, ge=0, le=100, description="Fill percentage 0-100")
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    methane_level: Optional[float] = None
    battery_level: float = Field(100, ge=0, le=100)
    last_reading: datetime = Field(default_factory=datetime.utcnow)


class BinCreate(BaseModel):
    bin_id: str = Field(..., min_length=3, max_length=20)
    name: str
    bin_type: BinType = BinType.GENERAL
    capacity_liters: float = 240
    location: Location
    address: str = ""
    zone_id: str
    description: Optional[str] = None


class BinResponse(BaseModel):
    id: str
    bin_id: str
    name: str
    bin_type: BinType
    capacity_liters: float
    location: Location
    address: str
    zone_id: str
    status: BinStatus
    sensor_data: SensorData
    last_collected: Optional[datetime] = None
    collection_count: int = 0
    created_at: datetime
    description: Optional[str] = None


class BinUpdate(BaseModel):
    name: Optional[str] = None
    bin_type: Optional[BinType] = None
    capacity_liters: Optional[float] = None
    address: Optional[str] = None
    zone_id: Optional[str] = None
    status: Optional[BinStatus] = None
    description: Optional[str] = None


class BinSensorUpdate(BaseModel):
    fill_level: Optional[float] = Field(None, ge=0, le=100)
    temperature: Optional[float] = None
    humidity: Optional[float] = None
    methane_level: Optional[float] = None
    battery_level: Optional[float] = Field(None, ge=0, le=100)
