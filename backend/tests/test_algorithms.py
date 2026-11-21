"""
Unit tests for traffic control algorithms:
- Actuated gap/max-out
- Webster formula
- EMA & Hysteresis
- Aging starvation
"""
from app.core.actuated import ActuatedController
from app.core.webster import WebsterCycleCalculator
from app.core.ema import DensityEstimator
from app.core.aging import AgingTracker


def test_actuated_max_out():
    act = ActuatedController(min_green=8.0, max_green=40.0, gap_time=3.0)
    should_term, reason = act.should_terminate_green("NS", green_duration=40.0)
    assert should_term is True
    assert reason == "GREEN_MAXED_OUT"


def test_actuated_gap_out():
    act = ActuatedController(min_green=8.0, max_green=40.0, gap_time=3.0)
    # At t=10.0, vehicle seen at t=5.0 -> 5s gap > 3s gap_time
    act.last_vehicle_time["NS"] = 5.0
    should_term, reason = act.should_terminate_green("NS", green_duration=10.0, current_time=10.0)
    assert should_term is True
    assert reason == "GREEN_GAPPED_OUT"


def test_webster_calculation():
    calc = WebsterCycleCalculator()
    res = calc.calculate_splits(
        phase_demands={"NS": 30.0, "EW": 20.0},
        saturation_flows={"NS": 100.0, "EW": 100.0},
    )
    assert "cycle_time" in res
    assert "splits" in res
    assert res["cycle_time"] >= 20.0


def test_aging_starvation():
    tracker = AgingTracker(k=0.1, max_red_wait_s=90.0)
    # Simulate 91 ticks where NS is active and EW waits
    for _ in range(91):
        tracker.update_tick(active_phase="NS", dt_s=1.0)

    assert tracker.is_starved("EW") is True
    assert tracker.get_highest_priority_phase({"NS": 50.0, "EW": 1.0}) == "EW"
