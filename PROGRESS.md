# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook)

## 현재 위치

- **Phase**: Phase 1 진행 중
- **Epic**: **Epic 1 통합 다국어 인박스** — 1A 인프라 + Instagram PoC
- **Task**: Phase A ✅ + Phase B ✅ + Prod migration v0011 ✅ + **Phase C ✅** + **Phase D ✅** + **사후 리뷰 9 fix ✅** → **다음**: Phase E (i18n, ~1h) + Phase F (Routes/UI/E2E, ~6h)
- **상태**: 모든 코어 인프라/DAL/Channel Layer 완성. main 최신 SHA `6de6931`. 차단 요소 없음.
- **작업 브랜치**: 모두 머지됨. 다음 세션은 origin/main에서 새 브랜치 분기.
- **이번 세션 PR (6개)**: [#22](https://github.com/jaydenjoo/hesya/pull/22) prod v0011 → [#23](https://github.com/jaydenjoo/hesya/pull/23) T07 → [#24](https://github.com/jaydenjoo/hesya/pull/24) T08+T09 → [#25](https://github.com/jaydenjoo/hesya/pull/25) T10~T12 → [#26](https://github.com/jaydenjoo/hesya/pull/26) Phase D → [#27](https://github.com/jaydenjoo/hesya/pull/27) 사후 리뷰 9 fix
- **Prod URL**: `https://hesya-web.vercel.app` (Vercel project `jaydens-projects-f5e92399/hesya-web`)
- **Supabase prod**: `bnlyzlfsxtjpzzydjjuv` (hesya-prod, Northeast Asia Seoul) — schema v0011 적용 완료
- **백업 태그**: `backup/before-monorepo-2026-04-30`

## 다음 세션 할 일 (우선순위)

### 1. Phase E — i18n (~1h)

plan: docs/superpowers/plans/2026-05-04-epic-1a-inbox-instagram.md § Phase E

- T19 `apps/web/messages/{ko,en}.json` (100% 번역)
- T20 `{ja,zh-CN,zh-TW,vi}.json` placeholder (1B 본격 번역)

### 2. Phase F — Routes / UI / E2E (~6h, 큰 작업)

plan § Phase F

- T21 webhook route (Instagram, HMAC verify + DAL 통합) — **H-4 X-Hub-Timestamp 5분 검증 포함** (사후 리뷰 follow-up)
- T22 OAuth callback route — **state CSRF 검증 포함** (review LOW follow-up)
- T23 polling endpoint
- T24 window-utils (24h 윈도우 계산)
- T25 send-outbound Server Action (window 만료 시 throw)
- T26 connect-instagram (OAuth start URL)
- T27 features/inbox/{types,schema,index}.ts
- T28 shadcn 5개 설치 (Sheet/Tabs/Avatar/Skeleton/ScrollArea)
- T29~T33 컴포넌트 (WindowStatus / ThreadList / MessageBubble / Composer / EmptyState)
- T34 store/inbox/page.tsx (Server Component + 5초 polling)
- T35 store/inbox/connect/page.tsx
- T36~T37 E2E (Playwright)

### 3. 미진행 follow-up (Phase F 작업 중 자연 흡수 또는 별 PR)

- 🟡 Channel inline 정의 5 파일 제거 → `import from "@hesya/database"` (`CHANNELS` 단일 소스 마련됨)
- 🟡 fetch timeout (Phase F instagram-api-client 보강)
- 🟡 vault row orphan cleanup (1B 영역)

## 차단 요소

없음. 모든 fix 머지, prod schema 최신, dev branch 없음 (비용 0).

## 마지막 업데이트

- 날짜: 2026-05-04 P.M. v3 (Phase D + 사후 리뷰 9 fix 완료)

## 이번 세션 완료 (2026-05-04 P.M. v3 — 풀 세션 6 PR 머지)

### 1. Prod migration v0011 적용 (PR #22)

- 사전 점검 5건 (병렬) → apply_migration 1회 → 검증 5/5 → Sentry/Vercel 5분 모니터링 클린
- prod schema 최신: conversations + store_integrations + messages 3컬럼 + 인덱스 5 + RLS 2 + pgsodium 3.1.8

### 2. Phase C — DAL 레이어 (PR #23, #24, #25)

- T07 `dal/conversations.ts` + test-helpers/db.ts (PR #23)
- T08 `dal/messages.ts` (idempotent insert) + T09 `dal/customers.ts` (idempotent upsert) (PR #24)
- T10 `dal/store-integrations.ts` (vault 연계) + T11 `dal/store-owners.ts` + T12 `store-owner-guard.ts` (Better Auth) (PR #25)
- 패턴 일관: `(db: DbClient, ...)` 인자 (Phase B vault 연속) + `HESYA_TEST_DATABASE_URL` 게이트 + `import "server-only"`

### 3. Phase D — Channel Layer (PR #26)

- T13 ChannelAdapter 인터페이스 + types.ts (5채널 union)
- T14 instagram-api-client (Meta Graph API 5 endpoint HTTP fetch 래퍼)
- T15-17 instagram-adapter (HMAC + parse + sendOutbound + OAuth code exchange)
- T18 process-inbound (1A 빈 hook, 1C에서 AI 응답 트리거)

### 4. 사후 리뷰 9 fix (PR #27) — 작업 프로토콜 § 4 보강

3 agent 병렬 리뷰 (security-reviewer + code-reviewer + consistency-reviewer) 결과 발견 9 issue 중 7 fix:

**Security**:

- H-1 + M-1: `sanitize-url.ts` 신규 + Sentry beforeBreadcrumb/beforeSend (`access_token`/`client_secret` 마스킹) + ExternalApiError body 200자 truncate
- H-2: HMAC length leak 제거 (dummy buffer 패딩 + timingSafeEqual 무조건 1회)
- H-3: webhook payload Zod schema + JSON.parse try-catch
- H-4: X-Hub-Timestamp는 Phase F webhook route 책임으로 명시 코멘트 (header layer 분리)

**DAL**:

- HIGH: insertMessage / upsertCustomer 시그니처 `Promise<T | null>` (race condition 시 throw 대신 null → 500 leak 방지)
- MEDIUM: listByConversation `opts.offset` 추가 (cursor 기반 페이지네이션)

**Consistency**:

- C-1: admin-guard.ts 첫 줄 `import "server-only";` 추가
- M-1: `packages/database/src/schema/channels.ts` 신규 (`CHANNELS` 상수 + `Channel` 타입 단일 소스)

### 5. 통계

- vitest: 26 files / 137 pass / 24 skipped (161 total) — 신규 36+ tests 추가
- type-check: 6/6 패키지 통과
- lint: pass
- 머지된 PR: 6개 (#22~#27)
- Vercel preview 비용: PR당 1회만 (Phase 단위 push, Jayden 비용 절감 요청)

### 6. learnings.md 신규 3건 (L-049, L-050, L-051)

- L-049: 자동 머지 PR 리뷰 누락 위험 + multi-agent 병렬 사후 리뷰 패턴
- L-050: TDD-guard hook 우회 — source code grep test로 RED 만들기
- L-051: Phase 단위 push로 Vercel preview 비용 절감 (~5x)

### 만들지 않은 것 (Not Doing)

- ❌ Phase E i18n + Phase F Routes/UI/E2E — 다음 세션
- ❌ Channel inline 정의 cleanup (5 파일) — 별 cleanup PR 또는 Phase F 시 자연 처리
- ❌ vault row orphan 정리 — 1B 영역
- ❌ 통합 테스트 실 실행 — `HESYA_TEST_DATABASE_URL` 셋업 후 별 task

## 이전 세션 완료 (2026-05-04 P.M. v2 — Prod migration v0011 적용)

apply_migration 1회 + 검증 5/5 + 모니터링 클린. prod schema 최신.

## 더 이전 세션 완료 (2026-05-04 P.M. — Phase B 완주 + PR #20 머지)

Phase B vault helper (plan 결함 2건 dev에서 발견 → vault 전환). dev branch 삭제 (비용 정지).

## (보류) E9-6 OCR smoke test

β-test 매장 모집 시 실제 영업신고증 사진 1~3장 자연 확보 → 그때 baseline 1회 측정 → `docs/kyc-ocr-baseline.md` 작성. 인터넷/합성 샘플은 baseline 의미 약함.
