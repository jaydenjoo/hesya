# Hesya — Project Instructions

> 외국인 손님 응대 자동화 플랫폼 (한국 미용업/자유업).
> Phase 1 (베타 5곳 목표, Day 91~120). 보안 등급 🔴 RED.

## Tech Stack — Topology (가정 깨짐 방지용 ⭐)

이 부분 가정 잘못 잡으면 plan 폐기됩니다. Plan 작성 전 반드시 확인.

| 영역       | 실제 (2026-05)                                                                                                                | 흔한 오해                           |
| ---------- | ----------------------------------------------------------------------------------------------------------------------------- | ----------------------------------- |
| Auth       | **Better Auth** (`@hesya/auth` → `lib/auth.ts:auth`, `auth.api.getSession({ headers })`)                                      | Supabase Auth, NextAuth             |
| DB         | PostgreSQL (Supabase host), **ORM = Drizzle**                                                                                 | Prisma                              |
| Migrations | **HYBRID** — 0010까지 drizzle / 0011~ manual SQL ⚠️                                                                           | drizzle-kit generate 단독           |
| i18n       | **next-intl** (`src/i18n/{routing,request,navigation}.ts`) + **Next.js 16: `src/proxy.ts`** (middleware 자리, AGENTS.md 참조) | `middleware.ts` 사용 / 일반 Next.js |
| Queue      | **QStash** (Upstash) — Vercel Queue beta 영구 이탈 (L-077)                                                                    | Vercel Queue                        |
| 모니터링   | Sentry + PostHog                                                                                                              | —                                   |
| LLM        | Anthropic Claude (Sonnet 4.6 + Opus 4.7)                                                                                      | OpenAI                              |

## Workspace

- pnpm + Turborepo 모노레포 (Node ≥20, pnpm ≥10)
- `apps/web/` — Next.js 16.2, port 4200
- `packages/{auth, database, shared-types, shared-ui, translations}`

## Verification Commands

```bash
pnpm type-check                       # turbo run type-check (tsc --noEmit per package)
pnpm lint                             # eslint
pnpm --filter @hesya/web test         # vitest 518+ cases
pnpm --filter @hesya/web build        # 경고 0건 목표
```

## App Routes & Middleware

- **`app/[locale]/`** — 다국어 routing (next-intl)
  - `admin/{kyc-test, store-reports}` — 운영자 (`requireAdminRole` 가드, `users.role='admin'`)
  - `sign-in/` — 로그인
  - `store/` — 매장 owner UI
  - `design-system/` — 디자인 토큰 데모
- **`app/api/`** — REST endpoints (locale 외부)
- **`src/proxy.ts`** — Next.js 16 middleware 위치 (rename됨, AGENTS.md "This is NOT the Next.js you know"). next-intl middleware 등록.
- **`src/i18n/request.ts`** — `getRequestConfig`로 메시지 로딩 (locale routing 아님)

## 핵심 자산 인덱스 (Pre-Plan 검색 시작점)

### Auth Guards (2종 — 신규 만들기 전 표 확인)

| 함수                         | 파일                                           | 상태 / 용도                                                           |
| ---------------------------- | ---------------------------------------------- | --------------------------------------------------------------------- |
| ✅ `requireAdminRole()`      | `apps/web/src/shared/lib/admin-role-guard.ts`  | DB `users.role='admin'` (마이그 0030). γ.2 마이그 완료 — 18 callsites |
| ✅ `requireStoreOwnerAuth()` | `apps/web/src/shared/lib/store-owner-guard.ts` | 매장 owner (`store_owners` 테이블 join)                               |

> 과거 두 stub은 모두 삭제됨: `auth-guard.ts` (`requireAuth` / `requireAdmin`) 2026-05-08 Phase 1-γ.0 fix #2, `admin-guard.ts` (`requireAdminEmail` + `ADMIN_EMAILS` env) 세션 45 γ.2 마이그 완료 후 cleanup PR. 신규 admin 가드 도입은 `admin-role-guard.ts`처럼 명시적 명명으로 새 파일에 작성 (`auth-guard.ts` / `admin-guard.ts` 이름은 stub 트라우마로 재사용 금지).
>
> **신규 가드/인증 함수 만들기 전 의무**: `grep -rn "guard\|require" apps/web/src/shared/lib/`

### DAL (Data Access Layer)

- 위치: `apps/web/src/shared/lib/dal/` (conversations, customers, messages, stores, store-owners 등 10+ 모듈)
- 컨벤션: `apps/web/src/shared/lib/dal/README.md`
- **새 DAL 모듈은 같은 폴더에 `<name>.ts` + `<name>.test.ts` 쌍**

### Feature Logic

- `apps/web/src/lib/{inbox, kyc, llm, notifications, store-reports}` — Server Actions + 비즈니스 로직
- `apps/web/src/features/{inbox, knowledge}` — UI 기능 모듈

### DB Schema

- `packages/database/src/schema/auth/{users, sessions, accounts, verifications}` — Better Auth
- `packages/database/src/schema/{stores, store-owners, customers, conversations, messages, ...}` — 비즈니스
- 새 테이블 추가는 **`packages/database/CLAUDE.md` 먼저 읽기 의무** ⚠️

## Pre-Plan Inventory (의무 — 5분, Plan 작성 전)

새 기능 plan 작성 전 반드시:

1. **키워드 grep**: `grep -rn "<키워드>" apps/web/src/lib/ apps/web/src/shared/lib/ apps/web/src/features/`
2. **작업 영역 ls**: 만들려는 파일이 갈 폴더 + 인접 폴더
3. **최근 마이그/스키마**: `ls packages/database/migrations | tail -5` + 관련 schema
4. **시연 prerequisite 검증** (L-082): 새 기능이 실제 사용자 흐름에서 작동하려면 어떤 환경 전제 필요? 데모 환경(`pnpm dev:demo`)에서 그 전제가 자동 충족되는가? fixture가 cover하는 영역 ≠ 데모 환경 — 명시 검증.
5. **결과를 Plan v1의 "기존 자산 검색 결과" 섹션에 첨부** (0건이라도 명시)

세부 절차: `~/.claude/rules/inventory-protocol.md`

## PROGRESS 자기평가 검증 규칙 (L-082, 2026-05-08 도입) ⭐

**% 표시는 "코드 머지 완료"가 아닌 "사용자 입장 e2e 시연 가능 여부"로 정의**.

| 상태                                        | 표시                   |
| ------------------------------------------- | ---------------------- |
| end-to-end 시연 한 번도 못 함 (코드만 머지) | **0%** 또는 "스키마만" |
| 부분 흐름 e2e 통과 (단일 경로)              | **30~60%**             |
| 통합 흐름 e2e 통과 (여러 사용자 단계)       | **70~85%**             |
| 통합 e2e + 디자인 적용 + a11y/perf 검증     | **90%+**               |

**자기평가 갱신 시 의무**:

1. 근거 첨부 (PR + e2e 결과 또는 subagent 진단)
2. P0 Epic은 senior-engineer + code-explorer subagent로 객관화
3. 같은 영역 PR 3개+ 누적 시 즉시 회고 trigger (plan 인벤토리 부실 시그널)

## Workflow

- Task 단위 7단계 사이클 (글로벌 CLAUDE.md, **0. Inventory** 포함)
- 보안 등급 🔴 RED — RLS, Auth, 결제, 마이그 변경은 Jayden 수동 검증 필수

## Known Gotchas

- ❌ `pnpm --filter @hesya/database db:generate` 실행 = **위험**. conversations/store_integrations 등 manual 마이그 테이블을 다시 만들려 시도. → `packages/database/CLAUDE.md` 절차 따르기.
- ❌ `app/(admin)/` route group을 `[locale]` **밖**에 만들면 i18n과 충돌. admin은 `app/[locale]/admin/<sub>/` 안에.
- ❌ DAL을 `apps/web/src/lib/dal/`에 새로 만들면 중복. 기존 `apps/web/src/shared/lib/dal/` 사용.
- ✅ `requireAdminRole` (마이그 0030 `users.role` 컬럼) — 세션 45 γ.2 마이그 완료 후 `requireAdminEmail` + `ADMIN_EMAILS` env 삭제됨. admin promotion = SQL `UPDATE users SET role='admin' WHERE email=...`.
- ⚠️ Next.js 16에서 `middleware.ts` 만들면 무시됨. `proxy.ts`가 middleware 자리.
- ✅ **rate-limit.ts** — `@upstash/ratelimit` sliding window (Upstash Redis `hesya-rate-limit-prod`, Tokyo, Free tier 500K/월). prefix `hesya:rl`. env: `UPSTASH_REDIS_KV_REST_API_URL/TOKEN`. 2026-05-08 Phase 1-γ.0 fix #1로 in-memory Map → 분산 Redis 교체 완료.
- ✅ **`sign-in/page.tsx`는 정식 페이지** — Hesya Store Login 디자인 적용 (brand panel + form panel + Google OAuth + trust badges + locale selector 6 locale). Plan v3 M1.4 (2026-05-11)에서 locale selector 활성화 + "임시 검증" 표기 정정 완료. admin/store 별도 분리는 보류 (현재 동일 페이지 + `requireAdminRole` 분기로 충분).
- ⚠️ **PROGRESS 자기평가는 e2e 시연 기준** (L-082) — 코드 머지 완료 ≠ 시연 가능. 새 기능 plan 시 시연 prerequisite 검증 의무.

## Documents

- PRD: `docs/PRD.md` (v1.2, 2026-04-29)
- 진행: `PROGRESS.md` (세션 시작 시 첫 번째 읽기)
- 교훈: `docs/learnings.md` (L-001~ 누적)
- ADR: `docs/DECISIONS.md`
- 개발 계획: `docs/DEVELOPMENT-PLAN.md`

@AGENTS.md
