from __future__ import annotations
from datetime import datetime
from typing import Optional, List, Any, Dict
from pydantic import BaseModel, EmailStr, field_validator
from app.models.user import UserRole
from app.models.vehicle import VehicleType, VehicleStatus
from app.models.junction import JunctionStatus
from app.models.signal import SignalPhase, SignalState
from app.models.sensor import SensorType, SensorStatus
from app.models.reading import CongestionLevel
from app.models.emergency import EmergencyStatus


# ── Auth ──────────────────────────────────────────────────────────────────────
class LoginRequest(BaseModel):
    email: str
    password: str


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"


class UserOut(BaseModel):
    id: int
    email: str
    role: UserRole
    model_config = {"from_attributes": True}


# ── Vehicle ───────────────────────────────────────────────────────────────────
class VehicleOut(BaseModel):
    id: int
    user_id: int
    vehicle_number: str
    vehicle_type: VehicleType
    org_name: str
    org_type: Optional[str]
    org_reg_no: Optional[str]
    driver_name: str
    phone: str
    email: str
    vehicle_photo_path: Optional[str]
    driver_photo_path: Optional[str]
    rc_photo_path: Optional[str]
    auth_letter_path: Optional[str]
    status: VehicleStatus
    reject_reason: Optional[str]
    trust_score: int
    strikes: int
    ai_plate_text: Optional[str]
    ai_plate_match: Optional[bool]
    ai_vehicle_class: Optional[str]
    ai_confidence: Optional[float]
    created_at: datetime
    reviewed_by: Optional[int]
    reviewed_at: Optional[datetime]
    model_config = {"from_attributes": True}


class RejectRequest(BaseModel):
    reason: str



# ── Junction ──────────────────────────────────────────────────────────────────
class JunctionOut(BaseModel):
    id: int
    name: str
    x: float
    y: float
    status: JunctionStatus
    model_config = {"from_attributes": True}


# ── Road ──────────────────────────────────────────────────────────────────────
class RoadOut(BaseModel):
    id: int
    from_junction_id: int
    to_junction_id: int
    length_m: float
    lanes: int
    capacity: int
    name: Optional[str]
    model_config = {"from_attributes": True}


# ── Signal ────────────────────────────────────────────────────────────────────
class SignalOut(BaseModel):
    id: int
    junction_id: int
    phase: SignalPhase
    state: SignalState
    timer_s: float
    model_config = {"from_attributes": True}


# ── Sensor ────────────────────────────────────────────────────────────────────
class SensorOut(BaseModel):
    id: int
    type: SensorType
    road_id: int
    status: SensorStatus
    last_seen: Optional[datetime]
    model_config = {"from_attributes": True}


class CameraReadingIn(BaseModel):
    count: int
    queue_length: float
    vehicle_class: Optional[str] = None
    confidence: Optional[float] = None


class SpeedReadingIn(BaseModel):
    avg_speed: float


class SensorReadingIn(BaseModel):
    type: SensorType
    data: Dict[str, Any]


# ── Congestion ────────────────────────────────────────────────────────────────
class CongestionStateOut(BaseModel):
    road_id: int
    level: CongestionLevel
    occupancy: float
    speed: float
    updated_at: datetime
    model_config = {"from_attributes": True}


# ── Emergency ─────────────────────────────────────────────────────────────────
class EmergencyPlanRequest(BaseModel):
    vehicle_id: int
    route_junctions: List[int]


class EmergencyRequestIn(BaseModel):
    vehicle_id: int
    route_junctions: List[int]


class EmergencyPositionUpdate(BaseModel):
    junction_id: int
    distance_m: float
    speed_kmh: float


class EmergencyRequestOut(BaseModel):
    id: int
    vehicle_id: int
    status: EmergencyStatus
    route_junctions: List[int]
    junction_confirmations: Dict[str, Any]
    flags: Dict[str, Any]
    created_at: datetime
    activated_at: Optional[datetime]
    completed_at: Optional[datetime]
    aborted_at: Optional[datetime]
    model_config = {"from_attributes": True}


# ── Config ────────────────────────────────────────────────────────────────────
class ConfigOut(BaseModel):
    key: str
    value: str
    description: Optional[str]
    updated_at: datetime
    model_config = {"from_attributes": True}


class ConfigUpdateItem(BaseModel):
    key: str
    value: str


class ConfigBulkUpdate(BaseModel):
    items: List[ConfigUpdateItem]


# ── Events ────────────────────────────────────────────────────────────────────
class EventOut(BaseModel):
    id: int
    type: str
    payload: Dict[str, Any]
    actor: Optional[str]
    created_at: datetime
    model_config = {"from_attributes": True}


# ── Analytics ─────────────────────────────────────────────────────────────────
class AnalyticsSummary(BaseModel):
    total_vehicles: int
    approved_vehicles: int
    pending_vehicles: int
    active_emergencies: int
    total_junctions: int
    total_events_today: int


class OverrideRequest(BaseModel):
    phase: SignalPhase
    duration_s: int = 30


class AIToggleRequest(BaseModel):
    enabled: bool

UserResponse = UserOut
VehicleResponse = VehicleOut
JunctionResponse = JunctionOut
RoadResponse = RoadOut
SignalResponse = SignalOut
SensorResponse = SensorOut

