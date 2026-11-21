"""
Forecaster: loads trained RF model and serves predictions.
Falls back to heuristic estimation if model not available.
"""
import logging
from pathlib import Path
from typing import Dict, Any, Optional

import numpy as np

from predictor.data_generator import FEATURE_COLS, PHASE_ENC

logger = logging.getLogger(__name__)

MODEL_PATH = Path(__file__).parent.parent / "models" / "rf_model.joblib"


class Forecaster:
    def __init__(self):
        self.model = None
        self.trained = False
        self._try_load()

    def _try_load(self):
        if MODEL_PATH.exists():
            try:
                import joblib
                self.model = joblib.load(MODEL_PATH)
                self.trained = True
                logger.info("RF model loaded from disk.")
            except Exception as e:
                logger.warning(f"Failed to load RF model: {e}")
                self.model = None
                self.trained = False

    def predict(
        self,
        junction_id: int,
        road_id: int,
        hour: int,
        day_of_week: int,
        current_count: float,
        lag1_count: float,
        lag2_count: float,
        lag3_count: float,
        avg_speed: float,
        upstream_count: float,
        current_phase: str,
    ) -> Dict[str, Any]:
        """Return prediction dict. Never raises."""
        try:
            is_weekend = int(day_of_week >= 5)
            phase_enc = PHASE_ENC.get(current_phase, 0)

            features = np.array([[
                hour, day_of_week, is_weekend,
                current_count, lag1_count, lag2_count, lag3_count,
                avg_speed, upstream_count, phase_enc,
            ]], dtype=float)

            if self.trained and self.model is not None:
                pred = float(self.model.predict(features)[0])
                confidence = 0.85
            else:
                pred = self._heuristic(hour, day_of_week, current_count)
                confidence = 0.55

            pred = max(0.0, min(100.0, pred))
            level = self._density_level(pred)

            return {
                "predicted_density": round(pred, 2),
                "predicted_level": level,
                "confidence": confidence,
                "horizon_minutes": 5,
            }
        except Exception as e:
            logger.error(f"Predict error: {e}")
            return {
                "predicted_density": 50.0,
                "predicted_level": "MEDIUM",
                "confidence": 0.0,
                "horizon_minutes": 5,
                "error": "fallback",
            }

    def _heuristic(self, hour: int, day_of_week: int, current_count: float) -> float:
        """Simple rule-based density estimate."""
        is_weekend = day_of_week >= 5
        wf = 0.7 if is_weekend else 1.0
        if 7 <= hour <= 9:
            base = 75
        elif 17 <= hour <= 19:
            base = 80
        elif 23 <= hour or hour <= 5:
            base = 12
        else:
            base = 40
        # Blend with current count influence
        occ = (current_count / 100.0) * 100.0
        return (base * wf + occ) / 2.0

    def _density_level(self, density: float) -> str:
        if density < 35:
            return "LOW"
        elif density < 65:
            return "MEDIUM"
        elif density < 85:
            return "HIGH"
        else:
            return "CONGESTED"
