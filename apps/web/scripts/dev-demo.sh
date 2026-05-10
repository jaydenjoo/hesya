#!/usr/bin/env bash
# 베타 데모 dev 서버 wrapper.
#
# IG Graph API mock (port 4201) + Next.js dev (port 4200)을 같이 띄우고,
# 데모 인증 우회 env (E2E_AUTH_USER_ID / E2E_ADMIN_EMAIL) + IG_API_BASE_URL을
# 주입. Ctrl+C 시 mock 서버도 같이 종료 (trap).
#
# 의존성 0 — concurrently/npm-run-all 추가 없이 bash & + trap.

set -euo pipefail

# 스크립트 위치 기준으로 apps/web으로 cd (어디서 호출되든 동작)
SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
cd "$SCRIPT_DIR/.."

# 1. IG mock 서버 (port 4201) 백그라운드 기동
node e2e/mock-server.mjs &
MOCK_PID=$!
NEXT_PID=""

# Ctrl+C / 정상 종료 시 두 process 모두 종료. exec 대신 background + wait 패턴이라
# 부모 bash가 trap을 계속 보유 (exec 사용 시 bash가 next로 replace되어 trap 손실).
cleanup() {
  kill "$MOCK_PID" 2>/dev/null || true
  [ -n "$NEXT_PID" ] && kill "$NEXT_PID" 2>/dev/null || true
}
trap cleanup EXIT INT TERM

# 2. mock 서버 health check (최대 5초 대기)
for i in {1..10}; do
  if curl -sf http://localhost:4201/health > /dev/null 2>&1; then
    echo "[dev:demo] ✓ IG mock 서버 ready (port 4201)"
    break
  fi
  sleep 0.5
done

# 3. DATABASE_URL을 시연 전용 로컬 DB(HESYA_TEST_DATABASE_URL)로 강제 override.
#
# .env.local의 DATABASE_URL이 prod Supabase를 가리키면 seed:demo(로컬 DB에 시드)와
# dev 서버(prod DB 조회)가 서로 다른 DB를 보게 됨 → owner row 미발견 → sign-in
# redirect. 시연은 격리 환경에서만 의미 있으므로 dev:demo 시작 시 강제 동기화.
#
# bash native parsing — apps/web에 dotenv dependency 없음 (packages/database
# 전용). 스크립트 헤더 "의존성 0" 원칙과 일치. 첫 매칭 줄만 사용 + 양쪽
# 따옴표(", ') 제거.
HESYA_TEST_URL="$(grep -E '^HESYA_TEST_DATABASE_URL=' .env.local 2>/dev/null | head -1 | sed -E 's/^[^=]+=//; s/^"(.*)"$/\1/; s/^'\''(.*)'\''$/\1/')"
if [ -z "$HESYA_TEST_URL" ]; then
  echo "[dev:demo] ✗ HESYA_TEST_DATABASE_URL이 apps/web/.env.local에 없습니다."
  echo "[dev:demo]   시연용 로컬 DB URL을 .env.local에 추가하고 다시 실행하세요."
  exit 1
fi
echo "[dev:demo] ✓ DATABASE_URL → HESYA_TEST_DATABASE_URL override (시연용 로컬 DB)"

# 4. Next.js dev 서버 (background) — pnpm hoisting 회피 위해 .bin 직접 호출
DATABASE_URL="$HESYA_TEST_URL" \
IG_API_BASE_URL=http://localhost:4201 \
E2E_AUTH_USER_ID=00000000-0000-0000-0000-000000000001 \
E2E_ADMIN_EMAIL=demo-owner@hesya.local \
./node_modules/.bin/next dev -p 4200 &
NEXT_PID=$!

# Next dev가 죽거나 SIGINT 받으면 wait 종료 → trap 발동
wait "$NEXT_PID"
