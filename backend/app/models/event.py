from datetime import datetime
from sqlalchemy import Column, Integer, String, DateTime, JSON
from app.database import Base


class Event(Base):
    __tablename__ = "events"

    id = Column(Integer, primary_key=True, index=True)
    type = Column(String, nullable=False, index=True)
    payload = Column(JSON, default=dict)
    actor = Column(String, nullable=True)
    created_at = Column(DateTime, default=datetime.utcnow)


class AuditLog(Base):
    __tablename__ = "audit_log"

    id = Column(Integer, primary_key=True, index=True)
    action = Column(String, nullable=False)
    actor_id = Column(Integer, nullable=True)
    target_type = Column(String, nullable=True)
    target_id = Column(Integer, nullable=True)
    details = Column(JSON, default=dict)
    created_at = Column(DateTime, default=datetime.utcnow)
