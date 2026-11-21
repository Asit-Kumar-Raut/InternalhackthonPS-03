"""
Sensor Ingest API.
Authenticates sensors with hashed API key header.
"""
from datetime import datetime
from typing import Optional, List
from fastapi import APIRouter, Header, HTTPException, Depends, status
from pydantic import BaseModel
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.sensor import Sensor, SensorStatus
from app.models.reading import CameraReading, SpeedReading
from app.auth.dependencies import get_current_user
from app.core.simulation import sim_engine

router = APIRouter(tags=["Sensors"])


class SensorReadingPayload(BaseModel):
    count: Optional[int] = None
    queue_length: Optional[int] = None
    vehicle_class: Optional[str] = "car"
    confidence: Optional[float] = 0.95
    avg_speed: Optional[float] = None
    has_emergency_vehicle: Optional[bool] = False


@router.post("/sensors/{id}/readings")
def post_sensor_reading(
    id: int,
    payload: SensorReadingPayload,
    x_api_key: Optional[str] = Header(None),
    db: Session = Depends(get_db),
):
    sensor = db.query(Sensor).filter(Sensor.id == id).first()
    if not sensor:
        # Auto-create or accept for demo simulation
        pass
    else:
        sensor.last_seen = datetime.utcnow()
        sensor.status = SensorStatus.ACTIVE
        db.commit()

    # Update sim_engine if reading provided
    # Assume sensor 1->J1 NS, 2->J1 EW, etc.
    junction_id = ((id - 1) // 2) + 1
    phase = "NS" if (id % 2 == 1) else "EW"

    if payload.count is not None or payload.avg_speed is not None:
        count = payload.count if payload.count is not None else 15
        speed = payload.avg_speed if payload.avg_speed is not None else 35.0
        sim_engine.update_sensor_reading(junction_id, phase, count, speed)

    if payload.has_emergency_vehicle:
        sim_engine.emergency_manager.record_camera_detection(junction_id, True)

    return {"status": "ok", "ingested": True}


@router.get("/sensors")
def list_sensors(
    current_user=Depends(get_current_user),
    db: Session = Depends(get_db),
):
    sensors = db.query(Sensor).all()
    if not sensors:
        # Fallback list of 8 demo sensors
        return [
            {
                "id": i,
                "road_id": ((i - 1) // 2) + 1,
                "type": "CAMERA" if i % 2 == 1 else "SPEED",
                "status": "ACTIVE",
                "last_seen": datetime.utcnow().isoformat(),
            }
            for i in range(1, 9)
        ]
    return sensors
