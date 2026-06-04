#!/usr/bin/env bash
#
# Nightly SQLite backup for AATradingJournal.
# Uses sqlite3's online .backup (WAL-safe — consistent even while the app is writing),
# gzips the result, and rotates to keep the most recent N daily backups.
#
# Install (on the droplet):
#   chmod +x /root/AATradingJournal/backend/scripts/backup_db.sh
#   ( crontab -l 2>/dev/null; echo "0 6 * * * /root/AATradingJournal/backend/scripts/backup_db.sh >> /root/AATradingJournal/backups/backup.log 2>&1" ) | crontab -
#
set -euo pipefail

DB="/root/AATradingJournal/backend/trading.db"
BACKUP_DIR="/root/AATradingJournal/backups"
KEEP=14                      # retain this many most-recent backups
TS="$(date -u +%Y%m%d_%H%M%S)"
DEST="${BACKUP_DIR}/trading_${TS}.db"

mkdir -p "$BACKUP_DIR"

if [ ! -f "$DB" ]; then
  echo "[$(date -u +%FT%TZ)] ERROR: database not found at $DB" >&2
  exit 1
fi

# Online backup via sqlite3 — safe against concurrent writers (handles WAL).
sqlite3 "$DB" ".backup '${DEST}'"

# Integrity check on the copy before we trust it.
if ! sqlite3 "$DEST" "PRAGMA integrity_check;" | grep -q '^ok$'; then
  echo "[$(date -u +%FT%TZ)] ERROR: integrity check FAILED on ${DEST} — keeping uncompressed for inspection" >&2
  exit 2
fi

gzip -f "$DEST"
SIZE="$(du -h "${DEST}.gz" | cut -f1)"
echo "[$(date -u +%FT%TZ)] backup ok: ${DEST}.gz (${SIZE})"

# ── Off-site copy to DigitalOcean Spaces (optional) ───────────────────────────
# Populate /root/.do_spaces_env to enable. If absent or incomplete, this block is a
# no-op and the local backup above still stands.
ENV_FILE="/root/.do_spaces_env"
if [ -f "$ENV_FILE" ]; then
  set +u; . "$ENV_FILE"; set -u
  if [ -n "${SPACES_KEY:-}" ] && [ -n "${SPACES_SECRET:-}" ] && [ -n "${SPACES_BUCKET:-}" ] && [ -n "${SPACES_REGION:-}" ]; then
    export RCLONE_CONFIG_SPACES_TYPE=s3
    export RCLONE_CONFIG_SPACES_PROVIDER=DigitalOcean
    export RCLONE_CONFIG_SPACES_ACCESS_KEY_ID="$SPACES_KEY"
    export RCLONE_CONFIG_SPACES_SECRET_ACCESS_KEY="$SPACES_SECRET"
    export RCLONE_CONFIG_SPACES_ENDPOINT="${SPACES_REGION}.digitaloceanspaces.com"
    if rclone copy "${DEST}.gz" "spaces:${SPACES_BUCKET}/db-backups/" 2>>"${BACKUP_DIR}/spaces.log"; then
      echo "[$(date -u +%FT%TZ)] spaces upload ok: db-backups/$(basename "${DEST}.gz")"
      # Off-site retention: keep 30 days of cloud copies.
      rclone delete "spaces:${SPACES_BUCKET}/db-backups/" --min-age 30d 2>>"${BACKUP_DIR}/spaces.log" || true
    else
      echo "[$(date -u +%FT%TZ)] WARNING: spaces upload failed (see backups/spaces.log)" >&2
    fi
  fi
fi

# Rotation: keep the newest $KEEP, delete older.
ls -1t "${BACKUP_DIR}"/trading_*.db.gz 2>/dev/null | tail -n +$((KEEP + 1)) | while read -r old; do
  rm -f "$old"
  echo "[$(date -u +%FT%TZ)] rotated out: $old"
done
