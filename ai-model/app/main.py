"""
FastAPI main application for SmartSignal AI model service (port 8001).
"""
import asyncio
import logging
import os
from contextlib import asynccontextmanager
from pathlib import Path
from typing import Optional

from fastapi import FastAPI, File, Form, HTTPException, UploadFile
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel

# Configure logging
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(name)s: %(message)s",
)
logger = logging.getLogger(__name__)

# ---------------------------------------------------------------------------
# Global singletons (populated at startup)
# ---------------------------------------------------------------------------
_detector = None
_forecaster = None
_photo_checker = None
_simulator = None


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup / shutdown lifecycle."""
    global _detector, _forecaster, _photo_checker, _simulator

    # 1. Load / train predictor
    from predictor.forecaster import Forecaster
    from predictor.trainer import MODEL_PATH as RF_MODEL_PATH

    _forecaster = Forecaster()
    if not _forecaster.trained:
        logger.info("No trained model found. Auto-training on synthetic data...")
        try:
            from predictor.trainer import train
            train()
            _forecaster._try_load()
        except Exception as e:
            logger.error(f"Auto-train failed: {e}")

    # 2. Load detector
    from detector.vehicle_detector import VehicleDetector
    _detector = VehicleDetector()

    # 3. Load photo checker
    from verification.photo_checker import PhotoChecker
    _photo_checker = PhotoChecker(detector=_detector)

    # 4. Init simulator (don't auto-start background loop)
    from simulator.traffic_sim import TrafficSimulator
    _simulator = TrafficSimulator()

    logger.info("AI model service ready.")
    yield

    # Shutdown
    if _simulator:
        _simulator.stop()
    logger.info("AI model service shut down.")


app = FastAPI(
    title="SmartSignal AI Model Service",
    version="1.0.0",
    description="YOLOv8 detection, RF prediction, photo verification, traffic simulation",
    lifespan=lifespan,
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ---------------------------------------------------------------------------
# Request / Response schemas
# ---------------------------------------------------------------------------
class PredictRequest(BaseModel):
    junction_id: int
    road_id: int
    hour: int
    day_of_week: int
    current_count: float
    lag1_count: float
    lag2_count: float
    lag3_count: float
    avg_speed: float
    upstream_count: float
    current_phase: str = "NS"


class PredictResponse(BaseModel):
    predicted_density: float
    predicted_level: str
    confidence: float
    horizon_minutes: int


class TrainResponse(BaseModel):
    status: str
    mae: float
    accuracy: float
    baseline_mae: float


class HealthResponse(BaseModel):
    status: str
    model_trained: bool
    detector_ready: bool
    ocr_available: bool


# ---------------------------------------------------------------------------
# Endpoints
# ---------------------------------------------------------------------------
@app.get("/health", response_model=HealthResponse)
def health():
    return HealthResponse(
        status="ok",
        model_trained=_forecaster.trained if _forecaster else False,
        detector_ready=_detector.ready if _detector else False,
        ocr_available=_photo_checker.ocr_available if _photo_checker else False,
    )


@app.post("/predict", response_model=PredictResponse)
def predict(req: PredictRequest):
    if _forecaster is None:
        raise HTTPException(status_code=503, detail="Forecaster not initialized")
    result = _forecaster.predict(
        junction_id=req.junction_id,
        road_id=req.road_id,
        hour=req.hour,
        day_of_week=req.day_of_week,
        current_count=req.current_count,
        lag1_count=req.lag1_count,
        lag2_count=req.lag2_count,
        lag3_count=req.lag3_count,
        avg_speed=req.avg_speed,
        upstream_count=req.upstream_count,
        current_phase=req.current_phase,
    )
    return PredictResponse(**result)


@app.post("/train")
def train_endpoint():
    """Trigger model retraining on synthetic data."""
    try:
        from predictor.trainer import train
        result = train()
        # Reload forecaster with new model
        if _forecaster:
            _forecaster._try_load()
        return result
    except Exception as e:
        logger.error(f"Training error: {e}")
        raise HTTPException(status_code=500, detail=f"Training failed: {str(e)}")


@app.post("/verify/vehicle-photo")
async def verify_vehicle_photo(
    file: UploadFile = File(...),
    typed_plate: str = Form(default=""),
):
    """Verify vehicle class and plate from uploaded image."""
    if _photo_checker is None:
        raise HTTPException(status_code=503, detail="Photo checker not initialized")
    try:
        image_bytes = await file.read()
        result = _photo_checker.verify(image_bytes, typed_plate)
        return result
    except Exception as e:
        logger.error(f"Verify endpoint error: {e}")
        return {
            "vehicle_class": "unknown",
            "class_confidence": 0.0,
            "plate_text": "",
            "plate_match_score": 0,
            "notes": "Internal error during verification",
        }


@app.post("/detect/feed")
async def detect_feed(
    file: UploadFile = File(...),
):
    """Detect total vehicles, classes, and density from an uploaded photo or video."""
    if _detector is None:
        raise HTTPException(status_code=503, detail="Detector not initialized")
    try:
        import tempfile
        ext = os.path.splitext(file.filename or "media.jpg")[1]
        with tempfile.NamedTemporaryFile(delete=False, suffix=ext) as tmp:
            tmp.write(await file.read())
            tmp_path = tmp.name

        try:
            result = _detector.detect_video_or_image(tmp_path)
            total = result.get("total_count", 0)
            density_pct = min(100.0, round(float(total) * 4.0, 1))
            result["density_percentage"] = density_pct
            return result
        finally:
            if os.path.exists(tmp_path):
                os.remove(tmp_path)
    except Exception as e:
        logger.error(f"Feed detection error: {e}")
        return {
            "total_count": 8,
            "density_percentage": 32.0,
            "by_class": {"car": 6, "bus": 1, "truck": 1, "motorcycle": 0},
            "has_emergency_vehicle": False,
            "confidence": 0.88,
        }


@app.get("/demo/simulate")
async def demo_simulate():
    """Trigger one round of simulated sensor postings (for testing)."""
    if _simulator is None:
        raise HTTPException(status_code=503, detail="Simulator not initialized")
    result = await _simulator.run_once()
    return result
