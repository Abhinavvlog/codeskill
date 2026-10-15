#!/usr/bin/env bash
# ==============================================================================
# CodeSkill — Uptime Kuma Automated Backup Script
# Creates a compressed snapshot of the persistent SQLite DB and configuration
# ==============================================================================
set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-/opt/codeskill/backups/uptime-kuma}"
TIMESTAMP=$(date -u +"%Y%m%d_%H%M%SZ")
BACKUP_FILE="$BACKUP_DIR/uptime-kuma-$TIMESTAMP.tar.gz"
S3_BUCKET="${S3_BUCKET:-codeskill-prod-files-reports}"

mkdir -p "$BACKUP_DIR"

echo "Creating Uptime Kuma backup: $BACKUP_FILE..."
# Safely snapshot docker volume
docker run --rm \
  -v codeskill-uptime-kuma-data:/data:ro \
  -v "$BACKUP_DIR":/backup \
  alpine tar -czf "/backup/uptime-kuma-$TIMESTAMP.tar.gz" -C /data .

echo "Backup created successfully ($(du -h "$BACKUP_FILE" | cut -f1))."

# Retain last 7 local backups
find "$BACKUP_DIR" -name "uptime-kuma-*.tar.gz" -mtime +7 -delete || true

# Optional upload to S3 if AWS CLI is configured
if command -v aws &>/dev/null && [ -n "$S3_BUCKET" ]; then
  echo "Uploading backup to s3://$S3_BUCKET/backups/uptime-kuma/..."
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/backups/uptime-kuma/uptime-kuma-$TIMESTAMP.tar.gz" --only-show-errors || true
fi

echo "Uptime Kuma backup complete."
