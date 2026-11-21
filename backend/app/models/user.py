import enum
from sqlalchemy import Column, Integer, String, Enum as SAEnum
from app.database import Base


class UserRole(str, enum.Enum):
    ADMIN = "ADMIN"
    OPERATOR = "OPERATOR"
    VIEWER = "VIEWER"
    DRIVER = "DRIVER"


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    password_hash = Column(String, nullable=False)
    role = Column(SAEnum(UserRole), default=UserRole.VIEWER, nullable=False)
