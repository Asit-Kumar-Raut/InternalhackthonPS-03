import enum
from sqlalchemy import Column, Integer, String, Float, Enum as SAEnum, ForeignKey
from app.database import Base


class SignalPhase(str, enum.Enum):
    NS = "NS"
    EW = "EW"


class SignalState(str, enum.Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    ALL_RED = "ALL_RED"


class Signal(Base):
    __tablename__ = "signals"

    id = Column(Integer, primary_key=True, index=True)
    junction_id = Column(Integer, ForeignKey("junctions.id"), nullable=False, unique=True)
    phase = Column(SAEnum(SignalPhase), default=SignalPhase.NS)
    state = Column(SAEnum(SignalState), default=SignalState.GREEN)
    timer_s = Column(Float, default=0.0)
