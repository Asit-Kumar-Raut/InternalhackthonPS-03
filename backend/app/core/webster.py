"""
Webster's optimised cycle length calculation.

C = (1.5L + 5) / (1 - Y)
g_i = (y_i / Y) * (C - L)

Where:
  L = lost time = number_of_phases * (yellow_time + all_red_time)
  Y = sum of critical flow ratios y_i = flow_i / saturation_i
  g_i = effective green time for phase i (clamped to [min_green, max_green])
"""
from typing import List, Dict, Any
import logging

logger = logging.getLogger(__name__)

DEFAULT_SATURATION_FLOW = 1800  # vehicles/hour/lane
DEFAULT_YELLOW = 3.0
DEFAULT_ALL_RED = 2.0
DEFAULT_MIN_GREEN = 8.0
DEFAULT_MAX_GREEN = 40.0
DEFAULT_ALPHA = 0.6  # blend factor: alpha*current + (1-alpha)*predicted


def blend_density(current: float, predicted: float, alpha: float = DEFAULT_ALPHA) -> float:
    """Blend current observation with AI prediction."""
    return alpha * current + (1 - alpha) * predicted


def webster_cycle(
    flows: List[float],           # critical flow per phase (veh/h)
    saturation: float = DEFAULT_SATURATION_FLOW,
    num_phases: int = 2,
    yellow_time: float = DEFAULT_YELLOW,
    all_red_time: float = DEFAULT_ALL_RED,
    min_green: float = DEFAULT_MIN_GREEN,
    max_green: float = DEFAULT_MAX_GREEN,
) -> Dict[str, float]:
    """
    Compute optimal cycle length and green splits.
    Returns dict with keys: C (cycle), Y (flow ratio sum), greens (list), lost_time
    """
    L = num_phases * (yellow_time + all_red_time)

    # Flow ratios y_i
    y_values = [f / saturation for f in flows]
    Y = sum(y_values)

    if Y <= 0:
        greens = [min_green] * len(flows)
        C = sum(greens) + L
        return {"C": C, "Y": Y, "greens": greens, "lost_time": L, "capped": False}

    capped = False
    if Y >= 0.9:
        C = num_phases * max_green + L
        capped = True
    else:
        C = (1.5 * L + 5) / (1 - Y)

    effective_total = C - L
    greens = []
    for y_i in y_values:
        g_i = (y_i / Y) * effective_total if Y > 0 else min_green
        g_i = max(min_green, min(max_green, g_i))
        greens.append(round(g_i, 1))

    logger.debug(f"Webster: C={C:.1f}s, Y={Y:.3f}, greens={greens}, L={L:.1f}s, capped={capped}")
    return {"C": round(C, 1), "Y": round(Y, 4), "greens": greens, "lost_time": L, "capped": capped}


class WebsterCycleCalculator:
    def __init__(self, saturation: float = DEFAULT_SATURATION_FLOW):
        self.saturation = saturation

    def calculate_splits(
        self,
        phase_demands: Dict[str, float],
        saturation_flows: Dict[str, float] = None,
    ) -> Dict[str, Any]:
        flows = list(phase_demands.values())
        res = webster_cycle(flows=flows, saturation=self.saturation)
        splits = dict(zip(phase_demands.keys(), res["greens"]))
        return {
            "cycle_time": res["C"],
            "splits": splits,
            "y_ratio": res["Y"],
            "lost_time": res["lost_time"],
        }
