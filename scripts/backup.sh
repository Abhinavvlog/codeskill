#!/usr/bin/env bash
# CodeSkill PostgreSQL Primary & Sharded Database Backup Script (AUD-021)
# Run via cron daily: 0 2 * * * /var/www/codeskill/scripts/backup.sh

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
REPO_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
BACKUP_DIR="$REPO_DIR/backups/daily"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
ENV_FILE="$REPO_DIR/backend-nestjs/.env"

# Load environment variables if present
if [ -f "$ENV_FILE" ]; then
  if [ -z "${DATABASE_URL:-}" ]; then
    DATABASE_URL=$(grep -E '^DATABASE_URL=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"'\''')
  fi
  if [ -z "${SUBMISSION_SHARDS:-}" ]; then
    SUBMISSION_SHARDS=$(grep -E '^SUBMISSION_SHARDS=' "$ENV_FILE" | cut -d '=' -f2- | tr -d '"'\''' || true)
  fi
fi

if [ -z "${DATABASE_URL:-}" ]; then
  echo "Error: DATABASE_URL is not set or found in $ENV_FILE" >&2
  exit 1
fi

mkdir -p "$BACKUP_DIR"

echo "[$TIMESTAMP] Starting primary PostgreSQL backup..."
pg_dump "$DATABASE_URL" -Fc -f "$BACKUP_DIR/primary_backup_$TIMESTAMP.dump"
echo "Primary backup successful: $BACKUP_DIR/primary_backup_$TIMESTAMP.dump"

# Iterate and backup each configured submission shard if sharding is enabled
if [ -n "${SUBMISSION_SHARDS:-}" ]; then
  echo "Backing up configured submission shards..."
  IFS=',' read -ra SHARD_LIST <<< "$SUBMISSION_SHARDS"
  for idx in "${!SHARD_LIST[@]}"; do
    SHARD_URL=$(echo "${SHARD_LIST[$idx]}" | xargs)
    if [ -n "$SHARD_URL" ]; then
      echo "Backing up submission shard #$idx..."
      pg_dump "$SHARD_URL" -Fc -f "$BACKUP_DIR/shard_${idx}_backup_$TIMESTAMP.dump"
      echo "Shard #$idx backup successful: $BACKUP_DIR/shard_${idx}_backup_$TIMESTAMP.dump"
    fi
  done
fi

# Retain backups for 7 days
find "$BACKUP_DIR" -type f -name "*.dump" -mtime +7 -delete

echo "[$TIMESTAMP] All database backups completed successfully."
