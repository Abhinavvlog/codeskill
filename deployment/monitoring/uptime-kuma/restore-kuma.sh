#!/usr/bin/env bash
# ==============================================================================
# CodeSkill — Uptime Kuma Restore Script
# Restores data from a specified tar.gz backup archive
# ==============================================================================
set -euo pipefail

BACKUP_FILE="${1:-}"

if [ -z "$BACKUP_FILE" ] || [ ! -f "$BACKUP_FILE" ]; then
  echo "Usage: $0 /path/to/uptime-kuma-TIMESTAMP.tar.gz"
  exit 1
fi

echo "Stopping Uptime Kuma container..."
docker stop codeskill-uptime-kuma || true

echo "Restoring data from $BACKUP_FILE..."
docker run --rm \
  -v codeskill-uptime-kuma-data:/data \
  -v "$(dirname "$BACKUP_FILE")":/backup \
  alpine sh -c "rm -rf /data/* && tar -xzf /backup/$(basename "$BACKUP_FILE") -C /data"

echo "Restarting Uptime Kuma container..."
docker start codeskill-uptime-kuma

echo "Restore complete! Verify at http://127.0.0.1:3001"
