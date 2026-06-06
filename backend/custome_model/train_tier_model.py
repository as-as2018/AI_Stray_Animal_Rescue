import os
import json
import argparse
from collections import Counter
from transformers import AutoTokenizer, AutoModelForSequenceClassification, Trainer, TrainingArguments
from datasets import Dataset

def load_data(rlhf=False):
    base_file = os.path.join(os.path.dirname(__file__), 'base_dataset.json')
    rlhf_file = os.path.join(os.path.dirname(__file__), 'rlhf_dataset.json')
    
    with open(base_file, 'r') as f:
        data = json.load(f)
        
    if rlhf and os.path.exists(rlhf_file):
        print("Loading RLHF Human Feedback corrections...")
        with open(rlhf_file, 'r') as f:
            rlhf_data = json.load(f)
            data.extend(rlhf_data)
            
    # MAJORITY VOTING (Solve Annotator Disagreement)
    text_to_labels = {}
    for item in data:
        t = item['text'].strip()
        if t not in text_to_labels:
            text_to_labels[t] = []
        text_to_labels[t].append(item['label'])
        
    final_data = []
    for t, labels in text_to_labels.items():
        # Get the most common label
        majority_label = Counter(labels).most_common(1)[0][0]
        final_data.append({"text": t, "label": majority_label})
        
    print(f"Loaded {len(final_data)} unique training examples after majority voting.")
    return final_data

def train(rlhf=False):
    print("Initializing Custom Tier Predictor Training...")
    data = load_data(rlhf=rlhf)
    
    # Convert to HuggingFace Dataset
    hf_dataset = Dataset.from_list(data)
    
    # Load Model & Tokenizer (prajjwal1/bert-tiny for fast CPU training)
    model_name = "prajjwal1/bert-tiny"
    print(f"Loading base model: {model_name}")
    tokenizer = AutoTokenizer.from_pretrained(model_name)
    model = AutoModelForSequenceClassification.from_pretrained(model_name, num_labels=5)
    
    def tokenize_function(examples):
        return tokenizer(examples["text"], padding="max_length", truncation=True, max_length=128)
        
    print("Tokenizing dataset...")
    tokenized_datasets = hf_dataset.map(tokenize_function, batched=True)
    
    training_args = TrainingArguments(
        output_dir=os.path.join(os.path.dirname(__file__), "checkpoints"),
        evaluation_strategy="no",
        save_strategy="no",
        learning_rate=5e-4,
        per_device_train_batch_size=8,
        num_train_epochs=50, # Higher epochs for tiny dataset
        weight_decay=0.01,
        logging_steps=10,
        report_to="none" # Disable wandb/tensorboard
    )
    
    trainer = Trainer(
        model=model,
        args=training_args,
        train_dataset=tokenized_datasets,
        tokenizer=tokenizer,
    )
    
    print("Starting Fine-Tuning...")
    trainer.train()
    
    # Save the model
    save_path = os.path.join(os.path.dirname(__file__), "saved_model")
    trainer.save_model(save_path)
    print(f"Training Complete! Model saved to {save_path}")

if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument('--rlhf', action='store_true', help="Include RLHF Human Feedback dataset")
    args = parser.parse_args()
    
    train(rlhf=args.rlhf)
