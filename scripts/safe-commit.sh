#!/usr/bin/env bash
# safe-commit.sh — 검증 통합 커밋
#
# 사용:
#   pnpm safe:commit "feat: 새 기능 추가"
#
# 자동 실행:
#   1. git add -A (스테이징되지 않은 변경 포함)
#   2. tsc --noEmit
#   3. eslint --max-warnings 0
#   4. gitleaks detect --staged
#   5. git commit -m "..."
#
# 하나라도 실패 → commit 안 됨
set -euo pipefail

readonly C_RED='\033[0;31m'
readonly C_GREEN='\033[0;32m'
readonly C_YELLOW='\033[1;33m'
readonly C_OFF='\033[0m'

if [ $# -eq 0 ]; then
  echo -e "${C_RED}❌ 커밋 메시지 필요${C_OFF}"
  echo "사용: pnpm safe:commit \"feat: 메시지\""
  exit 1
fi

MSG="$1"

# 1. 스테이징
echo "📦 git add -A"
git add -A

# 2. tsc
echo "🔍 TypeScript 검증..."
if ! pnpm tsc --noEmit; then
  echo -e "${C_RED}❌ tsc 실패 — 수정 후 재시도${C_OFF}"
  exit 1
fi
echo -e "${C_GREEN}✅ tsc 통과${C_OFF}"

# 3. eslint
echo "🔍 ESLint 검증..."
if ! pnpm lint --max-warnings 0; then
  echo -e "${C_RED}❌ eslint 실패 — 수정 후 재시도${C_OFF}"
  exit 1
fi
echo -e "${C_GREEN}✅ eslint 통과${C_OFF}"

# 4. gitleaks (있으면)
if command -v gitleaks > /dev/null 2>&1; then
  echo "🔍 gitleaks 시크릿 검사..."
  if ! gitleaks protect --staged --redact; then
    echo -e "${C_RED}❌ 시크릿 누출 발견 — commit 차단${C_OFF}"
    exit 1
  fi
  echo -e "${C_GREEN}✅ gitleaks 통과${C_OFF}"
else
  echo -e "${C_YELLOW}⚠️  gitleaks 미설치 (brew install gitleaks 권장)${C_OFF}"
fi

# 5. commit
echo "📝 git commit..."
git commit -m "$MSG"
echo -e "${C_GREEN}✅ 커밋 완료${C_OFF}"
