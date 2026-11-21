"""
SmartSignal AI - Main FastAPI Backend Application.
Port 8000.
"""
import os
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles

from app.config import settings
from app.database import engine, Base
from app.api.auth import router as auth_router
from app.api.vehicles import router as vehicles_router
from app.api.emergency import router as emergency_router
from app.api.traffic import router as traffic_router
from app.api.control import router as control_router
from app.api.sensors import router as sensors_router
from app.api.websocket import router as ws_router
from app.core.simulation import sim_engine


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Ensure tables created
    Base.metadata.create_all(bind=engine)
    # Ensure uploads dir exists
    os.makedirs(settings.UPLOAD_DIR, exist_ok=True)
    # Start synchronous 1s simulation tick loop
    sim_engine.start()
    yield
    # Shutdown
    sim_engine.stop()


app = FastAPI(
    title="SmartSignal AI Backend",
    description="Adaptive Traffic-Signal Simulation with Verified Emergency Green Corridor",
    version="1.0.0",
    lifespan=lifespan,
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://localhost:5174",
        "http://localhost:5175",
        "http://localhost:3000",
        "http://127.0.0.1:5173",
        "http://127.0.0.1:5174",
        "http://127.0.0.1:5175",
        "http://127.0.0.1:3000",
    ],
    allow_origin_regex=r"http://(localhost|127\.0\.0\.1)(:[0-9]+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Mount API Routers
app.include_router(auth_router, prefix="/api")
app.include_router(vehicles_router, prefix="/api")
app.include_router(emergency_router, prefix="/api")
app.include_router(traffic_router, prefix="/api")
app.include_router(control_router, prefix="/api")
app.include_router(sensors_router, prefix="/api")
app.include_router(ws_router)  # /ws/live and /ws/driver/{id}


@app.get("/")
def root():
    return {
        "service": "SmartSignal AI Backend",
        "status": "online",
        "docs": "/docs",
        "simulation": "running",
    }
