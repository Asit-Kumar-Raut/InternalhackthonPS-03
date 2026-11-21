"""
Authentication Router.
POST /api/auth/login
GET /api/auth/me
"""
from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.database import get_db
from app.models.user import User, UserRole
from app.models.vehicle import Vehicle, VehicleStatus
from app.schemas import LoginRequest, TokenResponse, UserResponse
from app.auth.jwt import verify_password, create_access_token
from app.auth.dependencies import get_current_user
from app.config import settings

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/login", response_model=TokenResponse)
def login(login_data: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == login_data.email).first()
    if not user or not verify_password(login_data.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password",
        )

    # If user is a DRIVER, verify that their vehicle is APPROVED by Admin
    if user.role == UserRole.DRIVER:
        vehicle = db.query(Vehicle).filter(Vehicle.user_id == user.id).first()
        if vehicle:
            if vehicle.status == VehicleStatus.PENDING:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Registration PENDING: Your vehicle is awaiting Traffic Admin verification and approval.",
                )
            elif vehicle.status == VehicleStatus.REJECTED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail=f"Registration REJECTED: {vehicle.reject_reason or 'Document verification failed.'}",
                )
            elif vehicle.status == VehicleStatus.SUSPENDED:
                raise HTTPException(
                    status_code=status.HTTP_403_FORBIDDEN,
                    detail="Account SUSPENDED: Vehicle has accumulated 3 strikes. Contact Traffic Control.",
                )

    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": user.email, "role": user.role.value, "user_id": user.id},
        expires_delta=access_token_expires,
    )
    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": user,
    }


@router.get("/me", response_model=UserResponse)
def get_me(current_user: User = Depends(get_current_user)):
    return current_user
