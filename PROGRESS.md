# PROGRESS.md

> **세션 시작 시 첫 번째로 읽는 파일** (settings.json SessionStart hook).
> ⚠️ **자기평가 갱신 규칙 (L-082)**: % 표시는 "코드 머지 완료"가 아닌 **"사용자 입장 e2e 시연 가능 여부"**로만 정의. AI 자체 평가 → 객관적 측정(grep / test count / subagent 진단 / 실제 시연)으로 교차 검증 의무.

## 현재 위치 (2026-05-10 세션 종료 시점)

- **Phase**: **Phase 1-γ.1.4 완료** (Epic 12 잔여 5 Task 중 1~4번째 — γ.1.1~γ.1.4 모두 머지 + Vercel prod 배포 성공)
- **시나리오**: B (풀 P0 베타 — PRD 원안)
- **베타 5곳 출시 가능 시점**: 약 8~10주 (γ.1 거의 마무리 → γ.1.5 E12-9 + 통합 E2E만 남음)
- **본 세션 머지 PR**: #96 (dev:demo dotenv fix), #97 (E12-6 결제이상), #98 (E12-7 AI정확도), #99 (E12-8 API정책 RSS), #100 (PR #99 보안 fix 누락분 재머지)
- **Vercel prod 배포**: `4387501` success (08:10:39Z, Jayden 수동 redeploy 후) — N8N_WEBHOOK_SECRET 등록 누락이 원인
- **본 세션 시연**: admin 페이지 4종(`payment-monitoring`, `ai-accuracy`, `api-policy-alerts`, 기존 분쟁) screenshot + n8n webhook curl 통과

## P0 Epic 객관 완성도 (Epic 12 — γ.1.2~γ.1.4 머지 반영, 통합 E2E 미완)

| Epic                | 실측 (직전) | 실측 (본 세션)      | 갭                                                              |
| ------------------- | ----------- | ------------------- | --------------------------------------------------------------- |
| E1 인박스           | 65%         | **65%** (변동 없음) | Instagram 단채널만, WhatsApp/카카오/LINE 0%                     |
| **E2 결제 위젯** 🔴 | 17%         | **17%** (변동 없음) | DB 스키마만. Stripe/Alipay/WeChat 코드 0건                      |
| **E3 예약 시스템**  | 17%         | **17%** (변동 없음) | DB 스키마만                                                     |
| **E4 대시보드**     | 8%          | **8%** (변동 없음)  | Recharts 미설치                                                 |
| E9 KYC 🔴           | 88%         | **88%** (변동 없음) | admin 검수 E2E 흐름만 차단                                      |
| **E12 관리자** 🔴   | 50%         | **75%** ↑           | E12-1~8,10 완료 / E12-9 (해지·삭제) + 통합 E2E 미완 (시연 부분) |

**P0 평균: 41% → 45%** (E12 +25, 다른 Epic 변동 없음).

> ⚠️ E12-6/7/8은 admin 페이지 visual + curl 시연만 통과. **production 시나리오 (실제 결제 anomaly trigger / 실 메시지 정확도 측정 / 실 RSS 수신) e2e 시연은 미실시** — L-082 기준 부분 시연.

## 본 세션 (2026-05-10) — Phase 1-γ.1.2~γ.1.4 머지 + 보안 fix 재진입

### 머지된 PR (5개)

| PR                                                  | Task                                                              | 상태              |
| --------------------------------------------------- | ----------------------------------------------------------------- | ----------------- |
| [#96](https://github.com/jaydenjoo/hesya/pull/96)   | dev:demo dotenv require 의존성 제거 (bash native parsing)         | ✅ 머지 (7e05f36) |
| [#97](https://github.com/jaydenjoo/hesya/pull/97)   | γ.1.2 E12-6 결제이상 모니터링 (thresholds + DAL + admin 페이지)   | ✅ 머지 (68cbce3) |
| [#98](https://github.com/jaydenjoo/hesya/pull/98)   | γ.1.3 E12-7 AI 정확도 모니터링 (drafts editedFromAi 비율 + admin) | ✅ 머지 (ed2ae85) |
| [#99](https://github.com/jaydenjoo/hesya/pull/99)   | γ.1.4 E12-8 API정책 n8n RSS → webhook → admin 큐                  | ✅ 머지 (eb40da4) |
| [#100](https://github.com/jaydenjoo/hesya/pull/100) | PR #99 보안 review fix 누락분 재머지 (CRITICAL 3 + HIGH 4)        | ✅ 머지 (4387501) |

### Vercel Production 배포 흐름 (실패 → 성공)

| 시각 (UTC)              | 이벤트                                                      | 상태                                      |
| ----------------------- | ----------------------------------------------------------- | ----------------------------------------- |
| 05:49 (PR #99 머지)     | Vercel auto-deploy `eb40da4`                                | ❌ ZodError: N8N_WEBHOOK_SECRET undefined |
| 07:08 (PR #100 머지)    | Vercel auto-deploy `4387501`                                | ❌ 같은 원인                              |
| 08:10 (Jayden redeploy) | Vercel Dashboard에 N8N_WEBHOOK_SECRET 등록(3환경) 후 재배포 | ✅ success                                |

→ **L-087 신규 (env 도입은 Vercel 등록까지 6-layer)**.

### PR #99 보안 review 후 fix 누락 사고 (L-086)

- PR #99 squash merge = 초기 커밋 `8a90aae` 1건만 통합. 보안 fix 커밋 `79b0b9e`는 PR closed **이후** push → main 도달 실패.
- 결과: prod 코드에 CRITICAL(timing-safe 비교, link XSS, alertId 노출) 패치 없음.
- 처리: 새 브랜치 `fix/api-policy-alerts-security-review` + PR #100으로 재진입, auto-merge 라벨 → CI 그린 후 자동 머지.
- **L-086 신규 (PR open 상태에서 fix push + CI 그린 + 머지 직전 main HEAD 검증 의무)**.

### 작업 흐름 (γ.1.2 → γ.1.3 → γ.1.4)

1. **γ.1.2 E12-6**: payments DAL + thresholds(refund_rate=0.3, mismatch=10K KRW) + admin page. drizzle facade에 `gte` 추가.
2. **γ.1.3 E12-7**: ai-accuracy DAL + thresholds(accuracy=0.9, sample=10) + admin page. 분모 = outbound + draftStatus IN(sent,skipped) / 분자 = sent AND editedFromAi != true. drizzle facade에 `inArray` 추가.
3. **γ.1.4 E12-8**: api-policy-alerts 마이그(0024 manual SQL) + DAL + webhook receiver(`/api/webhooks/n8n-rss`) + admin page + n8n 2.16.0 호환 워크플로 JSON.
4. **PR #99 보안 review** (subagent): CRITICAL 3건(timing-safe / link XSS / alertId 노출) + HIGH 4건(min(32) / body size / drizzle CHECK / .select() 명시) 발견 → fix 커밋 push했으나 PR 머지 직후라 main 미반영 → PR #100 별도 진입.

### 검증

- `pnpm type-check` ✅ tsc 0 errors (모든 PR)
- `pnpm lint` ✅ 0 issues
- `pnpm --filter @hesya/web test` ✅ 본 PR scope 19/19 통과 (γ.1.4 기준, 환경 drift는 기준 main과 동일)
- admin 페이지 4종 screenshot 시연 (`apps/web/demo-e12-{6,7,8}-*.png`)
- n8n webhook curl: 신규 → `inserted=true`, 중복 → `inserted=false` ✅
- **Vercel Production 배포 ✅** (`4387501`, 08:10:39Z)

## 다음 세션 가이드 — Phase 1-γ.1.5 (Epic 12 잔여 1개 + 통합 E2E)

📄 **상세 plan**: `docs/Plan-v2-scenario-B.md`

### 다음 세션 첫 행동

1. PROGRESS.md 본 파일 확인 (현재 위치 = γ.1.5 진입)
2. **L-086 / L-087 확인** docs/learnings.md (PR squash merge timing 누락 + Vercel env 6-layer)
3. γ.1.5 E12-9 해지/데이터삭제 plan v1 작성 (Pre-Plan Inventory 의무)
4. **새 env 도입 시 Vercel 등록까지 6-layer 체크리스트 명시 의무** (L-087)

### Phase 1-γ.1 — Epic 12 완성 (다음 1주, P0 RED)

E12 현재 75% → 100% 목표. 1 Task + 통합 E2E 남음:

| #         | Task                                 | 영역                    | 상태             |
| --------- | ------------------------------------ | ----------------------- | ---------------- |
| ~~γ.1.1~~ | ~~E12-4 분쟁처리~~                   | ✅ 완료 (전 세션)       | Playwright 8단계 |
| ~~γ.1.2~~ | ~~E12-6 결제이상 모니터링 (인프라)~~ | ✅ 완료 (본 세션)       | admin + curl     |
| ~~γ.1.3~~ | ~~E12-7 AI 정확도 모니터링~~         | ✅ 완료 (본 세션)       | admin + curl     |
| ~~γ.1.4~~ | ~~E12-8 API정책 n8n RSS~~            | ✅ 완료 (본 세션)       | admin + curl     |
| γ.1.5     | E12-9 해지/데이터삭제                | DAL + cascade 설계 + UI | 1일 예상         |
| γ.1.6     | Epic 12 통합 E2E (Playwright)        | E12-4~9 통합            | 0.5일 예상       |

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

없음. Phase 1-γ.1.4 완료 + Vercel prod 배포 성공 → γ.1.5 진입 가능.

## 마지막 업데이트

- 날짜: 2026-05-10
- 본 세션 작업 시간: ~6h (γ.1.2~γ.1.4 + PR #100 보안 fix 재진입 + Vercel env 진단)

## 컨텍스트 관리 강화 — 누적 (L-082 → L-087)

1. **PROGRESS 자기평가는 e2e 시연 기준** (L-082)
2. **destructive CLI 명령 글로벌 정밀화** (L-083)
3. **subagent 진단 의무화**: P0 Epic 작업 전 senior-engineer + code-explorer
4. **PR 같은 영역 3개+ 누적 시 회고 trigger** (L-082)
5. **새 env 도입 PR 5-layer → 6-layer 정합성 의무** (L-084 → L-087 확장)
6. **시연 prerequisite 3-layer 격리 검증 의무** (L-085)
7. **PR 머지 직전 main HEAD 검증 의무** (L-086 신규 — squash merge timing fix 누락 차단)
8. **새 env 도입은 Vercel Production+Preview+Development 3환경 등록까지** (L-087 신규)

## 알려진 환경 이슈 (본 세션 scope 밖)

- pnpm v10.28.2 환경 차이로 `pnpm-lock.yaml` quote style reformat 발생 (별도 cleanup PR 가능)
- `apps/web/.env.local`의 `ANTHROPIC_API_KEY` — `sk-ant-` prefix 형식 점검 필요 (Jayden 환경)
- 베타·prod 출시 직전 일괄 secret rotation 예정 (N8N_WEBHOOK_SECRET 임시값 포함)

## 관련 문서

- PRD: `docs/PRD.md` (v1.2)
- 개발 계획: `docs/DEVELOPMENT-PLAN.md` (v1.2 FINAL)
- Plan v2 상세: `docs/Plan-v2-scenario-B.md`
- 디자인: `docs/design/` (참조), `docs/DESIGN-PLAN.md`
- 데모 가이드: `docs/demo-guide.md`
- ADR: `docs/DECISIONS.md`
- 교훈: `docs/learnings.md` (L-001~**L-087**)
- 글로벌 규칙: `~/.claude/CLAUDE.md` v3.2
- 인벤토리 절차: `~/.claude/rules/inventory-protocol.md`
- 프로젝트 규칙: `CLAUDE.md` (5-Layer 문서 구조)
