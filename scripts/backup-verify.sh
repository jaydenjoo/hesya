#!/usr/bin/env bash
# Verify a Hesya weekly DB backup file before/after upload to R2.
#
# Three checks:
#   1. gzip integrity
#   2. SQL header line "PostgreSQL database dump" present
#   3. all 16 expected public tables have CREATE TABLE / COPY lines
#      (16 = 4 Better Auth + 11 business + 1 store_owners join, see PRD § 7)
#
# Exits 0 on full pass, non-zero on any failure with diagnostic output.
# Used by .github/workflows/weekly-backup.yml and scripts/backup-restore-test.sh.

set -euo pipefail

if [[ $# -ne 1 ]]; then
  echo "usage: $0 <backup.sql.gz>" >&2
  exit 2
fi

FILE="$1"

if [[ ! -f "$FILE" ]]; then
  echo "FAIL: file not found: $FILE" >&2
  exit 1
fi

# 1. gzip integrity
if ! gzip -t "$FILE" 2>/dev/null; then
  echo "FAIL: gzip integrity check failed" >&2
  exit 1
fi
echo "OK: gzip integrity"

# 2. SQL header
if ! gzip -dc "$FILE" | head -5 | grep -q "PostgreSQL database dump"; then
  echo "FAIL: SQL header 'PostgreSQL database dump' not found in first 5 lines" >&2
  exit 1
fi
echo "OK: SQL header present"

# 3. 16 expected tables
EXPECTED=(
  accounts aftercare_messages bookings customers messages payments
  reviews services sessions staff store_owners store_reports
  store_verifications stores users verifications
)

DUMP=$(gzip -dc "$FILE")
MISSING=0
for t in "${EXPECTED[@]}"; do
  # Match either schema-only CREATE TABLE or data dump COPY line
  if printf '%s' "$DUMP" | grep -qE "(CREATE TABLE (IF NOT EXISTS )?public\.${t} |COPY public\.${t} )"; then
    echo "  ✓ $t"
  else
    echo "  ✗ $t (missing)" >&2
    MISSING=$((MISSING + 1))
  fi
done

if [[ $MISSING -gt 0 ]]; then
  echo "FAIL: $MISSING/16 tables missing in backup" >&2
  exit 1
fi

echo "OK: 16/16 tables verified"
