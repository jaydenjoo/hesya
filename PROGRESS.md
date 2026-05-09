# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook).
> ⚠️ **자기평가 갱신 규칙 (L-082)**: % 표시는 "코드 머지 완료"가 아닌 **"사용자 입장 e2e 시연 가능 여부"**로만 정의. AI 자체 평가 → 객관적 측정(grep / test count / subagent 진단 / 실제 시연)으로 교차 검증 의무.

## 현재 위치 (2026-05-09 세션 종료 시점)

- **Phase**: **Phase 1-γ.1 진입** (Epic 12 잔여 5 Task 중 첫 번째 = γ.1.1 E12-4 backend 머지 대기)
- **시나리오**: B (풀 P0 베타 — PRD 원안)
- **베타 5곳 출시 가능 시점**: 약 9~11주 (γ.0 완료로 1주 단축, γ.1.1 backend 진행 중)
- **본 세션 종료**: PR #91 ✅ + PR #92 (E12-4 backend) ⏳ auto-merge + `~/.claude/docs/mattpocock-skills-guide.md` 글로벌 reference 저장

## P0 Epic 객관 완성도 (subagent 검증 — PRD §4 기준, 본 세션 변동 없음)

| Epic                | subagent 실측 | 갭                                                                    |
| ------------------- | ------------- | --------------------------------------------------------------------- |
| E1 인박스           | **65%**       | Instagram 단채널만, WhatsApp/카카오/LINE 0% (타입 정의만)             |
| **E2 결제 위젯** 🔴 | **17%**       | DB 스키마만. Stripe/Alipay/WeChat 코드 0건                            |
| **E3 예약 시스템**  | **17%**       | DB 스키마만. DAL/Server Action/UI 0건                                 |
| **E4 대시보드**     | **8%**        | Recharts 의존성 자체 없음, KPI 집계 테이블 없음                       |
| E9 KYC 🔴           | **88%**       | ✅ 가장 완성. admin 검수 E2E 흐름만 차단 (Better Auth 세션 시뮬 한계) |
| E12 관리자 🔴       | **40%**       | E12-1,2,3,5,10 완료 / E12-4,6,7,8,9 미완 (5개)                        |

**P0 평균: 39%** (변동 없음 — γ.0 차단 fix는 인프라/UX 영역, Epic % 직접 영향 없음).

## 코드 품질 (본 세션 변동 — Upstash 교체로 분산 안정성 ↑)

| 항목                                   | 점수                                                                               |
| -------------------------------------- | ---------------------------------------------------------------------------------- |
| 코드 품질 (DAL/타입/일관성)            | **7/10**                                                                           |
| 보안 (Auth/RLS/암호화)                 | **8/10**                                                                           |
| **분산 안정성 (rate-limit)**           | **8/10** ↑ (이전 4/10) — Upstash Redis e2e 시연 검증 (#11 BLOCKED, retryAfter=55s) |
| 기술 부채 (TODO 2건, 임시 솔루션 명시) | **6/10**                                                                           |
| E2E 통합 시연 커버리지                 | **5/10** (γ.2에서 Epic 1+9 통합 E2E로 ↑ 예정)                                      |
| 종합                                   | **7/10** ↑ (이전 6.5/10)                                                           |

## 본 세션 (2026-05-09) — Phase 1-γ.0 완료 + γ.1.1 backend + 글로벌 reference

### Phase 1-γ.1.1 진행 (E12-4 분쟁처리, PRD §1063, 🔴 RED)

**Plan v1 인벤토리 결과**: dispute/분쟁/complaint 코드 0건 (깨끗한 신규).
ADR된 디렉토리 `app/[locale]/admin/disputes/` (DECISIONS:201). 기존 패턴 (kyc/store-reports) 그대로 재사용.

**Plan-v2-scenario-B Q1~Q4 결정 (Jayden 추천 채택)**:

1. 사장이 매장 UI에서 분쟁 신고 (`filed_by_user_id`로 추적)
2. 5 상태 (`open` → `in_review` → `resolved`/`rejected`/`sla_exceeded`)
3. 단순 영업일 (월~금, 공휴일 무시 — 베타 MVP)
4. 이메일만 (Resend, kyc-result 패턴)

**[PR #92](https://github.com/jaydenjoo/hesya/pull/92)** (auto-merge 대기) — Backend layer 7 파일 757줄:

- Schema + migration `0023_disputes.sql` (manual SQL, ROLLBACK 주석)
- DAL + 11 tests (3 단위 + 8 integration)
- Server Actions (사장 측 submit / admin 측 setInReview·resolve·reject)
- 알림 (`dispute-result.ts` — terminal 전이 시 사장 이메일)

검증 ✅: type-check 0, lint 0, **591 tests passed (+3 신규, regression 0)**.

**후속 (다음 세션)**: UI(사장 폼 + admin 큐) + dev:demo seed + 시연 → L-082 충족 후 Epic 12 % 갱신.

### Phase 1-γ.0 완료 (직전)

### 작업 흐름

1. 직전 세션 진단 (subagent top 3 차단 사항) 기반 Phase 1-γ.0 — 즉시 차단 fix 3개 완료
2. **순서 결정**: 외부 리소스 무관 → 디자인 → 인프라 의존성 (γ.0.2 → γ.0.3 → γ.0.1)
3. **Jayden Vercel/Upstash 콘솔 진행** (사용자 측):
   - Upstash Redis `hesya-rate-limit-prod` 신규 생성 (Tokyo, Free 500K/월)
   - Vercel hesya-web 통합 → 환경변수 5개 자동 주입
4. **메타 사고**: `vercel env pull --yes`로 `.env.local` 덮어씀 → Jayden VS Code Local History로 직접 복구. 글로벌 settings.json `Bash(vercel env*)` 와일드카드 정밀화로 재발 차단 (L-083)
5. **컨텍스트 관리 검증** (Anthropic 공식 docs 딥리서치 + 환경 갭 분석): 베이스라인 상위 10% 수준, destructive command 안전망만 보강 필요 → 즉시 적용 (글로벌 settings.json)

### 머지된 PR (본 세션) — Phase 1-γ.0 차단 fix 3개

| PR                                                | Task                                                                                        | 상태                       |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------- | -------------------------- |
| [#89](https://github.com/jaydenjoo/hesya/pull/89) | γ.0.2 — auth-guard.ts stub 삭제 (사용처 0건)                                                | ✅ 머지                    |
| [#90](https://github.com/jaydenjoo/hesya/pull/90) | γ.0.3 — sign-in 매장 사장 디자인 적용                                                       | ✅ 머지                    |
| [#91](https://github.com/jaydenjoo/hesya/pull/91) | **γ.0.1 — rate-limit Upstash Redis 교체** + 부수 fix (turbo.json + ci.yml UPSTASH env 누락) | ✅ 머지 (squash `73215ed`) |

### 글로벌 환경 변경 (모든 프로젝트 적용)

- **`~/.claude/settings.json` allow 정밀화**: `Bash(vercel env*)` (모든 env 명령) → `Bash(vercel env ls*)` + `Bash(vercel env get *)` (read-only만)
- 효과: `vercel env pull/add/rm/push` 매번 명시적 prompt → 본 세션 사고 100% 차단
- 백업: `~/.claude/settings.json.bak.20260509_124259`

### 검증 통과 (PR #91 기준)

- `pnpm --filter @hesya/web type-check` ✅ tsc 0 errors
- `pnpm --filter @hesya/web test` ✅ **588 passed** (+7 신규 rate-limit tests, regression 0)
- `pnpm --filter @hesya/web lint` ✅ 0 issues
- **CI 전체 통과** (validate / e2e-smoke / e2e-integration / Vercel) — 부수 fix 2건 후
- **분산 e2e 시연 검증** (실 Upstash 호출, 임시 스크립트) ✅
  - #1~#10 OK (remaining 9→0 카운트다운)
  - #11~#12 BLOCKED (retryAfter=55s)
  - sliding window 강제 + retryAfter 정확 + atomic increment 모두 입증

## 다음 세션 가이드 — Phase 1-γ.1 (Epic 12 완성)

📄 **상세 plan**: `docs/Plan-v2-scenario-B.md`

### 다음 세션 첫 행동

1. PR #92 머지 통과 확인 + 마이그 `0023_disputes.sql` Jayden Supabase Studio 적용 (🔴 수동)
2. **`feat/e12-4-disputes-ui`** 브랜치 생성 — UI layer (사장 분쟁 신고 폼 + admin 큐 list/detail) ~3~4시간
3. dev:demo seed에 분쟁 1건 추가 + 시연 e2e (L-082 충족) ~1시간
4. PROGRESS Epic 12 % 갱신 + γ.1.1 종료 → γ.1.2 진입

### Phase 1-γ.1 — Epic 12 완성 (다음 1~1.5주, P0 RED)

E12 현재 40% → 100% 목표. 5 Task + 통합 E2E (γ.1.1 backend 진행 중):

| #     | Task                               | 영역                     | 예상  |
| ----- | ---------------------------------- | ------------------------ | ----- |
| γ.1.1 | E12-4 분쟁처리                     | DAL + admin UI + 알림    | 1일   |
| γ.1.2 | E12-6 결제이상 모니터링 (인프라만) | 모니터링 hook            | 0.5일 |
| γ.1.3 | E12-7 AI 정확도 모니터링           | metrics 수집 + dashboard | 1일   |
| γ.1.4 | E12-8 API정책 n8n RSS              | 외부 RSS 파싱 + 알림     | 0.5일 |
| γ.1.5 | E12-9 해지/데이터삭제              | DAL + cascade 설계 + UI  | 1일   |
| γ.1.6 | Epic 12 통합 E2E                   | 통합 검증                | 0.5일 |

### Phase 1-γ.2 — Epic 9 마무리 + Epic 1 통합 E2E (1주)

KYC 제출 → admin 승인 → integration 연결 → inbox 진입 통합 E2E.

### Phase 1-γ.3 — Epic 1 채널 확장 (1.5~2주)

WhatsApp / 카카오 / LINE adapter + 통합 시연.

### Phase 1-δ — Epic 2 결제 + Epic 3 예약 (3~4주)

Stripe + Alipay + WeChat + 한국은행 환율 + 다국어 예약 페이지.

### Phase 1-ε — Epic 4 대시보드 + 디자인 정합성 (1.5~2주)

Recharts KPI 12개 + 디자인 8개 페이지 적용 (현재 ~18%).

### Phase 1-ζ — 통합 검증 + 베타 매장 매칭 (1~2주)

demo.hesya.com Phase 2 도입 (L-081 옵션 C) + 베타 1~2곳 onboarding.

### 베타 5곳 출시 — 약 9~11주 후 (γ.0 완료로 1주 단축)

## 차단 요소

없음. Phase 1-γ.0 모든 차단 fix + 분산 시연 검증까지 완료 → Phase 1-γ.1 진입 가능.

✅ **시연 검증 완료** (2026-05-09 본 세션):

- PR #91 ✅ 머지 (`73215ed`) + 부수 fix 2건 (turbo.json + ci.yml UPSTASH env 누락) squash
- 옵션 B (직접 호출 검증 스크립트, 임시 → 실행 후 즉시 삭제) → Upstash sliding window e2e 통과
- L-082 충족: 코드 머지 + 사용자 흐름 시연 둘 다 → 분산 안정성 8/10 객관 근거 확보

(보너스 옵션 A `pnpm dev:demo` UI 시연은 베타 직전 단계로 보류 — B로 인프라 단위 충분)

## 컨텍스트 관리 강화 — 영구 도입 (본 세션 추가)

직전 세션 (L-082) + 본 세션 (L-083, L-084) 합산:

1. **PROGRESS 자기평가는 e2e 시연 기준** (L-082)
2. **destructive CLI 명령 글로벌 정밀화** (L-083) — `Bash(vercel env*)` → `*ls*`/`*get *`만
3. **VS Code Local History 복구 경로** 확보 (L-083)
4. **subagent 진단 의무화**: P0 Epic 작업 전 senior-engineer + code-explorer
5. **PR 같은 영역 3개+ 누적 시 회고 trigger** (L-082)
6. **새 env 도입 PR 5-layer 정합성 의무** (L-084) — env.ts / .env.example / Vercel / turbo.json / CI workflow 동시 갱신
7. **검증 스크립트는 lib wrapper 우회** (L-084) — 무관한 env validation 실패에 발목 안 잡히도록 라이브러리 직접 호출

## 알려진 환경 이슈 (본 세션 scope 밖, 별도 처리)

- `apps/web/.env.local`의 `ANTHROPIC_API_KEY` — `sk-ant-` prefix 형식 점검 필요 (Jayden 환경)
- 로컬 supabase connection slots 부족 시 시드 재실행 fail — supabase 재시작으로 회수
- pnpm v10.28.2 환경 차이로 `pnpm-lock.yaml` quote style reformat 발생 (PR #91 포함, 함수 변경 무관, 별도 cleanup PR 가능)

## 관련 문서

- PRD: `docs/PRD.md` (v1.2)
- 개발 계획: `docs/DEVELOPMENT-PLAN.md` (v1.2 FINAL)
- Plan v2 상세: `docs/Plan-v2-scenario-B.md`
- 디자인: `docs/design/` (참조), `docs/DESIGN-PLAN.md`
- 데모 가이드: `docs/demo-guide.md`
- ADR: `docs/DECISIONS.md`
- 교훈: `docs/learnings.md` (L-001~**L-084**)
- 글로벌 규칙: `~/.claude/CLAUDE.md` v3.2
- 인벤토리 절차: `~/.claude/rules/inventory-protocol.md`
- 프로젝트 규칙: `CLAUDE.md` (5-Layer 문서 구조, L-079 도입)
- **신규 글로벌 reference**: `~/.claude/docs/mattpocock-skills-guide.md` (mattpocock/skills 검증 결과 + 신규 프로젝트 도입 가이드, 2026-05-09)
