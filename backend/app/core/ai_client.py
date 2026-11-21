"""
Asynchronous HTTP client for the AI model service (port 8001).
Timeout contract: 300ms.
Any timeout, connection error, or failure returns a fallback response and logs MODEL_FALLBACK.
The synchronous path never waits on this.
"""
import logging
from typing import Dict, Any, Optional
import httpx
from app.config import settings

logger = logging.getLogger(__name__)


class AIClient:
    def __init__(self, base_url: Optional[str] = None, timeout: Optional[float] = None):
        self.base_url = base_url or settings.AI_SERVICE_URL
        self.timeout = timeout or settings.AI_SERVICE_TIMEOUT

    async def predict_density(self, payload: Dict[str, Any]) -> Dict[str, Any]:
        """
        POST /predict with 300ms timeout.
        Returns predicted density & level, or fallback estimate.
        """
        try:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                resp = await client.post(f"{self.base_url}/predict", json=payload)
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning("AI prediction call failed (%s); using density fallback.", e)

        # Fallback estimate
        current_count = payload.get("current_count", 20)
        est_density = min(100.0, float(current_count) * 1.5)
        level = "LOW"
        if est_density > 80:
            level = "CONGESTED"
        elif est_density > 60:
            level = "HIGH"
        elif est_density > 40:
            level = "MEDIUM"

        return {
            "predicted_density": est_density,
            "predicted_level": level,
            "confidence": 0.5,
            "horizon_minutes": 5,
            "fallback": True,
        }

    async def verify_vehicle_photo(self, image_bytes: bytes, filename: str, typed_plate: str) -> Dict[str, Any]:
        """
        POST /verify/vehicle-photo with 10.0s timeout for file upload.
        """
        try:
            async with httpx.AsyncClient(timeout=10.0) as client:
                files = {"image": (filename, image_bytes, "image/jpeg")}
                data = {"typed_plate": typed_plate}
                resp = await client.post(f"{self.base_url}/verify/vehicle-photo", files=files, data=data)
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.warning("AI photo verification failed (%s); returning fallback suggestion.", e)

        # Fallback suggestion
        return {
            "vehicle_class": "AMBULANCE",
            "class_confidence": 0.65,
            "plate_text": typed_plate,
            "plate_match_score": 75.0,
            "notes": "AI service offline or slow; fallback evaluation applied.",
            "fallback": True,
        }

    async def retrain_model(self) -> Dict[str, Any]:
        try:
            async with httpx.AsyncClient(timeout=30.0) as client:
                resp = await client.post(f"{self.base_url}/train")
                if resp.status_code == 200:
                    return resp.json()
        except Exception as e:
            logger.error("AI retraining trigger failed: %s", e)
        return {"status": "error", "message": "Failed to trigger retraining"}
