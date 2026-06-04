#!/usr/bin/env bash
#
# Off-box backup mirror — pulls the droplet's rotated SQLite backups down to this Mac.
# Runs automatically via launchd (see net.augustecapital.backupmirror.plist), or by hand.
# Combined with the on-droplet nightly backup, this gives a true second-location copy.
#
set -euo pipefail

DROPLET="root@159.89.84.232"
REMOTE_DIR="/root/AATradingJournal/backups/"
LOCAL_DIR="${HOME}/AATradingJournal-backups"
LOG="${LOCAL_DIR}/mirror.log"

mkdir -p "$LOCAL_DIR"

# --archive preserves timestamps; --delete keeps the local mirror in lockstep with the
# droplet's 14-file rotation so it doesn't grow unbounded.
if rsync -az --delete \
     --include='trading_*.db.gz' --include='backup.log' --exclude='*' \
     "$DROPLET:$REMOTE_DIR" "$LOCAL_DIR/" 2>>"$LOG"; then
  echo "[$(date -u +%FT%TZ)] mirror ok → $LOCAL_DIR ($(ls -1 "$LOCAL_DIR"/trading_*.db.gz 2>/dev/null | wc -l | tr -d ' ') files)" >> "$LOG"
else
  echo "[$(date -u +%FT%TZ)] mirror FAILED (droplet unreachable?)" >> "$LOG"
  exit 1
fi
