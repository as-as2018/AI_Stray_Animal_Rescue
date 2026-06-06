#!/bin/bash
# ============================================================
# RLHF Weekly Retraining — Linux / Mac Crontab Setup
# ============================================================
# This script adds a cron job that runs retrain_scheduler.py
# every Sunday at 2:00 AM automatically.
#
# HOW TO USE:
#   chmod +x setup_cron.sh
#   ./setup_cron.sh
# ============================================================

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
SCHEDULER_SCRIPT="$SCRIPT_DIR/retrain_scheduler.py"
PYTHON_EXE=$(which python3 || which python)
CRON_LOG="$SCRIPT_DIR/retrain_log.txt"

echo ""
echo " =========================================="
echo "  RLHF Auto-Retraining — Cron Setup"
echo " =========================================="
echo ""

if [ -z "$PYTHON_EXE" ]; then
    echo "[ERROR] Python not found. Please install python3."
    exit 1
fi

echo " [INFO] Python found at: $PYTHON_EXE"
echo " [INFO] Scheduler script: $SCHEDULER_SCRIPT"
echo ""

# The cron entry: every Sunday at 2:00 AM
CRON_ENTRY="0 2 * * 0 $PYTHON_EXE $SCHEDULER_SCRIPT --min-samples 5 >> $CRON_LOG 2>&1"

# Add to crontab without duplicating
( crontab -l 2>/dev/null | grep -v "retrain_scheduler.py" ; echo "$CRON_ENTRY" ) | crontab -

echo " =========================================="
echo "  SUCCESS! Cron job registered."
echo " =========================================="
echo ""
echo "  Schedule    : Every Sunday at 2:00 AM"
echo "  Script      : $SCHEDULER_SCRIPT"
echo "  Log File    : $CRON_LOG"
echo "  Min Samples : 5 RLHF corrections needed"
echo ""
echo " To view your crontab:"
echo "   crontab -l"
echo ""
echo " To remove this cron job:"
echo "   crontab -e   (then delete the retrain_scheduler.py line)"
echo ""
