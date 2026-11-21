import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum as SAEnum, ForeignKey, DateTime, JSON
from app.database import Base


class EmergencyStatus(str, enum.Enum):
    PENDING_CONFIRM = "PENDING_CONFIRM"
    ACTIVE = "ACTIVE"
    COMPLETED = "COMPLETED"
    ABORTED = "ABORTED"
    REJECTED = "REJECTED"
    EXPIRED = "EXPIRED"


class EmergencyRequest(Base):
    __tablename__ = "emergency_requests"

    id = Column(Integer, primary_key=True, index=True)
    vehicle_id = Column(Integer, ForeignKey("vehicles.id"), nullable=False)
    status = Column(SAEnum(EmergencyStatus), default=EmergencyStatus.PENDING_CONFIRM)
    route_junctions = Column(JSON, default=list)
    junction_confirmations = Column(JSON, default=dict)
    flags = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
    activated_at = Column(DateTime, nullable=True)
    completed_at = Column(DateTime, nullable=True)
    aborted_at = Column(DateTime, nullable=True)
