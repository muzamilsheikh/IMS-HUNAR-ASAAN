#!/usr/bin/env bash
# =============================================================================
# check_decisions.sh — Daily cron: flag decisions whose review date has passed
# Runs at 08:00 PKT via crontab
# =============================================================================

set -euo pipefail

# Resolve the project root relative to this script's location
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CSV_FILE="$PROJECT_ROOT/memory/decisions.csv"
LOG_FILE="$PROJECT_ROOT/memory/cron.log"

TODAY=$(date +%Y-%m-%d)

echo "[$TODAY] Running decision review check..." >> "$LOG_FILE"

if [[ ! -f "$CSV_FILE" ]]; then
  echo "[$TODAY] ERROR: decisions.csv not found at $CSV_FILE" >> "$LOG_FILE"
  exit 1
fi

# Create a temp file for the updated CSV
TMP_FILE=$(mktemp)
FLAGGED=0

# Read CSV line by line
while IFS=',' read -r date decision reasoning expected_outcome review_date status; do
  # Skip header row
  if [[ "$date" == "date" ]]; then
    echo "$date,$decision,$reasoning,$expected_outcome,$review_date,$status" >> "$TMP_FILE"
    continue
  fi

  # Check if review_date has passed and status is still 'active'
  if [[ "$status" == "active" ]] && [[ "$review_date" < "$TODAY" || "$review_date" == "$TODAY" ]]; then
    status="REVIEW DUE"
    FLAGGED=$((FLAGGED + 1))
    echo "[$TODAY] FLAGGED: $decision (was due $review_date)" >> "$LOG_FILE"
  fi

  echo "$date,$decision,$reasoning,$expected_outcome,$review_date,$status" >> "$TMP_FILE"
done < "$CSV_FILE"

# Replace the original CSV
mv "$TMP_FILE" "$CSV_FILE"

echo "[$TODAY] Done. $FLAGGED decision(s) newly flagged for review." >> "$LOG_FILE"
