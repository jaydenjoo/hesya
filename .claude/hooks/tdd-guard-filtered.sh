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
esac

# Business code path — delegate to the real tdd-guard CLI with original stdin.
printf '%s' "$input" | tdd-guard
exit $?
