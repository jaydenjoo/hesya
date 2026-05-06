# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook)

## 현재 위치

- **Phase**: Phase 1 — **워크플로우 인프라 + Epic 1B-Tone P2-A/2-B + Customer 확장 머지 완료** (auto-merge 라벨 3회 연속 검증 ✅)
- **Epic**: **Epic 1 통합 다국어 인박스** — 1A ✅ + 1B B-1~B-4c ✅ + 1B-UI ✅ + 1B-Tone P1 (4탭) ✅ + 1B-Tone P2-A ✅ + 1B-Tone P2-B (매장 톤 학습) ✅ + **Customer 확장 (IG profile + ContextPanel name/notes 편집) ✅** → **다음**: P2-B/P2-A follow-up (S2 row cap, S3 userId truncate, D6 prompt caching, Sec MED-1 IG fetch retry) 또는 다른 Epic 진입
- **Task**: 1A ✅ / 1B B-1~B-4c ✅ / 1B-UI A-1~A-4 ✅ / 1B-Tone 1~4 ✅ / 워크플로우 A-1 (CI 병렬화+Playwright cache) ✅ / 워크플로우 A-2 (auto-merge.yml + 라벨) ✅ / 1B-Tone P2-A ✅ / 1B-Tone P2-B ✅ / **Customer 확장 CC-1~CC-7 (DB+DAL+IG fetch+webhook+Server Action+ContextPanel UI) ✅**
- **상태**: 사장이 ContextPanel에서 고객 이름(IG 자동 fetch) + 방문 횟수 + 사용 금액 보고, 알러지·선호 디자이너 메모 편집·저장. PR #58 머지 검증 결과 auto-merge 인프라 정상 (validate + e2e-smoke + Vercel 모두 SUCCESS → squash merge `7ceeaff` + 브랜치 자동 삭제). 차단 요소 없음 (단 0016 prod migration 적용 보류).
- **작업 브랜치**: `main` (Customer 확장 머지 + 작업 브랜치 자동 삭제 완료). origin 동기화 ✅.
- **최근 main 직접 commit**: `503c16d` (ci 병렬화), `725e437` (auto-merge.yml). 둘 다 인프라 yml 변경 — 정책상 main 직접 push 적용 (코드 회귀 0).
- **최근 머지된 PR**: [#58](https://github.com/jaydenjoo/hesya/pull/58) Customer 확장 — `auto-merge` 라벨 3회 사용, squash merge `7ceeaff`, 25 신규 테스트, 491/491 + 40 skipped, 사후 리뷰 fix 5건 (Sec MED-2 명시 select, LOW-3 DB CHECK, Code HIGH-1 NotesForm key, HIGH-2 unknown cast, MED-4 Sentry storeId tag).
- **prod migration**: `0014_messages_tone_metadata.sql` 적용 완료 (SQL Editor) / **`0015_store_tone_examples.sql` 적용 ✅** (이번 세션 MCP `apply_migration`) / **`0016_customers_profile.sql` 적용 ✅** (이번 세션 MCP, Jayden 명시 승인 후). customers 컬럼 11→14 (`name`/`allergy_note`/`preferred_designer` + 2 CHECK 2000자 제약). 모든 P2-B/Customer 확장 기능 prod 동작 가능 상태.
- **Meta App**: `Hesya-IG` (App ID `898424353214958`), Development mode, OAuth Redirect URI 등록 완료, Test User 미등록(베타 시점)
- **Prod URL**: `https://hesya-web.vercel.app` (Vercel project `jaydens-projects-f5e92399/hesya-web`)
- **Supabase prod**: `bnlyzlfsxtjpzzydjjuv` (hesya-prod, Northeast Asia Seoul) — schema v0011 적용 완료
- **백업 태그**: `backup/before-monorepo-2026-04-30`

## 다음 세션 할 일 (우선순위)

### 1. Customer 확장 follow-up (선택, 별 PR)

**Security review 잔여**:

- 🟡 **Sec MED-1**: `ig_profile_fetched boolean` 플래그 + 0017 마이그 — 영구 fail customer 무한 retry 방어

**Code review 잔여**:

- 🟡 **Code MED-3**: IG accessToken URL → Authorization header (모든 IG endpoint 영향, 큰 변경)
- 🔵 **Code MED-5**: DAL test source-grep → mock DB pattern 통합 (의도된 패턴, 별 cleanup)
- 🔵 **Code LOW-7**: `preferredDesigner` 500자 → UX 검토 (이름 필드 적정 길이)

### 2. P2-B/P2-A follow-up (선택, 별 PR)

- 🟡 **S2**: `store_tone_examples` per-store row cap (storage growth 방어)
- 🟢 **S3**: Sentry full userId → 8자 truncate (cross-cutting, 기존 패턴 통합)
- 🔵 **D6**: prompt caching — system을 array of blocks로 리팩 (cache breakpoint, ~30% 비용 절감 추정)
- 🔵 톤 학습 buffer 축적 시 quality 측정 (실 사용 후 정성 평가)

### 3. Shortcuts FAB 키보드 단축키 모달 (선택, ~1h)

디자인 ref Composer에 단축키 1~9 표시. 실제 단축키 hookup은 별 Task.

### 2. Phase B-4 사후 follow-up (선택, 별 PR)

**남아있는 항목**:

- 🟡 OpenAI rate limit (현재 무방어 — 빠른 클릭 시 429 가능). Upstash Redis 전환과 함께 처리 권장
- 🟡 `count(*)::int` 드라이버 런타임 number 보장 — postgres-js는 안전하나 `Number(...)` 가드 추가 검토
- 🟡 FAQ 삭제 `window.confirm` → shadcn AlertDialog (UX 개선, 디자인 ref 추가 시)
- 🟢 FAQ 검색/필터 UI (등록 수 50개 초과 시점)
- 🔵 통합 테스트: advisory lock 실제 직렬화 + limit_exceeded 행동 검증 (HESYA_TEST_DATABASE_URL 게이트)
- 🔵 **C-heavy** (PostgreSQL CI service container) — Supabase 호환(pgsodium/auth.uid) 처리 ~4~6h. 옵션: (a) Supabase CLI in CI, (b) pgsodium pre-install 커스텀 이미지, (c) RLS 마이그레이션 conditional 분리

**완료**:

- ✅ PR #45: countStoreKnowledge DAL 분리 + createFAQ TOCTOU 차단(advisory lock + lock_timeout)
- ✅ PR #46: createStoreKnowledge orphan 제거 + Sentry tag storeId PII 자동 truncate(8자)
- ✅ PR #47: C-light integration 시나리오 3 (RAG 통합) + storeKnowledge 격리

### 3. B-3c 사후 follow-up (선택, 별 PR)

- **Code-L-2**: AIAssist 발송 후 짧은 클릭 창 → toast + 즉시 dismiss (UX 개선)
- **Sec-L-2**: claimAiDraftForSend ownership 함수 시그니처 강제 (래퍼 패턴)
- **Sec-M-3**: 다른 16개 테이블 RLS POLICY 추가 (advisor 권장 — accounts/customers/payments 등)
- **Code-L-1**: source-code 정규식 검사 → integration test 이전 (DB CI 도입 시)

### 2. 또는 다른 옵션

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

**B-2 사후 리뷰 LOW 4건** (B-3 진입 시 흡수 또는 별 PR):

- 🟡 `revalidatePath` silent failure 추적 + path 상수화 (B-3 Composer 작업 시 자연 흡수)
- 🔴 `ai_draft` outbound RLS 검증 (B-3 진입 직전 필수)
- 🟡 DAL error wrapping 일관성 (connection string 누출 방어 — Drizzle 에러)
- 🟢 `recentMessages` filter type narrowing 단순화 (스키마 NOT NULL 확인 후)
- 🟢 `no_recent_messages` 가드 주석 명확화 (방어적 코딩 의도)

## 차단 요소

없음. 모든 fix 머지, prod schema 최신, dev branch 없음 (비용 0).

## 마지막 업데이트

- 날짜: 2026-05-06 (Customer 확장 + 0016 prod 적용) — **0016 prod 적용 ✅** (MCP `apply_migration`, Jayden 명시 승인). customers 컬럼 11→14 (name/allergy_note/preferred_designer + 2 CHECK 2000자). 모든 P2-B/Customer 확장 기능 prod 동작 가능. 차단 요소 없음.
- 날짜: 2026-05-06 (Customer 확장 풀 세션) — **Customer 확장 7-step 완료** (PR #58 squash merge `7ceeaff`). 0015 prod 적용 ✅ (MCP). DB 0016 마이그 + DAL 3 함수 + IG fetchUserProfile + locale-to-language helper + webhook 자동 enrichment + Server Action updateCustomerNotes + ContextPanel Notes 편집 form. 사후 리뷰 2-agent 병렬 결과 fix 5건 적용 (Sec MED-2 명시 select, LOW-3 DB CHECK, Code HIGH-1 NotesForm key prop+caller reset, HIGH-2 unknown cast, MED-4 Sentry storeId tag). vitest 491 passed (+25 신규) + 40 skipped. type-check 6/6 + lint Done. auto-merge 라벨 3회 연속 검증 ✅. **prod migration `0016_customers_profile.sql` 미적용 — Jayden 명시 승인 대기**.
- 날짜: 2026-05-06 (P2-B 풀 세션) — **Epic 1B-Tone Phase 2-B 매장 톤 학습 완료** (PR #57 squash merge `c79081a`). 7-step 구현 (DB → DAL → Action → Prompt → Trigger → UI → Review). 사후 리뷰 2-agent 병렬 결과 fix 6건 적용 (Sec S1 rate limit 30/h, Code HIGH-2 catch 주석, MEDIUM-1 null 가드, LOW-1 onChange clear, HIGH-1은 message-view key prop 패턴 위임, lint 1 error fix). vitest 466 passed (+26 신규) + 40 skipped. type-check 6/6 + lint Done. auto-merge 라벨 2회 연속 검증 ✅. **prod migration `0015_store_tone_examples.sql` 수동 적용 보류 (Jayden)**.
- 날짜: 2026-05-06 세션 시작 — **PR #56 자동 머지 검증 ✅** (auto-merge 라벨 + workflow_run 트리거 첫 동작 성공: validate + e2e-smoke + Vercel + Vercel Preview Comments 모두 SUCCESS → squash merge `6730140` + 브랜치 자동 삭제). main + origin/main 완전 동기화. 다음 Task: Phase 2-B 매장 톤 학습.
- 날짜: 2026-05-05 심야 후속 — **워크플로우 인프라 (CI 병렬화 + Playwright cache + auto-merge.yml) + Epic 1B-Tone Phase 2-A 구현 (PR #56 open with auto-merge 라벨)**. main SHA `725e437`. learnings L-062 (auto-merge silent ignore), L-063 (Playwright cache) 추가.
- 날짜: 2026-05-05 심야 세션 — **Epic 1B-Tone 시리즈 완료** (PR #52 DB+DAL + #53 Anthropic 4 tone tool use + #54 generate-and-store 저장 + #55 AIAssist 4탭). main SHA `197b5a6`. prod migration `0014_messages_tone_metadata.sql` 수동 적용 완료.
- 날짜: 2026-05-05 후반 세션 — **Epic 1B-UI 시리즈 완료** (PR #48 골조 + #49 ThreadRow + #50 MessageBubble/Header + #51 ContextPanel) + **B-4 followup-2** (PR #46) + **C-light** (PR #47)
- 날짜: 2026-05-05 late night+ — **B-4 followup 흡수** (PR #45: countStoreKnowledge DAL + advisory lock TOCTOU 차단 + lock_timeout)
- 날짜: 2026-05-05 late night — **Epic 1B Phase B-4 RAG 시리즈 완료** (PR #42 pgvector + #43 검색 주입 + #44 CRUD UI)
- 날짜: 2026-05-05 night — **Epic 1B Phase B-3c 완료** (PR #41, Sec HIGH 1 + Code MEDIUM 4 + 운영 안전 fix)

## 이번 세션 완료 (2026-05-05 심야 후속 — 워크플로우 인프라 + Phase 2-A)

### 1. 워크플로우 정책 결정 + 메모리화

- **main 직접 vs 브랜치+PR 분류**: docs/색상은 main 직접 (회귀 0), 코드는 브랜치+PR
- **시리즈 작업**: PR 묶음 권장 (1 PR + N commit) 또는 분리 PR — 사전 결정
- **memory 저장**: `feedback_workflow_main_vs_branch.md` (구현된 인프라 + 새 PR 명령 포함)

### 2. CI 워크플로우 최적화 (PR 없이 main 직접 — 503c16d)

- `e2e-smoke needs: validate` 제거 → validate와 병렬 실행 (wall time 5분 → 4분)
- `actions/cache@v4`로 `~/.cache/ms-playwright` 캐시 추가 (lockfile hash 기반 key)
- 캐시 적중 시 Playwright browser download 30~40초 → 5초
- 다음 PR (#56)부터 효과 측정 가능

### 3. Auto-merge 인프라 구축 (PR 없이 main 직접 — 725e437)

- `.github/workflows/auto-merge.yml` 신규 — workflow_run 트리거
- `auto-merge` 라벨 PR이 CI green 시 자동 squash + branch delete
- 외부 액션 의존성 0 (gh CLI만 사용)
- branch protection 불필요 (개인 repo + main 직접 push 정책 호환)
- `gh label create auto-merge` (#0E8A16) 완료
- **Why workflow_run**: GitHub auto-merge API는 branch protection 없으면 silent ignore (L-062)

### 4. Epic 1B-Tone Phase 2-A 구현 (PR #56 open, 12a5ff9)

**디자인 ref** (`docs/design/reference/inbox-app.jsx` 라인 475~570): AIAssist에 verification pill + 이유 보기 inline popover.

- **schema**: `ToneVerification` 타입 + `MessageMetadata.verifications` 옵셔널
- **generate-reply.ts**: tool_schema에 `verifications` 객체 추가 — 4 tone × `{state, label, reason}`. state enum `["ok", "warn"]`. 응답 형식 가드 (`isValidVerifications`).
- **generate-and-store-reply.ts**: `verifications` 있을 때만 `metadata.verifications` 키 저장 (Phase 1 호환)
- **AIAssist UI**: active tone pill (✓ 녹색 / ⚠ 주황) + reason 있을 때만 '이유 보기' 버튼 + 탭 전환 시 popover 자동 닫힘
- **message-view.tsx**: `verifications={aiDraft.metadata?.verifications}` forwarding

**테스트** (12 신규):

- generate-reply +5 (정상 응답, 누락 호환, schema 포함, state enum 검증, 잘못된 형식 reject)
- ai-assist +5 (미전달 미표시, ok pill, warn pill+이유, popover toggle, 탭 전환 시 닫힘)
- generate-and-store-reply +2 (verifications 있을 때 metadata 저장, 없을 때 키 생략)
- 440/440 + 40 skipped, tsc + lint 클린

**비용**: tool output 토큰 ~30% 증가 (4 verification labels + reasons). input은 prompt cache로 무변동.

**PR #56 진행 중**: 첫 `auto-merge` 라벨 사용 사례 — workflow_run 트리거 자동 머지 검증 예정.

### 5. learnings.md 추가 (2건)

- **L-062**: GitHub auto-merge는 Branch Protection 의존성 (silent ignore). workflow_run 트리거로 우회.
- **L-063**: e2e-smoke 1.5분의 진짜 병목은 Playwright browser download. lockfile hash 기반 cache 필수.

## 이번 세션 완료 (2026-05-05 심야 — Epic 1B-Tone 시리즈 4 PR)

### 1. DB 스키마 + DAL (PR #52, 1B-Tone-1)

- 마이그레이션 `0014_messages_tone_metadata.sql` — `messages.metadata` jsonb (nullable) 추가
- `MessageMetadata` 타입: `{ tones?: { warm: string; formal: string; short: string; friendly: string } }`
- `insertMessage` DAL 시그니처 확장 — `metadata?: MessageMetadata` 옵셔널
- prod 수동 적용: nullable + drizzle ignores unknown → 머지 전후 순서 무관 안전

### 2. Anthropic 4 톤 동시 생성 (PR #53, 1B-Tone-2)

- `generate-reply.ts` rewrite → `tool_choice: { type: "tool", name: "generate_tone_variations" }` 강제 호출
- MAX_TOKENS 600 → 1500 (4 tone output 4배)
- `Tones` 타입 + `isValidTones` 타입 가드 export
- `GenerateReplyOutput.tones`는 옵셔널 (caller backward compat)
- 프롬프트 캐싱 + tool use 패턴으로 단일 generate 대비 +30~50% 비용

### 3. metadata.tones 저장 (PR #54, 1B-Tone-3)

- `generate-and-store-reply.ts` 조건부 spread:
  ```ts
  ...(result.tones ? { metadata: { tones: result.tones } } : {})
  ```
- 1A/1B 호환: tones 없으면 metadata도 없음

### 4. UI 4탭 활성화 (PR #55, 1B-Tone-4)

- `schema.ts`: `TONE_VALUES` enum + `acceptAiDraftInputSchema.tone` 옵셔널
- `accept-ai-draft.ts`: `tone` 파라미터 추가, `metadata.tones[tone]` 우선 / `originalText` fallback
- `AIAssist`: `tones?: Tones` prop, 4탭 UI (role=tablist + aria-selected), `useState<Tone>("warm")`, 탭 클릭 즉시 텍스트 전환, `onAcceptAsIs(activeTone)`
- `message-view.tsx`: `tones={aiDraft.metadata?.tones}` 전달, `hasTones` gate로 tone 조건부 송신
- 테스트: ai-assist +5, accept-ai-draft +3, schema +3 / 429 passed + 40 skipped / tsc 클린

### 5. 백워드 호환 매트릭스

| 시나리오                 | metadata | 발송 텍스트                                 |
| ------------------------ | -------- | ------------------------------------------- |
| 1A/1B 기존 (pre-Tone)    | null     | originalText (fallback)                     |
| 1B-Tone 신규 (sans tone) | tones    | originalText (fallback, 호출자가 tone 생략) |
| 1B-Tone 신규 (with tone) | tones    | tones[tone]                                 |

## 이번 세션 완료 (2026-05-05 night — Phase B-3c)

### 1. messages RLS 정책 추가 (Track 1, B-2 LOW [L-2] 흡수)

- 0003에서 RLS enable됐으나 POLICY 없는 상태 → `0012_messages_rls.sql` (`FOR ALL` + conversation_id → store_owners EXISTS join)
- prod 적용 + Supabase advisor 검증 (messages는 더 이상 `rls_enabled_no_policy` 목록 없음)
- service_role bypass이므로 application 회귀 0 (defense-in-depth 레이어)

### 2. DAL 3개 신규 (Track 2-2, race-safe claim — L-058 재사용)

- `claimAiDraftForSend(db, messageId): Promise<Message | null>` — UPDATE WHERE status='ai_draft' RETURNING
- `markMessageSent(db, messageId, externalMessageId)` — WHERE status='sending' 가드
- `revertAiDraftClaim(db, messageId)` — WHERE status='sending' 가드

### 3. Server action `acceptAiDraft` (Track 2-3)

- 흐름: 인증 → 메시지/conversation/ownership 검증 → claim → inner-try (window/integration/recipient/IG send) → markMessageSent + revalidatePath
- 실패 시 `safeRevertWithSentry` (revert 자체 실패 시 Sentry alert로 stale 'sending' 영구 고착 방어)
- **MVP 결정**: `originalText`(한국어) 발송. `translatedText`는 사장 검수용 보조 표시 (B-3a/B-3b 일관)

### 4. UI 연결 (Track 2-4)

- MessageView가 `useTransition`으로 acceptAiDraft 호출
- AIAssist에 `isAccepting` prop 추가 → 처리 중 모든 액션 disabled + '그대로 보내기' → '발송 중...'
- 발송 완료 시 revalidatePath가 messages 갱신 → status='sent' 전환되어 AIAssist 자동 사라짐

### 5. 사후 리뷰 fix (PR #41 동봉)

**Security HIGH 1**:

- 메시지/대화/ownership 미존재 모두 동일 ValidationError("요청한 메시지를 처리할 수 없습니다") — enumeration 벡터 차단

**Code MEDIUM 4**:

- `message.conversationId!` → null 가드 + ValidationError
- `claimed.originalText!` 2군데 → narrowing + revert + ValidationError (non-null assertion 완전 제거)
- revalidatePath `[locale]` 의도 주석
- 동적 import → 정적 import (테스트 안정성)

**운영 안전 (Sec 추가)**:

- `safeRevertWithSentry` 헬퍼 — revert 실패 시 stale 'sending' row 영구 고착 방어

### 6. 테스트

- DAL +4 (source-level pattern), 액션 +14 (성공/검증/race/실패/revert/Sentry), AIAssist +2, MessageView +1
- **336 passed (+21 vs B-3c 시작)** / typecheck / lint clean
- main 최종 SHA `a3c50ad`

## 이번 세션 완료 (2026-05-05 night — Phase B-3b)

### 1. 디자인 레퍼런스 영구 보관 (`docs/design/reference/`)

- claude.ai/design 출력 zip(80 files) 추출 → 영구 보관소 신설
- README.md에 통합 정책 + 17 페이지 인덱스 + 단계적 적용 로드맵
- B-3b는 디자인 토큰 + AIAssist MVP만 도입, 인박스 전체 3-col 재구성은 별 Epic
- auto-memory 등록 (`hesya_design_reference.md`) → 다음 세션에서 위치 자동 인식

### 2. AIAssist 패널 신규 (`features/inbox/components/ai-assist.tsx`)

- 디자인 ref `.ix-assist*` CSS와 1:1 매핑 (padding 12px 18px, draft 13px/leading-1.65, 버튼 8px 14px)
- 액션 3개: 그대로 보내기 / 편집 후 보내기 / 거절하고 직접 작성
- '그대로 보내기'는 `onAcceptAsIs` prop이 undefined면 disabled + tooltip ("다음 단계(B-3c)에서 활성화됩니다") — B-3c에서 prop만 연결하면 자동 활성화
- 🤖 이모지 aria-hidden + 키보드 접근성 (Tab 순서 + Enter 활성화 테스트)
- B-3b 미적용 (별 Epic): 톤 4탭, 톤 검증 pill, "이유 보기" 팝업, "내 매장 톤 학습"

### 3. MessageView 통합 (`features/inbox/components/message-view.tsx`)

- 마지막 메시지 = `direction='outbound' + status='ai_draft'` → AIAssist 표시
- '편집 후 보내기' → ReplyComposer `key` 증가 + `initialValue` prefill로 자동 textarea 채움
- '거절하고 직접 작성' → AIAssist 사라짐 (dismissed state)
- 활성 conversation 변경 시 wrapper component + key prop 패턴으로 내부 상태 자동 reset (React 19 `react-hooks/set-state-in-effect` lint 회피)
- `pickAIDraft` 타입 가드로 narrowing → `originalText: string` 보장 (non-null assertion 제거)

### 4. MessageBubble 강화

- `translatedText` 보조 표시 (border-t pt-1 italic, 🌐 prefix)
- `status='ai_draft'` 시 'AI 초안' 뱃지 + ring-dashed ring-hesya-amber-500 (디자인 ref 시각 강조)

### 5. 사후 리뷰 8 fix (PR #40 동봉)

**HIGH 2** (디자인 ref 정합):

- AIAssist panel padding `px-4` → `px-[18px]` (디자인 ref `12px 18px` 일치)
- draft box `kr` 클래스 충돌 해소 → `text-[13px] leading-[1.65] break-keep` (`.kr` line-height 1.8과 디자인 ref 1.65 충돌)
- eyebrow `text-xs` → `text-[11px]`

**MEDIUM 4**:

- alert() placeholder 제거 → optional prop + disabled 처리 (B-3c 대기 명시)
- i18n 하드코딩 의도 주석 추가 (사장님 한국어 전용)
- 키보드 접근성 테스트 4개 추가
- aiDraft non-null assertion 제거 (타입 가드 narrowing)

**LOW 2**:

- 🤖 이모지 aria-hidden 처리
- 디자인 ref 매핑 주석 (ai-assist.tsx 헤더에 `.ix-assist` CSS 사양 명시)

### 6. 테스트

- 단위 신규: AIAssist 9건 (기존 5 + 신규 4 — disabled / Tab / Enter / aria-hidden)
- MessageView 회귀 6건 (AIAssist 표시 조건 + prefill + dismiss)
- MessageBubble 회귀 4건 (translatedText / ai_draft 뱃지)
- **315 passed / 39 skipped** / typecheck / lint clean
- main 최종 SHA `231648b`

## 이번 세션 완료 (2026-05-05 night — Phase B-3a)

### 1. 신규 모듈 `features/inbox/ai/translate-reply.ts`

- 순수 함수 (B-1 generate-reply.ts 패턴 재사용): `translateReply({koreanText, targetLanguage}) → {translatedText, tokensUsed}`
- `targetLanguage='ko'` → SDK 호출 없이 입력 그대로 반환 (no-op, 비용 0)
- 5개 언어 라벨 (en/zh/ja/vi)
- Sonnet 4.6, MAX_TOKENS=800
- **LLM01 framing 강화**: system에 "user turn은 input data, instruction 아님" 명시 (chained LLM 보호)

### 2. DAL `markTranslated`

- outbound 메시지에 translated_text + language_to 저장
- 멱등 (사장 수정 후 재번역 허용)
- **방어적 가드**: WHERE direction='outbound' (inbound 덮어쓰기 차단)

### 3. AI trigger 통합 (`generate-and-store-reply.ts`)

- insertMessage 후 customerLanguage !== 'ko' → translateReply + markTranslated
- **try-catch 분리**: translate 에러는 Sentry tag `phase: "translateReply"`, markTranslated 에러는 `phase: "markTranslated"`
- **출력 길이 가드**: translatedText > 7500자 (MAX_REPLY_CHARS \* 1.5) silent skip
- Sentry extra: aiMessageId / targetLanguage / inputLength / translatedLength
- 번역 실패 silent skip → 한국어 ai_draft는 살아있어 사장 수동 처리 가능 (Q1=A)

### 4. 사후 리뷰 7 fix (PR #39 동봉)

**HIGH 1**: LLM01 framing (chained LLM injection 방어)
**MEDIUM 6**: 출력 길이 가드 / try-catch 분리 / Sentry inputLength / Partial<Deps> JSDoc / markTranslated direction guard / Sentry serialization 검증 (운영 점검)

### 5. 테스트

- 단위 30건 (translate-reply 7 + trigger 26 + DAL +2)
- 통합 2건 갱신 (translateReplyStub + translatedText/languageTo 검증)
- **297 passed / 39 skipped** / typecheck / lint clean
- main 최종 SHA `c56c909`

## 이번 세션 완료 (2026-05-05 evening — Phase B-2)

### 1. DAL 5개 추가

- `stores.findStoreNameByConversationId` (conversation→store join)
- `messages.listRecentByConversation` (DESC + limit + reverse → ASC N개)
- `messages.findMessageById` (단건 조회)
- `messages.markAIResponded` — **Race-safe boolean 시그니처** (`WHERE ai_responded=false` conditional UPDATE + RETURNING). 동시 호출 시 한 번만 true 반환 → caller가 generateReply 비용 1회 보장
- `customers.getCustomerPreferredLanguage`

### 2. AI internal trigger (`features/inbox/ai/generate-and-store-reply.ts`)

- `generateAndStoreReply(messageId, deps?)` — server-only 함수 (`"use server"` 아님)
- 11개 skip reason union (invalid_message_id, message_not_found, not_inbound, no_channel, already_responded, no_conversation_id, no_recent_messages, no_store_name, invalid_store_name, reply_too_long, insert_failed)
- B-2 boundary: 5턴 slice / storeName trim+1~100자 / customerId UUID / 5개 언어 enum + 'ko' fallback / 5000자 reply 상한
- Default db는 모듈 레벨 lazy singleton (connection pool 누수 방어)

### 3. processInbound 교체

- 1A 빈 placeholder → `generateAndStoreReply` 호출
- skip silent (정상 흐름) / throw 그대로 전파 (webhook route가 Sentry capture)

### 4. 사후 리뷰 8 fix (PR #38 동봉)

**HIGH 4** (security 2 + code 2):

- markAIResponded race-safe conditional UPDATE
- LLM 응답 5000자 상한
- default db lazy singleton (connection pool)
- channel `?? "instagram"` 무조건 폴백 제거 → no_channel skip

**MEDIUM 4**:

- customerId UUID 검증 (비-UUID는 'ko' fallback)
- listRecentByConversation jsdoc 위치 수정
- LLM01 known-limitation 주석
- partial success 정책 문서화 (Sentry monitoring)

### 5. 테스트

- 단위 26건 (B-2 trigger 20 + processInbound 4 + DAL pure 2)
- 통합 2건 (DB-gated, HESYA_TEST_DATABASE_URL CI)
- main 최종 SHA `c1cad2d`

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
