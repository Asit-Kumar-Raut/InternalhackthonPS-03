"""
Exponential Moving Average + Hysteresis congestion classification.
"""
from typing import Optional, Tuple, Dict
import logging

logger = logging.getLogger(__name__)

# Congestion level thresholds
UP_THRESHOLDS = {
    "LOW": 45.0,      # LOW → MEDIUM when occupancy >= 45%
    "MEDIUM": 65.0,   # MEDIUM → HIGH when occupancy >= 65%
    "HIGH": 85.0,     # HIGH → CONGESTED when occupancy >= 85%
}
DOWN_THRESHOLDS = {
    "MEDIUM": 35.0,   # MEDIUM → LOW when occupancy < 35%
    "HIGH": 55.0,     # HIGH → MEDIUM when occupancy < 55%
    "CONGESTED": 75.0,  # CONGESTED → HIGH when occupancy < 75%
}
CONGESTED_SPEED_THRESHOLD = 20.0  # km/h — speed must be this LOW for CONGESTED


class EMA:
    """Exponential Moving Average filter."""

    def __init__(self, beta: float = 0.4, initial: float = 0.0):
        self.beta = beta
        self.value = initial
        self._initialized = False

    def update(self, new_value: float) -> float:
        if not self._initialized:
            self.value = new_value
            self._initialized = True
        else:
            self.value = self.beta * new_value + (1 - self.beta) * self.value
        return self.value

    def get(self) -> float:
        return self.value


class HysteresisClassifier:
    """
    Classifies road congestion with hysteresis to prevent rapid oscillation.
    Levels: LOW, MEDIUM, HIGH, CONGESTED
    """

    LEVELS = ["LOW", "MEDIUM", "HIGH", "CONGESTED"]

    def __init__(self, road_id: int = 1):
        self.road_id = road_id
        self.level = "LOW"
        self._occupancy_ema = EMA(beta=0.4)
        self._speed_ema = EMA(beta=0.4, initial=50.0)

    def update(self, occupancy: float, speed: float) -> Optional[str]:
        smoothed_occ = self._occupancy_ema.update(occupancy)
        smoothed_spd = self._speed_ema.update(speed)
        new_level = self._classify(smoothed_occ, smoothed_spd)

        if new_level != self.level:
            old = self.level
            self.level = new_level
            logger.info(
                f"Road {self.road_id}: congestion {old}→{new_level} "
                f"(occ={smoothed_occ:.1f}%, spd={smoothed_spd:.1f}km/h)"
            )
            return new_level
        return None

    def _classify(self, occupancy: float, speed: float) -> str:
        current = self.level

        # Upgrade path (hysteresis up)
        if current == "LOW" and occupancy >= UP_THRESHOLDS["LOW"]:
            return "MEDIUM"
        if current == "MEDIUM" and occupancy >= UP_THRESHOLDS["MEDIUM"]:
            return "HIGH"
        if current == "HIGH" and occupancy >= UP_THRESHOLDS["HIGH"] and speed <= CONGESTED_SPEED_THRESHOLD:
            return "CONGESTED"

        # Downgrade path (hysteresis down)
        if current == "CONGESTED" and occupancy < DOWN_THRESHOLDS["CONGESTED"]:
            return "HIGH"
        if current == "HIGH" and occupancy < DOWN_THRESHOLDS["HIGH"]:
            return "MEDIUM"
        if current == "MEDIUM" and occupancy < DOWN_THRESHOLDS["MEDIUM"]:
            return "LOW"

        return current

    def get_smoothed(self) -> tuple:
        return self._occupancy_ema.get(), self._speed_ema.get()


class DensityEstimator:
    """
    Tracks density and hysteresis per phase ('NS', 'EW') at a junction.
    """
    def __init__(self):
        self.classifiers: Dict[str, HysteresisClassifier] = {
            "NS": HysteresisClassifier(1),
            "EW": HysteresisClassifier(2),
        }

    def update(self, phase: str, occupancy: float, speed: float) -> Tuple[str, bool]:
        if phase not in self.classifiers:
            self.classifiers[phase] = HysteresisClassifier()
        clf = self.classifiers[phase]
        old_level = clf.level
        changed_level = clf.update(occupancy, speed)
        return clf.level, (changed_level is not None)

    def get_current_level(self, phase: str) -> str:
        if phase in self.classifiers:
            return self.classifiers[phase].level
        return "LOW"
