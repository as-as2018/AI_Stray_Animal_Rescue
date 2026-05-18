import os
import time
import logging
from typing import Optional
import numpy as np
from PIL import Image, ImageStat
import io

logger = logging.getLogger(__name__)

# ─── Injury label mapping ────────────────────────────────────────────────────
INJURY_LABELS = {
    0: "Healthy",
    1: "Mild Distress",
    2: "Moderate Injury",
    3: "Severe Injury",
    4: "Critical",
}

# ─── Lazy-loaded model singletons ─────────────────────────────────────────────
_yolo_model = None
_effnet_model = None
_effnet_transform = None


def load_yolo(model_path: str):
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            if os.path.exists(model_path):
                logger.info(f"Loading custom YOLOv8 from {model_path}")
                _yolo_model = YOLO(model_path)
            else:
                # Use yolov8m (medium) — much better detection than nano
                logger.warning("Custom YOLO weights not found. Falling back to yolov8m pretrained on COCO.")
                _yolo_model = YOLO("yolov8m.pt")
        except Exception as e:
            logger.error(f"YOLO load error: {e}")
            _yolo_model = None
    return _yolo_model


def load_effnet(model_path: str):
    global _effnet_model, _effnet_transform
    if _effnet_model is None:
        try:
            import torch
            import timm
            from torchvision import transforms

            device = "cuda" if torch.cuda.is_available() else "cpu"

            if os.path.exists(model_path):
                logger.info(f"Loading custom EfficientNetV2-S from {model_path}")
                model = timm.create_model("tf_efficientnetv2_s", pretrained=False, num_classes=5)
                state = torch.load(model_path, map_location=device)
                model.load_state_dict(state)
                model.eval()
                model.to(device)
                _effnet_model = model
                _effnet_transform = transforms.Compose([
                    transforms.Resize((384, 384)),
                    transforms.ToTensor(),
                    transforms.Normalize(mean=[0.485, 0.456, 0.406],
                                         std=[0.229, 0.224, 0.225]),
                ])
                logger.info("Custom EfficientNetV2-S weights loaded.")
            else:
                logger.warning("Custom EfficientNet weights not found. Will use visual heuristic fallback.")
                _effnet_model = "heuristic"   # sentinel — use heuristic mode
        except Exception as e:
            logger.error(f"EfficientNet load error: {e}")
            _effnet_model = "heuristic"
    return _effnet_model, _effnet_transform


# ─── COCO animal classes → species name ───────────────────────────────────────
# Covers all animals in the 80-class COCO dataset
COCO_ANIMAL_CLASSES = {
    "bird": "bird",
    "cat": "cat",
    "dog": "dog",
    "horse": "horse",
    "sheep": "sheep",
    "cow": "cow",
    "elephant": "elephant",
    "bear": "bear",
    "zebra": "zebra",
    "giraffe": "giraffe",
    # alias — some YOLO variants label these differently
    "cattle": "cow",
    "buffalo": "cow",
    "ox": "cow",
    "bull": "cow",
    "donkey": "horse",
    "mule": "horse",
    "monkey": "monkey",
    "deer": "deer",
    "goat": "goat",
    "pig": "pig",
}


def _visual_injury_heuristic(image: Image.Image) -> dict:
    """
    When no custom injury model is available, estimate injury severity from
    image statistics (contrast, colour variance, dark-spot density).
    This is a rough heuristic for demo purposes — not clinically accurate.
    """
    try:
        img_rgb = image.convert("RGB")
        stat = ImageStat.Stat(img_rgb)

        # Mean brightness per channel
        r_mean, g_mean, b_mean = stat.mean
        brightness = (r_mean + g_mean + b_mean) / 3.0

        # Standard deviation reflects colour variation (wounds, lesions cause patches)
        r_std, g_std, b_std = stat.stddev
        colour_variance = (r_std + g_std + b_std) / 3.0

        # Red-channel dominance can indicate blood/wounds
        red_excess = r_mean - (g_mean + b_mean) / 2.0

        # Convert to numpy for patch-level analysis
        arr = np.array(img_rgb, dtype=np.float32)

        # Dark patch ratio — injuries / lesions often create darker regions
        gray = arr.mean(axis=2)
        dark_ratio = float((gray < 60).sum()) / gray.size

        # Simple scoring
        score = 0.0
        score += min(colour_variance / 60.0, 1.0) * 0.35   # high var → injury
        score += min(red_excess / 40.0, 1.0) * 0.30        # red excess → blood
        score += min(dark_ratio / 0.15, 1.0) * 0.20        # dark patches → bruising
        score -= min(brightness / 200.0, 1.0) * 0.15       # very bright → healthy

        score = max(0.0, min(score, 1.0))

        # Map score → injury class
        if score < 0.15:
            cls, conf = 0, round(0.7 + score, 4)   # Healthy
        elif score < 0.35:
            cls, conf = 1, round(0.55 + score * 0.4, 4)   # Mild Distress
        elif score < 0.55:
            cls, conf = 2, round(0.5 + score * 0.3, 4)    # Moderate Injury
        elif score < 0.75:
            cls, conf = 3, round(0.5 + score * 0.25, 4)   # Severe Injury
        else:
            cls, conf = 4, round(0.5 + score * 0.2, 4)    # Critical

        return {
            "injury_class": cls,
            "injury_label": INJURY_LABELS[cls],
            "injury_confidence": min(round(conf, 4), 0.99),
        }
    except Exception as e:
        logger.error(f"Visual heuristic error: {e}")
        return {"injury_class": 1, "injury_label": "Mild Distress", "injury_confidence": 0.45}


def run_species_detection(image_bytes: bytes, model_path: str) -> dict:
    """Run YOLOv8 on image bytes. Returns species, confidence, bbox."""
    model = load_yolo(model_path)
    if model is None:
        return {"species": "unknown", "breed_estimate": "N/A",
                "detection_confidence": 0.0, "bounding_box": None}

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        # conf=0.15 → catch weaker detections when no fine-tuned weights
        results = model(image, verbose=False, conf=0.15)

        best_conf = 0.0
        best_class = "unknown"
        best_box = None

        for r in results:
            for box in r.boxes:
                cls_name = r.names[int(box.cls)].lower()
                conf = float(box.conf)
                mapped = COCO_ANIMAL_CLASSES.get(cls_name)
                if mapped and conf > best_conf:
                    best_conf = conf
                    best_class = mapped
                    best_box = box.xyxy[0].tolist()

        # If YOLO found nothing in COCO animal set, still return the
        # highest-confidence detection by any class (so it's not blank)
        if best_class == "unknown":
            for r in results:
                for box in r.boxes:
                    conf = float(box.conf)
                    cls_name = r.names[int(box.cls)].lower()
                    if conf > best_conf:
                        best_conf = conf
                        best_class = cls_name   # raw COCO class name
                        best_box = box.xyxy[0].tolist()

        return {
            "species": best_class,
            "breed_estimate": f"Unknown {best_class.capitalize()} breed" if best_class != "unknown" else "N/A",
            "detection_confidence": round(best_conf, 4),
            "bounding_box": best_box,
        }
    except Exception as e:
        logger.error(f"YOLO inference error: {e}")
        return {"species": "unknown", "breed_estimate": "N/A",
                "detection_confidence": 0.0, "bounding_box": None}


def run_injury_classification(image_bytes: bytes, model_path: str, bbox: Optional[list] = None) -> dict:
    """Run EfficientNetV2-S (or heuristic fallback) on image bytes."""
    model, transform = load_effnet(model_path)

    image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

    # Crop to animal bounding box if available
    if bbox:
        x1, y1, x2, y2 = [int(v) for v in bbox]
        w, h = image.size
        x1, y1 = max(0, x1 - 20), max(0, y1 - 20)
        x2, y2 = min(w, x2 + 20), min(h, y2 + 20)
        image = image.crop((x1, y1, x2, y2))

    # Heuristic mode when no custom weights exist
    if model == "heuristic" or model is None:
        return _visual_injury_heuristic(image)

    try:
        import torch
        device = next(model.parameters()).device
        tensor = transform(image).unsqueeze(0).to(device)

        with torch.no_grad():
            logits = model(tensor)
            probs = torch.softmax(logits, dim=1)
            injury_class = int(probs.argmax(dim=1).item())
            injury_confidence = float(probs[0, injury_class].item())

        return {
            "injury_class": injury_class,
            "injury_label": INJURY_LABELS[injury_class],
            "injury_confidence": round(injury_confidence, 4),
        }
    except Exception as e:
        logger.error(f"EfficientNet inference error: {e}")
        return _visual_injury_heuristic(image)


def run_full_pipeline(image_bytes: bytes, yolo_path: str, effnet_path: str) -> dict:
    """Run the complete AI pipeline. Returns merged result dict."""
    start = time.time()

    species_result = run_species_detection(image_bytes, yolo_path)
    injury_result = run_injury_classification(
        image_bytes, effnet_path, species_result.get("bounding_box")
    )

    inference_ms = int((time.time() - start) * 1000)

    return {
        **species_result,
        **injury_result,
        "inference_time_ms": inference_ms,
    }
