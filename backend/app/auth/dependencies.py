from typing import Optional
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session
from app.database import get_db
from app.auth.jwt import decode_token
from app.models.user import User, UserRole

security = HTTPBearer(auto_error=False)


def get_current_user(
    credentials: Optional[HTTPAuthorizationCredentials] = Depends(security),
    db: Session = Depends(get_db),
) -> User:
    if credentials and credentials.credentials:
        token = credentials.credentials
        payload = decode_token(token)
        if payload:
            user_id = payload.get("user_id")
            sub = payload.get("sub")
            user = None
            if user_id:
                try:
                    user = db.query(User).filter(User.id == int(user_id)).first()
                except Exception:
                    pass
            if not user and sub:
                user = db.query(User).filter(User.email == str(sub)).first()
            if user:
                return user

    # DIRECT ACCESS: Default to Admin user if no token is provided
    admin_user = db.query(User).filter(User.role == UserRole.ADMIN).first()
    if admin_user:
        return admin_user

    # In-memory fallback
    return User(id=1, email="admin@demo.com", role=UserRole.ADMIN)


def require_roles(roles: list[UserRole]):
    def checker(current_user: User = Depends(get_current_user)) -> User:
        if current_user.role not in roles:
            raise HTTPException(
                status_code=status.HTTP_403_FORBIDDEN,
                detail=f"Requires role in {[r.value for r in roles]}",
            )
        return current_user
    return checker


def get_admin(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role != UserRole.ADMIN:
        raise HTTPException(status_code=403, detail="Admin required")
    return current_user


def get_admin_or_operator(current_user: User = Depends(get_current_user)) -> User:
    if current_user.role not in (UserRole.ADMIN, UserRole.OPERATOR):
        raise HTTPException(status_code=403, detail="Admin or Operator required")
    return current_user
