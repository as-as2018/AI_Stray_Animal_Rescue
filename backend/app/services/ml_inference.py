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
_tier_classifier = None

def load_nlp_classifier():
    global _nlp_classifier
    if _nlp_classifier is None:
        try:
            from transformers import pipeline
            logger.info("Loading Zero-Shot NLP Classifier for species...")
            _nlp_classifier = pipeline(
                "zero-shot-classification",
                model="typeform/distilbert-base-uncased-mnli",
                device=0 if _device.type == "cuda" else -1
            )
        except Exception as e:
            logger.error(f"NLP load error: {e}")
    return _nlp_classifier

def load_tier_classifier():
    global _tier_classifier
    if _tier_classifier is None:
        try:
            from transformers import pipeline
            import os
            model_path = os.path.join(os.path.dirname(__file__), '..', '..', 'custome_model', 'saved_model')
            if os.path.exists(model_path):
                logger.info("Loading Custom RLHF Tier Predictor...")
                _tier_classifier = pipeline(
                    "text-classification",
                    model=model_path,
                    device=0 if _device.type == "cuda" else -1
                )
        except Exception as e:
            logger.error(f"Custom Tier model load error: {e}")
    return _tier_classifier

def run_moondream_pipeline(image_bytes: bytes) -> dict:
    model, tokenizer = load_moondream()
    if model is None:
        return {"species": "unknown", "breed_estimate": "N/A", "detection_confidence": 0.0, "bounding_box": None, "injury_class": 0, "injury_label": "Healthy", "ai_confidence": 0.95, "moondream_text": ""}

    try:
        image = Image.open(io.BytesIO(image_bytes)).convert("RGB")
        prompt = """
You are an expert veterinary triage assistant.

Analyze the image carefully and generate a dense descriptive paragraph.
Describe:
1. The animal species (e.g. dog, cat, cow, bird).
2. Its posture or activity (e.g. resting, unable to stand, lying down).
3. Any visible physical injuries, bleeding, wounds, fractures, or signs of distress.

Do NOT use JSON. Write a highly detailed paragraph.
"""

        enc_image = model.encode_image(image)
        text = model.answer_question(enc_image, prompt, tokenizer)
        
        print(f"\n=========================================\nMOONDREAM RAW OUTPUT: {text}\n=========================================\n")
        
        # PIPELINE STEP 2: Custom RLHF Tier Classifier
        tier_classifier = load_tier_classifier()
        injury_type = "MONITOR"
        confidence = 0.85
        
        if tier_classifier is not None:
            tier_result = tier_classifier(text)[0]
            label_mapping = {"LABEL_0": "MONITOR", "LABEL_1": "LOW", "LABEL_2": "MEDIUM", "LABEL_3": "HIGH", "LABEL_4": "CRITICAL"}
            injury_type = label_mapping.get(tier_result["label"], "MONITOR")
            confidence = float(tier_result["score"])
        else:
            print("Custom Tier Classifier not found. Falling back to generic healthy.")
            
        # PIPELINE STEP 3: Zero-Shot Species Extraction
        classifier = load_nlp_classifier()
        moondream_species = None
        if classifier is not None:
            animal_candidates = ["lion", "tiger", "dog", "cat", "cow", "horse", "goat", "sheep", "monkey", "bird", "pig", "deer", "bear", "elephant", "none"]
            species_result = classifier(
                text, 
                animal_candidates, 
                multi_label=False,
                hypothesis_template="The species of the animal is {}."
            )
            best_animal = species_result["labels"][0]
            moondream_species = best_animal if best_animal != "none" and species_result["scores"][0] > 0.4 else None

        print(f"EXTRACTED TIER (CUSTOM BERT): {injury_type}")
        if moondream_species:
            print(f"EXTRACTED SPECIES (DISTILBERT): {moondream_species}")
        
        final_species = moondream_species if moondream_species else "unknown"
        return {
            "species": final_species,
            "breed_estimate": f"Unknown {final_species.capitalize()} breed" if final_species != "unknown" else "N/A",
            "detection_confidence": confidence,
            "bounding_box": None,
            "injury_class": 0, # Recalculated dynamically later
            "injury_label": injury_type,
            "ai_confidence": confidence,
            "moondream_text": text
        }
    except Exception as e:
        logger.error(f"Moondream inference error: {e}")
        return {"species": "unknown", "breed_estimate": "N/A", "detection_confidence": 0.0, "bounding_box": None, "injury_class": 0, "injury_label": "Healthy", "ai_confidence": 0.95}

def run_full_pipeline(image_bytes: bytes, yolo_path: str = None) -> dict:
    # yolo_path is kept as an optional argument to prevent breaking older router imports
    start = time.time()
    result = run_moondream_pipeline(image_bytes)
    inference_ms = int((time.time() - start) * 1000)

    result["inference_time_ms"] = inference_ms
    return result
