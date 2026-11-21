"""
TrafficSimulator: simulates sensor readings posted to the backend.
Runs as a background asyncio task.
"""
import asyncio
import logging
import random
from typing import Optional

import httpx

logger = logging.getLogger(__name__)

BACKEND_URL = "http://localhost:8000"

# Sensor IDs and API keys to use (populated from backend seed data)
# These are example defaults; real values come from env/config
SENSOR_CONFIGS = [
    {"sensor_id": 1, "api_key": "sensor_key_1", "road_id": 1},
    {"sensor_id": 2, "api_key": "sensor_key_2", "road_id": 2},
    {"sensor_id": 3, "api_key": "sensor_key_3", "road_id": 3},
    {"sensor_id": 4, "api_key": "sensor_key_4", "road_id": 4},
]


class TrafficSimulator:
    def __init__(self):
        self.running = False
        self._task: Optional[asyncio.Task] = None
        self._scenario_cycle = 0
        self.results = []

    def start(self):
        """Start the background simulation loop."""
        if not self.running:
            self.running = True
            loop = asyncio.get_event_loop()
            self._task = loop.create_task(self._run_loop())
            logger.info("Traffic simulator started.")

    def stop(self):
        self.running = False
        if self._task:
            self._task.cancel()

    async def run_once(self) -> dict:
        """Run one round of all scenarios (for /demo/simulate endpoint)."""
        results = []
        scenarios = self._build_scenarios()
        async with httpx.AsyncClient(timeout=5.0) as client:
            for scenario in scenarios:
                result = await self._post_scenario(client, scenario)
                results.append(result)
        return {"scenarios_run": len(results), "results": results}

    def _build_scenarios(self):
        """Build one round of scenario payloads."""
        scenarios = []
        hour = 8  # simulate rush hour by default

        for cfg in SENSOR_CONFIGS:
            sid = cfg["sensor_id"]
            road_id = cfg["road_id"]
            api_key = cfg["api_key"]

            # Scenario 1: Rush hour
            scenarios.append({
                "name": "rush_hour",
                "sensor_id": sid,
                "api_key": api_key,
                "payload": {
                    "count": random.randint(60, 100),
                    "queue_length": random.randint(20, 40),
                    "vehicle_class": "mixed",
                    "confidence": round(random.uniform(0.75, 0.95), 2),
                    "avg_speed": round(random.uniform(15, 30), 1),
                    "has_emergency_vehicle": False,
                },
            })

        # Scenario 2: Quiet period
        scenarios.append({
            "name": "quiet_period",
            "sensor_id": SENSOR_CONFIGS[0]["sensor_id"],
            "api_key": SENSOR_CONFIGS[0]["api_key"],
            "payload": {
                "count": random.randint(5, 20),
                "queue_length": random.randint(0, 5),
                "vehicle_class": "car",
                "confidence": 0.9,
                "avg_speed": round(random.uniform(45, 60), 1),
                "has_emergency_vehicle": False,
            },
        })

        # Scenario 3: Zero-traffic road
        scenarios.append({
            "name": "zero_traffic",
            "sensor_id": SENSOR_CONFIGS[1]["sensor_id"],
            "api_key": SENSOR_CONFIGS[1]["api_key"],
            "payload": {
                "count": 0,
                "queue_length": 0,
                "vehicle_class": "none",
                "confidence": 0.99,
                "avg_speed": 0.0,
                "has_emergency_vehicle": False,
            },
        })

        # Scenario 4: Congested road
        scenarios.append({
            "name": "congested",
            "sensor_id": SENSOR_CONFIGS[2]["sensor_id"],
            "api_key": SENSOR_CONFIGS[2]["api_key"],
            "payload": {
                "count": random.randint(90, 110),
                "queue_length": random.randint(40, 60),
                "vehicle_class": "mixed",
                "confidence": 0.88,
                "avg_speed": 5.0,
                "has_emergency_vehicle": False,
            },
        })

        # Scenario 5: Ambulance sighting
        scenarios.append({
            "name": "ambulance_sighting",
            "sensor_id": SENSOR_CONFIGS[3]["sensor_id"],
            "api_key": SENSOR_CONFIGS[3]["api_key"],
            "payload": {
                "count": random.randint(10, 30),
                "queue_length": random.randint(5, 15),
                "vehicle_class": "ambulance",
                "confidence": 0.92,
                "avg_speed": round(random.uniform(20, 40), 1),
                "has_emergency_vehicle": True,
            },
        })

        return scenarios

    async def _post_scenario(self, client: httpx.AsyncClient, scenario: dict) -> dict:
        sensor_id = scenario["sensor_id"]
        api_key = scenario["api_key"]
        payload = scenario["payload"]
        url = f"{BACKEND_URL}/api/sensors/{sensor_id}/readings"
        try:
            resp = await client.post(
                url,
                json=payload,
                headers={"X-API-Key": api_key},
            )
            return {
                "scenario": scenario["name"],
                "sensor_id": sensor_id,
                "status_code": resp.status_code,
                "ok": resp.status_code < 300,
            }
        except Exception as e:
            return {
                "scenario": scenario["name"],
                "sensor_id": sensor_id,
                "status_code": 0,
                "ok": False,
                "error": str(e)[:80],
            }

    async def _run_loop(self):
        """Background loop running scenarios every 30 seconds."""
        while self.running:
            try:
                result = await self.run_once()
                self.results.append(result)
                if len(self.results) > 20:
                    self.results = self.results[-20:]
            except Exception as e:
                logger.error(f"Simulator loop error: {e}")
            await asyncio.sleep(30)
