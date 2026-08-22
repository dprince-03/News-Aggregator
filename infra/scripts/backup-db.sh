#!/usr/bin/env bash
#
# Backs up the newshub MySQL database via `docker exec` + mysqldump, gzips
# the result, and prunes backups older than $RETENTION_DAYS. No backup
# mechanism existed anywhere in this project before this script.
#
# Usage:
#   ./backup-db.sh                    # backs up to ./backups
#   BACKUP_DIR=/var/backups/newshub ./backup-db.sh
#
# Scheduling (cron, run as the user with docker access):
#   0 3 * * *  cd /path/to/repo/infra/scripts && ./backup-db.sh >> /var/log/newshub-backup.log 2>&1
#
# Restoring:
#   gunzip -c backups/newshub-2026-08-17-030000.sql.gz | \
#     docker exec -i newshub-mysql mysql -u"$DB_USER" -p"$DB_PASSWORD" "$DB_NAME"
#   (rehearse this against a copy of production data at least once - a
#   backup script that's never been used to restore isn't verified.)

set -euo pipefail

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
ENV_FILE="$SCRIPT_DIR/../docker/.env"

if [[ -f "$ENV_FILE" ]]; then
  set -a
  # shellcheck disable=SC1090
  source "$ENV_FILE"
  set +a
fi

DB_NAME="${DB_NAME:-news_aggregator}"
CONTAINER="${MYSQL_CONTAINER:-newshub-mysql}"
BACKUP_DIR="${BACKUP_DIR:-$SCRIPT_DIR/../../backups}"
RETENTION_DAYS="${RETENTION_DAYS:-14}"
TIMESTAMP="$(date +%Y-%m-%d-%H%M%S)"
OUT_FILE="$BACKUP_DIR/newshub-${TIMESTAMP}.sql.gz"

: "${DB_USER:?DB_USER must be set (via infra/docker/.env or the environment)}"
: "${DB_PASSWORD:?DB_PASSWORD must be set (via infra/docker/.env or the environment)}"

mkdir -p "$BACKUP_DIR"

if ! docker inspect "$CONTAINER" >/dev/null 2>&1; then
  echo "Container '$CONTAINER' not found - is the stack running? (docker compose -f infra/docker/docker-compose.yml up -d)" >&2
  exit 1
fi

echo "Backing up '$DB_NAME' from container '$CONTAINER' to $OUT_FILE ..."

docker exec "$CONTAINER" \
  mysqldump -u"$DB_USER" -p"$DB_PASSWORD" \
    --single-transaction \
    --routines \
    --triggers \
    --no-tablespaces \
    "$DB_NAME" \
  | gzip > "$OUT_FILE"

# gzip -t verifies the archive isn't truncated/corrupt before trusting it
if ! gzip -t "$OUT_FILE"; then
  echo "Backup file failed integrity check: $OUT_FILE" >&2
  exit 1
fi

echo "Backup complete: $OUT_FILE ($(du -h "$OUT_FILE" | cut -f1))"

if [[ "$RETENTION_DAYS" -gt 0 ]]; then
  DELETED=$(find "$BACKUP_DIR" -name 'newshub-*.sql.gz' -mtime "+$RETENTION_DAYS" -print -delete | wc -l)
  if [[ "$DELETED" -gt 0 ]]; then
    echo "Pruned $DELETED backup(s) older than $RETENTION_DAYS days."
  fi
fi
