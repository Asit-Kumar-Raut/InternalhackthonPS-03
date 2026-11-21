"""
Tests for the SmartSignal AI model service.
Run with: pytest tests/test_service.py -v
"""
import io
import json
import sys
import os

# Ensure project root is on sys.path
sys.path.insert(0, os.path.dirname(os.path.dirname(os.path.abspath(__file__))))

import pytest
from fastapi.testclient import TestClient


@pytest.fixture(scope="module")
def client():
    from app.main import app
    with TestClient(app) as c:
        yield c


def test_health(client):
    resp = client.get("/health")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "ok"
    assert "model_trained" in data
    assert "detector_ready" in data


def test_predict(client):
    payload = {
        "junction_id": 1,
        "road_id": 1,
        "hour": 8,
        "day_of_week": 1,
        "current_count": 75.0,
        "lag1_count": 70.0,
        "lag2_count": 65.0,
        "lag3_count": 60.0,
        "avg_speed": 25.0,
        "upstream_count": 68.0,
        "current_phase": "NS",
    }
    resp = client.post("/predict", json=payload)
    assert resp.status_code == 200
    data = resp.json()
    assert "predicted_density" in data
    assert "predicted_level" in data
    assert 0 <= data["predicted_density"] <= 100
    assert data["predicted_level"] in ("LOW", "MEDIUM", "HIGH", "CONGESTED")
    assert 0 <= data["confidence"] <= 1


def test_train(client):
    resp = client.post("/train")
    assert resp.status_code == 200
    data = resp.json()
    assert data["status"] == "trained"
    assert "mae" in data
    assert "baseline_mae" in data
    # Check metrics.json was saved
    from predictor.trainer import METRICS_PATH
    assert METRICS_PATH.exists()
    with open(METRICS_PATH) as f:
        metrics = json.load(f)
    assert "rf_mae" in metrics
    assert "trained_at" in metrics


def test_verify_vehicle_photo(client):
    """Generate a white rectangle with plate text and test OCR."""
    try:
        from PIL import Image, ImageDraw, ImageFont
        import io as _io

        img = Image.new("RGB", (400, 200), color=(255, 255, 255))
        draw = ImageDraw.Draw(img)
        # Draw plate text
        draw.text((100, 80), "OD02AB1234", fill=(0, 0, 0))

        buf = _io.BytesIO()
        img.save(buf, format="JPEG")
        buf.seek(0)
        image_bytes = buf.read()

        resp = client.post(
            "/verify/vehicle-photo",
            files={"file": ("test_plate.jpg", image_bytes, "image/jpeg")},
            data={"typed_plate": "OD02AB1234"},
        )
        assert resp.status_code == 200
        data = resp.json()
        assert "vehicle_class" in data
        assert "plate_match_score" in data
        assert "plate_text" in data
        # plate_match_score is 0-100; just check range
        assert 0 <= data["plate_match_score"] <= 100
    except ImportError:
        pytest.skip("PIL not available")


def test_verify_bad_image(client):
    """Should not crash on invalid image bytes."""
    resp = client.post(
        "/verify/vehicle-photo",
        files={"file": ("bad.jpg", b"not_an_image", "image/jpeg")},
        data={"typed_plate": "TESTPLATE"},
    )
    assert resp.status_code == 200
    data = resp.json()
    assert "plate_match_score" in data
