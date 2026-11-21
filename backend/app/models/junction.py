import enum
from sqlalchemy import Column, Integer, String, Float, Enum as SAEnum
from app.database import Base


class JunctionStatus(str, enum.Enum):
    ACTIVE = "ACTIVE"
    INACTIVE = "INACTIVE"
    FAULT = "FAULT"


class Junction(Base):
    __tablename__ = "junctions"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    x = Column(Float, default=0.0)
    y = Column(Float, default=0.0)
    status = Column(SAEnum(JunctionStatus), default=JunctionStatus.ACTIVE)
