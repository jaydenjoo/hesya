# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook).
> ⚠️ **자기평가 갱신 규칙 (L-082)**: % 표시는 "코드 머지 완료"가 아닌 **"사용자 입장 e2e 시연 가능 여부"**로만 정의. AI 자체 평가 → 객관적 측정(grep / test count / subagent 진단 / 실제 시연)으로 교차 검증 의무.

## 현재 위치 (객관 측정 — 2026-05-08, senior-engineer + code-explorer subagent 진단 기반)

- **Phase**: Phase 1-β 후 → **Phase 1-γ 정리 단계 (시나리오 B 진입 직전)**
- **시나리오**: B (풀 P0 베타 — PRD 원안). 시나리오 C(인박스+KYC만) 거부됨.
- **베타 5곳 출시 가능 시점**: P0 6개 Epic 모두 완성 후 — 실측 약 10~12주 추가
- **본 세션 종료**: 정리/준비 통합 PR `fix/session-cleanup` 머지 후

## P0 Epic 객관 완성도 (subagent 검증 — PRD §4 기준)

| Epic                | PROGRESS 자기평가 (이전) | **subagent 실측** | 갭                                                                    |
| ------------------- | ------------------------ | ----------------- | --------------------------------------------------------------------- |
| E1 인박스           | "62%"                    | **65%**           | Instagram 단채널만, WhatsApp/카카오/LINE 0% (타입 정의만)             |
| **E2 결제 위젯** 🔴 | "후속"                   | **17%**           | DB 스키마만. Stripe/Alipay/WeChat 코드 0건                            |
| **E3 예약 시스템**  | "~10%"                   | **17%**           | DB 스키마만. DAL/Server Action/UI 0건                                 |
| **E4 대시보드**     | "~5%"                    | **8%**            | Recharts 의존성 자체 없음, KPI 집계 테이블 없음                       |
| E9 KYC 🔴           | "83%"                    | **88%**           | ✅ 가장 완성. admin 검수 E2E 흐름만 차단 (Better Auth 세션 시뮬 한계) |
| E12 관리자 🔴       | "18%"                    | **40%**           | E12-1,2,3,5,10 완료 / E12-4,6,7,8,9 미완 (5개)                        |

**P0 평균: 39%**. 베타 5곳 출시 = 6 Epic 모두 80%+ 도달 필요.

## 코드 품질 (subagent 진단 — 변경 없음, 기반 탄탄)

| 항목                                   | 점수                                     |
| -------------------------------------- | ---------------------------------------- |
| 코드 품질 (DAL/타입/일관성)            | **7/10**                                 |
| 보안 (Auth/RLS/암호화)                 | **8/10**                                 |
| 기술 부채 (TODO 2건, 임시 솔루션 명시) | **6/10**                                 |
| **E2E 통합 시연 커버리지**             | **5/10** ⚠️ 본 세션 patch 누적 근본 원인 |
| 종합                                   | **6.5/10**                               |

## 본 세션 (2026-05-08) — 정리 + 준비

### 작업 흐름

1. Plan v1 (베타 데모 시드 + ngrok 4 Task) → PR #83 ✅
2. 시연 시도 중 **6개 갭 연속 발견** (PR #84~#87 + fix/dev-demo-ig-mock):
   - 마이그 적용 절차 부재 → PR #84
   - 시드 번역 NULL + PRD §268 위반 → PR #85
   - 시드 idempotency → PR #86
   - admin guard mock bypass 부재 → PR #87
   - IG mock 자동 기동 + dev-demo.sh trap → fix/dev-demo-ig-mock (보류)
   - .env.local ANTHROPIC_API_KEY 형식 → 별개 환경 이슈 (Jayden 환경)
3. Jayden 우려: "까먹고 잘못하는 느낌, 최고품질 도달 가능한가?"
4. **subagent 2개 병렬 진단** (senior-engineer + code-explorer):
   - 종합 점수 6.5/10
   - 베타 차단 top 3: rate-limit Upstash 교체, auth-guard.ts stub 정리, KYC 통합 E2E
   - PROGRESS 자기평가와 실측 갭 큼 (E2/E3/E4 사실상 0%)
5. **L-082 작성**: "PROGRESS 자기평가 ≠ 실제 완성도, e2e 시연으로만 검증" 메타 학습
6. **fix/session-cleanup 통합 PR**: PR #84(db:apply) + IG mock 자동 기동 + 회고 docs 일괄 머지

### 머지된 PR (본 세션)

| PR                                                | 내용                                           | 상태          |
| ------------------------------------------------- | ---------------------------------------------- | ------------- |
| [#83](https://github.com/jaydenjoo/hesya/pull/83) | 베타 데모 시드 + ngrok 인프라 (Plan v1)        | ✅            |
| [#85](https://github.com/jaydenjoo/hesya/pull/85) | 시드 메시지 번역 + PRD §268 일관               | ✅            |
| [#86](https://github.com/jaydenjoo/hesya/pull/86) | seed:demo idempotent (PK 충돌 방지)            | ✅            |
| [#87](https://github.com/jaydenjoo/hesya/pull/87) | admin 가드 mock bypass (E2E_ADMIN_EMAIL)       | ✅            |
| **fix/session-cleanup**                           | **db:apply + dev-demo.sh + 회고 docs (본 PR)** | **머지 대기** |
| [#84](https://github.com/jaydenjoo/hesya/pull/84) | (close 예정 — fix/session-cleanup으로 통합)    | OPEN → CLOSE  |

## 다음 세션 가이드 — Phase 1-γ Plan v2 (시나리오 B)

📄 **상세 plan**: `docs/Plan-v2-scenario-B.md` (본 PR에 포함)

### Phase 1-γ.0 — 즉시 차단 fix (다음 1 세션, 1~2일)

⚠️ 모두 **베타 출시 차단 사항** (subagent top 3):

1. **rate-limit Upstash Redis 교체** — `apps/web/src/shared/lib/rate-limit.ts`
   - 현재 in-memory Map → Vercel Serverless 인스턴스 분산 환경에서 무력화
   - QStash로 이미 Upstash 계정 연결됨 → `@upstash/ratelimit + @upstash/redis` 추가
   - 예상: 1 PR, ~40분
2. **auth-guard.ts stub 삭제** — `requireAuth` / `requireAdmin` 전부 throw, 사용처 0건
   - 새 contributor 실수 import 위험
   - 예상: 1 PR, ~15분
3. **sign-in 페이지 정식화** — 주석 "임시 검증 페이지" 제거 + 디자인
   - 베타 사용자 노출되는 페이지
   - 예상: 1 PR, ~30분

### Phase 1-γ.1 — Epic 12 완성 (다음 1주, P0 RED)

E12-4 분쟁처리, E12-6 결제이상, E12-7 AI 정확도, E12-8 API정책, E12-9 해지/삭제 — 5 Task

### Phase 1-γ.2 — Epic 9 마무리 + Epic 1 통합 E2E (1주)

KYC 제출 → admin 승인 → inbox 진입 통합 E2E (subagent top 3 차단 #3)

### Phase 1-γ.3 — Epic 1 채널 확장 (2주)

WhatsApp / 카카오 / LINE adapter 추가 + 통합 시연

### Phase 1-δ — Epic 2 결제 + Epic 3 예약 (3~4주)

Stripe + Alipay + WeChat + 한국은행 환율 + 다국어 예약 페이지

### Phase 1-ε — Epic 4 대시보드 + 디자인 정합성 (2주)

Recharts KPI 12개 위젯 + 디자인 8개 페이지 적용 (현재 ~18%)

### Phase 1-ζ — 통합 검증 + 베타 매장 매칭 (1~2주)

demo.hesya.com Phase 2 도입 (L-081 옵션 C) + 베타 1~2곳 onboarding

### 베타 5곳 출시 — 약 10~12주 후

## 컨텍스트 관리 강화 (본 세션 영구 도입)

다음 세션이 본 세션 패턴 안 반복하도록:

1. **CLAUDE.md 강화** (본 PR): "PROGRESS 자기평가는 e2e 시연 가능 여부로만 정의" 규칙 추가
2. **L-082 메타 학습** (본 PR): "PR 같은 영역 3개+ 누적 시 즉시 회고 trigger"
3. **memory 갱신** (본 세션): feedback 항목 — "Plan 인벤토리에 e2e 시연 prerequisite 의무"
4. **subagent 진단 의무화**: P0 Epic 작업 전 senior-engineer + code-explorer 진단으로 % 객관화
5. **PROGRESS 갱신 규칙**: 자기평가 변경 시 근거 (PR + e2e 결과 + subagent 진단) 첨부 의무

## 알려진 환경 이슈 (본 PR scope 밖, 별도 처리)

- `apps/web/.env.local`의 `ANTHROPIC_API_KEY` — `sk-ant-` prefix로 시작 안 함 → instrumentation register 시 zod fail (Jayden 환경 점검 필요)
- 로컬 supabase connection slots 부족 시 시드 재실행 fail — supabase 재시작 또는 dev 서버 일시 종료로 회수

## 관련 문서

- PRD: `docs/PRD.md` (v1.2)
- 개발 계획: `docs/DEVELOPMENT-PLAN.md` (v1.2 FINAL)
- **Plan v2 상세**: `docs/Plan-v2-scenario-B.md` (본 PR)
- 디자인: `docs/design/` (참조), `docs/DESIGN-PLAN.md`
- 데모 가이드: `docs/demo-guide.md`
- ADR: `docs/DECISIONS.md`
- 교훈: `docs/learnings.md` (L-001~L-082)
- 글로벌 규칙: `~/.claude/CLAUDE.md` v3.2
- 인벤토리 절차: `~/.claude/rules/inventory-protocol.md`
- 프로젝트 규칙: `CLAUDE.md` (5-Layer 문서 구조, L-079 도입)
