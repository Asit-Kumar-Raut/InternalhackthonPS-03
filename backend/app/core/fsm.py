"""
Safety FSM for traffic signal control.

States: GREEN → YELLOW (3s) → ALL_RED (2s) → next GREEN
- Conflicting phases NEVER green together
- Yellow and all-red CANNOT be skipped
- Every transition validated against conflict matrix
"""
import logging
from enum import Enum
from typing import Dict, Tuple, Optional

logger = logging.getLogger(__name__)

# Conflict matrix: phases that cannot be GREEN simultaneously
CONFLICT_MATRIX: Dict[str, set] = {
    "NS": {"EW"},
    "EW": {"NS"},
}

PHASES = ["NS", "EW"]

YELLOW_DURATION = 3  # seconds
ALL_RED_DURATION = 2  # seconds


class FSMState(str, Enum):
    GREEN = "GREEN"
    YELLOW = "YELLOW"
    ALL_RED = "ALL_RED"


class JunctionFSM:
    """
    Finite State Machine for a single junction's signal controller.
    Tracks time within each state and enforces safe transitions.
    """

    def __init__(self, junction_id: int, min_green: float = 8.0, max_green: float = 40.0):
        self.junction_id = junction_id
        self.min_green = min_green
        self.max_green = max_green

        # Current active phase and state
        self.current_phase: str = "NS"
        self.state: FSMState = FSMState.GREEN
        self.time_in_state: float = 0.0

        # Next phase requested (queued, applied after ALL_RED)
        self._next_phase: Optional[str] = None

        # Track all-green phases for conflict detection
        self._active_greens: Dict[str, bool] = {p: False for p in PHASES}
        self._active_greens["NS"] = True  # NS starts green

        # Transition log for audit
        self.transition_log: list = []

    def _validate_no_conflict(self, phase: str, state: FSMState) -> bool:
        """Ensure no conflicting phases are simultaneously GREEN."""
        if state != FSMState.GREEN:
            return True
        conflicts = CONFLICT_MATRIX.get(phase, set())
        for conflicting_phase in conflicts:
            if self._active_greens.get(conflicting_phase, False):
                logger.error(
                    f"Junction {self.junction_id}: CONFLICT DETECTED! "
                    f"{phase} GREEN while {conflicting_phase} is GREEN"
                )
                return False
        return True

    def _set_all_greens_off(self):
        for p in PHASES:
            self._active_greens[p] = False

    def tick(self, dt: float = 1.0) -> Optional[dict]:
        """
        Advance FSM by dt seconds.
        Returns a transition event dict if a transition occurred, else None.
        """
        self.time_in_state += dt
        event = None

        if self.state == FSMState.GREEN:
            # Transitions out of GREEN handled by actuated/webster logic via request_switch
            pass

        elif self.state == FSMState.YELLOW:
            if self.time_in_state >= YELLOW_DURATION:
                # Transition to ALL_RED
                self._set_all_greens_off()
                self.state = FSMState.ALL_RED
                self.time_in_state = 0.0
                event = {
                    "type": "SIGNAL_PHASE_CHANGED",
                    "junction_id": self.junction_id,
                    "from_state": "YELLOW",
                    "to_state": "ALL_RED",
                    "phase": self.current_phase,
                }
                logger.debug(f"Junction {self.junction_id}: YELLOW → ALL_RED")

        elif self.state == FSMState.ALL_RED:
            if self.time_in_state >= ALL_RED_DURATION:
                # Transition to GREEN on next phase
                next_phase = self._next_phase or self._get_next_phase()
                if not self._validate_no_conflict(next_phase, FSMState.GREEN):
                    logger.error(
                        f"Junction {self.junction_id}: Conflict validation failed for {next_phase}, "
                        "staying in ALL_RED"
                    )
                    return None

                prev_phase = self.current_phase
                self.current_phase = next_phase
                self._next_phase = None
                self._set_all_greens_off()
                self._active_greens[self.current_phase] = True
                self.state = FSMState.GREEN
                self.time_in_state = 0.0
                event = {
                    "type": "SIGNAL_PHASE_CHANGED",
                    "junction_id": self.junction_id,
                    "from_phase": prev_phase,
                    "to_phase": self.current_phase,
                    "from_state": "ALL_RED",
                    "to_state": "GREEN",
                }
                logger.debug(
                    f"Junction {self.junction_id}: ALL_RED → GREEN (phase={self.current_phase})"
                )
                self.transition_log.append(event)

        return event

    def _get_next_phase(self) -> str:
        """Round-robin next phase."""
        idx = PHASES.index(self.current_phase)
        return PHASES[(idx + 1) % len(PHASES)]

    def request_switch(self, next_phase: Optional[str] = None) -> bool:
        """
        Request a phase switch. Only valid from GREEN state.
        Initiates YELLOW transition; never skips safety states.
        Returns True if switch initiated.
        """
        if self.state != FSMState.GREEN:
            logger.warning(
                f"Junction {self.junction_id}: switch requested in state {self.state}, ignored"
            )
            return False

        if self.time_in_state < self.min_green:
            logger.warning(
                f"Junction {self.junction_id}: min_green not reached "
                f"({self.time_in_state:.1f}s < {self.min_green}s), rejecting switch"
            )
            return False

        target = next_phase or self._get_next_phase()
        if target not in PHASES:
            logger.error(f"Junction {self.junction_id}: invalid phase requested: {target}")
            return False

        # Cannot switch to same phase that's already GREEN (would be a no-op)
        # but we still allow it to reset the timer (EW→EW stays EW)
        self._next_phase = target
        self._set_all_greens_off()
        self.state = FSMState.YELLOW
        self.time_in_state = 0.0
        return True

    def request_phase_change(self, next_phase: Optional[str] = None) -> bool:
        return self.request_switch(next_phase)
        self.time_in_state = 0.0
        event = {
            "type": "SIGNAL_PHASE_CHANGED",
            "junction_id": self.junction_id,
            "from_state": "GREEN",
            "to_state": "YELLOW",
            "phase": self.current_phase,
            "next_phase": target,
        }
        self.transition_log.append(event)
        logger.debug(
            f"Junction {self.junction_id}: GREEN → YELLOW (current={self.current_phase}, next={target})"
        )
        return True

    def force_switch_for_emergency(self, target_phase: str) -> bool:
        """
        Emergency switch — still cannot skip YELLOW/ALL_RED.
        Queues the target phase; initiates YELLOW if in GREEN.
        """
        if target_phase not in PHASES:
            logger.error(f"Invalid emergency phase: {target_phase}")
            return False

        self._next_phase = target_phase

        if self.state == FSMState.GREEN and self.current_phase != target_phase:
            # Must go through yellow — ignore min_green for emergencies
            self._set_all_greens_off()
            self.state = FSMState.YELLOW
            self.time_in_state = 0.0
            logger.info(
                f"Junction {self.junction_id}: Emergency switch initiated GREEN→YELLOW→{target_phase}"
            )
            return True
        elif self.state == FSMState.GREEN and self.current_phase == target_phase:
            # Already on correct phase, just extend
            self._next_phase = None
            return True
        elif self.state in (FSMState.YELLOW, FSMState.ALL_RED):
            # Already transitioning; just update next phase
            logger.info(
                f"Junction {self.junction_id}: Emergency queued {target_phase} during {self.state}"
            )
            return True
        return False

    def get_state_snapshot(self) -> dict:
        return {
            "junction_id": self.junction_id,
            "phase": self.current_phase,
            "state": self.state.value,
            "time_in_state": round(self.time_in_state, 1),
        }

    def no_conflict_check(self) -> bool:
        """External check: ensure no two conflicting phases are GREEN simultaneously."""
        green_phases = [p for p, v in self._active_greens.items() if v]
        for p in green_phases:
            conflicts = CONFLICT_MATRIX.get(p, set())
            for cp in conflicts:
                if self._active_greens.get(cp, False):
                    return False
        return True
