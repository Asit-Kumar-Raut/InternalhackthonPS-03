"""
Synthetic training data generator for traffic density forecasting.
365 days x 24 hours x 4 junctions.
"""
import numpy as np
import pandas as pd
from typing import Tuple

CAPACITY = 100  # vehicles per road segment (used for occupancy calc)
JUNCTIONS = [1, 2, 3, 4]
PHASES = ["NS", "EW"]
PHASE_ENC = {"NS": 0, "EW": 1}


def _base_count(hour: int, day_of_week: int) -> float:
    """Return expected vehicle count based on hour and day."""
    is_weekend = day_of_week >= 5
    weekend_factor = 0.7 if is_weekend else 1.0

    if 7 <= hour <= 9:  # Morning peak
        return random.uniform(60, 100) * weekend_factor
    elif 17 <= hour <= 19:  # Evening peak
        return random.uniform(70, 110) * weekend_factor
    elif 23 <= hour or hour <= 5:  # Quiet night
        return random.uniform(5, 20)
    elif 10 <= hour <= 16:  # Midday
        return random.uniform(30, 60) * weekend_factor
    else:  # Shoulder hours
        return random.uniform(20, 45) * weekend_factor


def generate_data() -> pd.DataFrame:
    import random as _random
    global random
    random = _random

    rows = []
    rng = np.random.default_rng(42)

    for day in range(365):
        day_of_week = day % 7
        is_weekend = int(day_of_week >= 5)
        for junction_id in JUNCTIONS:
            # Build hourly counts for the day for lag features
            counts = []
            for hour in range(24):
                count = _base_count(hour, day_of_week)
                # Random incident: 5% chance of 2× traffic
                if rng.random() < 0.05:
                    count *= 2
                # Gaussian noise
                count += rng.normal(0, 3)
                count = max(0, count)
                counts.append(count)

            for hour in range(24):
                current_count = counts[hour]
                lag1 = counts[hour - 1] if hour >= 1 else counts[0]
                lag2 = counts[hour - 2] if hour >= 2 else counts[0]
                lag3 = counts[hour - 3] if hour >= 3 else counts[0]

                avg_speed = max(5.0, 60.0 - current_count * 0.5 + rng.normal(0, 5))
                upstream_count = counts[(hour - 1) % 24] * rng.uniform(0.8, 1.2)
                current_phase = rng.choice(PHASES)

                # Target: occupancy 5 min ahead (use next hour as proxy)
                next_count = counts[(hour + 1) % 24]
                occupancy = min(100.0, (next_count / CAPACITY) * 100.0)

                rows.append({
                    "day": day,
                    "junction_id": junction_id,
                    "hour": hour,
                    "day_of_week": day_of_week,
                    "is_weekend": is_weekend,
                    "current_count": round(current_count, 2),
                    "lag1_count": round(lag1, 2),
                    "lag2_count": round(lag2, 2),
                    "lag3_count": round(lag3, 2),
                    "avg_speed": round(avg_speed, 2),
                    "upstream_count": round(upstream_count, 2),
                    "current_phase": PHASE_ENC[current_phase],
                    "occupancy": round(occupancy, 2),
                })

    df = pd.DataFrame(rows)
    return df


FEATURE_COLS = [
    "hour", "day_of_week", "is_weekend",
    "current_count", "lag1_count", "lag2_count", "lag3_count",
    "avg_speed", "upstream_count", "current_phase",
]
TARGET_COL = "occupancy"
