#!/usr/bin/env bash
# Manual quarterly restore test for a Hesya R2 backup.
# Spins up a local Docker PG 17, restores the backup, prints row counts,
# and tears down. Run by Jayden every quarter or after suspicious backup output.
#
# Usage:
#   bash scripts/backup-restore-test.sh <backup.sql.gz>
#
# Prerequisites: Docker daemon running, port 15432 free.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <backup.sql.gz>" >&2
  exit 2
fi

BACKUP_FILE="$1"
CONTAINER="hesya-restore-test"
DB="hesya_restore"
PORT=15432

if ! command -v docker >/dev/null 2>&1; then
  echo "FAIL: docker CLI not found in PATH" >&2
  exit 1
fi

echo "Step 1: pre-flight verify backup file"
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
bash "$SCRIPT_DIR/backup-verify.sh" "$BACKUP_FILE"

echo
echo "Step 2: spin up Docker PG 17 (container=$CONTAINER, port=$PORT)"
docker rm -f "$CONTAINER" >/dev/null 2>&1 || true
docker run -d --name "$CONTAINER" \
  -e POSTGRES_PASSWORD=test \
  -e POSTGRES_DB="$DB" \
  -p "$PORT:5432" \
  postgres:17 >/dev/null

echo "Step 3: wait for PG ready"
for i in $(seq 1 30); do
  if docker exec "$CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then
    echo "  ready @ ${i}s"
    break
  fi
  sleep 1
done

echo
echo "Step 4: restore backup"
gzip -dc "$BACKUP_FILE" \
  | docker exec -i "$CONTAINER" psql -U postgres -d "$DB" \
  >/tmp/restore-stdout.log 2>/tmp/restore-stderr.log
echo "  restore stdout: $(wc -l < /tmp/restore-stdout.log) lines"
echo "  restore stderr: $(wc -l < /tmp/restore-stderr.log) lines (warnings/notices expected)"

echo
echo "Step 5: row counts (public schema)"
docker exec "$CONTAINER" psql -U postgres -d "$DB" -c "
SELECT relname AS table, n_live_tup AS rows
FROM pg_stat_user_tables
WHERE schemaname = 'public'
ORDER BY relname;
"

echo
echo "Step 6: cleanup"
read -p "  Press ENTER to remove the container, or CTRL+C to keep it for inspection: "
docker rm -f "$CONTAINER" >/dev/null
echo "  container removed."
