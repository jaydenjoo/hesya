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

  # environment variable schemas (Zod declarations, not business logic)
  */shared/config/env.ts|*/config/env.ts|*/src/env.ts) exit 0 ;;

  # next.js root layout — wiring point for env validation, not business logic
  */src/app/layout.tsx|*/src/app/layout.ts) exit 0 ;;
esac

# Business code path — delegate to the real tdd-guard CLI with original stdin.
printf '%s' "$input" | tdd-guard
exit $?
