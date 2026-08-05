#!/usr/bin/env bash
# =============================================================================
# review.sh — Surface all decisions flagged as "REVIEW DUE"
# Usage: ./scripts/review.sh
# =============================================================================

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
PROJECT_ROOT="$(dirname "$SCRIPT_DIR")"
CSV_FILE="$PROJECT_ROOT/memory/decisions.csv"

# ANSI colors
RED='\033[0;31m'
YELLOW='\033[1;33m'
CYAN='\033[0;36m'
GREEN='\033[0;32m'
BOLD='\033[1m'
RESET='\033[0m'

echo ""
echo -e "${BOLD}${CYAN}╔══════════════════════════════════════════════════════════════╗${RESET}"
echo -e "${BOLD}${CYAN}║          📋  DECISIONS DUE FOR REVIEW                        ║${RESET}"
echo -e "${BOLD}${CYAN}╚══════════════════════════════════════════════════════════════╝${RESET}"
echo ""

if [[ ! -f "$CSV_FILE" ]]; then
  echo -e "${RED}ERROR: decisions.csv not found at $CSV_FILE${RESET}"
  exit 1
fi

COUNT=0

# Read and display flagged decisions
while IFS=',' read -r date decision reasoning expected_outcome review_date status; do
  # Skip header
  [[ "$date" == "date" ]] && continue

  if [[ "$status" == "REVIEW DUE" ]]; then
    COUNT=$((COUNT + 1))
    echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
    echo -e "${BOLD}Decision #$COUNT${RESET}"
    echo -e "  ${BOLD}Date logged :${RESET} $date"
    echo -e "  ${RED}${BOLD}Status      :${RESET}${RED} $status${RESET}"
    echo -e "  ${BOLD}Review was  :${RESET} $review_date"
    echo -e "  ${BOLD}Decision    :${RESET} $decision"
    echo -e "  ${BOLD}Reasoning   :${RESET} $reasoning"
    echo -e "  ${BOLD}Expected    :${RESET} $expected_outcome"
    echo ""
  fi
done < "$CSV_FILE"

if [[ $COUNT -eq 0 ]]; then
  echo -e "${GREEN}✅  No decisions are currently due for review.${RESET}"
  echo ""
else
  echo -e "${YELLOW}━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━${RESET}"
  echo ""
  echo -e "${BOLD}Total flagged: ${RED}$COUNT decision(s)${RESET}"
  echo ""
  echo -e "${CYAN}To mark a decision as reviewed, edit:${RESET}"
  echo -e "  ${BOLD}$CSV_FILE${RESET}"
  echo -e "  Change its status from ${RED}REVIEW DUE${RESET} → ${GREEN}reviewed${RESET}"
  echo ""
fi
