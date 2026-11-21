"""
Aging and starvation prevention logic.

Rules:
- priority = demand + k * waiting_time
- Hard cap: no phase waits red longer than aging_cap_s (default 90s)
"""
from typing import Dict, Optional


class AgingTracker:
    def __init__(self, k: float = 0.1, max_red_wait_s: float = 90.0):
        self.k = k
        self.max_red_wait_s = max_red_wait_s
        # Time (in seconds) that each phase has been waiting at red
        self.red_wait_times: Dict[str, float] = {"NS": 0.0, "EW": 0.0}

    def update_tick(self, active_phase: str, dt_s: float = 1.0) -> None:
        """
        Increment red wait time for waiting phases, reset active phase.
        """
        for phase in self.red_wait_times.keys():
            if phase == active_phase:
                self.red_wait_times[phase] = 0.0
            else:
                self.red_wait_times[phase] += dt_s

    def compute_priority(self, phase: str, raw_demand: float) -> float:
        wait_time = self.red_wait_times.get(phase, 0.0)
        return raw_demand + (self.k * wait_time)

    def is_starved(self, phase: str) -> bool:
        """
        Returns True if a waiting phase has exceeded the 90s hard cap.
        """
        return self.red_wait_times.get(phase, 0.0) >= self.max_red_wait_s

    def get_highest_priority_phase(self, demands: Dict[str, float]) -> str:
        """
        Selects next phase based on aging priority, giving immediate priority to starved phases.
        """
        for phase, wait_time in self.red_wait_times.items():
            if wait_time >= self.max_red_wait_s:
                return phase

        priorities = {
            phase: self.compute_priority(phase, demands.get(phase, 0.0))
            for phase in demands.keys()
        }
        return max(priorities, key=priorities.get)
