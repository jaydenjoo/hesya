#!/usr/bin/env bash
# TDD Guard with file pattern exclusions for monorepo setup/config files.
# Exits 0 (allow) if the touched file is infra/config; otherwise delegates to tdd-guard.
#
# Background: see docs/learnings.md L-002 — tdd-guard CLI treats every Edit/Write
# as "implementation needing a failing test", which is wrong for framework configs,
# package manifests, gitkeep placeholders, etc. This wrapper limits TDD enforcement
# to actual business logic.
#
# Claude Code passes the tool input as JSON on stdin. We parse tool_input.file_path
# with jq, match against the allowlist, and either short-circuit (exit 0) or
# forward the original stdin to the real tdd-guard CLI.

set -euo pipefail

input=$(cat)
path=$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty' 2>/dev/null || true)

# Fall through to tdd-guard if we cannot determine the path.
if [[ -z "$path" ]]; then
  printf '%s' "$input" | tdd-guard
  exit $?
fi

case "$path" in
  # framework / build configs
  *.config.ts|*.config.js|*.config.mjs|*.config.cjs) exit 0 ;;
  *next.config.*|*postcss.config.*|*eslint.config.*|*tailwind.config.*) exit 0 ;;
  *commitlint.config.*|*lint-staged.config.*|*prettier.config.*) exit 0 ;;
  *vitest.config.*|*jest.config.*|*playwright.config.*) exit 0 ;;

  # vitest setup files (test bootstrap, not implementation)
  *vitest.setup.*|*jest.setup.*|*test.setup.*|*tests/setup.*) exit 0 ;;

  # test files themselves — TDD guard exists to ensure tests precede implementation,
  # not to block creation of test files. *.test.ts(x) and *.spec.ts(x) are always allowed.
  *.test.ts|*.test.tsx|*.test.js|*.test.jsx|*.test.mjs) exit 0 ;;
  *.spec.ts|*.spec.tsx|*.spec.js|*.spec.jsx|*.spec.mjs) exit 0 ;;
  */__tests__/*) exit 0 ;;

  # package manifests / lockfiles / workspace
  */package.json|*pnpm-workspace.yaml|*turbo.json|*nx.json) exit 0 ;;
  *pnpm-lock.yaml|*package-lock.json|*yarn.lock|*bun.lockb) exit 0 ;;

  # typescript configs
  */tsconfig*.json|*tsup.config.*) exit 0 ;;

  # git / gitkeep / gitleaks
  *.gitkeep|*.gitignore|*.gitleaks.toml|*.gitattributes) exit 0 ;;

  # claude-code / husky / github workflows / hooks
  */.husky/*|*/.claude/*|*/.github/*) exit 0 ;;

  # docs / project meta
  */docs/*|*PROGRESS.md|*README.md|*AGENTS.md|*CLAUDE.md) exit 0 ;;
  *CHANGELOG.md|*CONTRIBUTING.md|*ONBOARDING.md|*ARCHITECTURE.md) exit 0 ;;

  # next-env / mcp / env files
  *next-env.d.ts|*.mcp.json|*.env*) exit 0 ;;

  # SQL migrations / schema (use db-engineer + manual review, not TDD)
  */migrations/*|*.sql|*/db/schema/*) exit 0 ;;

  # 일회용 검증/통합 스크립트 — 실 외부 API + 실 DB 호출하는 production-adjacent
  # 도구. unit test로 격리 불가 (실 동작이 source of truth — L-027 정신).
  # 같은 비즈니스 로직은 별도 unit test로 cover. 명명 규칙: scripts/verify-*.ts.
  */scripts/verify-*.ts|*/scripts/integration-*.ts) exit 0 ;;

  # Vercel Cron / 외부 webhook Route Handler — 인증·외부 API·DB UPDATE 통합.
  # Server Action(actions.ts)과 같은 카테고리 (server-only + 인증). unit test로
  # 격리 부적절 (mock 위에 mock 가치 낮음). 비즈니스 로직은 helper 모듈
  # (match-score, normalize-*)로 분리해 unit test cover. 통합 흐름은 verify-*
  # 스크립트 또는 Vercel Cron 실행 로그로 검증.
  */apps/*/src/app/api/cron/*/route.ts) exit 0 ;;
  */apps/*/src/app/api/webhooks/*/route.ts) exit 0 ;;

  # monorepo packages — Drizzle schema files & DB client entry (declarative infra)
  # See docs/learnings.md L-003. Schemas mirror PRD § 7; verification = drizzle-kit
  # generate (syntax) + Supabase apply_migration (runtime) + list_tables (deploy).
  */packages/*/src/schema/*.ts) exit 0 ;;
  */packages/*/src/schema/*/*.ts) exit 0 ;;
  */packages/*/src/client.ts) exit 0 ;;

  # shared-types — drizzle-zod auto-generated schemas + inferred TS types.
  # Pure declarative re-exports of Drizzle schema (S-6). Verification =
  # tsc --noEmit + apps/web build + Zod parse smoke. Same rationale as schema/*.ts.
  */packages/shared-types/src/*.ts) exit 0 ;;
  */packages/shared-types/src/index.ts) exit 0 ;;

  # shared-ui — design-system primitives (AiFlow, IosFrame, etc.).
  # Visual mirroring of handoff v1.0 components. Verification =
  # tsc --noEmit + apps/web build + visual regression on /design-system page.
  */packages/shared-ui/src/*.tsx) exit 0 ;;
  */packages/shared-ui/src/*.ts) exit 0 ;;

  # apps/web design-system catalog page + co-located client modules +
  # globals.css token mapping + K-Verified Badge primitive.
  # Visual catalog of handoff v1.0 (page.tsx server, _icons/_section-N client),
  # verified by build + visual review (Phase 1A).
  */apps/*/src/app/design-system/*.tsx) exit 0 ;;
  */apps/*/src/app/globals.css) exit 0 ;;
  */apps/*/src/components/trust/*.tsx) exit 0 ;;
  */apps/*/src/components/ui/*.tsx) exit 0 ;;

  # Better Auth wiring — factory + handler routes (declarative integration)
  # See docs/learnings.md (S-18). Verification = build + runtime OAuth flow,
  # not unit tests on the wrapper that just forwards to betterAuth().
  */packages/auth/src/index.ts) exit 0 ;;
  */apps/*/src/lib/auth.ts|*/apps/*/lib/auth.ts) exit 0 ;;
  */apps/*/src/app/api/auth/*) exit 0 ;;
  */apps/*/src/app/sign-in/page.tsx) exit 0 ;;

  # environment variable schemas (Zod declarations, not business logic)
  */shared/config/env.ts|*/config/env.ts|*/src/env.ts) exit 0 ;;

  # next.js root layout — wiring point for env validation, not business logic
  */src/app/layout.tsx|*/src/app/layout.ts) exit 0 ;;

  # next.js instrumentation hook — server boot entry point for env Zod parse,
  # OpenTelemetry init, etc. Pure wiring; verification = build + boot success.
  */apps/*/src/instrumentation.ts) exit 0 ;;

  # Sentry config + browser instrumentation (S-10) — pure SDK init wiring,
  # not business logic. Verification = build + production runtime event delivery
  # to Sentry dashboard, not unit tests on Sentry.init() arguments.
  */apps/*/sentry.server.config.ts) exit 0 ;;
  */apps/*/sentry.edge.config.ts) exit 0 ;;
  */apps/*/src/instrumentation-client.ts) exit 0 ;;

  # next-intl wiring (S-9) — routing config, getRequestConfig, navigation helpers,
  # and the Next.js 16 proxy.ts middleware. Pure framework integration; verification =
  # build + dev server returning 200 on each locale URL, not unit tests on re-exports.
  */apps/*/src/i18n/*.ts) exit 0 ;;
  */apps/*/proxy.ts|*/apps/*/middleware.ts) exit 0 ;;

  # [locale] dynamic segment — layout shells and locale-scoped pages.
  # Server/client wiring around NextIntlClientProvider; same rationale as root layout.
  */apps/*/src/app/\[locale\]/layout.tsx) exit 0 ;;
  */apps/*/src/app/\[locale\]/page.tsx) exit 0 ;;
  */apps/*/src/app/\[locale\]/sign-in/page.tsx) exit 0 ;;
  */apps/*/src/app/\[locale\]/design-system/*.tsx) exit 0 ;;

  # @hesya/translations — locale constants + UI message JSON files (i18n data,
  # not business logic). Verification = tsc + build + curl 200 OK per locale URL.
  */packages/translations/src/*.ts) exit 0 ;;
  */packages/translations/messages/*.json) exit 0 ;;

  # Epic 9 KYC — external API thin wrappers (NTS / LOCALDATA / OCR) + Server Actions
  # that compose them with auth gate + Drizzle insert. Mock-heavy (3 deps), low unit
  # test value. Verification = G3 실 호출 (data.go.kr) + G4 Zod parse smoke + G5 auth
  # gate + G6 store_verifications INSERT (Supabase MCP execute_sql). Pure functions
  # (valid 코드 매핑 등) extracted later get individual TDD.
  */apps/*/src/lib/kyc/*.ts) exit 0 ;;
  # E9-9 KYC 결과 알림 — declarative i18n message map (6 locale × 3 kind = 18
  # hardcoded strings) + thin Resend SDK wrapper. Same rationale as KYC clients
  # (mock-heavy, low unit test value). Verification = builder unit test (18 cases
  # subject/body 비어있지 않음 + storeName 포함) + manual smoke (실 이메일 수신).
  */apps/*/src/lib/notifications/*.ts) exit 0 ;;
  */apps/*/src/app/admin/kyc-test/*.tsx) exit 0 ;;
  */apps/*/src/app/admin/kyc-test/*.ts) exit 0 ;;
  # L-030: next-intl으로 admin 페이지가 [locale] 안으로 이동 → glob 패턴도 함께 보강.
  */apps/*/src/app/\[locale\]/admin/kyc-test/*.tsx) exit 0 ;;
  */apps/*/src/app/\[locale\]/admin/kyc-test/*.ts) exit 0 ;;
  # E9-11 외부 신고 채널 — Server Action + Drizzle thin wrapper + Phase 1 admin
  # 검증 페이지. 핵심 helper(submit.ts)는 별도 TDD 적용. 같은 정책.
  */apps/*/src/lib/store-reports/*.ts) exit 0 ;;
  */apps/*/src/app/\[locale\]/admin/store-reports/*.tsx) exit 0 ;;
  */apps/*/src/app/\[locale\]/admin/store-reports/*.ts) exit 0 ;;
  # E9-4 LLM thin wrappers (Anthropic SDK 호출 + JSON parse + lazy init).
  # 핵심 helper(category-classifier.ts)는 lib/kyc/* 안에서 별도 TDD. 같은 정책.
  */apps/*/src/lib/llm/*.ts) exit 0 ;;
esac

# Business code path — delegate to the real tdd-guard CLI with original stdin.
printf '%s' "$input" | tdd-guard
exit $?
