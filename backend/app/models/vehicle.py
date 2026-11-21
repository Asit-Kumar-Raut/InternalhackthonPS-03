import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum as SAEnum, ForeignKey, DateTime, Boolean
from app.database import Base


class VehicleType(str, enum.Enum):
    AMBULANCE = "AMBULANCE"
    FIRE = "FIRE"
    POLICE = "POLICE"


class VehicleStatus(str, enum.Enum):
    PENDING = "PENDING"
    APPROVED = "APPROVED"
    REJECTED = "REJECTED"
    SUSPENDED = "SUSPENDED"


class Vehicle(Base):
    __tablename__ = "vehicles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    vehicle_number = Column(String, unique=True, index=True, nullable=False)
    vehicle_type = Column(SAEnum(VehicleType), nullable=False)
    org_name = Column(String, nullable=False)
    org_type = Column(String, nullable=True)
    org_reg_no = Column(String, nullable=True)
    driver_name = Column(String, nullable=False)
    phone = Column(String, nullable=False)
    email = Column(String, nullable=False)
    vehicle_photo_path = Column(String, nullable=True)
    driver_photo_path = Column(String, nullable=True)
    rc_photo_path = Column(String, nullable=True)
    auth_letter_path = Column(String, nullable=True)
    status = Column(SAEnum(VehicleStatus), default=VehicleStatus.PENDING, nullable=False)
    reject_reason = Column(String, nullable=True)
    trust_score = Column(Integer, default=70)
    strikes = Column(Integer, default=0)
    ai_plate_text = Column(String, nullable=True)
    ai_plate_match = Column(Boolean, nullable=True)
    ai_vehicle_class = Column(String, nullable=True)
    ai_confidence = Column(Float, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)
    reviewed_by = Column(Integer, ForeignKey("users.id"), nullable=True)
    reviewed_at = Column(DateTime, nullable=True)
