from app.api.auth import router as auth_router
from app.api.vehicles import router as vehicles_router
from app.api.emergency import router as emergency_router
from app.api.traffic import router as traffic_router
from app.api.control import router as control_router
from app.api.sensors import router as sensors_router
from app.api.websocket import router as ws_router

__all__ = [
    "auth_router",
    "vehicles_router",
    "emergency_router",
    "traffic_router",
    "control_router",
    "sensors_router",
    "ws_router",
]
