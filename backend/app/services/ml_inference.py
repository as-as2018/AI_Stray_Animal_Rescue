import os
import time
import logging
import io
import json
from typing import Optional
import numpy as np
from PIL import Image

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer

logger = logging.getLogger(__name__)

# ─── Lazy-loaded model singletons ─────────────────────────────────────────────
_yolo_model = None
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")


def load_yolo(model_path: str):
    global _yolo_model
    if _yolo_model is None:
        try:
            from ultralytics import YOLO
            if os.path.exists(model_path):
                _yolo_model = YOLO(model_path)
            else:
                _yolo_model = YOLO("yolo11x.pt")
        except Exception as e:
            logger.error(f"YOLO load error: {e}")
            _yolo_model = None
    return _yolo_model

COCO_ANIMAL_CLASSES = {
    "bird": "bird", "cat": "cat", "dog": "dog", "horse": "horse",
    "sheep": "sheep", "cow": "cow", "elephant": "elephant", "bear": "bear",
    "zebra": "zebra", "giraffe": "giraffe", "cattle": "cow", "buffalo": "cow",
    "ox": "cow", "bull": "cow", "donkey": "horse", "mule": "horse",
    "monkey": "monkey", "deer": "deer", "goat": "goat", "pig": "pig",
}

def run_species_detection(image_bytes: bytes, model_path: str) -> dict:
    model = load_yolo(model_path)
    if model is None:
        return {"species": "unknown", "breed_estimate": "N/A",
                "detection_confidence": 0.0, "bounding_box": None}

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
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

        if best_class == "unknown":
            for r in results:
                for box in r.boxes:
                    conf = float(box.conf)
                    cls_name = r.names[int(box.cls)].lower()
                    if conf > best_conf:
                        best_conf = conf
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

_moondream_model = None
_moondream_tokenizer = None

def load_moondream():
    global _moondream_model, _moondream_tokenizer
    if _moondream_model is None:
        try:
            logger.info("Loading Moondream2 model...")
            model_id = "vikhyatk/moondream2"
            
            _moondream_model = AutoModelForCausalLM.from_pretrained(
                model_id, trust_remote_code=True, revision="2024-05-08"
            ).to(_device)

            _moondream_tokenizer = AutoTokenizer.from_pretrained(
                model_id, revision="2024-05-08"
            )
            logger.info("Moondream2 loaded successfully.")
        except Exception as e:
            logger.error(f"Moondream load error: {e}")
            _moondream_model = None
    return _moondream_model, _moondream_tokenizer

def run_injury_classification_moondream(image_bytes: bytes, bbox: Optional[list]) -> dict:
    model, tokenizer = load_moondream()
    if model is None:
        return {"injury_class": 0, "injury_label": "Healthy", "injury_confidence": 0.95}

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")

        if bbox:
            x1, y1, x2, y2 = [int(v) for v in bbox]
            w, h = image.size
            margin_x = int((x2 - x1) * 0.05)
            margin_y = int((y2 - y1) * 0.05)
            x1, y1 = max(0, x1 - margin_x), max(0, y1 - margin_y)
            x2, y2 = min(w, x2 + margin_x), min(h, y2 + margin_y)
            image = image.crop((x1, y1, x2, y2))

        prompt = """
You are a veterinary injury assessment assistant.

Analyze the image carefully.

Tasks:
1. Identify the animal species (dog, cat, cow, bird, etc).
2. Categorize the severity level according to this table:
   - MONITOR: healthy, old scar, resting animal, no visible injury
   - LOW: minor skin disease, small wound, mild limping
   - MEDIUM: moderate wound, eye infection, unable to use one leg
   - HIGH: deep wound, severe burn, large open wound
   - CRITICAL: fracture, heavy bleeding, road accident, hit by vehicle
3. Describe the specific injury in 1 or 2 words based on the level above (e.g. "healthy", "small wound", "fracture").
4. Return ONLY valid JSON.

Output JSON format:
{
  "animal_species": "",
  "severity_level": "MONITOR, LOW, MEDIUM, HIGH, or CRITICAL",
  "injury_types": "healthy or brief injury description"
}

Return JSON only. Do not return explanations.
"""

        enc_image = model.encode_image(image)
        text = model.answer_question(enc_image, prompt, tokenizer)
        
        print(f"\n=========================================\nMOONDREAM RAW OUTPUT: {text}\n=========================================\n")
        
        # Valid injuries in their DB format (with underscores)
        valid_injuries = [
            "healthy", "old_scar", "minor_skin_disease", "small_wound", "mild_limping", 
            "moderate_wound", "moderate_bleeding", "eye_infection", "skin_infection", 
            "deep_wound", "severe_burn", "unable_to_walk_properly", "fracture", 
            "exposed_bone", "heavy_bleeding", "road_accident", "severe_trauma", "critical_condition"
        ]
        
        text_cleaned = text.strip()
        if text_cleaned.startswith("```json"):
            text_cleaned = text_cleaned[7:]
        elif text_cleaned.startswith("```"):
            text_cleaned = text_cleaned[3:]
        if text_cleaned.endswith("```"):
            text_cleaned = text_cleaned[:-3]
        text_cleaned = text_cleaned.strip()
            
        try:
            res = json.loads(text_cleaned)
            
            # If the model double-encoded the JSON as a string
            if isinstance(res, str):
                try:
                    res = json.loads(res)
                except:
                    pass
                    
            # If the model returned a list containing the object (like it tried to do in the last log)
            if isinstance(res, list):
                if len(res) > 0 and isinstance(res[0], dict):
                    res = res[0]
                else:
                    res = {}
                    
            if not isinstance(res, dict):
                res = {}
                
            injury_data = res.get("injury_types", "")
            
            # Handle comma-separated string by splitting it
            if isinstance(injury_data, str):
                injury_list = [i.strip() for i in injury_data.split(",")]
            elif isinstance(injury_data, list):
                injury_list = injury_data
            else:
                injury_list = []
                
            # Filter and normalize
            normalized_list = [str(i).lower().replace(" ", "_").replace("-", "_") for i in injury_list]
            matches = [inj for inj in normalized_list if inj in valid_injuries]
            
            if matches:
                best_match = max(matches, key=lambda x: valid_injuries.index(x))
                injury_type = best_match
            else:
                injury_type = "healthy"
                
            confidence = float(res.get("confidence", 0.85))
        except Exception as parse_err:
            print(f"JSON decode failed: {parse_err}. Attempting smart fallback keyword extraction.")
            text_lower = text.lower()
            injury_type = "healthy"
            confidence = 0.90  # Default confidence if no injuries are found
            
            # Smart heuristic mapping for natural language outputs
            if any(w in text_lower for w in ["critical", "dying", "hit by vehicle", "severe trauma"]):
                injury_type = "critical_condition"
                confidence = 0.98
            elif any(w in text_lower for w in ["fracture", "broken leg", "broken bone", "broken arm"]):
                injury_type = "fracture"
                confidence = 0.95
            elif any(w in text_lower for w in ["heavy bleeding", "lot of blood", "severe bleeding"]):
                injury_type = "heavy_bleeding"
                confidence = 0.95
            elif any(w in text_lower for w in ["road accident", "hit by car", "run over"]):
                injury_type = "road_accident"
                confidence = 0.92
            elif any(w in text_lower for w in ["burn", "burnt"]):
                injury_type = "severe_burn"
                confidence = 0.90
            elif any(w in text_lower for w in ["deep wound", "large wound", "serious injury", "severe wound"]):
                injury_type = "deep_wound"
                confidence = 0.88
            elif any(w in text_lower for w in ["blood", "bleeding"]):
                injury_type = "moderate_bleeding"
                confidence = 0.85
            elif any(w in text_lower for w in ["wound", "cut", "bitten", "bite", "scratch", "laceration"]):
                injury_type = "small_wound"
                confidence = 0.82
            elif any(w in text_lower for w in ["limp", "limping", "unable to walk", "injured leg"]):
                injury_type = "mild_limping"
                confidence = 0.85
            elif any(w in text_lower for w in ["eye"]):
                injury_type = "eye_infection"
                confidence = 0.80
            elif any(w in text_lower for w in ["skin", "mange", "hair loss", "red mark", "spot"]):
                injury_type = "minor_skin_disease"
                confidence = 0.75
            elif any(w in text_lower for w in ["injured", "injury", "sick"]):
                injury_type = "small_wound" # Generic fallback if we just know it's injured
                confidence = 0.65
            
            # Extract animal species from text if mentioned (Overrides YOLO)
            moondream_species = None
            for animal in ["lion", "tiger", "dog", "cat", "cow", "horse", "goat", "sheep", "monkey", "bird", "pig", "deer", "bear", "elephant"]:
                if animal in text_lower:
                    moondream_species = animal
                    break
        
        print(f"EXTRACTED INJURY TYPE: {injury_type}")
        if moondream_species:
            print(f"EXTRACTED SPECIES (MOONDREAM): {moondream_species}")
        
        # We pass injury_type as injury_label to preserve DB schema backwards compatibility
        return {
            "injury_class": 0, # This will be recalculated by the Rule Engine in reports.py or urgency_score
            "injury_label": injury_type,
            "injury_confidence": confidence,
            "moondream_species": moondream_species
        }
    except Exception as e:
        logger.error(f"Moondream inference error: {e}")
        return {"injury_class": 0, "injury_label": "Healthy", "injury_confidence": 0.95, "moondream_species": None}

def run_full_pipeline(image_bytes: bytes, yolo_path: str) -> dict:
    start = time.time()
    species_result = run_species_detection(image_bytes, yolo_path)
    injury_result = run_injury_classification_moondream(
        image_bytes, species_result.get("bounding_box")
    )
    
    # If Moondream found a specific species (like Lion) that YOLO missed, override it!
    if injury_result.get("moondream_species"):
        species_result["species"] = injury_result["moondream_species"]

    inference_ms = int((time.time() - start) * 1000)

    return {
        **species_result,
        **injury_result,
        "inference_time_ms": inference_ms,
    }
