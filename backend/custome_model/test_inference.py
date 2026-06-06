from transformers import pipeline
import os

def test_model():
    model_path = os.path.join(os.path.dirname(__file__), "saved_model")
    
    if not os.path.exists(model_path):
        print(f"Model not found at {model_path}")
        return
        
    print(f"Loading Custom BERT Model from: {model_path}")
    classifier = pipeline("text-classification", model=model_path)
    
    # Label mapping based on our generate_dataset.py
    label_mapping = {
        "LABEL_0": "MONITOR (Healthy)",
        "LABEL_1": "LOW (Minor Injury)",
        "LABEL_2": "MEDIUM (Moderate Injury)",
        "LABEL_3": "HIGH (Severe Injury)",
        "LABEL_4": "CRITICAL (Life Threatening)"
    }
    
    test_cases = [
        "The dog is resting peacefully in the shade. It has no visible injuries and looks well fed.",
        "A cat with a small scratch on its nose. It is limping slightly but walking.",
        "The cow has a moderately large cut on its leg that looks infected. It is unable to stand.",
        "A stray dog is lying on the road with an exposed bone fracture. It is bleeding heavily.",
        "The monkey has just been hit by a truck and is lying completely motionless in a pool of blood."
    ]
    
    print("\n" + "="*50)
    print("RUNNING INFERENCE TESTS ON CUSTOM BERT MODEL")
    print("="*50 + "\n")
    
    for idx, text in enumerate(test_cases, 1):
        result = classifier(text)[0]
        predicted_tier = label_mapping.get(result['label'], "UNKNOWN")
        confidence = result['score'] * 100
        
        print(f"Test Case {idx}:")
        print(f"Text: \"{text}\"")
        print(f"Predicts: {predicted_tier} (Confidence: {confidence:.1f}%)\n")

if __name__ == "__main__":
    test_model()
