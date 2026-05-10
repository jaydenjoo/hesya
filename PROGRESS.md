# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook).
> ⚠️ **자기평가 갱신 규칙 (L-082)**: % 표시는 "코드 머지 완료"가 아닌 **"사용자 입장 e2e 시연 가능 여부"**로만 정의. AI 자체 평가 → 객관적 측정(grep / test count / subagent 진단 / 실제 시연)으로 교차 검증 의무.

## 현재 위치 (2026-05-10 세션 3 종료 시점)

- **Phase**: **Phase 1-γ.2.3.3 완료** (γ.1 100% + γ.2.1~2.2 완료 + γ.2.3 디자인 정합성 3/5 단계 — Inbox 좌측 thread list + Inbox 메인 thread/draft + Onboarding sign-in/KYC submit/pending)
- **시나리오**: B (풀 P0 베타 — PRD 원안)
- **베타 5곳 출시 가능 시점**: 약 6~7주 (γ.2.3 5-split 중 3/5 완료 → 2단계 + γ.3 채널 확장 + δ Epic 2/3 + ε Epic 4 + ζ 베타 매칭)
- **세션 3 머지**: [#106](https://github.com/jaydenjoo/hesya/pull/106) γ.2.3.2 (`d041080`) + [#107](https://github.com/jaydenjoo/hesya/pull/107) γ.2.3.3 (`098d9f0b`)
- **세션 3 시연**:
  - γ.2.3.2: `unset ANTHROPIC_API_KEY && pnpm dev:demo` + Playwright로 inbox Col 2 시각 검증 — customer 좌하 4px 꼬리 / owner 우하 4px 꼬리 / 시간 버블 외부 / draft panel slide-in / amber primary buttons 모두 reference 일치
  - γ.2.3.3: sign-in 페이지 회귀 캡처 (Run your salon hero / ticker 01/04 / Google 로그인 매칭). KYC submit/pending은 demo 미인증 user 부재로 직접 접근 불가 → 단위 테스트 className 검증으로 갈음 (L-082 시연 prerequisite 한계 명시 적용)
- **누적 교훈**: L-001 ~ **L-091** (세션 3 추가 항목 없음 — 모든 작업이 plan v1 명시 한계 안에서 진행)

## P0 Epic 객관 완성도 (γ.2.3.3 머지 반영)

| Epic                | 직전 % | 본 세션 %         | 갭                                                                                           |
| ------------------- | ------ | ----------------- | -------------------------------------------------------------------------------------------- |
| E1 인박스           | 67%    | **71%** ↑↑        | 디자인 정합성 2/5 단계 (좌측 + Col 2 메인 thread + draft) 시연 통과. WhatsApp/카카오/LINE 0% |
| **E2 결제 위젯** 🔴 | 17%    | **17%** (변동 X)  | DB 스키마만. Stripe/Alipay/WeChat 코드 0건                                                   |
| **E3 예약 시스템**  | 17%    | **17%** (변동 X)  | DB 스키마만                                                                                  |
| **E4 대시보드**     | 8%     | **8%** (변동 X)   | Recharts 미설치                                                                              |
| E9 KYC 🔴           | 92%    | **93%** ↑         | γ.2.3.3 KYC submit/pending Hesya 토큰 정합성 (단위 테스트 갈음). 시연 prerequisite 한계 ⚠️   |
| **E12 관리자** 🔴   | 100%   | **100%** (변동 X) | E12-1~10 모두 완료 + 통합 E2E 통과                                                           |

**P0 평균: 50.3% → 51%** (E1 +4, E9 +1 누적). γ.2.3 5-split 잔여 2단계(γ.2.3.4 admin 6큐 / γ.2.3.5 landing/마케팅) 진행에 따라 E1/E9/E12 시각 정합성 추가 상승 예정.

> ⚠️ E12-9 매장 해지는 e2e 통과 (owner 요청 → 취소 + admin 큐 cancelled). γ.2.1 KYC→inbox은 admin 클릭 + DB 검증 통과. **prod 시나리오 (실 OAuth 로그인 + 실 IG webhook 수신)**은 다음 phase에서 검증.
> ⚠️ E9 +1은 시각 정합성만 (단위 테스트 className 기반). KYC submit/pending demo 시연은 미인증 user seed 보강 후 가능 — 별 PR 후보.

## 본 세션 3 (2026-05-10) — Phase 1-γ.2.3.2 + γ.2.3.3

### 머지된 PR

| #                                                   | Task                                                                | 상태                 |
| --------------------------------------------------- | ------------------------------------------------------------------- | -------------------- |
| [#106](https://github.com/jaydenjoo/hesya/pull/106) | γ.2.3.2 inbox 메인 thread + draft review 디자인 정합성 (5종 시그널) | ✅ 머지 (`d041080`)  |
| [#107](https://github.com/jaydenjoo/hesya/pull/107) | γ.2.3.3 KYC submit/pending Hesya 토큰 + sign-in 회귀 검증           | ✅ 머지 (`098d9f0b`) |

### Phase 1-γ.2.3.2 — Inbox 메인 thread + draft review (Col 2)

reference `docs/design/reference/inbox-app.jsx` Col 2 영역 시각 시그널 5종 매핑. **DB/로직 변경 0건**.

1. **ThreadHeader** (.ix-thread-head): h-16 + 36px avatar + peach-100 border + meta row (11px gray-500). Badge → span(meta pattern).
2. **MessageView stream** (.ix-stream): `bg-hesya-peach-50` + `px-5 py-4 gap-2.5` (message-list).
3. **MessageBubble** (.ix-msg/.ix-bubble): inbound peach-50 → peach-100, max-w 75% → 78%, asymmetric corner (outbound 우하 4px / inbound 좌하 4px), `<time>` 버블 외부로 분리, bubble-trans border 색 정합 (customer navy/10, owner white/25).
4. **DraftReviewPanel** (.ix-assist): `motion-safe slide-in-from-bottom-2 220ms` 추가, 승인+전송 emerald-500 → amber-500 (Hesya 디자인 토큰 정합 + primary action), 무시 ghost 명시적 bg-transparent.
5. **vitest.setup.ts** N8N_WEBHOOK_SECRET stub 추가 (env schema 동기화 — 본 PR 검증 차단 방지).

10 files / +157/-43. 신규 시각 시그널 단위 테스트 8개 추가.

### Phase 1-γ.2.3.3 — Onboarding sign-in/KYC submit/KYC pending

3 페이지 묶음:

- **Sign-in (변경 0줄)**: 이미 reference `login-store-app.jsx` 80%+ 매칭 (첫 40 클래스 동일). 차이 ~159줄은 의도된 누락 영역 (Hesya는 Google OAuth 단일 → email/password form scope 외). Playwright 회귀 캡처로 회귀 없음 확인.
- **KYC submit page + KycForm**: Hesya 토큰 0% → 100%. 검은 버튼(bg-black) → amber-500 primary, generic input border → peach-200 + amber-500 focus ring, fieldset peach-50/60 + peach-200 border, kr Pretendard 라벨.
- **KYC pending page + PendingStatus**: 5상태별 시각 분리 StatusCard (warn/success/error/neutral) — manual_review(amber-500/peach-100), auto_approved(emerald-500/emerald-50 + amber primary CTA), rejected(red-500/red-50), pending(peach-200/peach-50), session_expired(warn + ghost CTA). 공통: rounded-2xl + border-l-4 + 아이콘 9x9 원형.

6 files / +211/-32. 신규 시각 시그널 단위 테스트 7개 (kyc-form 3 + pending-status 4).

### 시연 prerequisite 한계 (L-082) — KYC submit/pending

demo 환경에 미인증 user seed 부재 → 직접 접근 시 sign-in redirect. **단위 테스트 className 기반 검증으로 갈음**. demo seed 보강은 별 PR 후보 (γ.2.3 후속 또는 ζ 단계).

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors (양 PR)
- `pnpm lint` ✅ 0 issues
- `pnpm --filter @hesya/web exec vitest run src/features/inbox` ✅ 276 passed (γ.2.3.2)
- `pnpm --filter @hesya/web exec vitest run src/features/onboarding` ✅ 20 passed (γ.2.3.3)
- 누적 신규 시각 시그널 unit tests 15개 (γ.2.3.2: 8 + γ.2.3.3: 7)
- 시각 검증:
  - γ.2.3.2: Playwright /ko/store/inbox + thread 선택 + Col 2 캡처 ✅ reference 매칭 확인
  - γ.2.3.3: Playwright /ko/sign-in 회귀 캡처 ✅ reference 매칭 유지. KYC submit/pending은 redirect로 단위 테스트 갈음

### Vercel 배포

- PR #106 `d041080` → main 자동 배포 ✅ (deployment ID `EXVxdjXi7x233PgGPhNNTd5NZ8j4`)
- PR #107 `098d9f0b` → main 자동 배포 (CI 직후 자동 배포 진행)

## 직전 세션 2 (2026-05-10) — Phase 1-γ.2.3.1

### 머지

| #                                                   | Task                                                              | 상태                |
| --------------------------------------------------- | ----------------------------------------------------------------- | ------------------- |
| [#105](https://github.com/jaydenjoo/hesya/pull/105) | γ.2.3.1 inbox 좌측 thread list 디자인 정합성 (5종 시그널)         | ✅ 머지 (`26dc381`) |
| `5c13f71`                                           | docs L-091 추가 + PROGRESS.md "알려진 환경 이슈" 정정 (main 직접) | ✅ push 완료        |

### Phase 1-γ.2.3.1 — Inbox 좌측 thread list/item 디자인 정합성

- 5종 디자인 시그널 적용 (reference `docs/design/reference/inbox-app.jsx` Col 1 + `inbox.css` `.ix-thread-row`):
  1. **active 좌측 3px amber bar** (`before:` pseudo) — 현재 thread 시각 강조
  2. **avatar 4색 cycling** (peach-200 / peach-100 / peach-50 / trust-rose, customerId 해시 결정적)
  3. **avatar 38px + channel icon 18px + peach-50 ring** — reference size/border 매칭
  4. **unread bg subtle** (`bg-hesya-peach-100/40` Tailwind v4 alpha modifier) — 읽지 않은 thread 시각 차이
  5. **row separator peach-100** (옅음) — reference border-bottom과 일치
- thread-item.tsx ~35줄 / thread-list.tsx 2줄 / thread-item.test.tsx +50줄(4 신규 테스트)
- 시각 검증 통과: pnpm dev:demo + Playwright로 active state + 우측 ThreadView 정상 작동 캡처
- **범위 OUT** (4원칙 2번 — 데이터 한계 / 별 PR 약속 유지): Filter pill / 채널 chip / Search bar / Foot tag (AI 대기·urgent·done) / ThreadHeader (Col 2)

### L-091 — Claude Code shell 환경 진단 (세션 핵심 발견)

- **증상**: Claude Code 안에서 `pnpm dev:demo` 실행 시 zod 2 에러 (ANTHROPIC_API_KEY format + N8N_WEBHOOK_SECRET undefined)
- **근본 원인**: Claude Code CLI host가 subshell에 `ANTHROPIC_API_KEY=""` (빈 문자열) 자동 inject → `@next/env`는 process.env에 이미 있는 키 skip → .env.local의 정상 값 무력화
- **해결**: `unset ANTHROPIC_API_KEY && pnpm dev:demo` (한 줄)
- **메타**: PROGRESS.md "알려진 환경 이슈" 섹션의 _"Jayden .env.local의 sk-ant- prefix 형식 점검 필요"_ 기재는 오진단. Jayden 환경은 정상 (`sk-ant-api03...` 108자), Claude Code shell이 원인.
- **세션 2 추가 메모리**: `env_claude_code_shell_anthropic_key.md` (project type) — 향후 모든 Hesya 세션에서 인지

### 검증

- `pnpm --filter @hesya/web type-check` ✅ 0 errors
- `pnpm lint` ✅ 0 issues
- thread-item 12 tests + thread-list/empty/header/shell 15 tests = 27 inbox tests ✅
- Tailwind v4 alpha modifier (`bg-hesya-peach-100/40`) ✅ 컴파일 + 렌더 정상
- Vercel Preview build ✅ — prod 빌드 환경에서도 컴파일 통과
- 시각 검증 ✅ — Playwright로 active 좌측 amber bar / avatar 4색 cycling 캡처 확인

## 본 세션 1 (2026-05-10) — Phase 1-γ.1.5 ~ γ.2.2 일괄 진행

### 머지된 PR / 커밋 (5건)

| #                                                   | Task                                                         | 상태              |
| --------------------------------------------------- | ------------------------------------------------------------ | ----------------- |
| `50f363d`                                           | Housekeeping (데모 PNG 7개 정리 + .gitignore 보강)           | ✅ main 직접 push |
| [#101](https://github.com/jaydenjoo/hesya/pull/101) | γ.1.5 E12-9 매장 해지·데이터 삭제 (soft-delete + 30일 grace) | ✅ 머지 (8819487) |
| [#102](https://github.com/jaydenjoo/hesya/pull/102) | γ.1.6 Epic 12 통합 E2E (admin 6개 큐 순회)                   | ✅ 머지 (513eab7) |
| [#103](https://github.com/jaydenjoo/hesya/pull/103) | γ.2.1 KYC→inbox 통합 E2E (admin 진짜 클릭 승인 + draft 전송) | ✅ 머지 (369d125) |
| [#104](https://github.com/jaydenjoo/hesya/pull/104) | γ.2.2 NTS audit log + edge case 보강 (6 unit tests)          | ✅ 머지 (af97fc7) |

### Phase 1-γ.1.5 — 매장 해지·데이터 삭제 (E12-9)

- 0025 manual SQL 마이그: `stores.deleted_at` + `store_deletion_requests` 테이블
- **FK ON DELETE SET NULL + `store_name_snapshot`** 패턴 — cascade 후에도 audit trail 보존
- DAL: `requestStoreDeletion / cancelStoreDeletion / listDeletionRequestsForAdmin / purgeExpiredStoreDeletions`
- Server Actions: owner self-request + admin admin-request (rate-limit 적용)
- Cron: `/api/cron/cascade-delete-expired-stores` (timing-safe Bearer, PII 미반환)
- Webhook routing block: `findStoreByExternalAccount`에 `isNull(stores.deletedAt)` 추가 → soft-deleted 매장으로 IG 메시지 라우팅 차단
- e2e 통과: owner 요청 → grace 카운트 → 취소 → admin 큐 cancelled

### Phase 1-γ.1.6 — Epic 12 통합 E2E

- `e2e/epic-12-integration.spec.ts` 단일 spec: admin 6개 큐 순회 (분쟁 → 결제이상 → AI정확도 → API정책 → 매장해지 → KYC)
- 시드: 1 admin + 1 store + 분쟁 1 + API alert 1 + 해지 요청 1 → 6 페이지 모두 헤딩 + row 검증
- E12 75% → 100%

### Phase 1-γ.2.1 — KYC→inbox 통합 E2E

- `e2e/kyc-to-inbox-flow.spec.ts`: phase-1-beta가 cover 못 하던 갭 (admin DB update 시뮬 → admin 진짜 클릭 승인)
- 시나리오 8단계: manual_review seed → admin 큐 → 상세 → 승인 클릭 → DB `auto_approved` 검증 → IG integration seed → owner inbox → "승인+전송" → DB `sent`
- E9 KYC 88% → 92%

### Phase 1-γ.2.2 — NTS audit log + edge case

- `kyc-log-repo.ts`: KycLogRepo (audit log immutable trail, PII 2차 저장 회피 — 성공 시 `extracted` 미포함, 실패 시 error code만)
- `nts-client.test.ts`: 6 unit tests (5xx 3회 재시도, 4xx 즉시 fail, network reject, 200 + invalid JSON, 200 + data[] empty, 정상 흐름)
- `actions.ts`: `extractOcrFromLicenseAction` 실패 path도 audit log 기록
- 보안 review (subagent): NO-GO HIGH (PII 2차 저장) → 정제 → GO. L-090 (gitleaks placeholder) 신규.

### Vercel/Env 진단 — 본 세션 추가 교훈 (L-088 ~ L-090, L-087 정확화)

- **L-088**: Vercel Dashboard env 등록 후 마스킹 (Encrypted/Sensitive Sensitive)은 **정상 동작**. UI에서 값이 사라진 것처럼 보여도 저장은 완료된 상태.
- **L-089**: env 갱신만으로는 자동 redeploy 안 됨 — Vercel Dashboard에서 **수동 redeploy 의무**.
- **L-090**: gitleaks `generic-api-key` entropy 임계는 ≈3.7+ → 테스트 fake key는 `REPLACE_ME_FAKE_*` prefix로 entropy < 3.5 유지.
- **L-087 정확화**: `openssl rand -base64 32`는 32 byte raw → **44 char base64 출력**. Vercel `min(32)` Zod 검증은 char count 기준 → 44 char OK.

### 검증

- `pnpm type-check` ✅ tsc 0 errors (모든 PR)
- `pnpm lint` ✅ 0 issues
- `pnpm --filter @hesya/web test` ✅ 본 세션 신규 케이스 모두 통과 (NTS 6 unit + E12 6큐 통합 + γ.2.1 8단계)
- e2e: store-deletion ✅ / epic-12-integration ✅ / kyc-to-inbox-flow ✅
- Vercel Production: PR #100 머지 후 `4387501` success (이전 세션 기록), 본 세션 PR은 모두 main 머지만 — **수동 redeploy 미실행** (L-089 적용 — 필요 시 다음 세션 첫 행동에서 redeploy)

## 다음 세션 가이드 — Phase 1-γ.2.3.4 (Admin 6개 큐 디자인 통일) 또는 demo seed 보강

📄 **상세 plan**: `docs/Plan-v2-scenario-B.md`

### 다음 세션 첫 행동

1. PROGRESS.md 본 파일 확인 (현재 위치 = γ.2.3.3 머지 완료, γ.2.3.4 또는 후속 진입 대기)
2. **L-091 확인** docs/learnings.md — Claude Code shell이 `ANTHROPIC_API_KEY=""` inject. dev 띄울 때 `unset ANTHROPIC_API_KEY &&` prefix 의무.
3. **PR #107 prod 배포 검증** — main 머지 후 자동 배포 확인 (Vercel `5GGEdUvC6XxnVTma9dv3pSBVXT58` deployment 또는 후속)
4. **분기 결정**:
   - **(A) γ.2.3.4 admin 6큐 디자인 통일** (1.5일 예상) — 분쟁/결제이상/AI정확도/API정책/해지/KYC. reference: `Hesya Admin KYC.html` + `admin-kyc.css` + `Hesya Admin Login.html` + `admin-login.css` 활용
   - **(B) demo seed 미인증 user 보강** (γ.2.3.3 후속, 0.5일) — KYC submit/pending 시연 가능화 (현재 단위 테스트 갈음 상태)
   - 권장 순서: (A) 먼저 → γ.2.3 5-split 마무리 후 (B)는 ζ 단계 통합 검증 시 처리
5. γ.2.3.4 plan v1 작성 (Pre-Plan Inventory 의무):
   - 작업 영역: `apps/web/src/app/[locale]/admin/{disputes,payments,ai-accuracy,api-policy-alerts,store-deletion-requests,kyc-test}/`
   - 6개 큐의 공통 list 패턴 식별 → 추상화 가능 여부 판단
   - reference: `docs/design/reference/admin-*.css` + admin-app.jsx (있는 경우)

### Phase 1-γ.2.3 — 디자인 정합성 5-split (잔여 2단계, 0.5~1주)

`docs/design/reference/` 80 files (claude.ai/design 출력) 기반 단계적 적용:

| 단계        | 영역                                                       | 예상  | 상태        |
| ----------- | ---------------------------------------------------------- | ----- | ----------- |
| γ.2.3.1     | Inbox 좌측 thread list + 헤더 디자인 토큰 적용             | 1일   | ✅ 완료     |
| γ.2.3.2     | Inbox 메인 thread + draft review 패널                      | 1일   | ✅ 완료     |
| γ.2.3.3     | Sign-in / KYC submit / KYC pending 페이지                  | 1일   | ✅ 완료     |
| **γ.2.3.4** | **Admin 6개 큐 (분쟁/결제이상/AI정확도/API정책/해지/KYC)** | 1.5일 | **🔜 다음** |
| γ.2.3.5     | Landing / 마케팅 / 디자인 시스템 데모 페이지               | 1일   | ⏳ 대기     |

### Phase 1-γ.3 — Epic 1 채널 확장 (1.5~2주)

WhatsApp / 카카오 / LINE adapter + 통합 시연.

### Phase 1-δ — Epic 2 결제 + Epic 3 예약 (3~4주)

Stripe + Alipay + WeChat + 한국은행 환율 + 다국어 예약 페이지.

### Phase 1-ε — Epic 4 대시보드 (1주)

Recharts KPI 12개.

### Phase 1-ζ — 통합 검증 + 베타 매장 매칭 (1~2주)

demo.hesya.com Phase 2 도입 + 베타 1~2곳 onboarding.

### 베타 5곳 출시 — 약 7~9주 후

## 차단 요소

없음. Phase 1-γ.2.3.3 완료 → γ.2.3.4 진입 가능. (선택: demo seed 보강 후 KYC 시연 가능화)

## 마지막 업데이트

- 날짜: 2026-05-10 (세션 3)
- 세션 3 작업 시간: ~5h (γ.2.3.2 + γ.2.3.3 인벤토리 + 구현 + 시각 검증 + 양 PR 머지)
- 세션 3 누적 머지: 2 PRs (#106 γ.2.3.2 / #107 γ.2.3.3)
- 세션 3 누적 변경 (γ.2.3.2 + γ.2.3.3 합산): 16 files / +368/-75 / 신규 시각 시그널 unit tests 15개

## 컨텍스트 관리 강화 — 누적 (L-082 → L-091)

1. **PROGRESS 자기평가는 e2e 시연 기준** (L-082)
2. **destructive CLI 명령 글로벌 정밀화** (L-083)
3. **subagent 진단 의무화**: P0 Epic 작업 전 senior-engineer + code-explorer
4. **PR 같은 영역 3개+ 누적 시 회고 trigger** (L-082)
5. **새 env 도입 PR 5-layer → 7-layer 정합성 의무** (L-084 → L-087 → 세션 1 L-088/089 추가)
6. **시연 prerequisite 3-layer 격리 검증 의무** (L-085)
7. **PR 머지 직전 main HEAD 검증 의무** (L-086 — squash merge timing fix 누락 차단)
8. **새 env 도입은 Vercel Production+Preview+Development 3환경 등록 + 수동 redeploy** (L-087 + L-089)
9. **Vercel UI Encrypted/Sensitive 마스킹은 정상 동작** (L-088)
10. **gitleaks 우회는 `REPLACE_ME_FAKE_*` placeholder 패턴** (L-090)
11. **audit log에 PII 2차 저장 금지** (γ.2.2 보안 review fix)
12. **Claude Code shell이 `ANTHROPIC_API_KEY=""` inject — dev 띄울 때 `unset` prefix 의무** (L-091 신규, 세션 2)
13. **PROGRESS.md "알려진 환경 이슈" 추측 진단 금지** (L-091 메타 — 본 항목 정정 trigger)

## 알려진 환경 이슈 (다음 세션 scope 밖)

- **Claude Code shell ANTHROPIC_API_KEY 빈 값 inject** (L-091): 정상 터미널 영향 X, Claude Code 안 dev 시작 시 `unset ANTHROPIC_API_KEY` prefix 의무. 영구 가드는 `dev-demo.sh` 첫 줄 추가 후속 PR 후보.
- 베타·prod 출시 직전 일괄 secret rotation 예정 (N8N_WEBHOOK_SECRET 임시값 포함)
- Vercel Production 세션 1 PR (#101~#104) + 세션 2 PR (#105) 자동 배포는 main 머지 후 진행되나, **L-089 적용 시 다음 세션에서 명시적 검증 권장**

## 관련 문서

- PRD: `docs/PRD.md` (v1.2)
- 개발 계획: `docs/DEVELOPMENT-PLAN.md` (v1.2 FINAL)
- Plan v2 상세: `docs/Plan-v2-scenario-B.md`
- 디자인 참조: `docs/design/reference/` (80 files, claude.ai/design 출력)
- 디자인 가이드: `docs/DESIGN-PLAN.md`
- 데모 가이드: `docs/demo-guide.md`
- ADR: `docs/DECISIONS.md`
- 교훈: `docs/learnings.md` (L-001~**L-091**)
- 글로벌 규칙: `~/.claude/CLAUDE.md` v3.2
- 인벤토리 절차: `~/.claude/rules/inventory-protocol.md`
- 프로젝트 규칙: `CLAUDE.md` (5-Layer 문서 구조)
