"""
Trainer: trains a Random Forest on synthetic traffic data and saves the model.
"""
import json
import logging
import os
from datetime import datetime, timezone
from pathlib import Path
from typing import Dict, Any

import joblib
import numpy as np
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
from sklearn.metrics import mean_absolute_error, r2_score
import matplotlib
matplotlib.use("Agg")
import matplotlib.pyplot as plt

from predictor.data_generator import generate_data, FEATURE_COLS, TARGET_COL

logger = logging.getLogger(__name__)

MODELS_DIR = Path(__file__).parent.parent / "models"
REPORTS_DIR = Path(__file__).parent.parent / "reports"
MODEL_PATH = MODELS_DIR / "rf_model.joblib"
METRICS_PATH = REPORTS_DIR / "metrics.json"


def _exponential_smoothing(series: np.ndarray, alpha: float = 0.3) -> np.ndarray:
    """Simple exponential smoothing baseline."""
    smoothed = np.zeros_like(series, dtype=float)
    smoothed[0] = series[0]
    for i in range(1, len(series)):
        smoothed[i] = alpha * series[i] + (1 - alpha) * smoothed[i - 1]
    # Shift by 1 (predict next from current)
    return np.roll(smoothed, 1)


def train() -> Dict[str, Any]:
    """Generate data, train RF model, evaluate, save model + plots + metrics."""
    MODELS_DIR.mkdir(parents=True, exist_ok=True)
    REPORTS_DIR.mkdir(parents=True, exist_ok=True)

    logger.info("Generating synthetic training data...")
    df = generate_data()
    n_samples = len(df)
    logger.info(f"Generated {n_samples} samples.")

    # Time-based split: first 80% train, last 20% test
    split_idx = int(n_samples * 0.8)
    train_df = df.iloc[:split_idx].copy()
    test_df = df.iloc[split_idx:].copy()

    X_train = train_df[FEATURE_COLS].values
    y_train = train_df[TARGET_COL].values
    X_test = test_df[FEATURE_COLS].values
    y_test = test_df[TARGET_COL].values

    logger.info("Training Random Forest...")
    rf = RandomForestRegressor(n_estimators=100, random_state=42, n_jobs=-1)
    rf.fit(X_train, y_train)

    y_pred = rf.predict(X_test)
    rf_mae = float(mean_absolute_error(y_test, y_pred))
    rf_r2 = float(r2_score(y_test, y_pred))

    # Baseline: exponential smoothing on lag1_count
    lag1_test = test_df["lag1_count"].values
    baseline_preds = _exponential_smoothing(lag1_test)
    baseline_mae = float(mean_absolute_error(y_test, baseline_preds))
    baseline_r2 = float(r2_score(y_test, baseline_preds))

    logger.info(f"RF MAE={rf_mae:.3f}, R2={rf_r2:.3f} | Baseline MAE={baseline_mae:.3f}")

    # Save model
    joblib.dump(rf, MODEL_PATH)
    logger.info(f"Model saved to {MODEL_PATH}")

    # Save metrics
    metrics = {
        "rf_mae": round(rf_mae, 4),
        "rf_r2": round(rf_r2, 4),
        "baseline_mae": round(baseline_mae, 4),
        "baseline_r2": round(baseline_r2, 4),
        "trained_at": datetime.now(timezone.utc).isoformat(),
        "n_samples": n_samples,
    }
    with open(METRICS_PATH, "w") as f:
        json.dump(metrics, f, indent=2)

    # Plot 1: Actual vs Predicted
    _plot_actual_vs_predicted(y_test, y_pred)

    # Plot 2: Feature Importance
    _plot_feature_importance(rf)

    return {
        "status": "trained",
        "mae": round(rf_mae, 4),
        "accuracy": round(max(0, 100 * (1 - rf_mae / (y_test.mean() + 1e-6))), 2),
        "baseline_mae": round(baseline_mae, 4),
        "rf_r2": round(rf_r2, 4),
        "n_samples": n_samples,
    }


def _plot_actual_vs_predicted(y_test: np.ndarray, y_pred: np.ndarray):
    fig, ax = plt.subplots(figsize=(8, 5))
    sample = min(500, len(y_test))
    ax.scatter(y_test[:sample], y_pred[:sample], alpha=0.4, s=10, color="steelblue")
    mn = min(y_test.min(), y_pred.min())
    mx = max(y_test.max(), y_pred.max())
    ax.plot([mn, mx], [mn, mx], "r--", linewidth=1.5, label="Perfect prediction")
    ax.set_xlabel("Actual Occupancy (%)")
    ax.set_ylabel("Predicted Occupancy (%)")
    ax.set_title("Actual vs Predicted Traffic Occupancy")
    ax.legend()
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "actual_vs_predicted.png", dpi=120)
    plt.close(fig)


def _plot_feature_importance(rf: RandomForestRegressor):
    from predictor.data_generator import FEATURE_COLS
    importances = rf.feature_importances_
    indices = np.argsort(importances)[::-1]
    fig, ax = plt.subplots(figsize=(8, 5))
    ax.bar(range(len(FEATURE_COLS)), importances[indices], color="steelblue")
    ax.set_xticks(range(len(FEATURE_COLS)))
    ax.set_xticklabels([FEATURE_COLS[i] for i in indices], rotation=45, ha="right")
    ax.set_title("Random Forest Feature Importances")
    ax.set_ylabel("Importance")
    fig.tight_layout()
    fig.savefig(REPORTS_DIR / "feature_importance.png", dpi=120)
    plt.close(fig)
