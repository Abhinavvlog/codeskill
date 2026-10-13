#!/bin/bash
# CodeSkill PostgreSQL / AWS RDS Database Backup Script
# Run via cron daily: 0 2 * * * /var/www/codeskill/scripts/backup.sh

set -euo pipefail

BACKUP_DIR="${BACKUP_DIR:-../backups/daily}"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_URL=$(grep DATABASE_URL ../backend-nestjs/.env 2>/dev/null | cut -d '=' -f2- || echo "${DATABASE_URL:-}")

if [ -z "$DATABASE_URL" ]; then
  echo "Error: DATABASE_URL is not set"
  exit 1
fi

mkdir -p "$BACKUP_DIR"
BACKUP_FILE="$BACKUP_DIR/db_backup_$TIMESTAMP.dump"

echo "Starting PostgreSQL backup..."
pg_dump "$DATABASE_URL" -Fc -f "$BACKUP_FILE"

# Upload to S3 if bucket is configured (AUD-015)
S3_BUCKET="${S3_BACKUP_BUCKET:-${AWS_S3_BUCKET_NAME:-}}"
if [ -n "$S3_BUCKET" ] && command -v aws >/dev/null 2>&1; then
  echo "Uploading backup to S3: s3://$S3_BUCKET/db-backups/db_backup_$TIMESTAMP.dump"
  aws s3 cp "$BACKUP_FILE" "s3://$S3_BUCKET/db-backups/db_backup_$TIMESTAMP.dump"
fi

# Delete local backups older than 7 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +7 -delete

echo "Backup successful: $BACKUP_FILE"
