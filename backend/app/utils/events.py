"""
Event persistence and streaming utilities.
All events are streamed through WebSocket and persisted asynchronously.
"""
import asyncio
import json
import logging
from datetime import datetime
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from app.models.event import Event, AuditLog
from app.database import SessionLocal

logger = logging.getLogger(__name__)

# Asynchronous broadcast queue for real-time WebSocket distribution
event_broadcast_queue: asyncio.Queue = asyncio.Queue()


def emit_event(
    event_type: str,
    payload: Dict[str, Any],
    actor: str = "SYSTEM",
    db: Optional[Session] = None,
) -> Dict[str, Any]:
    """
    Synchronously queues event for broadcast and persists to DB.
    """
    event_dict = {
        "type": event_type,
        "payload": payload,
        "actor": actor,
        "created_at": datetime.utcnow().isoformat(),
    }

    try:
        event_broadcast_queue.put_nowait(event_dict)
    except Exception as e:
        logger.error("Failed to put event in broadcast queue: %s", e)

    # Persist in DB
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True

    try:
        ev = Event(
            type=event_type,
            payload=json.dumps(payload),
            actor=actor,
            created_at=datetime.utcnow(),
        )
        db.add(ev)
        db.commit()
    except Exception as e:
        logger.error("Failed to persist event %s: %s", event_type, e)
        if db:
            db.rollback()
    finally:
        if own_session and db:
            db.close()

    return event_dict


def log_audit(
    action: str,
    actor_id: Optional[int],
    target_type: str,
    target_id: Optional[int] = None,
    details: Optional[Dict[str, Any]] = None,
    db: Optional[Session] = None,
) -> None:
    own_session = False
    if db is None:
        db = SessionLocal()
        own_session = True

    try:
        audit = AuditLog(
            action=action,
            actor_id=actor_id,
            target_type=target_type,
            target_id=target_id,
            details=json.dumps(details or {}),
            created_at=datetime.utcnow(),
        )
        db.add(audit)
        db.commit()
    except Exception as e:
        logger.error("Failed to write audit log: %s", e)
        if db:
            db.rollback()
    finally:
        if own_session and db:
            db.close()
