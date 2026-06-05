import os
import time
import logging
import io
import json
from typing import Optional
import numpy as np
from PIL import Image

import torch
from transformers import AutoModelForCausalLM, AutoTokenizer, pipeline

logger = logging.getLogger(__name__)

# ─── Lazy-loaded model singletons ─────────────────────────────────────────────
_device = torch.device("cuda" if torch.cuda.is_available() else "cpu")

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

_nlp_classifier = None

def load_nlp_classifier():
    global _nlp_classifier
    if _nlp_classifier is None:
        try:
            logger.info("Loading secondary NLP Zero-Shot Classifier...")
            _nlp_classifier = pipeline(
                "zero-shot-classification",
                model="typeform/distilbert-base-uncased-mnli",
                device=0 if _device.type == "cuda" else -1
            )
        except Exception as e:
            logger.error(f"NLP load error: {e}")
    return _nlp_classifier

def run_moondream_pipeline(image_bytes: bytes) -> dict:
    model, tokenizer = load_moondream()
    if model is None:
        return {"species": "unknown", "breed_estimate": "N/A", "detection_confidence": 0.0, "bounding_box": None, "injury_class": 0, "injury_label": "Healthy", "injury_confidence": 0.95}

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
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
            print(f"JSON decode failed: {parse_err}. Booting secondary NLP Agent for Zero-Shot extraction...")
            classifier = load_nlp_classifier()
            
            if classifier is not None:
                # 1. NLP AI classifies the injury using Moondream's text
                # Fix: Replace underscores with spaces so the NLP model understands the English words!
                human_readable_injuries = [inj.replace("_", " ") for inj in valid_injuries]
                injury_result = classifier(
                    text, 
                    human_readable_injuries, 
                    multi_label=False,
                    hypothesis_template="Based on the text, the animal's physical condition is {}."
                )
                injury_type = injury_result["labels"][0].replace(" ", "_")
                confidence = float(injury_result["scores"][0])
                
                # 2. NLP AI classifies the animal species using Moondream's text
                animal_candidates = ["lion", "tiger", "dog", "cat", "cow", "horse", "goat", "sheep", "monkey", "bird", "pig", "deer", "bear", "elephant", "none"]
                species_result = classifier(
                    text, 
                    animal_candidates, 
                    multi_label=False,
                    hypothesis_template="The species of the animal is {}."
                )
                best_animal = species_result["labels"][0]
                moondream_species = best_animal if best_animal != "none" and species_result["scores"][0] > 0.4 else None
            else:
                # Absolute last resort if the second AI fails to load
                injury_type = "healthy"
                confidence = 0.85
                moondream_species = None
        
        print(f"EXTRACTED INJURY TYPE: {injury_type}")
        if moondream_species:
            print(f"EXTRACTED SPECIES (MOONDREAM): {moondream_species}")
        
        final_species = moondream_species if moondream_species else "unknown"
        return {
            "species": final_species,
            "breed_estimate": f"Unknown {final_species.capitalize()} breed" if final_species != "unknown" else "N/A",
            "detection_confidence": confidence,
            "bounding_box": None,
            "injury_class": 0, # This will be recalculated by the Rule Engine in reports.py or urgency_score
            "injury_label": injury_type,
            "injury_confidence": confidence
        }
    except Exception as e:
        logger.error(f"Moondream inference error: {e}")
        return {"species": "unknown", "breed_estimate": "N/A", "detection_confidence": 0.0, "bounding_box": None, "injury_class": 0, "injury_label": "Healthy", "injury_confidence": 0.95}

def run_full_pipeline(image_bytes: bytes, yolo_path: str = None) -> dict:
    # yolo_path is kept as an optional argument to prevent breaking older router imports
    start = time.time()
    result = run_moondream_pipeline(image_bytes)
    inference_ms = int((time.time() - start) * 1000)

    result["inference_time_ms"] = inference_ms
    return result
