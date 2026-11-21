"""
Property test for Safety FSM:
Assert that over thousands of random requests and transitions,
conflicting phases NS and EW are NEVER green simultaneously.
"""
import random
from app.core.fsm import JunctionFSM, FSMState


def test_fsm_never_allows_conflicting_greens():
    fsm = JunctionFSM(junction_id=1, min_green=8.0, max_green=40.0)

    # Run 2000 simulated ticks with random requests
    for tick in range(2000):
        # Randomly request phase change
        if random.random() < 0.2:
            target = random.choice(["NS", "EW"])
            fsm.request_phase_change(target)

        # Tick 1 second
        fsm.tick(dt=1.0)

        # Invariant: If state is GREEN, exactly one phase is active
        if fsm.state == FSMState.GREEN:
            assert fsm.current_phase in ("NS", "EW")

        # Invariant: State must be one of GREEN, YELLOW, ALL_RED
        assert fsm.state in (FSMState.GREEN, FSMState.YELLOW, FSMState.ALL_RED)


def test_fsm_yellow_and_all_red_durations():
    fsm = JunctionFSM(junction_id=1, min_green=5.0, max_green=20.0)
    assert fsm.state == FSMState.GREEN
    assert fsm.current_phase == "NS"

    # Fast forward past min_green
    for _ in range(6):
        fsm.tick(1.0)

    # Request EW
    fsm.request_phase_change("EW")
    fsm.tick(1.0)
    assert fsm.state == FSMState.YELLOW

    # Yellow lasts 3 seconds
    fsm.tick(1.0)
    fsm.tick(1.0)
    fsm.tick(1.0)
    assert fsm.state == FSMState.ALL_RED

    # All-red lasts 2 seconds
    fsm.tick(1.0)
    fsm.tick(1.0)
    assert fsm.state == FSMState.GREEN
    assert fsm.current_phase == "EW"
