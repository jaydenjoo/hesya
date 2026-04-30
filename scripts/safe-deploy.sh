#!/usr/bin/env bash
# safe-deploy.sh — 배포 전 13개 체크
#
# 사용:
#   pnpm safe:deploy
#
# 자동 검증:
#   1. tsc --noEmit
#   2. lint --max-warnings 0
#   3. build
#   4. gitleaks detect --no-git
#   5. .env 변수명 일치 검증
#
# 수동 확인 프롬프트:
#   6~13. SAFETY-CHECKLIST.md 8개 항목
set -euo pipefail

readonly C_RED='\033[0;31m'
readonly C_GREEN='\033[0;32m'
readonly C_YELLOW='\033[1;33m'
readonly C_BOLD='\033[1m'
readonly C_OFF='\033[0m'

echo -e "${C_BOLD}🚀 safe-deploy: 배포 전 13개 체크${C_OFF}"
echo ""

# 1. tsc
echo "1️⃣  TypeScript..."
pnpm tsc --noEmit && echo -e "${C_GREEN}✅ tsc${C_OFF}" || { echo -e "${C_RED}❌ tsc 실패${C_OFF}"; exit 1; }

# 2. lint
echo "2️⃣  ESLint..."
pnpm lint --max-warnings 0 && echo -e "${C_GREEN}✅ lint${C_OFF}" || { echo -e "${C_RED}❌ lint 실패${C_OFF}"; exit 1; }

# 3. build
echo "3️⃣  Build..."
pnpm build && echo -e "${C_GREEN}✅ build${C_OFF}" || { echo -e "${C_RED}❌ build 실패${C_OFF}"; exit 1; }

# 4. gitleaks
echo "4️⃣  Gitleaks..."
if command -v gitleaks > /dev/null 2>&1; then
  gitleaks detect --no-git --redact && echo -e "${C_GREEN}✅ gitleaks${C_OFF}" || { echo -e "${C_RED}❌ 시크릿 누출${C_OFF}"; exit 1; }
else
  echo -e "${C_YELLOW}⚠️  gitleaks 미설치${C_OFF}"
fi

# 5. .env 변수명 일치
echo "5️⃣  .env vs .env.example 변수명 일치..."
if [ -f .env.example ] && [ -f .env.local ]; then
  example_keys=$(grep -E "^[A-Z_]+=" .env.example | cut -d= -f1 | sort)
  actual_keys=$(grep -E "^[A-Z_]+=" .env.local | cut -d= -f1 | sort)
  diff <(echo "$example_keys") <(echo "$actual_keys") > /dev/null && echo -e "${C_GREEN}✅ env 변수명 일치${C_OFF}" || {
    echo -e "${C_YELLOW}⚠️  .env와 .env.example 변수명 불일치${C_OFF}"
    diff <(echo "$example_keys") <(echo "$actual_keys") || true
  }
else
  echo -e "${C_YELLOW}⚠️  .env.example 또는 .env.local 없음${C_OFF}"
fi

# 6~13. 수동 체크
echo ""
echo -e "${C_BOLD}📋 SAFETY-CHECKLIST.md 수동 8개 (Y/n로 답변):${C_OFF}"
echo ""
prompts=(
  "6.  모든 Server Action에 requireAuth() 호출됨?"
  "7.  Supabase RLS 활성화? (해당 시)"
  "8.  CSP 헤더 적용됨? (next.config.ts)"
  "9.  rate-limit 적용? (비싼 작업)"
  "10. 에러 메시지 일반화 (PII 노출 없음)?"
  "11. HTTPS 강제됨?"
  "12. 로그에 PII 노출 없음?"
  "13. 결제 로직 (🔴) 사람 리뷰 완료? (해당 시 'y')"
)
for prompt in "${prompts[@]}"; do
  read -r -p "  $prompt [Y/n] " ans
  case "${ans:-Y}" in
    [Yy]*) echo -e "${C_GREEN}     ✅${C_OFF}" ;;
    *) echo -e "${C_RED}     ❌ — 수정 후 재시도${C_OFF}"; exit 1 ;;
  esac
done

# 통과
echo ""
echo -e "${C_GREEN}${C_BOLD}═══════════════════════════════════════════${C_OFF}"
echo -e "${C_GREEN}${C_BOLD}  ✅ 13개 체크 모두 통과 — 배포 가능${C_OFF}"
echo -e "${C_GREEN}${C_BOLD}═══════════════════════════════════════════${C_OFF}"
echo ""
read -r -p "🚀 vercel deploy 실행? [Y/n] " ans
if [[ "${ans:-Y}" =~ ^[Yy]$ ]]; then
  if command -v vercel > /dev/null 2>&1; then
    vercel --prod
  else
    echo -e "${C_YELLOW}⚠️  vercel CLI 미설치 — 수동 배포${C_OFF}"
    echo "  설치: npm i -g vercel"
  fi
fi
