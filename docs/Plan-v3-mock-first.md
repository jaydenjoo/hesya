# Plan v3 — Mock-First Beta-Ready Plan

> 작성: 2026-05-11 (세션 9) | 시나리오 B (풀 P0 베타) 위에서 Mock-first 전략 추가.
> v2.0 (`Plan-v2-scenario-B.md`)는 사업자 등록 후 풀 P0 베타 계획. v3는 사업자 등록 이전에도 외부인이 전 흐름을 시뮬할 수 있는 단계적 계획.

## 0. 비전 + 전제

**비전**: 외부인이 Vercel preview URL만으로 Hesya의 모든 흐름(회원가입 → KYC → IG 연동 → 메시지 → 예약 → 결제)을 사업자 없이 시뮬 가능. Jayden 사업자 등록 후 **5개 env flag toggle**로 실 운영 전환.

**전제**:

1. 외부인 = 베타 후보 / 디자인 검토자 / Jayden 친구 (소수)
2. Mock 환경은 격리 DB(`HESYA_TEST_DATABASE_URL`), prod DB 절대 노출 X
3. 모든 Mock은 env flag로 분기 (`MOCK_KYC` / `MOCK_IG_OAUTH` / `MOCK_PAYMENT` / `MOCK_NOTIFICATION` / `MOCK_MULTI_CHANNEL`)
4. 디자인 reference 24개 페이지 → 베타 출시 시점 21개 정합성 목표 (3개 후순위)
5. 사업자 등록 후 Mock flag 모두 false toggle = 실 운영

## 1. 단계별 Phase (5단계 / 약 5~7주)

### M1 — Mock 인프라 + KYC + IG OAuth Mock (1주)

**목표**: 외부인 회원가입 → 사장 입장 진입 자동 통과.

| Task                                                                           | 예상  | 산출물                                                   |
| ------------------------------------------------------------------------------ | ----- | -------------------------------------------------------- |
| M1.1 Mock env flag 5개 도입 + env schema 등록                                  | 0.5일 | `apps/web/src/shared/config/env.ts`                      |
| M1.2 `MOCK_KYC=true` 분기 — data.go.kr 호출 skip + 자동 승인                   | 1일   | `apps/web/src/lib/kyc/*.ts`                              |
| M1.3 IG OAuth Mock 콜백 — "Instagram 연결" 클릭 → 가짜 OAuth flow → 가짜 token | 1.5일 | `apps/web/src/app/api/oauth/instagram/callback/route.ts` |
| M1.4 Sign-in 페이지 정식화 (`Hesya Login.html` reference 적용)                 | 1일   | `/sign-in/page.tsx`                                      |
| M1.5 외부 데모 가이드 신규 (`docs/external-demo-guide.md`)                     | 0.5일 | docs                                                     |

**검증**: 신규 user → Google OAuth → `/onboarding/kyc` → 자동 승인 → `/store/inbox` 진입. 외부인 1명 완주 = M1 완료.

### M2 — Customer-side 4페이지 + Mock 결제 (2주)

**목표**: 외국인 손님 입장 시뮬 (매장 상세 → 예약 → 결제 → 확정).

| Task                                                                                                              | 예상  | 산출물                                         |
| ----------------------------------------------------------------------------------------------------------------- | ----- | ---------------------------------------------- |
| M2.1 `/c/store/[slug]/page.tsx` — `Hesya Store Detail.html` 적용                                                  | 1.5일 | customer 매장 상세                             |
| M2.2 `/c/store/[slug]/photos/page.tsx` — `Hesya Store Photos.html`                                                | 0.5일 | 매장 사진 갤러리                               |
| M2.3 `/c/store/[slug]/book/schedule/page.tsx` — `Hesya Booking Schedule.html`                                     | 1.5일 | 시간 슬롯 선택                                 |
| M2.4 `/c/store/[slug]/book/confirm/page.tsx` — `Hesya Booking Confirmation.html`                                  | 1일   | 예약 확정                                      |
| M2.5 `MOCK_PAYMENT=true` Mock 결제 페이지 — `Hesya Payment.html` (가짜 카드/Alipay QR/WeChat QR → DB payment row) | 2일   | `/c/pay/[bookingId]` + `lib/payment/mock-*.ts` |
| M2.6 Epic 3 customer-side server action `createBookingAction`                                                     | 1일   | `lib/booking/customer-actions.ts`              |
| M2.7 다국어 6 locale customer 페이지 (ko/en/ja/zh-CN/zh-TW/vi)                                                    | 1일   | i18n keys                                      |

**검증**: 외국인 손님 → 매장 슬러그 → 시술 선택 → 시간 → Mock 결제 → 확정 → 사장 inbox에 inbound 메시지 + 새 예약 row.

### M3 — 누락 사장 페이지 5개 (1주)

**목표**: 사장이 매장 운영 모든 메뉴 접근 가능.

| Task                                                                 | 예상  | 산출물          |
| -------------------------------------------------------------------- | ----- | --------------- |
| M3.1 `/store/services` — `Hesya Services.html` (시술 CRUD)           | 1일   | services 관리   |
| M3.2 `/store/customers` — `Hesya Customers.html` (고객 list + 상세)  | 1일   | customers 관리  |
| M3.3 `/store/settings` — `Hesya Store Settings.html` (영업시간/주소) | 1일   | 매장 설정       |
| M3.4 `/store/mypage` — `Hesya MyPage.html`                           | 0.5일 | 사장 마이페이지 |
| M3.5 `/store/photos` — `Hesya Store Photos.html` (사장 측 업로드)    | 0.5일 | 사진 관리       |

**검증**: 사장이 inbox 외 5개 메뉴 모두 진입 + DB CRUD. dashboard 시술 분포 donut이 services CRUD와 연동.

### M4 — Mock 알림 + Multi-channel + 누락 admin (1주)

**목표**: 알림 흐름 + 4채널 시뮬 + admin 잔여 페이지.

| Task                                                                           | 예상  | 산출물                        |
| ------------------------------------------------------------------------------ | ----- | ----------------------------- |
| M4.1 `MOCK_NOTIFICATION=true` — 카카오 알림톡/SMS skip + console + DB 알림 row | 1일   | `lib/notifications/mock-*.ts` |
| M4.2 `MOCK_MULTI_CHANNEL=true` — WhatsApp/카카오/LINE webhook Mock 시드        | 1.5일 | mock-server.mjs 확장          |
| M4.3 `/admin/dashboard` — `Hesya Admin Dashboard.html` (통합 admin)            | 1일   | admin 메인                    |
| M4.4 `/admin/ai-cost` — `Hesya Admin AI Cost.html` (ai-accuracy 보강)          | 0.5일 | AI 비용                       |
| M4.5 `/c` — `Hesya Customer Landing.html` (고객 랜딩, 매장 검색)               | 1일   | customer 랜딩                 |

**검증**: 4채널 메시지 시뮬 + admin 통합 대시보드 + customer 랜딩 검색.

### M5 — 외부 데모 환경 확정 + UAT (1주)

**목표**: ~~Vercel preview를 안정적 외부 데모로 격상~~ → **prod 단일 baseline 데모 확정** + ζ.4 재실행.

> ⚠️ **v3.1 정책 변경 (2026-05-14)**: 메모리 `feedback_demo_no_personal_env_dependency.md` 적용. RED 프로젝트는 prod 1곳이 외부 데모 baseline. preview 기반 항목은 폐기, prod 직접 검증으로 대체.

| Task                                                                                    | 예상  | 상태                                             | 산출물                        |
| --------------------------------------------------------------------------------------- | ----- | ------------------------------------------------ | ----------------------------- |
| ~~M5.1 Vercel preview 데모 모드 — `?demo=1` 인증 bypass~~                               | 1일   | ❌ 폐기 (prod에 demo 계정 prefill로 대체)        | —                             |
| M5.2 Mock 흐름 통합 e2e (Playwright) — customer 예약 → 사장 수락 → admin 모니터 전 경로 | 1.5일 | ✅ 완료 (Sprint 2 prod e2e 13/14)                | `e2e/*.spec.ts`               |
| M5.3 ζ.4 stress test 재실행 + LCP/INP 측정                                              | 0.5일 | ✅ 완료 (세션 32 perf -94%, cold 546ms)          | `docs/performance.md`         |
| ~~M5.4 UAT — Vercel Preview demo env 등록 (Jayden 외부 작업)~~                          | 0.5일 | ❌ 폐기 (prod e2e + ADMIN_EMAILS prefill로 대체) | —                             |
| M5.5 `MOCK_*` swap procedure 문서 — 사업자 등록 후 실 연동 전환                         | 0.5일 | 🔄 보류 (사업자 등록 후 작성)                    | `docs/mock-swap-procedure.md` |

**검증**: ~~외부인 Vercel preview URL만으로~~ **prod URL (hesya-web.vercel.app)** 만으로 전 흐름 완주 + Core Web Vitals 통과 ✅.

## 2. Mock 인프라 공통 패턴

### 2.1 env flag 5개 (M1.1 도입 완료)

```ts
// apps/web/src/shared/config/env.ts
const mockFlag = z
  .string()
  .default("false")
  .transform((v) => v === "true" || v === "1");

const envSchema = z.object({
  // ...
  MOCK_KYC: mockFlag,
  MOCK_IG_OAUTH: mockFlag,
  MOCK_PAYMENT: mockFlag,
  MOCK_NOTIFICATION: mockFlag,
  MOCK_MULTI_CHANNEL: mockFlag,
});
```

`process.env.MOCK_*`가 `"true"` 또는 `"1"`일 때만 truthy. `undefined` / 빈 문자열 / 기타 = false.

### 2.2 Mock 모듈 패턴 (M1.2 이후 도입)

```
lib/<module>/
  real-<adapter>.ts     ← 실 연동 (사업자 등록 후 사용)
  mock-<adapter>.ts     ← Mock (외부 데모용)
  index.ts              ← env flag 분기 + export
```

`index.ts` 예시:

```ts
import { env } from "@/shared/config/env";
import * as real from "./real-kyc";
import * as mock from "./mock-kyc";
export const verifyBusinessNumber = env.MOCK_KYC
  ? mock.verifyBusinessNumber
  : real.verifyBusinessNumber;
```

### 2.3 Vercel 환경 차이

| 환경                | MOCK\_\* 5개 | 용도                     |
| ------------------- | ------------ | ------------------------ |
| Production          | 모두 false   | 실 운영 (사업자 등록 후) |
| Preview (PR/branch) | 모두 true    | 외부 데모                |
| Development (local) | 자유 toggle  | 개발자 선택              |

## 3. 디자인 정합성 트래킹 (24개 reference)

| Reference                                                            | 현재    | 적용 phase         |
| -------------------------------------------------------------------- | ------- | ------------------ |
| Inbox / Bookings / Store Dashboard / Admin KYC / Design System (5개) | ✅ 완료 | (기존)             |
| Login                                                                | ⚠️ 임시 | M1.4               |
| Customer Landing                                                     | ❌      | M4.5               |
| Store Detail / Photos (customer)                                     | ❌      | M2.1 / M2.2        |
| Booking Schedule / Confirmation / Payment                            | ❌      | M2.3 / M2.4 / M2.5 |
| Services / Customers / Settings / MyPage / Store Photos (사장 5종)   | ❌      | M3.1~M3.5          |
| Admin Dashboard / AI Cost / Payments (3종)                           | ❌      | M4.3 / M4.4        |
| Store Login                                                          | ❌      | M1.4 통합 결정     |
| Chat / AI Photo Analysis / Analytics (후순위 3개)                    | ❌      | 베타 출시 후       |

**베타 출시 시점**: 21/24 (88%) 적용.

## 4. 사업자 등록 후 Swap 절차

1. Jayden 사업자 등록 완료 (개인 또는 법인)
2. data.go.kr API 키 발급 → Vercel Production `KOREA_NTS_API_KEY` / `KOREA_LOCALDATA_API_KEY` 갱신
3. Meta Business / IG OAuth app 등록 → `IG_APP_ID/SECRET` 등록
4. Stripe Connect / Alipay / WeChat KYB 완료 → 각 secret 등록
5. Vercel Production env에서 `MOCK_*` 5개 모두 `false` toggle
6. 수동 redeploy (L-089)
7. ζ.7 베타 매장 1~2곳 onboarding 시작 (`docs/beta-onboarding-checklist.md`)

상세: `docs/mock-swap-procedure.md` (M5.5에서 작성).

## 5. 베타 5곳 출시 Timeline

```
M1 (1주) ──── 외부인 사장 진입 OK
M2 (2주) ──── customer 예약+결제 흐름 OK
M3 (1주) ──── 사장 운영 메뉴 완비
M4 (1주) ──── 알림+멀티채널+admin 완비
M5 (1주) ──── 외부 데모 환경 + UAT
        ↓
사업자 등록 + Mock swap (1~2일)
        ↓
ζ.7 베타 1~2곳 (1주)
        ↓
ζ.8 베타 5곳 확대 (1주)
```

총 약 7~9주. Jayden 사업자 등록은 병렬 진행 가능.

## 6. 성공 기준

| 지표                               | 목표                                                |
| ---------------------------------- | --------------------------------------------------- |
| Mock으로 외부인이 완주 가능한 흐름 | 5개 (회원가입/KYC/IG/예약/결제) 모두                |
| 디자인 정합성                      | 21/24 페이지 (88%)                                  |
| Core Web Vitals                    | LCP < 2.5s / INP < 200ms / CLS < 0.1                |
| ζ.4 stress test 통과               | 250 메시지 + 50 예약 + 5 분쟁 + 3 정책 큐 모두 정상 |
| Mock → Real swap 시간              | < 1일 (env toggle만)                                |

## 7. 위험 + 대응

| 위험                                    | 가능성 | 영향          | 대응                                   |
| --------------------------------------- | ------ | ------------- | -------------------------------------- |
| Mock 결제 UI ↔ 디자인 reference 차이    | 중     | 사용자 혼란   | `Hesya Payment.html` 픽셀 단위 적용    |
| Mock IG OAuth ↔ 실 Meta OAuth 흐름 차이 | 낮     | swap 시 break | Mock도 redirect → callback 형태로 시뮬 |
| Mock 흐름 e2e 누락                      | 중     | 통합 break    | M5.2 통합 e2e 의무                     |
| Customer-side 다국어 키 폭증            | 중     | i18n 부담     | M2.7 namespace 분리                    |
| 디자인 HTML → React 변환 오류           | 중     | UI break      | 페이지별 Playwright 시각 비교          |

## 8. v2와의 관계

- v2 `Plan-v2-scenario-B.md`의 Phase γ ~ ζ는 그대로 유효
- 본 v3는 v2의 ζ.7 (베타 매장 onboarding) 진입 전에 **Mock으로 외부 데모를 가능케 하는 단계** 추가
- v3 M5 완료 + Jayden 사업자 등록 후 → v2 ζ.7 진입

## 9. 변경 이력

- v3.0 (2026-05-11, 세션 9): Mock-first 5 phase 분해 + env flag 5개 도입 (M1.1 시작)
- v3.1 (2026-05-14, 세션 33): RED 프로젝트 정책 (`feedback_demo_no_personal_env_dependency.md`) 반영. M5.1 (preview bypass) + M5.4 (preview demo env 등록) 폐기 → prod 단일 baseline. Sprint 2 12 PR 머지 + prod e2e 13/14 통과로 M5.2 / M5.3 완료. M5.5는 사업자 등록 후 작성 보류.

## 관련 문서

- v2 풀 P0 계획: `docs/Plan-v2-scenario-B.md`
- 데모 가이드 (경량): `docs/demo-guide.md`
- 베타 onboarding 체크리스트: `docs/beta-onboarding-checklist.md`
- Stress test 가이드 (ζ.4): `docs/stress-test-guide.md`
- 교훈: `docs/learnings.md` (L-087 새 env 7-layer / L-089 prod 배포 / L-091 ANTHROPIC_API_KEY)
