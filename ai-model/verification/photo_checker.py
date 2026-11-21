"""
PhotoChecker: vehicle class detection (YOLOv8) + plate OCR (EasyOCR) + fuzzy match.
"""
import logging
import re
import difflib
from typing import Dict, Any, Optional

logger = logging.getLogger(__name__)

PLATE_PATTERN = re.compile(r"^[A-Z0-9]{4,10}$")


class PhotoChecker:
    def __init__(self, detector=None):
        self.detector = detector  # VehicleDetector instance (shared)
        self.ocr_reader = None
        self.ocr_available = False
        self._load_ocr()

    def _load_ocr(self):
        try:
            import easyocr
            self.ocr_reader = easyocr.Reader(["en"], gpu=False, verbose=False)
            self.ocr_available = True
            logger.info("EasyOCR loaded successfully.")
        except Exception as e:
            logger.warning(f"EasyOCR unavailable ({e}). Plate OCR disabled.")
            self.ocr_reader = None
            self.ocr_available = False

    def verify(self, image_bytes: bytes, typed_plate: str) -> Dict[str, Any]:
        """Main verification method. Never raises."""
        try:
            import numpy as np
            from PIL import Image
            import io
            import cv2

            # Decode image
            img_pil = Image.open(io.BytesIO(image_bytes)).convert("RGB")
            img_np = np.array(img_pil)
            img_cv = cv2.cvtColor(img_np, cv2.COLOR_RGB2BGR)

            # Vehicle detection
            vehicle_class = "unknown"
            class_confidence = 0.0
            if self.detector is not None:
                det_result = self.detector.detect_from_array(img_cv)
                vehicle_class = det_result.get("best_vehicle_class") or "unknown"
                class_confidence = det_result.get("best_vehicle_conf", 0.0)
                if det_result.get("has_emergency_vehicle"):
                    vehicle_class = "ambulance"

            # Plate OCR
            plate_text = ""
            plate_match_score = 0
            notes = ""

            if self.ocr_available and self.ocr_reader is not None:
                ocr_results = self.ocr_reader.readtext(img_np, detail=1, paragraph=False)
                plate_text = self._extract_plate(ocr_results)

            if plate_text:
                similarity = difflib.SequenceMatcher(
                    None,
                    plate_text.upper().replace(" ", ""),
                    typed_plate.upper().replace(" ", "")
                ).ratio()
                plate_match_score = round(similarity * 100, 1)
                notes = "Plate read successfully"
            else:
                plate_text = ""
                plate_match_score = 0
                notes = "Plate not readable"

            return {
                "vehicle_class": vehicle_class,
                "class_confidence": round(class_confidence, 3),
                "plate_text": plate_text,
                "plate_match_score": plate_match_score,
                "notes": notes,
            }
        except Exception as e:
            logger.error(f"Photo verification error: {e}")
            return {
                "vehicle_class": "unknown",
                "class_confidence": 0.0,
                "plate_text": "",
                "plate_match_score": 0,
                "notes": f"Verification failed: {str(e)[:100]}",
            }

    def _extract_plate(self, ocr_results) -> str:
        """Pick the OCR result that most looks like a vehicle plate."""
        candidates = []
        for result in ocr_results:
            # easyocr format: (bbox, text, confidence)
            if len(result) >= 3:
                text = result[1].upper().replace(" ", "").replace("-", "")
                conf = float(result[2])
                if PLATE_PATTERN.match(text):
                    candidates.append((conf, text))

        if not candidates:
            # Fallback: take longest alphanumeric token
            for result in ocr_results:
                if len(result) >= 2:
                    raw = re.sub(r"[^A-Z0-9]", "", result[1].upper())
                    if 4 <= len(raw) <= 10:
                        conf = float(result[2]) if len(result) >= 3 else 0.5
                        candidates.append((conf, raw))

        if candidates:
            candidates.sort(key=lambda x: -x[0])
            return candidates[0][1]
        return ""
