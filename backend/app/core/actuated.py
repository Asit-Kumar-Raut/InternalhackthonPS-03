"""
Actuated traffic signal control logic.

Rules:
- min_green = 8s, max_green = 40s, gap = 3s
- Skip phase with zero demand
- Gap-out when no vehicle arrives for gap duration
- Max-out at max_green
- Fallback to fixed-time (15s heartbeat missing -> SENSOR_FAULT)
"""
import time
from typing import Dict, Optional, Tuple


class ActuatedController:
    def __init__(
        self,
        min_green: float = 8.0,
        max_green: float = 40.0,
        gap_time: float = 3.0,
        sensor_fault_timeout: float = 15.0,
    ):
        self.min_green = min_green
        self.max_green = max_green
        self.gap_time = gap_time
        self.sensor_fault_timeout = sensor_fault_timeout

        # Phase tracking
        self.last_vehicle_time: Dict[str, float] = {"NS": time.time(), "EW": time.time()}
        self.phase_green_time: Dict[str, float] = {"NS": 0.0, "EW": 0.0}
        self.sensor_last_seen: Dict[str, float] = {"NS": time.time(), "EW": time.time()}
        self.sensor_fault_active: Dict[str, bool] = {"NS": False, "EW": False}

    def record_detection(self, phase: str, count: int, current_time: Optional[float] = None) -> None:
        now = current_time if current_time is not None else time.time()
        self.sensor_last_seen[phase] = now
        if count > 0:
            self.last_vehicle_time[phase] = now

    def check_sensor_fault(self, phase: str, current_time: Optional[float] = None) -> Tuple[bool, bool]:
        """
        Returns (is_fault, newly_faulted)
        """
        now = current_time if current_time is not None else time.time()
        time_since_seen = now - self.sensor_last_seen.get(phase, now)
        is_fault = time_since_seen >= self.sensor_fault_timeout
        was_fault = self.sensor_fault_active.get(phase, False)
        self.sensor_fault_active[phase] = is_fault
        newly_faulted = is_fault and not was_fault
        return is_fault, newly_faulted

    def should_terminate_green(
        self,
        current_phase: str,
        green_duration: float,
        current_time: Optional[float] = None,
    ) -> Tuple[bool, str]:
        """
        Determines whether the current green phase should terminate.
        Returns: (terminate: bool, reason: str)
        reasons: "MIN_GREEN_NOT_MET", "MAX_GREEN_REACHED", "GAP_OUT", "CONTINUE", "SENSOR_FAULT_FIXED"
        """
        now = current_time if current_time is not None else time.time()

        # Check sensor fault
        is_fault, _ = self.check_sensor_fault(current_phase, now)
        if is_fault:
            # Fixed-time fallback: 20s fixed green
            if green_duration >= 20.0:
                return True, "SENSOR_FAULT_FIXED"
            return False, "SENSOR_FAULT_HOLD"

        # Rule 1: Min green must be satisfied
        if green_duration < self.min_green:
            return False, "MIN_GREEN_NOT_MET"

        # Rule 2: Max green reached -> Max-out
        if green_duration >= self.max_green:
            return True, "GREEN_MAXED_OUT"

        # Rule 3: Gap out check
        time_since_last_veh = now - self.last_vehicle_time.get(current_phase, now)
        if time_since_last_veh >= self.gap_time:
            return True, "GREEN_GAPPED_OUT"

        return False, "CONTINUE"

    def should_skip_phase(self, phase: str, demand: int) -> bool:
        """
        Skip a phase with zero demand unless sensor is faulted.
        """
        if self.sensor_fault_active.get(phase, False):
            # Do NOT skip if sensor is dead (fail-safe)
            return False
        return demand <= 0
