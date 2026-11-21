import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Float, Enum as SAEnum, ForeignKey, DateTime
from app.database import Base


class CongestionLevel(str, enum.Enum):
    LOW = "LOW"
    MEDIUM = "MEDIUM"
    HIGH = "HIGH"
    CONGESTED = "CONGESTED"


class CameraReading(Base):
    __tablename__ = "camera_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    count = Column(Integer, default=0)
    queue_length = Column(Float, default=0.0)
    vehicle_class = Column(String, nullable=True)
    confidence = Column(Float, nullable=True)
    timestamp = Column(DateTime, default=datetime.utcnow)


class SpeedReading(Base):
    __tablename__ = "speed_readings"

    id = Column(Integer, primary_key=True, index=True)
    sensor_id = Column(Integer, ForeignKey("sensors.id"), nullable=False)
    avg_speed = Column(Float, default=0.0)
    timestamp = Column(DateTime, default=datetime.utcnow)


class CongestionState(Base):
    __tablename__ = "congestion_state"

    id = Column(Integer, primary_key=True, index=True)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False, unique=True)
    level = Column(SAEnum(CongestionLevel), default=CongestionLevel.LOW)
    occupancy = Column(Float, default=0.0)
    speed = Column(Float, default=50.0)
    updated_at = Column(DateTime, default=datetime.utcnow)
