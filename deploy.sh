#!/usr/bin/env bash
#
# Test-gated deploy for AATradingJournal.
# Runs the pytest suite FIRST; nothing ships unless it passes.
#
# Usage:
#   ./deploy.sh            # full: tests → build frontend → push backend+frontend → restart
#   ./deploy.sh backend    # tests → push backend only → restart
#   ./deploy.sh frontend   # tests → build + push frontend only (no restart)
#
set -euo pipefail

DROPLET="root@159.89.84.232"
REMOTE="/root/AATradingJournal"
ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
MODE="${1:-full}"

DB_EXCLUDES=(--exclude='*.db' --exclude='*.db-shm' --exclude='*.db-wal' --exclude='__pycache__' --exclude='.pytest_cache')

say() { printf '\n\033[1m▶ %s\033[0m\n' "$1"; }

# ── 1. Test gate — always runs, always blocks on failure ──────────────────────
say "Running test suite (deploy gate)"
cd "$ROOT"
if ! python3 -m pytest -q; then
  echo "✗ Tests failed — aborting deploy. Nothing was pushed." >&2
  exit 1
fi
echo "✓ Tests passed"

# ── 2. Build frontend (full + frontend modes) ─────────────────────────────────
if [ "$MODE" = "full" ] || [ "$MODE" = "frontend" ]; then
  say "Building frontend"
  ( cd "$ROOT/frontend" && npm run build )
fi

# ── 3. Push backend (full + backend modes) ────────────────────────────────────
if [ "$MODE" = "full" ] || [ "$MODE" = "backend" ]; then
  say "Pushing backend"
  rsync -avz "${DB_EXCLUDES[@]}" "$ROOT/backend/" "$DROPLET:$REMOTE/backend/"
fi

# ── 4. Push frontend (full + frontend modes) ──────────────────────────────────
if [ "$MODE" = "full" ] || [ "$MODE" = "frontend" ]; then
  say "Pushing frontend dist"
  rsync -avz "$ROOT/frontend/dist/" "$DROPLET:$REMOTE/frontend/dist/"
fi

# ── 5. Restart + health check (full + backend modes) ──────────────────────────
if [ "$MODE" = "full" ] || [ "$MODE" = "backend" ]; then
  say "Restarting service"
  ssh "$DROPLET" "systemctl restart trading-journal && sleep 4 && systemctl is-active trading-journal"
  say "Health check"
  CODE="$(ssh "$DROPLET" "curl -s -o /dev/null -w '%{http_code}' https://api.augustecapital.net/forecast/current")"
  if [ "$CODE" = "200" ]; then
    echo "✓ API healthy (200)"
  else
    echo "✗ API returned $CODE — investigate" >&2
    exit 1
  fi
fi

say "Deploy complete ($MODE)"
