# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook).
> ⚠️ **자기평가 갱신 규칙 (L-082)**: % 표시는 "코드 머지 완료"가 아닌 **"사용자 입장 e2e 시연 가능 여부"**로만 정의. AI 자체 평가 → 객관적 측정(grep / test count / subagent 진단 / 실제 시연)으로 교차 검증 의무.

## 현재 위치 (2026-05-10 세션 2 종료 시점)

- **Phase**: **Phase 1-γ.2.3.1 완료** (γ.1 100% + γ.2.1~2.2 완료 + γ.2.3 디자인 정합성 1/5 단계 — Inbox 좌측 thread list)
- **시나리오**: B (풀 P0 베타 — PRD 원안)
- **베타 5곳 출시 가능 시점**: 약 7~8주 (γ.2.3 5-split 중 1/5 완료 → 4단계 + γ.3 채널 확장 + δ Epic 2/3 + ε Epic 4 + ζ 베타 매칭)
- **세션 2 머지**: [#105](https://github.com/jaydenjoo/hesya/pull/105) (γ.2.3.1 inbox 디자인) + `5c13f71` (L-091 docs main 직접)
- **세션 2 시연**: pnpm dev:demo + Playwright로 inbox 좌측 thread list 시각 검증 — active 좌측 amber bar / avatar 4색 cycling / channel icon ring / row separator peach-100 모두 reference 일치 확인
- **누적 교훈**: L-001 ~ **L-091** (세션 2 +1: L-091 Claude Code shell `ANTHROPIC_API_KEY=""` inject)

## P0 Epic 객관 완성도 (γ.2.3.1 머지 반영)

| Epic                | 직전 % | 본 세션 %         | 갭                                                                           |
| ------------------- | ------ | ----------------- | ---------------------------------------------------------------------------- |
| E1 인박스           | 65%    | **67%** ↑         | 디자인 정합성 1/5 단계 (좌측 thread list) 시연 통과. WhatsApp/카카오/LINE 0% |
| **E2 결제 위젯** 🔴 | 17%    | **17%** (변동 X)  | DB 스키마만. Stripe/Alipay/WeChat 코드 0건                                   |
| **E3 예약 시스템**  | 17%    | **17%** (변동 X)  | DB 스키마만                                                                  |
| **E4 대시보드**     | 8%     | **8%** (변동 X)   | Recharts 미설치                                                              |
| E9 KYC 🔴           | 92%    | **92%** (변동 X)  | γ.2.1 admin 클릭 e2e + γ.2.2 audit log + edge test 누적                      |
| **E12 관리자** 🔴   | 100%   | **100%** (변동 X) | E12-1~10 모두 완료 + 통합 E2E 통과                                           |

**P0 평균: 50% → 50.3%** (E1 +2, 다른 Epic 변동 없음). γ.2.3 5-split 진행에 따라 E1 단계적 상승 예정.

> ⚠️ E12-9 매장 해지는 e2e 통과 (owner 요청 → 취소 + admin 큐 cancelled). γ.2.1 KYC→inbox은 admin 클릭 + DB 검증 통과. **prod 시나리오 (실 OAuth 로그인 + 실 IG webhook 수신)**은 다음 phase에서 검증.

## 본 세션 2 (2026-05-10) — Phase 1-γ.2.3.1

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

## 다음 세션 가이드 — Phase 1-γ.2.3.2 (Inbox 메인 thread + draft review)

📄 **상세 plan**: `docs/Plan-v2-scenario-B.md`

### 다음 세션 첫 행동

1. PROGRESS.md 본 파일 확인 (현재 위치 = γ.2.3.1 머지 완료, γ.2.3.2 진입 대기)
2. **L-091 확인** docs/learnings.md — Claude Code shell이 `ANTHROPIC_API_KEY=""` inject. dev 띄울 때 `unset ANTHROPIC_API_KEY &&` prefix 의무.
3. **PR #105 prod 배포 검증** — main 머지 후 자동 배포, L-089 적용 시 명시적 Vercel Production redeploy 검증 권장
4. γ.2.3.2 plan v1 작성 (Pre-Plan Inventory 의무):
   - 작업 영역: `apps/web/src/features/inbox/components/{thread-header,message-view,message-bubble,inbox-shell}.tsx`
   - reference: `docs/design/reference/inbox-app.jsx` (Col 2 thread + draft review 영역) + `inbox.css` (`.ix-thread-head` / `.ix-msg-*` / `.ix-draft-*`)
   - draft review 패널: `apps/web/src/features/inbox/components/` 또는 `apps/web/src/lib/inbox/`에서 기존 draft review 컴포넌트 grep

### Phase 1-γ.2.3 — 디자인 정합성 5-split (잔여 4단계, 1~1.5주)

`docs/design/reference/` 80 files (claude.ai/design 출력) 기반 단계적 적용:

| 단계        | 영역                                                        | 예상  | 상태        |
| ----------- | ----------------------------------------------------------- | ----- | ----------- |
| γ.2.3.1     | Inbox 좌측 thread list + 헤더 디자인 토큰 적용              | 1일   | ✅ 완료     |
| **γ.2.3.2** | **Inbox 메인 thread + draft review 패널**                   | 1일   | **🔜 다음** |
| γ.2.3.3     | Sign-in / KYC submit / KYC pending 페이지                   | 1일   | ⏳ 대기     |
| γ.2.3.4     | Admin 6개 큐 (분쟁/결제이상/AI정확도/API정책/해지/KYC) 통일 | 1.5일 | ⏳ 대기     |
| γ.2.3.5     | Landing / 마케팅 / 디자인 시스템 데모 페이지                | 1일   | ⏳ 대기     |

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

없음. Phase 1-γ.2.3.1 완료 → γ.2.3.2 진입 가능.

## 마지막 업데이트

- 날짜: 2026-05-10 (세션 2)
- 세션 2 작업 시간: ~3h (γ.2.3.1 인벤토리 + 구현 + 시각 검증 + L-091 진단 + docs)

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
