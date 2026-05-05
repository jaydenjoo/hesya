# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook)

## 현재 위치

- **Phase**: Phase 1 — **Epic 1B Phase B-1 완료** ✅ (1A 전체 + 1B 첫 Phase 머지)
- **Epic**: **Epic 1 통합 다국어 인박스** — 1A 인프라/PoC ✅ + 1B AI 응답 코어 ✅ → **다음**: Phase B-2 (AI 응답 Server Action + processInbound 트리거)
- **Task**: 1A Phase A~J ✅ / 1B Phase B-1 ✅ (Anthropic Sonnet 응답 생성 순수 모듈)
- **상태**: AI 응답 코어 (`features/inbox/ai/`) 4 파일 + 단위 테스트 12건. Meta App Development mode 발급 완료, Vercel prod env 4개 실값 교체 완료. main 최신 SHA `d117903`. 차단 요소 없음.
- **작업 브랜치**: 모두 머지됨. 다음 세션은 origin/main에서 새 브랜치 분기.
- **이번 세션 PR (1개)**: [#37](https://github.com/jaydenjoo/hesya/pull/37) Phase B-1 — Anthropic 응답 생성 코어 + 사후 리뷰 11 fix
- **Meta App**: `Hesya-IG` (App ID `898424353214958`), Development mode, OAuth Redirect URI 등록 완료, Test User 미등록(베타 시점)
- **Prod URL**: `https://hesya-web.vercel.app` (Vercel project `jaydens-projects-f5e92399/hesya-web`)
- **Supabase prod**: `bnlyzlfsxtjpzzydjjuv` (hesya-prod, Northeast Asia Seoul) — schema v0011 적용 완료
- **백업 태그**: `backup/before-monorepo-2026-04-30`

## 다음 세션 할 일 (우선순위)

### 1. Epic 1B Phase B-2 진입 (권장)

**B-2: AI 응답 Server Action + processInbound 트리거** (~3h, 1 PR):

- `features/inbox/ai/generate-reply` 호출하는 Server Action
- DAL: 직전 5턴 messages + storeName 조회 → buildPrompt 입력 구성
- `processInbound` 비어있는 hook을 AI 트리거로 채움 (1A에서 placeholder)
- `recentMessages` 길이 상한 + storeName 신뢰성 검증 (B-1 주석에 "B-2 boundary 책임"으로 위임된 것들)
- 통합 테스트 (DB-gated)

### 2. 또는 다른 옵션

- **Phase B-3**: 다국어 자동 번역 (5개 언어) + Composer 통합
- **Phase B-4**: RAG 인덱싱 (매장 FAQ 학습 — pgvector)
- **Phase B-5**: e2e 시나리오 (AI 응답 → 번역 → 발송) + PostgreSQL CI

### 3. 외부 의존성 (Epic 외 task)

- **Meta App Test User 등록**: 베타 검증 직전. 본인 IG Pro 계정 → 앱 역할 → 테스터 추가
- **Meta App Webhooks 구성**: Live mode 전환 시점 (`콜백 URL` + `IG_WEBHOOK_VERIFY_TOKEN`)
- **Meta App Review (Live mode)**: 출시 직전. Hesya 사업자등록증 발급 후 (개인사업자 즉시 가능)
- **PostgreSQL service container CI 통합**: B-5 시 자연 흡수 가능

### 3. 미진행 follow-up (Epic 진입 시 흡수 또는 별 PR)

**Senior Engineer 검토 (Epic 1B/1C/1D 진입 시 ADR 동반)**:

- 🔴 채널명 박힌 라우트 → `/api/webhooks/[channel]/route.ts` (Epic 1D, 1A 단일 채널 PoC라 OK)
- 🔴 fire-and-forget `processInbound` → Vercel Queue (Epic 1C)
- 🟡 env.ts flat schema → 5채널로 안 확장 (Epic 1D, channelConfigs map 권장)
- 🟡 module-level adapter → lazy `getAdapter()` Map cache (Epic 1D)
- 🟢 폴링 endpoint → SSE 마이그레이션 (Phase H follow-up, ~1000 owner 도달 시)

**기타 cleanup**:

- 🟡 X-Hub-Timestamp Meta 미발송 시 entry.time fallback (실제 PoC에서 발견 시)
- 🟡 fetch timeout (instagram-api-client 보강)
- 🟢 `HESYA_TEST_DATABASE_URL` 문서화
- 🟢 `test-helpers/db.ts` Channel inline (TDD Guard allowlist 추가 후 별 PR)
- 🟢 vault row orphan cleanup (1B 영역)

## 차단 요소

없음. 모든 fix 머지, prod schema 최신, dev branch 없음 (비용 0).

## 마지막 업데이트

- 날짜: 2026-05-05 evening — **Epic 1B Phase B-1 완료** (PR #37, 사후 리뷰 11 fix)

## 이번 세션 완료 (2026-05-05 evening — Phase B-1 + Meta App 발급)

### 1. Meta App 발급 (Jayden 외부 작업)

- `https://developers.facebook.com` → Hesya-IG 앱 생성 (Development mode)
- 이용 사례 "Instagram에서 메시지 및 콘텐츠 관리" 추가
- 권한 3개 (`instagram_business_basic`, `instagram_manage_comments`, `instagram_business_manage_messages`)
- OAuth Redirect URI 등록 (`https://hesya-web.vercel.app/api/oauth/instagram/callback`)
- `IG_APP_ID = 898424353214958` / `IG_APP_SECRET` (32자) / `IG_WEBHOOK_VERIFY_TOKEN` (`openssl rand -hex 16`) / `IG_REDIRECT_URI` 4개 수집
- Vercel prod env 4개 stub → 실값 교체 (Production)

### 2. Phase B-1 — Anthropic 응답 생성 코어 (PR #37)

신규 4파일 (`apps/web/src/features/inbox/ai/`):

- **prompt.ts** — `buildPrompt({storeName, customerLanguage, recentMessages})` → `{system, messages}`
  - 5개 언어 라벨 (ko/en/zh/ja/vi)
  - 한국어 답변 강제 (사장 검수용 — 자동 번역은 B-3)
  - `inbound → user` / `outbound → assistant` 역할 매핑
  - **storeName sanitize** (100자 + 백틱·이중인용·역슬래시·제어문자 제거 — LLM01 defense in depth)
- **generate-reply.ts** — `generateReply(input)` → `{reply, tokensUsed}`
  - Sonnet 4.6 (`claude-sonnet-4-6`), `max_tokens: 600`
  - `server-only` + cached client (anthropic-category-repo.ts 패턴 준수, top-level env import)
  - SDK 에러 → "AI 응답 생성 실패" 도메인 에러 래핑 (LLM02 키 prefix 누출 방지, `cause` 보존)
  - text block 부재 / 호출 실패 → throw (silent failure 금지)
- **prompt.test.ts** — 8건 (storeName/언어 라벨/한국어 강제/매핑/5개 언어/인젝션 회귀/100자/공백 보존)
- **generate-reply.test.ts** — 4건 (응답+토큰 / SDK 호출 인자 (objectContaining) / text block 부재 메시지 / SDK 에러 래핑)

### 3. 사후 리뷰 11 fix (PR #37 동봉)

병렬 2-agent (security-reviewer Opus + code-reviewer Sonnet):

**Security (MED 3 + LOW 2)**:

- M-1 storeName 인젝션 → sanitize 추가
- M-2 recentMessages 길이 상한 → B-2 boundary 위임 명시 주석
- M-3 SDK 에러 원문 전파 → 도메인 에러 래핑
- L-1 마지막 메시지 inbound 선제조건 → 주석 명시
- L-3 인젝션 회귀 테스트 추가

**Code (HIGH 2 + MED 4 + LOW 2)**:

- H-1 lazy require 주석/구현 불일치 → top-level import 유지 + 주석 정정 (vitest.setup이 env stub 선제 공급으로 안전)
- H-2 type narrowing 중복 → 의도 주석 (SDK 한계)
- M-1 `.rejects.toThrow()` 메시지 검증 → "text block 없음" 메시지 명시
- M-2 MAX_TOKENS 근거 → 주석 추가
- M-3 5개 언어 라벨 매칭 강화 → Record 누락 회귀 방어
- M-4 tokensUsed 네이밍 의도 주석
- L-1 cachedClient 격리 주석
- L-2 mock arg 캐스팅 → `expect.objectContaining`

### 4. 통계

- 신규 unit test 12건 (prompt 8 + generate-reply 4)
- 전체 258 통과 + 31 skipped / tsc clean / lint clean
- CI validate ✅ + e2e-smoke ✅ + Vercel preview ✅
- TDD baby-step (L-052) 적용 — RED 확인 후 GREEN

### 5. learnings.md 신규 1건 (L-057)

- L-057: Write/Edit 도구의 character class regex literal 직렬화 손상 → imperative 패턴으로 우회

### 만들지 않은 것 (Not Doing)

- ❌ Server Action / API Route / DB 변경 — Phase B-2
- ❌ 자동 번역 — Phase B-3
- ❌ RAG / pgvector / FAQ — Phase B-4
- ❌ E2E 시나리오 — Phase B-5
- ❌ Meta App Test User / Webhook / App Review — 베타·출시 시점에 처리

## 이번 세션 완료 (2026-05-05 — 옵션 C 풀 세션, 2 PR 머지)

### 1. Phase E — i18n (PR #29)

- T19 `packages/translations/messages/{ko,en}.json` — inbox 키 100% 번역
- T20 `{ja,zh-CN,zh-TW,vi}.json` — ko 구조 그대로 placeholder (next-intl 키 미스 방지)
- 6개 파일 동일 키 트리 (20 키), `Common.signIn` 기존 번역 보존

### 2. Phase F — Routes (PR #30)

- T21 `/api/webhooks/instagram` — HMAC + replay defense (X-Hub-Timestamp 5분) + 5 DAL upsert + fire-and-forget hook
- T22 `/api/oauth/instagram/callback` — state CSRF + 매장 사장 인증 + 토큰 교환 + integration upsert + webhook subscribe
- T23 `/api/inbox/refresh` — 인증/IDOR 검증 + listByStore + 옵션 activeId의 listByConversation
- DAL `findStoreByExternalAccount` 신규
- env IG_APP_ID/IG_APP_SECRET/IG_WEBHOOK_VERIFY_TOKEN/IG_REDIRECT_URI 추가
- vitest stub 4개 추가, test-helper `seedStoreIntegration` 추가

### 3. 사후 리뷰 6 fix (PR #30 동봉)

병렬 2 agent (security-reviewer + code-reviewer) 결과:

- **HIGH T23 IDOR**: `getConversationById`로 storeId 검증 → 다른 매장 conv 접근 시 403
- **HIGH T22 빈 catch**: Auth 에러만 sign-in, 나머지 throw → 500 (Sentry instrumentation 자동 캡처)
- **MEDIUM T22 err.message leak**: URL은 `exchange_failed` 카테고리만, raw 메시지는 Sentry로
- **MEDIUM T22 base URL**: `req.url` → `NEXT_PUBLIC_APP_URL` (Host 변조 open-redirect 방어)
- **MEDIUM T21 module-level adapter**: 재시작 필요성 주석
- **LOW T21 hub.challenge**: `slice(0, 256)` (amplifier 방어)

### 4. 통계 (PR #29 + #30)

- 189 unit test (5 신규 추가) + 29 skipped (DB-gated) / 0 fail
- tsc clean
- 커밋 7개 (Phase E 2 + Phase F 3 + 사후 fix 1 + i18n 2)

### 5. Consistency follow-up (PR #31) — senior + consistency 병렬 리뷰 후 처리

**HIGH 1 + MEDIUM 3 + LOW 3 fix**:

- HIGH: `Channel` union 6 파일 단일 소스 (`@hesya/database`의 `CHANNELS`/`Channel` import). test-helpers/db.ts는 TDD Guard 차단으로 별 PR
- MEDIUM R-2: `inbox/refresh` unknown error → `Sentry.captureException`
- MEDIUM I-1: `inbox` → `Inbox` 네임스페이스 (PascalCase 통일)
- MEDIUM I-2: placeholder 4 locale 한국어 → 영어 fallback
- LOW: stores.test.ts pure describe / webhook test import 순서 / ko.json 문장 종결

**미수정**: T-2 db.test.ts mock chain (false positive — 실제 `seedStoreIntegration`이 `.returning()` 미호출)

**총 통계**: 162 통과 + 29 skipped / tsc clean / i18n 6 파일 20 키 일치

### 6. Phase G (PR #32) — Server Actions + features

**T24~T27 + 사후 리뷰 7 fix**:

- T24 `features/inbox/lib/window-utils` — 24h 메시징 윈도우 상태 계산 (no-inbound/open/closing-soon/expired). 4 TDD 테스트
- T25 `features/inbox/actions/send-outbound` Server Action — 인증 + zod 검증 + 매장 소유 + 24h 윈도우 + adapter.sendOutbound + 5 DAL ops + revalidatePath. 8 unit test (Validation 4 + Forbidden + WindowClosed + adapter throw + 정상). 신규 DAL `getExternalIdByCustomerId`
- T26 `features/inbox/actions/connect-instagram` — 32-byte hex CSRF state cookie + Instagram authorize URL. 5 unit test
- T27 `features/inbox/{types,schema}.ts` — Conversation/Message/WindowState re-export + zod sendOutboundInputSchema

**사후 리뷰 fix (HIGH 2 + MEDIUM 3 + LOW 2)**:

- HIGH-1: Channel union 인라인 → `@hesya/database` import (L-049/050)
- HIGH-2: integration not found → `ExternalApiError` → `ValidationError` (사전 조건 위반은 외부 API 실패 아님)
- MEDIUM-3: schema.ts DRY (sendOutboundInputSchema 단일 소스)
- MEDIUM-4: 3 테스트 추가 (integration null / recipient null / adapter throw)
- MEDIUM-5: connect-instagram envelope 미사용 사유 주석
- LOW: secure 쿠키 NODE_ENV === 'production' 조건부 (로컬 HTTP DX)
- LOW: connect-instagram 인증 실패 + secure 검증 테스트 2개

**총 통계**: 219 통과 + 31 skipped / tsc clean / TDD baby-step (L-052) 적용

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
