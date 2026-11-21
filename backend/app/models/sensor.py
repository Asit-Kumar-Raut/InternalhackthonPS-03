import enum
from datetime import datetime
from sqlalchemy import Column, Integer, String, Enum as SAEnum, ForeignKey, DateTime
from app.database import Base


class SensorType(str, enum.Enum):
    CAMERA = "CAMERA"
    SPEED = "SPEED"


class SensorStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    FAULT = "FAULT"


class Sensor(Base):
    __tablename__ = "sensors"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(SAEnum(SensorType), nullable=False)
    road_id = Column(Integer, ForeignKey("roads.id"), nullable=False)
    api_key = Column(String, nullable=False)  # stored hashed
    status = Column(SAEnum(SensorStatus), default=SensorStatus.ACTIVE)
    last_seen = Column(DateTime, nullable=True)
