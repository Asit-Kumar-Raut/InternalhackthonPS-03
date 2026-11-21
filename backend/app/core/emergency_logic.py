"""
Emergency vehicle priority queue and green corridor logic.

Rules:
- Priority queue ordered by (priority level, arrival time)
- Transition starts when ETA <= yellow + all_red + buffer (default 3+2+5 = 10s)
- Hold green until vehicle passes or 60s timeout
- 2 consecutive unconfirmed junctions -> release priority and alert
"""
import time
from typing import Dict, List, Optional, Tuple, Any
from app.models.emergency import EmergencyStatus


class EmergencyManager:
    def __init__(self, yellow_time: float = 3.0, all_red_time: float = 2.0, buffer_time: float = 5.0):
        self.yellow_time = yellow_time
        self.all_red_time = all_red_time
        self.buffer_time = buffer_time
        self.trigger_window = yellow_time + all_red_time + buffer_time  # 10.0 seconds

        # Active requests keyed by request_id
        # {request_id: dict_state}
        self.active_runs: Dict[int, Dict[str, Any]] = {}

    def register_run(
        self,
        request_id: int,
        vehicle_id: int,
        route_junctions: List[int],
        trust_score: int,
        vehicle_type: str = "AMBULANCE",
    ) -> Dict[str, Any]:
        priority_level = 1 if vehicle_type == "AMBULANCE" else (2 if vehicle_type == "FIRE" else 3)
        run_state = {
            "request_id": request_id,
            "vehicle_id": vehicle_id,
            "priority_level": priority_level,
            "trust_score": trust_score,
            "route_junctions": route_junctions,
            "current_index": 0,
            "status": EmergencyStatus.ACTIVE if trust_score >= 50 else EmergencyStatus.PENDING_CONFIRM,
            "created_at": time.time(),
            "started_at": time.time() if trust_score >= 50 else None,
            "unconfirmed_count": 0,
            "current_green_held_s": 0.0,
            "junction_status": {
                j_id: {
                    "state": "WAITING",  # WAITING, CLEARING, GREEN_READY, PASSED
                    "confirmed": None,   # None, True, False
                    "eta_s": 30.0 * (idx + 1),
                }
                for idx, j_id in enumerate(route_junctions)
            },
            "last_gps": None,
        }
        self.active_runs[request_id] = run_state
        return run_state

    def update_position(
        self,
        request_id: int,
        lat: float,
        lng: float,
        speed_kmh: float,
        passed_junction: Optional[int] = None,
    ) -> Optional[Dict[str, Any]]:
        run = self.active_runs.get(request_id)
        if not run:
            return None
        run["last_gps"] = {"lat": lat, "lng": lng, "speed": speed_kmh, "ts": time.time()}

        if passed_junction and passed_junction in run["junction_status"]:
            run["junction_status"][passed_junction]["state"] = "PASSED"
            idx = run["route_junctions"].index(passed_junction)
            if idx >= run["current_index"]:
                run["current_index"] = idx + 1

        return run

    def record_camera_detection(
        self,
        junction_id: int,
        detected_emergency: bool,
    ) -> List[Tuple[int, bool, bool]]:
        """
        Record camera detection.
        Returns list of (request_id, confirmed, trigger_abort_alert)
        """
        results = []
        for req_id, run in list(self.active_runs.items()):
            if run["status"] != EmergencyStatus.ACTIVE:
                continue
            if junction_id in run["route_junctions"]:
                curr_idx = run["current_index"]
                if curr_idx < len(run["route_junctions"]) and run["route_junctions"][curr_idx] == junction_id:
                    j_info = run["junction_status"][junction_id]
                    j_info["confirmed"] = detected_emergency
                    if detected_emergency:
                        run["unconfirmed_count"] = 0
                        results.append((req_id, True, False))
                    else:
                        run["unconfirmed_count"] += 1
                        abort_alert = run["unconfirmed_count"] >= 2
                        if abort_alert:
                            run["status"] = EmergencyStatus.ABORTED
                        results.append((req_id, False, abort_alert))
        return results

    def get_corridor_demands_for_junction(self, junction_id: int) -> Optional[Dict[str, Any]]:
        """
        Returns green phase request if an active emergency run requires priority at this junction.
        """
        candidates = []
        for req_id, run in self.active_runs.items():
            if run["status"] != EmergencyStatus.ACTIVE:
                continue
            if run["current_index"] < len(run["route_junctions"]):
                target_j = run["route_junctions"][run["current_index"]]
                if target_j == junction_id:
                    j_info = run["junction_status"][junction_id]
                    eta = j_info.get("eta_s", 15.0)
                    if eta <= self.trigger_window:
                        candidates.append((run["priority_level"], run["created_at"], req_id, run))

        if not candidates:
            return None

        # Sort by priority level (1=Ambulance, 2=Fire, 3=Police), then earlier created_at
        candidates.sort(key=lambda x: (x[0], x[1]))
        winning_run = candidates[0][3]
        return winning_run

    def tick_corridor(self, dt_s: float = 1.0) -> List[Dict[str, Any]]:
        """
        Progress ETAs and green-hold timeouts.
        """
        completed = []
        for req_id, run in list(self.active_runs.items()):
            if run["status"] != EmergencyStatus.ACTIVE:
                continue

            curr_idx = run["current_index"]
            if curr_idx >= len(run["route_junctions"]):
                run["status"] = EmergencyStatus.COMPLETED
                completed.append(run)
                continue

            curr_j = run["route_junctions"][curr_idx]
            j_info = run["junction_status"][curr_j]

            # Decrease ETA
            j_info["eta_s"] = max(0.0, j_info.get("eta_s", 15.0) - dt_s)

            if j_info["eta_s"] <= self.trigger_window and j_info["state"] == "WAITING":
                j_info["state"] = "CLEARING"

            if j_info["eta_s"] <= 4.0 and j_info["state"] == "CLEARING":
                j_info["state"] = "GREEN_READY"
                j_info["confirmed"] = True

            if j_info["state"] == "GREEN_READY":
                run["current_green_held_s"] += dt_s
                if run["current_green_held_s"] >= 10.0:  # held green while passing
                    j_info["state"] = "PASSED"
                    run["current_index"] += 1
                    run["current_green_held_s"] = 0.0
                    # Set initial ETA for next junction if waiting
                    if run["current_index"] < len(run["route_junctions"]):
                        next_j = run["route_junctions"][run["current_index"]]
                        run["junction_status"][next_j]["eta_s"] = 15.0

        return completed
