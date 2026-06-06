"""
RLHF Weekly Auto-Retraining Scheduler
======================================
This script is designed to be run weekly (every Sunday at 2:00 AM) to
automatically retrain the custom BERT Tier Classifier with accumulated
human feedback from NGO Admin corrections.

How it works:
  1. Checks if the RLHF dataset has enough new corrections (MIN_SAMPLES threshold)
  2. Runs training using train_tier_model.py with the --rlhf flag
  3. Backs up the old model before replacing it
  4. Logs all activity to retrain_log.txt

Usage:
  python retrain_scheduler.py                   # Manual run (always trains)
  python retrain_scheduler.py --min-samples 20  # Only train if 20+ RLHF samples exist
  python retrain_scheduler.py --dry-run         # Check status without training
"""

import os
import sys
import json
import shutil
import argparse
import subprocess
import logging
from datetime import datetime

# ─── Configuration ────────────────────────────────────────────────────────────
BASE_DIR        = os.path.dirname(os.path.abspath(__file__))
RLHF_FILE       = os.path.join(BASE_DIR, "rlhf_dataset.json")
BASE_FILE       = os.path.join(BASE_DIR, "base_dataset.json")
SAVED_MODEL_DIR = os.path.join(BASE_DIR, "saved_model")
BACKUP_DIR      = os.path.join(BASE_DIR, "model_backups")
TRAIN_SCRIPT    = os.path.join(BASE_DIR, "train_tier_model.py")
LOG_FILE        = os.path.join(BASE_DIR, "retrain_log.txt")

MIN_SAMPLES_DEFAULT = 5  # Minimum new RLHF samples required to trigger retraining

# ─── Logging Setup ────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="%(asctime)s [%(levelname)s] %(message)s",
    handlers=[
        logging.FileHandler(LOG_FILE, encoding="utf-8"),
        logging.StreamHandler(sys.stdout)
    ]
)
log = logging.getLogger(__name__)


def load_rlhf_count():
    """Returns the number of human feedback corrections in rlhf_dataset.json."""
    if not os.path.exists(RLHF_FILE):
        return 0
    try:
        with open(RLHF_FILE, "r") as f:
            data = json.load(f)
            return len(data)
    except (json.JSONDecodeError, IOError):
        return 0


def backup_current_model():
    """Creates a timestamped backup of the current saved model before retraining."""
    if not os.path.exists(SAVED_MODEL_DIR):
        log.info("No existing model to back up. Skipping backup.")
        return

    os.makedirs(BACKUP_DIR, exist_ok=True)
    timestamp = datetime.now().strftime("%Y%m%d_%H%M%S")
    backup_path = os.path.join(BACKUP_DIR, f"model_backup_{timestamp}")

    try:
        shutil.copytree(SAVED_MODEL_DIR, backup_path)
        log.info(f"✅ Model backed up to: {backup_path}")

        # Keep only the last 5 backups to save disk space
        all_backups = sorted(
            [d for d in os.listdir(BACKUP_DIR) if d.startswith("model_backup_")]
        )
        while len(all_backups) > 5:
            oldest = os.path.join(BACKUP_DIR, all_backups.pop(0))
            shutil.rmtree(oldest)
            log.info(f"🗑️  Old backup removed: {oldest}")
    except Exception as e:
        log.error(f"Backup failed: {e}")


def run_training():
    """Executes the training script with the --rlhf flag."""
    log.info("🚀 Starting RLHF fine-tuning via train_tier_model.py...")
    try:
        result = subprocess.run(
            [sys.executable, TRAIN_SCRIPT, "--rlhf"],
            capture_output=True,
            text=True,
            cwd=BASE_DIR
        )
        if result.returncode == 0:
            log.info("✅ Training completed successfully!")
            log.info(result.stdout)
            return True
        else:
            log.error(f"❌ Training failed with exit code {result.returncode}")
            log.error(result.stderr)
            return False
    except Exception as e:
        log.error(f"❌ Failed to run training script: {e}")
        return False


def print_status():
    """Print a summary of the current RLHF dataset state."""
    rlhf_count = load_rlhf_count()
    base_count = 0
    if os.path.exists(BASE_FILE):
        with open(BASE_FILE, "r") as f:
            base_count = len(json.load(f))

    model_exists = os.path.exists(SAVED_MODEL_DIR) and os.listdir(SAVED_MODEL_DIR)
    backups = os.listdir(BACKUP_DIR) if os.path.exists(BACKUP_DIR) else []

    log.info("=" * 55)
    log.info("  RLHF RETRAINING SCHEDULER — STATUS REPORT")
    log.info("=" * 55)
    log.info(f"  📊 Base Training Samples : {base_count}")
    log.info(f"  🧑‍⚕️  RLHF Corrections      : {rlhf_count}")
    log.info(f"  🤖 Trained Model Exists  : {'Yes' if model_exists else 'No'}")
    log.info(f"  🗄️  Model Backups Stored  : {len(backups)}")
    log.info("=" * 55)


def main():
    parser = argparse.ArgumentParser(description="RLHF Weekly Auto-Retraining Scheduler")
    parser.add_argument(
        "--min-samples", type=int, default=MIN_SAMPLES_DEFAULT,
        help=f"Minimum RLHF samples needed to trigger training (default: {MIN_SAMPLES_DEFAULT})"
    )
    parser.add_argument(
        "--dry-run", action="store_true",
        help="Check status without actually training"
    )
    args = parser.parse_args()

    log.info("=" * 55)
    log.info(f"  🐾 RLHF WEEKLY RETRAINING JOB STARTED")
    log.info(f"  📅 Time: {datetime.now().strftime('%A, %d %B %Y at %I:%M %p')}")
    log.info("=" * 55)

    print_status()

    rlhf_count = load_rlhf_count()

    if args.dry_run:
        log.info("Dry-run mode: No training will happen.")
        if rlhf_count >= args.min_samples:
            log.info(f"✅ Training would be triggered ({rlhf_count} samples >= {args.min_samples} threshold).")
        else:
            log.info(f"⏭️  Training would be SKIPPED ({rlhf_count} samples < {args.min_samples} threshold).")
        return

    if rlhf_count < args.min_samples:
        log.info(
            f"⏭️  Skipping retraining: Only {rlhf_count} RLHF sample(s) available. "
            f"Need at least {args.min_samples} to retrain meaningfully."
        )
        log.info("  (More NGO Admin feedback corrections are needed first)")
        return

    log.info(f"✅ Threshold met: {rlhf_count} corrections found. Proceeding with retraining...")

    # Step 1: Backup old model
    backup_current_model()

    # Step 2: Run training
    success = run_training()

    if success:
        log.info("🎉 Weekly RLHF retraining job finished successfully!")
        log.info("  ℹ️  Restart the FastAPI server to load the new model weights.")
    else:
        log.error("💥 Retraining job failed. Old model is still in place (backup preserved).")


if __name__ == "__main__":
    main()
