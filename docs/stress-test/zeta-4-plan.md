# Phase ζ.4 — E1 + E9 + E12 통합 Stress Test Plan

> **위치**: Plan v2 scenario-B Phase 1-ζ.4 — 베타 매장 onboarding (ζ.7) 직전 마지막 통합 검증.
> **목표**: 매장 5곳 × 50건/매장 = **250 동시 메시지** 부하를 1시간 내 처리 + p95 응답 시간 < 3분 + 결제 성공률 ≥ 95%.
> **현재 상태**: 본 문서 = scope · scenario 정의. 실제 부하 실행은 ζ.7 (베타 매장 onboarded) 이후. ζ.5 PostHog 이벤트 wire 완료 ([2026-05-19](#)) → 부하 결과 측정 인프라 준비됨.

## 대상 epic

| Epic | 영역          | ζ.4에서 검증할 시나리오                                  |
| ---- | ------------- | -------------------------------------------------------- |
| E1   | Inbox + AI    | inbound webhook → generate → ai_draft → accept/edit/send |
| E9   | KYC + 알림    | submit-kyc → admin approve/reject → owner 알림           |
| E12  | 분쟁/결제 SLA | dispute 생성 → SLA 추적 → admin 결정 → 환불/노쇼 처리    |

## 부하 시나리오 (4종)

### S1 — Inbound 폭주 (E1 RAG 검증)

- **시작 조건**: 5 매장 × 10 customer = 50 conversation. 매장 모두 `bot_mode=false` (사장 검수 모드).
- **부하**: 1시간 동안 250 inbound (5 매장 × 50건). 분당 ~4건/매장 (Phase 1 베타 5매장 1일 50건의 1시간 압축).
- **측정**:
  - `ai_draft_generated` 이벤트 수 (PostHog) — 목표 250건 (drop 5건 이하)
  - p95 `tokensInput + tokensOutput` (이벤트 properties) — 추세만, blocker 아님
  - Sentry error rate — < 1% (250건 중 2건 이하)
  - DB connection pool 누수 0 (Supabase 모니터링)

### S2 — Draft 검수 처리 (H1 핵심 지표)

- **시작 조건**: S1 완료 후 ai_draft 250건 누적.
- **부하**: 매장 5곳 사장이 동시에 30분간 처리 (accept 60% / edit 30% / skip 10% 분포).
- **측정**:
  - `ai_draft_accepted` + `ai_draft_edited` + `ai_draft_skipped` 합 = 250
  - `ai_draft_edited` / (`ai_draft_accepted` + `ai_draft_edited`) ≤ 50% — **PRD 핵심 지표 H1**
  - `message_sent`(`source=ai_draft_accept` + `source=ai_draft_edit`) 합 — 발송 성공률
  - IG send 실패 → Sentry capture rate < 1%
  - revert 후 재시도 패턴 작동 확인 (수동 sampling)

### S3 — KYC 큐 처리 (E9)

- **시작 조건**: 베타 후보 매장 5곳 + control 5곳 = 10건 KYC 신청 누적 (`submit-kyc-application`).
- **부하**: admin 1명이 30분간 10건 모두 검토 (approve 7 / reject 3).
- **측정**:
  - `kyc_submitted` 이벤트 10건 (PostHog)
  - `kyc_approved` 7건 + `kyc_rejected` 3건
  - 알림 발송 실패 silent 처리 후 `console.error` Sentry로 캡처 — 0건 목표
  - 재신청 (kyc_rejected → kyc_submitted) 1건 시뮬 → 흐름 정상

### S4 — Dispute SLA (E12)

- **시작 조건**: S1 + S2 완료 후 분쟁 가능 conversation 5건 시드.
- **부하**: 5건 분쟁 생성 → SLA 카운트다운 24h → admin 결정 (3 resolve, 1 reject, 1 escalate).
- **측정**:
  - `dispute_filed` 이벤트 5건 (ζ.5에는 미포함 — 본 시나리오 실행 전 wire 필요)
  - SLA 마감 alert 작동 (Sentry warning level)
  - `disputes-list.tsx` admin UI SLA 초과 표시 정합 (PR #427 hesya-danger 토큰 적용 후 확인)

## 부하 발생 방법

| 영역    | 방법                                                                                                                           |
| ------- | ------------------------------------------------------------------------------------------------------------------------------ |
| S1 부하 | `apps/web/scripts/seed-stress-inbound.ts` (신규 작성 필요 — ζ.4 실행 시점) — fixture customer + curl Instagram webhook payload |
| S2 부하 | Playwright 시나리오 (`tests/e2e/inbox-flow.spec.ts`) 5 매장 동시 세션, randomized accept/edit/skip                             |
| S3 부하 | 수동 + Playwright 혼합 — admin 사용성도 함께 검증                                                                              |
| S4 부하 | DB 직접 시드 (`scripts/seed-disputes.ts` 신규) + admin UI 흐름                                                                 |

## 수용 기준 (모두 통과 시 ζ.4 종료)

- [ ] S1 — `ai_draft_generated` ≥ 245/250 (drop 5건 이하)
- [ ] S1 — Sentry error rate < 1%
- [ ] S2 — `ai_draft_edited` / total ≤ 50% (PRD H1 충족)
- [ ] S2 — message_sent 성공률 ≥ 95%
- [ ] S3 — KYC 알림 발송 성공률 100% (재시도 0건)
- [ ] S4 — SLA alert 정확도 100% (5건 모두 마감 24h 전 alert)
- [ ] 베타 5곳 종합 → p95 응답 시간 < 3분 (PRD 외국인 응답 시간 지표)

## ζ.4 실행 전제

1. **ζ.5 PostHog 이벤트 wire 완료** (2026-05-19, PR feat/zeta-5-posthog-events) ✓
2. **베타 매장 5곳 onboarded** (ζ.7) — 부하 매장 컨텍스트
3. **`dispute_filed` 이벤트 wire** — S4 prerequisite (별도 PR)
4. **Stress 시드 스크립트 작성** (`seed-stress-inbound.ts` / `seed-disputes.ts`)
5. **Sentry alert rule 설정** — error rate > 1% / latency p95 > 60s

## 종료 후 산출

- `docs/stress-test/zeta-4-result-YYYYMMDD.md` — 측정값 표 + Sentry/PostHog 캡처
- `PROGRESS.md` ζ.4 완료 entry (L-082 e2e 기준 충족 근거)
- 발견된 회귀가 있으면 → 별도 fix PR + 재실행

## 관련

- `docs/PRD.md` v1.2 § 9 — 베타 5곳 매칭 후 성공 지표
- `docs/Plan-v2-scenario-B.md` Phase 1-ζ — 본 stress test 위치
- `apps/web/src/shared/lib/analytics.ts` — ζ.5 server-side track helper
- `apps/web/sentry.server.config.ts` — error rate baseline 측정 기준
