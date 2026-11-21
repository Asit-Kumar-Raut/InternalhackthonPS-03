"""
Vehicle Registration and Review API.
- POST /api/vehicles/register (Public multipart/form-data)
- GET /api/vehicles (ADMIN, OPERATOR)
- GET /api/vehicles/{id}
- POST /api/vehicles/{id}/approve
- POST /api/vehicles/{id}/reject
- POST /api/vehicles/{id}/suspend
- POST /api/vehicles/{id}/reinstate
- POST /api/vehicles/{id}/reverify
- GET /api/files/{path:path} (Authenticated file serving)
"""
import os
import re
from datetime import datetime
from typing import List, Optional
from fastapi import APIRouter, Depends, HTTPException, UploadFile, File, Form, status
from fastapi.responses import FileResponse
from sqlalchemy.orm import Session

from app.database import get_db
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleType, VehicleStatus
from app.schemas import VehicleResponse, RejectRequest
from app.auth.jwt import get_password_hash
from app.auth.dependencies import get_current_user, require_roles
from app.utils.files import save_upload_file
from app.utils.events import emit_event, log_audit
from app.core.ai_client import AIClient
from app.config import settings

router = APIRouter(tags=["Vehicles"])
ai_client = AIClient()

PLATE_REGEX = re.compile(r"^[A-Z]{2}[0-9]{2}[A-Z]{1,2}[0-9]{4}$")


@router.post("/vehicles/register", status_code=status.HTTP_201_CREATED)
async def register_vehicle(
    vehicle_number: str = Form(...),
    vehicle_type: str = Form(...),
    org_name: str = Form(...),
    org_type: str = Form(...),
    org_reg_no: str = Form(...),
    driver_name: str = Form(...),
    phone: str = Form(...),
    email: str = Form(...),
    password: str = Form(...),
    vehicle_photo: UploadFile = File(...),
    driver_photo: UploadFile = File(...),
    rc_photo: UploadFile = File(...),
    auth_letter: Optional[UploadFile] = File(None),
    db: Session = Depends(get_db),
):
    norm_plate = vehicle_number.strip().upper().replace(" ", "").replace("-", "")
    if not PLATE_REGEX.match(norm_plate):
        raise HTTPException(
            status_code=400,
            detail=f"Invalid vehicle plate format '{vehicle_number}'. Expected e.g. OD02AB1234",
        )

    # Check email and vehicle uniqueness
    if db.query(User).filter(User.email == email.strip().lower()).first():
        raise HTTPException(status_code=400, detail="An account with this email already exists")

    if db.query(Vehicle).filter(Vehicle.vehicle_number == norm_plate).first():
        raise HTTPException(status_code=400, detail="Vehicle number already registered")

    # Save uploaded photos
    veh_path = await save_upload_file(vehicle_photo)
    driver_path = await save_upload_file(driver_photo)
    rc_path = await save_upload_file(rc_photo)
    auth_path = await save_upload_file(auth_letter) if auth_letter else None

    # Create DRIVER user
    user = User(
        email=email.strip().lower(),
        password_hash=get_password_hash(password),
        role=UserRole.DRIVER,
        created_at=datetime.utcnow(),
    )
    db.add(user)
    db.flush()

    # Create Vehicle record
    v_type_enum = VehicleType(vehicle_type.upper()) if vehicle_type.upper() in VehicleType.__members__ else VehicleType.AMBULANCE
    vehicle = Vehicle(
        user_id=user.id,
        vehicle_number=norm_plate,
        vehicle_type=v_type_enum,
        org_name=org_name,
        org_type=org_type,
        org_reg_no=org_reg_no,
        driver_name=driver_name,
        phone=phone,
        email=email.strip().lower(),
        vehicle_photo_path=veh_path,
        driver_photo_path=driver_path,
        rc_photo_path=rc_path,
        auth_letter_path=auth_path,
        status=VehicleStatus.PENDING,
        trust_score=70,
        strikes=0,
        created_at=datetime.utcnow(),
    )
    db.add(vehicle)
    db.commit()
    db.refresh(vehicle)

    # Trigger async AI photo check
    try:
        if os.path.exists(veh_path):
            with open(veh_path, "rb") as f:
                img_bytes = f.read()
            ai_res = await ai_client.verify_vehicle_photo(
                image_bytes=img_bytes,
                filename=os.path.basename(veh_path),
                typed_plate=norm_plate,
            )
            vehicle.ai_vehicle_class = ai_res.get("vehicle_class")
            vehicle.ai_plate_text = ai_res.get("plate_text")
            vehicle.ai_plate_match = ai_res.get("plate_match_score", 0.0)
            vehicle.ai_confidence = ai_res.get("class_confidence", 0.0)
            db.commit()
    except Exception:
        pass

    emit_event("VEHICLE_REGISTERED", {
        "vehicle_id": vehicle.id,
        "vehicle_number": vehicle.vehicle_number,
        "driver_name": vehicle.driver_name,
        "status": vehicle.status.value,
    })

    return {
        "message": "Vehicle registered successfully. Status is PENDING admin approval.",
        "vehicle_id": vehicle.id,
        "status": vehicle.status.value,
    }


@router.get("/vehicles", response_model=List[VehicleResponse])
def list_vehicles(
    status: Optional[str] = None,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
    db: Session = Depends(get_db),
):
    query = db.query(Vehicle)
    if status:
        query = query.filter(Vehicle.status == status.upper())
    return query.order_by(Vehicle.created_at.desc()).all()


@router.get("/vehicles/{id}", response_model=VehicleResponse)
def get_vehicle(
    id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    # DRIVER can only see their own vehicle
    if current_user.role == UserRole.DRIVER and vehicle.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")

    return vehicle


@router.post("/vehicles/{id}/approve")
def approve_vehicle(
    id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    vehicle.status = VehicleStatus.APPROVED
    vehicle.reviewed_by = current_user.id
    vehicle.reviewed_at = datetime.utcnow()
    db.commit()

    log_audit("APPROVE_VEHICLE", current_user.id, "VEHICLE", vehicle.id, {"vehicle_number": vehicle.vehicle_number}, db)
    emit_event("VEHICLE_APPROVED", {"vehicle_id": vehicle.id, "vehicle_number": vehicle.vehicle_number}, actor=current_user.email, db=db)
    return {"message": "Vehicle approved", "status": vehicle.status.value}


@router.post("/vehicles/{id}/reject")
def reject_vehicle(
    id: int,
    req: RejectRequest,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    vehicle.status = VehicleStatus.REJECTED
    vehicle.reject_reason = req.reason
    vehicle.reviewed_by = current_user.id
    vehicle.reviewed_at = datetime.utcnow()
    db.commit()

    log_audit("REJECT_VEHICLE", current_user.id, "VEHICLE", vehicle.id, {"reason": req.reason}, db)
    emit_event("VEHICLE_REJECTED", {"vehicle_id": vehicle.id, "reason": req.reason}, actor=current_user.email, db=db)
    return {"message": "Vehicle rejected", "status": vehicle.status.value}


@router.post("/vehicles/{id}/suspend")
def suspend_vehicle(
    id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    vehicle.status = VehicleStatus.SUSPENDED
    db.commit()

    log_audit("SUSPEND_VEHICLE", current_user.id, "VEHICLE", vehicle.id, {}, db)
    emit_event("VEHICLE_SUSPENDED", {"vehicle_id": vehicle.id, "vehicle_number": vehicle.vehicle_number}, actor=current_user.email, db=db)
    return {"message": "Vehicle suspended", "status": vehicle.status.value}


@router.post("/vehicles/{id}/reinstate")
def reinstate_vehicle(
    id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle:
        raise HTTPException(status_code=404, detail="Vehicle not found")

    vehicle.status = VehicleStatus.APPROVED
    vehicle.strikes = 0
    vehicle.trust_score = 70
    db.commit()

    log_audit("REINSTATE_VEHICLE", current_user.id, "VEHICLE", vehicle.id, {}, db)
    emit_event("VEHICLE_APPROVED", {"vehicle_id": vehicle.id, "reinstated": True}, actor=current_user.email, db=db)
    return {"message": "Vehicle reinstated", "status": vehicle.status.value}


@router.post("/vehicles/{id}/reverify")
async def reverify_vehicle(
    id: int,
    current_user: User = Depends(require_roles([UserRole.ADMIN, UserRole.OPERATOR])),
    db: Session = Depends(get_db),
):
    vehicle = db.query(Vehicle).filter(Vehicle.id == id).first()
    if not vehicle or not vehicle.vehicle_photo_path:
        raise HTTPException(status_code=404, detail="Vehicle or photo not found")

    if os.path.exists(vehicle.vehicle_photo_path):
        with open(vehicle.vehicle_photo_path, "rb") as f:
            img_bytes = f.read()
        ai_res = await ai_client.verify_vehicle_photo(
            image_bytes=img_bytes,
            filename=os.path.basename(vehicle.vehicle_photo_path),
            typed_plate=vehicle.vehicle_number,
        )
        vehicle.ai_vehicle_class = ai_res.get("vehicle_class")
        vehicle.ai_plate_text = ai_res.get("plate_text")
        vehicle.ai_plate_match = ai_res.get("plate_match_score", 0.0)
        vehicle.ai_confidence = ai_res.get("class_confidence", 0.0)
        db.commit()

    return {"message": "AI reverification complete", "vehicle": vehicle}


@router.get("/files/{path:path}")
def serve_file(
    path: str,
    current_user: User = Depends(get_current_user),
):
    # Normalized secure path inside uploads/
    full_path = os.path.abspath(os.path.join(settings.UPLOAD_DIR, os.path.basename(path)))
    if not os.path.exists(full_path):
        raise HTTPException(status_code=404, detail="File not found")
    return FileResponse(full_path)
