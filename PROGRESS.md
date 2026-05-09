# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook).
> ⚠️ **자기평가 갱신 규칙 (L-082)**: % 표시는 "코드 머지 완료"가 아닌 **"사용자 입장 e2e 시연 가능 여부"**로만 정의. AI 자체 평가 → 객관적 측정(grep / test count / subagent 진단 / 실제 시연)으로 교차 검증 의무.

## 현재 위치 (2026-05-09 세션 종료 시점)

- **Phase**: **Phase 1-γ.1.1 완료** (Epic 12 잔여 5 Task 중 첫 번째 = γ.1.1 E12-4 분쟁처리 e2e 시연 통과)
- **시나리오**: B (풀 P0 베타 — PRD 원안)
- **베타 5곳 출시 가능 시점**: 약 9~11주 (γ.1.1 시연 통과 → γ.1.2 진입 가능)
- **본 세션 머지 PR**: #92 (backend), #93 (UI), #94 (seed fix), #95 (dev:demo DATABASE_URL override)
- **Playwright e2e 시연**: 8단계 모두 ✅ — 사장 신고 → admin 검토 → 해결 처리 → 사장 측 동기화

## P0 Epic 객관 완성도 (Epic 12 갱신 — Playwright e2e 시연 통과 근거)

| Epic                | 실측 (직전) | 실측 (본 세션)      | 갭                                                               |
| ------------------- | ----------- | ------------------- | ---------------------------------------------------------------- |
| E1 인박스           | 65%         | **65%** (변동 없음) | Instagram 단채널만, WhatsApp/카카오/LINE 0% (타입 정의만)        |
| **E2 결제 위젯** 🔴 | 17%         | **17%** (변동 없음) | DB 스키마만. Stripe/Alipay/WeChat 코드 0건                       |
| **E3 예약 시스템**  | 17%         | **17%** (변동 없음) | DB 스키마만. DAL/Server Action/UI 0건                            |
| **E4 대시보드**     | 8%          | **8%** (변동 없음)  | Recharts 의존성 자체 없음, KPI 집계 테이블 없음                  |
| E9 KYC 🔴           | 88%         | **88%** (변동 없음) | admin 검수 E2E 흐름만 차단 (Better Auth 세션 시뮬 한계)          |
| **E12 관리자** 🔴   | 40%         | **50%** ↑           | E12-1,2,3,4,5,10 완료 (E12-4 시연 통과) / E12-6,7,8,9 미완 (4개) |

**P0 평균: 39% → 41%** (E12 +10, 다른 Epic 변동 없음).

## 코드 품질 (본 세션 변동 — UI feature/dispute 추가 + dev:demo 격리 보강)

| 항목                                   | 점수 (직전) | 점수 (본 세션)                                         |
| -------------------------------------- | ----------- | ------------------------------------------------------ |
| 코드 품질 (DAL/타입/일관성)            | 7/10        | **7/10** (UI 신규 7파일 + 기존 패턴 일관)              |
| 보안 (Auth/RLS/암호화)                 | 8/10        | **8/10**                                               |
| 분산 안정성 (rate-limit)               | 8/10        | **8/10**                                               |
| 기술 부채 (TODO 2건, 임시 솔루션 명시) | 6/10        | **6/10**                                               |
| **E2E 통합 시연 커버리지**             | 5/10        | **6/10** ↑ (Epic 12.4 8단계 Playwright 자동 시연 통과) |
| 종합                                   | 7/10        | **7/10** (E2E ↑로 베이스라인 안정)                     |

## 본 세션 (2026-05-09) — Phase 1-γ.1.1 e2e 시연 통과

### 머지된 PR (4개, 같은 영역 누적 → L-082 회고 trigger 발동)

| PR                                                | Task                                                                  | 상태              |
| ------------------------------------------------- | --------------------------------------------------------------------- | ----------------- |
| [#92](https://github.com/jaydenjoo/hesya/pull/92) | E12-4 backend (직전 세션 작업, 본 세션 시작 시 자동 머지 확인)        | ✅ 머지 (b429245) |
| [#93](https://github.com/jaydenjoo/hesya/pull/93) | E12-4 UI (사장 폼 + admin 큐 + features 7파일)                        | ✅ 머지 (5ece42b) |
| [#94](https://github.com/jaydenjoo/hesya/pull/94) | seed fix (createDispute server-only → seedDispute fixture helper)     | ✅ 머지 (766076e) |
| [#95](https://github.com/jaydenjoo/hesya/pull/95) | dev:demo DATABASE_URL override (.env.local의 HESYA_TEST_DATABASE_URL) | ✅ 머지           |

### 작업 흐름 회고 (같은 영역 PR 4개째 → plan 인벤토리 부실 시그널 — L-085)

1. **PR #93 plan 단계**: 인벤토리에서 dispute UI 0건 확인했지만, **시연 prerequisite 3-layer (마이그 / seed / dev:demo DATABASE_URL) 격리 검증 누락**.
2. **#94 fix**: seed가 server-only DAL을 직접 import → tsx에서 throw. fixture inline 패턴 (server-only 우회 의도) 미준수.
3. **#95 fix**: dev:demo의 next dev가 `.env.local` DATABASE_URL(prod) 그대로 사용 → seed가 들어간 로컬 DB와 불일치. dotenv로 .env.local 파싱 + DATABASE_URL inline override.
4. **시연 통과**: PR #95 머지 후 dev:demo 재시작 → Playwright 8단계 모두 통과.

### Playwright e2e 시연 (L-082 충족 핵심)

| 단계 | 검증                                                          | 결과 |
| ---- | ------------------------------------------------------------- | ---- |
| 1    | 사장 페이지 진입 + seed 분쟁 1건 보임 (컴플레인 / 접수 / D-5) | ✅   |
| 2    | 신규 분쟁 폼 진입 (`/store/disputes/new`)                     | ✅   |
| 3    | 환불 분쟁 신규 신고 → list 복귀 (2건)                         | ✅   |
| 4    | admin 큐 진입 (분쟁 2건 + D-day 표시 D-5/D-6)                 | ✅   |
| 5    | status 필터 동작 (`?status=in_review` → 0건)                  | ✅   |
| 6    | "검토 시작" → `open` → `in_review` 전이                       | ✅   |
| 7    | resolution 입력 + "해결 처리" → `in_review` → `resolved`      | ✅   |
| 8    | 사장 측 list에서 "해결됨" 동기화 표시, terminal detail 정상   | ✅   |

영업일 vs 달력일 SLA 차이 자연스럽게 검증 (5/15 vs 5/14). 스크린샷 3장 (`apps/web/demo-step{1,3,8}-*.png`).

### 검증 통과 (PR #95 기준)

- `pnpm --filter @hesya/web type-check` ✅ tsc 0 errors
- `pnpm --filter @hesya/web lint` ✅ 0 issues
- `pnpm --filter @hesya/web test` ✅ **591 passed** (regression 0)
- **Playwright e2e 자동 시연** ✅ 8단계 통과

## 다음 세션 가이드 — Phase 1-γ.1.2 (Epic 12 잔여)

📄 **상세 plan**: `docs/Plan-v2-scenario-B.md`

### 다음 세션 첫 행동

1. PROGRESS.md 본 파일 확인 (현재 위치 = γ.1.2 진입)
2. **L-085 추가** docs/learnings.md (본 세션 회고 — 같은 영역 PR 4개+ 누적 + 시연 prerequisite 3-layer 검증 의무)
3. γ.1.2 E12-6 결제이상 모니터링 plan v1 작성 (Pre-Plan Inventory 의무)

### Phase 1-γ.1 — Epic 12 완성 (다음 1주, P0 RED)

E12 현재 50% → 100% 목표. 4 Task + 통합 E2E 남음:

| #         | Task                               | 영역                     | 예상  |
| --------- | ---------------------------------- | ------------------------ | ----- |
| ~~γ.1.1~~ | ~~E12-4 분쟁처리~~                 | ✅ 완료 (본 세션)        | 1일   |
| γ.1.2     | E12-6 결제이상 모니터링 (인프라만) | 모니터링 hook            | 0.5일 |
| γ.1.3     | E12-7 AI 정확도 모니터링           | metrics 수집 + dashboard | 1일   |
| γ.1.4     | E12-8 API정책 n8n RSS              | 외부 RSS 파싱 + 알림     | 0.5일 |
| γ.1.5     | E12-9 해지/데이터삭제              | DAL + cascade 설계 + UI  | 1일   |
| γ.1.6     | Epic 12 통합 E2E                   | 통합 검증                | 0.5일 |

### Phase 1-γ.2 — Epic 9 마무리 + Epic 1 통합 E2E (1주)

KYC 제출 → admin 승인 → integration 연결 → inbox 진입 통합 E2E.

### Phase 1-γ.3 — Epic 1 채널 확장 (1.5~2주)

WhatsApp / 카카오 / LINE adapter + 통합 시연.

### Phase 1-δ — Epic 2 결제 + Epic 3 예약 (3~4주)

Stripe + Alipay + WeChat + 한국은행 환율 + 다국어 예약 페이지.

### Phase 1-ε — Epic 4 대시보드 + 디자인 정합성 (1.5~2주)

Recharts KPI 12개 + 디자인 8개 페이지 적용.

### Phase 1-ζ — 통합 검증 + 베타 매장 매칭 (1~2주)

demo.hesya.com Phase 2 도입 + 베타 1~2곳 onboarding.

### 베타 5곳 출시 — 약 9~11주 후

## 차단 요소

없음. Phase 1-γ.1.1 완료 + 시연 통과 → γ.1.2 진입 가능.

## 컨텍스트 관리 강화 — 누적 (L-082 → L-085)

1. **PROGRESS 자기평가는 e2e 시연 기준** (L-082)
2. **destructive CLI 명령 글로벌 정밀화** (L-083) — `Bash(vercel env*)` → `*ls*`/`*get *`만
3. **VS Code Local History 복구 경로** 확보 (L-083)
4. **subagent 진단 의무화**: P0 Epic 작업 전 senior-engineer + code-explorer
5. **PR 같은 영역 3개+ 누적 시 회고 trigger** (L-082) — 본 세션 4개째 발동 → L-085 추가
6. **새 env 도입 PR 5-layer 정합성 의무** (L-084)
7. **검증 스크립트는 lib wrapper 우회** (L-084)
8. **시연 prerequisite 3-layer (마이그 / seed / dev:demo DATABASE_URL) 격리 검증 의무** (L-085 신규)

## 알려진 환경 이슈 (본 세션 scope 밖)

- pnpm v10.28.2 환경 차이로 `pnpm-lock.yaml` quote style reformat 발생 (별도 cleanup PR 가능)
- `apps/web/.env.local`의 `ANTHROPIC_API_KEY` — `sk-ant-` prefix 형식 점검 필요 (Jayden 환경)

## 관련 문서

- PRD: `docs/PRD.md` (v1.2)
- 개발 계획: `docs/DEVELOPMENT-PLAN.md` (v1.2 FINAL)
- Plan v2 상세: `docs/Plan-v2-scenario-B.md`
- 디자인: `docs/design/` (참조), `docs/DESIGN-PLAN.md`
- 데모 가이드: `docs/demo-guide.md`
- ADR: `docs/DECISIONS.md`
- 교훈: `docs/learnings.md` (L-001~**L-085**)
- 글로벌 규칙: `~/.claude/CLAUDE.md` v3.2
- 인벤토리 절차: `~/.claude/rules/inventory-protocol.md`
- 프로젝트 규칙: `CLAUDE.md` (5-Layer 문서 구조)
