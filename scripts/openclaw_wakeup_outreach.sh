#!/usr/bin/env bash
set -euo pipefail

# Wake-Up Launchpad Confidence Ask runner for doting.co (paired with watershortcut)
# Reuses the same central generator.

ROOT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
cd "$ROOT_DIR"

mkdir -p logs outreach_outputs contacts

LOG_PATH="$ROOT_DIR/logs/openclaw_wakeup_outreach.log"
SCRIPT="/Users/nirlevy/.openclaw/workspace/scripts/wakeup_confidence_outreach.py"

DOMAIN="${OUTREACH_DOMAIN:-doting.co}"
MAX_DRAFTS="${OUTREACH_DRAFT_COUNT:-3}"
CONTACTS_FILE="${OUTREACH_CONTACTS_FILE:-$ROOT_DIR/contacts/${DOMAIN%%.*}_targets.json}"

{
  echo "===== [$(date -u +'%Y-%m-%dT%H:%M:%SZ')] wakeup confidence outreach start ($DOMAIN) ====="

  if [[ ! -f "$CONTACTS_FILE" ]]; then
    echo "No contacts file — using the one created alongside watershortcut setup."
    CONTACTS_FILE="/Users/nirlevy/.openclaw/workspace/doting/contacts/doting_targets.json"
  fi

  python3 "$SCRIPT" \
    --domain "$DOMAIN" \
    --contacts-file "$CONTACTS_FILE" \
    --max-drafts "$MAX_DRAFTS" \
    --output-dir "$ROOT_DIR/outreach_outputs"

  echo "===== [$(date -u +'%Y-%m-%dT%H:%M:%SZ')] wakeup confidence outreach end ($DOMAIN) ====="
} | tee -a "$LOG_PATH"
