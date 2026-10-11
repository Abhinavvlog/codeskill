#!/bin/bash
# CodeSkill PostgreSQL / AWS RDS Database Backup Script
# Run via cron daily: 0 2 * * * /var/www/codeskill/scripts/backup.sh

set -e

BACKUP_DIR="../backups/daily"
TIMESTAMP=$(date +"%Y%m%d_%H%M%S")
DATABASE_URL=$(grep DATABASE_URL ../backend-nestjs/.env | cut -d '=' -f2-)

mkdir -p $BACKUP_DIR

echo "Starting PostgreSQL backup..."
pg_dump "$DATABASE_URL" -Fc -f "$BACKUP_DIR/db_backup_$TIMESTAMP.dump"

# Delete backups older than 7 days
find $BACKUP_DIR -type f -name "*.dump" -mtime +7 -delete

echo "Backup successful: $BACKUP_DIR/db_backup_$TIMESTAMP.dump"
