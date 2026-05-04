# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook)

## 현재 위치

- **Phase**: Phase 1 진행 중
- **Epic**: **Epic 1 통합 다국어 인박스** — 1A 인프라 + Instagram PoC
- **Task**: **Phase A 완료 ✅ (PR #19 머지)** → **Phase B 진행 중** (T04 SQL 작성, 적용 대기)
- **상태**: Phase A 완료 머지. Phase B 시작 — Migration v0011 SQL 작성 완료 + Supabase dev branch 생성 완료. 다음 세션에서 dev branch에 적용 + 검증 + T05/T06.
- **작업 브랜치**: `feat/epic-1a-phase-b-db` (origin/main = `19d2f1a` 기준 분기, 1 commit ahead — session save)
- **이전 PR**: [apps#19](https://github.com/jaydenjoo/hesya/pull/19) Phase A — runbook + 6 에러 클래스 + Server Action Sentry → main `19d2f1a` ✅
- **Prod URL**: `https://hesya-web.vercel.app` (Vercel project `jaydens-projects-f5e92399/hesya-web`)
- **Supabase prod**: `bnlyzlfsxtjpzzydjjuv` (hesya-prod, Northeast Asia Seoul)
- **백업 태그**: `backup/before-monorepo-2026-04-30`

## ⚠️ 다음 세션 시작 즉시 처리 (비용 발생 중)

- **Supabase dev branch `phase-b-v0011` 살아있음** (`project_ref: jypvsjgaxcxwtcgcomcp`)
  - 시간당 **$0.01344** 청구 중. 일당 ≈ ₩430.
  - 다음 세션 시작 첫 명령으로 `mcp__supabase-local__list_branches` 호출 → 상태 확인.
  - 이번 세션 종료 시점 status: `CREATING_PROJECT`. 다음 세션 시작 시 `ACTIVE_HEALTHY`일 가능성 큼.
- **즉시 사용 추천** — Phase B T04 적용 + T06 검증 끝나는 즉시 `delete_branch` 호출하여 비용 정지.
- 만약 다음 세션이 24h+ 늦어지면 그 사이 ≈ ₩430 청구. 가능한 빠르게 진입.

## Supabase MCP 셋업 (이번 세션 영구 해결)

- 원격 MCP `[claude.ai] Supabase` (`mcp.supabase.com`)는 OAuth Connected여도 도구 호출 시 PAT 별도 요구 → Unauthorized.
- 해결: **로컬 npx 기반 MCP 추가** — 도구 prefix `mcp__supabase-local__*`.
- 등록 위치: `~/.claude.json` mcpServers (자동 생성). PAT는 글로벌 `~/.claude/settings.json` env에서 추출하여 supabase-local 자체 env로 주입.
- 검증: 이번 세션에서 `list_projects` → 5 projects 정상 (chatsio-v1 / autovoxflow / **hesya-prod (`bnlyzlfsxtjpzzydjjuv`)** / dairect / dari).
- L-046 기록 완료.

## 다음 세션 할 일 (Phase B 이어서)

1. **`list_branches` 첫 명령** — dev branch `phase-b-v0011` 상태 확인 (`ACTIVE_HEALTHY` 기대)
2. **T04 Migration v0011 dev branch 적용**
   - `mcp__supabase-local__apply_migration(project_id="jypvsjgaxcxwtcgcomcp", name="0011_inbox_conversations", query=<SQL 파일 내용>)`
   - SQL 파일: `packages/database/migrations/0011_inbox_conversations.sql` (이번 세션 작성 완료, untracked로 보존됨)
3. **T04 검증**
   - `list_tables(project_id="jypvsjgaxcxwtcgcomcp", schemas=["public"], verbose=true)` — conversations + store_integrations 존재 확인
   - messages 컬럼 3개 추가 확인
   - 인덱스 4개 (`idx_conversations_*`, `idx_messages_*`, `idx_customers_channel_external`) 확인
   - ROLLBACK 드라이런 (별도 임시 schema 또는 manual 검증)
4. **drizzle journal 수동 entry 추가** (L-010 패턴) — `packages/database/migrations/meta/_journal.json`에 `{idx: 11, version: "7", when: <epoch>, tag: "0011_inbox_conversations", breakpoints: true}` 추가
5. **T04 commit** — `feat(db): v0011 conversations + store_integrations + messages 확장 + RLS`
6. **T05 Drizzle 스키마 TypeScript** — plan § Phase B Task 05 그대로
   - `packages/database/src/schema/conversations.ts` (신규)
   - `packages/database/src/schema/store-integrations.ts` (신규)
   - `messages.ts` 3컬럼 추가 / `customers.ts` 유일 인덱스 / `index.ts` export
7. **T06 pgsodium 헬퍼 (TDD with DB)** — plan § Phase B Task 06
   - `apps/web/src/shared/lib/dal/pgsodium-helpers.ts` + test
   - 실제 DB 연결 필요 → dev branch DATABASE_URL 사용 또는 prod (신중)
8. **Phase B 검증 통과 → `delete_branch` 즉시** ← 비용 정지 핵심
9. **Phase B PR 생성** (T04+T05+T06 한 PR)
10. (Phase B 끝나면) Phase C DAL 진입

## Phase A 완료 (이전 세션 + 이번 세션 머지)

| Task                                                 | Commits               | 결과                     |
| ---------------------------------------------------- | --------------------- | ------------------------ |
| T01 docs/runbook.md (롤백 + ngrok + Meta App Review) | `c671cce` + `1680cc0` | ✅ Approved + 머지된 #19 |
| T02 instrumentation captureServerActionError (C-01)  | `3ee534d` + `62ade9b` | ✅ Approved + 머지된 #19 |
| T03 errors.ts (6 클래스 + auth-guard 통합)           | `b9849cf`             | ✅ Approved + 머지된 #19 |

머지: PR #19 → main `19d2f1a` (squash, 9 commits 포함)

## 차단 요소

없음. Supabase MCP 작동, PR 머지 완료, dev branch 생성 진행 중. 외부 의존성 모두 OK.

## 마지막 업데이트

- 날짜: 2026-05-04 P.M. (PR #19 머지 + Supabase MCP 로컬 전환 + Phase B SQL 작성 + dev branch 생성)
- 다음 세션 시작 시 `/start` 스킬이 이 파일 읽고 자동 보고

## 이번 세션 완료 (2026-05-04 P.M. — PR #19 머지 + Supabase MCP 영구 해결 + Phase B 시작)

### 1. Phase A PR #19 squash 머지 (main `19d2f1a`)

- spec(`d1cd2d8`) + plan(`d3843d8`) + Phase A 5 commits + PROGRESS + learnings = 9 commits → 단일 squash commit으로 main 진입.
- CI 모두 pass: validate (1m56s) ✅ / Vercel deployment ✅ / Vercel Preview Comments ✅.
- 머지 후 로컬 main이 origin과 divergent (이전 세션 main 직접 commit 후유증) → `git reset --hard origin/main` (Jayden 직접, hook 차단) → 정상화.
- 새 작업 브랜치 `feat/epic-1a-phase-b-db`를 origin/main 직접 base로 생성 (L-045 규칙 적용).

### 2. Supabase MCP 영구 해결 — 원격 → 로컬 전환 (L-046)

- 증상: `mcp____supabase__list_projects` (원격 claude.ai MCP) → Unauthorized. `/mcp` 재인증 / settings.json env 추가 모두 효과 없음.
- 원인: 원격 MCP는 OAuth Connected 표시되지만 도구 호출 시 PAT 별도 요구. settings.json env는 로컬 프로세스 변수일 뿐 — Anthropic 서버에서 호출되는 원격 MCP는 못 봄.
- 해결: `claude mcp add supabase-local --scope user --env SUPABASE_ACCESS_TOKEN=... -- npx -y @supabase/mcp-server-supabase@latest` 로 로컬 등록 + 데스크톱 앱 `Cmd+Q` 후 재실행.
- 검증: 새 세션 시작 후 `mcp__supabase-local__list_projects` → 5 projects 정상 ✓.

### 3. Phase B 시작 — T04 Migration v0011 SQL 작성 (untracked, 다음 세션 commit)

- 위치: `packages/database/migrations/0011_inbox_conversations.sql` (135줄, plan § Phase B Task 04 그대로)
- 내용: pgsodium 활성화 / conversations 신규 / messages 컬럼 3개 / customers 유일 인덱스 / store_integrations 신규 / RLS 정책 2개
- ROLLBACK 주석 (C-06 정책 첫 적용)
- 다음 세션에서 dev branch에 `apply_migration` 후 commit 예정.

### 4. Supabase dev branch 생성 (`phase-b-v0011`)

- `confirm_cost` → `create_branch(project_id="bnlyzlfsxtjpzzydjjuv", name="phase-b-v0011")` 성공
- 비용: $0.01344/h (≈ ₩18/h, ₩430/일) — Jayden 명시 승인
- branch_id: `8aeb72db-43ef-49fc-9a05-8443437e7d2d`
- project_ref: `jypvsjgaxcxwtcgcomcp` (apply_migration 시 사용)
- 이번 세션 종료 시점 status: `CREATING_PROJECT` (1~3분 더 필요)
- ⚠️ 비용 발생 중 — 다음 세션 즉시 사용 + 검증 끝 즉시 `delete_branch` 권장

### 5. learnings.md 신규 3건 (L-045 + L-046 + L-047)

- L-045: spec/plan을 main에 직접 commit 시 PR squash 머지 후 divergence (글로벌 룰 위반 패턴)
- L-046: Supabase 원격 MCP의 PAT 별도 요구 → 로컬 npx MCP 우회 (영구 해결)
- L-047: dev branch 비용 운영 룰 (생성 → 사용 → 즉시 삭제, PROGRESS 명시 표기 의무)

### 만들지 않은 것 (Not Doing)

- ❌ Migration v0011 dev branch 적용 — 다음 세션 (이번 세션 종료 시점 dev branch 아직 CREATING)
- ❌ T05 Drizzle 스키마 / T06 pgsodium 헬퍼 — 다음 세션
- ❌ drizzle journal 수동 entry — 다음 세션 (T04 commit과 함께)
- ❌ SQL 파일 commit — untracked로 보존, 다음 세션 정식 commit
- ❌ 원격 supabase MCP 제거 — 로컬과 공존 무해, 별 task로 처리

### 자체 정정 (4원칙 1번 — Surface Assumptions)

- 세션 시작 시 PROGRESS.md "Supabase MCP PAT 토큰 셋업 완료 (검증 대기)" 라고 적혀있던 부분이 실제로는 셋업 위치가 잘못됐음 (글로벌 env vs MCP 서버 env). 이번 세션 자연 검증으로 발견하고 즉시 수정.
- 이전 세션에서 spec/plan을 main에 직접 commit한 흔적이 PR squash 후 divergent로 발현. L-045로 기록하고 운영 룰 강화.

## 이전 세션 완료 (2026-05-04 — Phase A T01~T03)

### 1. Epic 결정 + 1A spec 작성 (`d1cd2d8`)

- Epic 1 / 2 / 12 trade-off → Epic 1이 의존성·사용자 가치·MVP P0 측면 최우선.
- 1A spec: `docs/superpowers/specs/2026-05-04-epic-1a-inbox-instagram-design.md` (978줄, 10 섹션, 4 clarifying Q + Approach A).
- senior-engineer 검증 6.5/10 → 1A 흡수 6개 + cleanup trail 6개 (C-01~C-06)로 분리.
- 외부 정보 검증 4건 (24h 메시징 윈도우, ngrok 무료 정적 도메인, Vercel preview 안정성, Cloudflare Tunnel 무제한 대역폭).

### 2. 1A implementation plan 작성 (`d3843d8`)

- `docs/superpowers/plans/2026-05-04-epic-1a-inbox-instagram.md` (4009줄, 40 tasks, 10 phases).
- 각 task TDD 5단계 + 명시 commit + self-review 통과.
- Open Questions 4개 모두 해결.

### 3. Phase A 5 commits (subagent-driven-development)

| Task                                                | Commits                           | 검토                 |
| --------------------------------------------------- | --------------------------------- | -------------------- |
| T01 docs/runbook.md (C-06)                          | `c671cce` + `1680cc0` (ngrok fix) | spec ✅ + quality ✅ |
| T03 errors.ts (6 클래스 + auth-guard 통합)          | `b9849cf`                         | spec ✅ + quality ✅ |
| T02 instrumentation captureServerActionError (C-01) | `3ee534d` + `62ade9b` (refactor)  | spec ✅ + quality ✅ |

검증: tsc 0 error, 100/100 tests pass, 회귀 0건.

### 4. learnings.md L-041~L-044 (이전 세션)

- L-041: Epic 시작 전 senior-engineer 검증 의무화
- L-042: 외부 API 의존 spec은 정책 검증을 spec 단계에서
- L-043: 외부 도구·서비스 정책 답변 시 검색 우선 (확증편향 경계)
- L-044: PRD vs 실제 코드 갭은 spec 작성 시 양쪽 다 점검

## (보류) E9-6 OCR smoke test

β-test 매장 모집 시 실제 영업신고증 사진 1~3장 자연 확보 → 그때 baseline 1회 측정 → `docs/kyc-ocr-baseline.md` 작성. 인터넷/합성 샘플은 baseline 의미 약함.
