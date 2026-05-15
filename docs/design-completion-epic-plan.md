# Design Completion Epic — 전체 24 페이지 reference 100% 적용 plan (2026-05-15)

> **목표**: `docs/design/reference/` 80 files (HTML + CSS + JSX, claude.ai/design 출력) 청사진과 현재 코드를 **24 페이지 모두 100% 일치**시키기.
> **본 문서**: Phase 0 inventory 결과 + 페이지별 일치도 등급 + priority 분류 + 단계 분리 + 시간 추정.
> **다음 단계**: Jayden이 본 문서 기반 priority 결정 → 페이지 batch별 PR 진행.

---

## 측정 방법론

각 페이지 일치도는 다음 3 지표 종합:

1. **Line ratio**: `현재 코드 line / reference (HTML + JSX + CSS) line` — rough 작업 분량 시그널
2. **PR history**: 이미 reference 정합 작업이 머지된 PR 추적 (예: PR #165 landing batch 1+2)
3. **PDF/UI 비교**: 본 세션 PDF 검토 결과 + 알려진 누락 elements

**등급 기준** (L-082 시연 % 정신):

- ✅ **A (90%+)**: chrome + 위젯 + 데이터 wire + a11y 모두 정합. minor polish만 남음.
- 🟢 **B (70~90%)**: 핵심 elements 구현. shell 일부 누락 또는 데이터 wire 미완.
- 🟡 **C (40~70%)**: 페이지 자체 존재 + 일부 elements. shell + 위젯 다수 누락.
- 🔴 **D (<40%)**: 페이지 wrapper만 존재 또는 minimal 구현.

---

## Phase 0 — 24 페이지 매핑 + 일치도 inventory

### Customer 영역 (10 페이지)

| #   | 페이지                  | Reference                                           | 현재 코드                                                                    | Line ratio | PR history               | 일치도         | 예상 작업                             |
| --- | ----------------------- | --------------------------------------------------- | ---------------------------------------------------------------------------- | ---------- | ------------------------ | -------------- | ------------------------------------- |
| C1  | Customer Landing        | `landing-app.jsx` + `landing.css` (711)             | `c/page.tsx` (142) + `customer-landing.tsx` (650)                            | ~95%       | PR #165 + Sprint 2A #177 | **🟢 B (85%)** | 1~2d (data wire + minor polish)       |
| C2  | Customer Chat           | `chat-app.jsx` + `chat.css`                         | `c/chat/page.tsx` (61) + `customer-chat.tsx` (391)                           | ~60%       | Sprint 2A #178           | **🟡 C (60%)** | 2~3d (mock 정합 + 다국어 polish)      |
| C3  | Customer MyPage         | `mypage-app.jsx` + `mypage.css` (690)               | `c/mypage/page.tsx` (199) + `my-page-tabs.tsx` (616)                         | ~80%       | Sprint 2A #179           | **🟢 B (80%)** | 2d (실 데이터 wire prerequisite)      |
| C4  | Customer Sign-in        | `login-app.jsx` + `login.css`                       | `c/sign-in/page.tsx` (109) + customer-auth/ (3 form)                         | ~70%       | PR #194 (OAuth fallback) | **🟢 B (75%)** | 1d (reference 디테일 정합)            |
| C5  | Customer Store Detail   | `detail-app.jsx` (789) + `detail.css` (1271)        | `c/store/[id]/page.tsx` (290) + store-detail-customer/                       | ~50%       | (기존 풀 구현)           | **🟡 C (65%)** | 3~4d (Tabs + Stylists + Reviews 정합) |
| C6  | Booking Schedule        | `schedule-app.jsx` + `schedule.css` (683)           | `c/store/[id]/book/schedule/page.tsx` (157) + `book-schedule-form.tsx` (358) | ~55%       | Sprint 2B #180           | **🟡 C (60%)** | 2~3d                                  |
| C7  | Booking Confirmation    | `booking-app.jsx` + `booking.css`                   | `c/store/[id]/book/confirm/page.tsx` (190)                                   | ~40%       | —                        | **🔴 D (40%)** | 3d                                    |
| C8  | Payment                 | `payment-app.jsx` + `payment.css` (711)             | `c/store/[id]/pay/page.tsx` (208) + `mock-payment-form.tsx` (372)            | ~55%       | (mock-first)             | **🟡 C (55%)** | 2~3d (mock UI 정합)                   |
| C9  | AI Photo Analysis       | `ai-flow-app.jsx` + `ai-flow.css` (889)             | `c/photo-analyze/page.tsx` (71) + `photo-analyze-flow.tsx` (348)             | ~40%       | Epic B                   | **🟡 C (50%)** | 3~4d (flow stepper 정합)              |
| C10 | Store Photos (Customer) | `store-photos.jsx` (668) + `store-photos.css` (872) | `c/store/[id]/photos/page.tsx` (87)                                          | ~15%       | —                        | **🔴 D (25%)** | 4~5d                                  |

**Customer 영역 합**: ~23~31일

### Owner 영역 (9 페이지)

| #   | 페이지              | Reference                                                                                           | 현재 코드                                                              | Line ratio | PR history                   | 일치도         | 예상 작업                                              |
| --- | ------------------- | --------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------- | ---------- | ---------------------------- | -------------- | ------------------------------------------------------ |
| O1  | **Store Dashboard** | `dashboard-app.jsx` (998) + `dashboard.css` (1573)                                                  | `store/dashboard/page.tsx` (374)                                       | ~15%       | (기본 KPI grid만)            | **🔴 D (30%)** | **5~7d (위젯 9종 + shell + AI 인사이트 + 알림 panel)** |
| O2  | Owner Inbox         | `inbox-app.jsx` (912) + `inbox.css` (1261)                                                          | `store/inbox/page.tsx` + features/inbox/ (5 컴포넌트 ~1080)            | ~50%       | M6.3d + Epic 1B-UI + PR #160 | **🟢 B (75%)** | 2~3d (composer batch 후속 + ContextPanel 데이터)       |
| O3  | Owner Bookings      | `bookings-app.jsx` + `bookings-views.jsx` (1004) + `bookings.css` (1552)                            | `store/bookings/page.tsx` (174) + features/booking/ (5 컴포넌트 ~1100) | ~50%       | Sprint 2B #180 (calendar)    | **🟡 C (65%)** | 3~4d                                                   |
| O4  | Owner Services      | `services-app.jsx` + `services-views.jsx` + `services.css` (1637)                                   | `store/services/page.tsx` (137) + features/store-services/ (3 ~940)    | ~45%       | Sprint 2C #187               | **🟡 C (60%)** | 3~4d                                                   |
| O5  | Owner Customers     | `customers-app.jsx` + `customers-detail.jsx` (704) + `customers-table.jsx` + `customers.css` (1496) | `store/customers/page.tsx` (114) + features/store-customers/ (1 ~320)  | ~25%       | —                            | **🔴 D (40%)** | 4~5d                                                   |
| O6  | Owner Analytics     | `analytics-app.jsx` + `analytics-charts1.jsx` + `analytics-charts2.jsx` + `analytics.css` (916)     | `store/analytics/page.tsx` (315) + features/analytics/ (1 ~395)        | ~40%       | Sprint 2B #182               | **🟡 C (60%)** | 3~4d                                                   |
| O7  | Owner Store Photos  | `store-photos-app.jsx` + `store-photos.jsx` (668) + `store-photos.css` (872)                        | `store/photos/page.tsx` (135) + `photo-board.tsx` (463)                | ~50%       | Sprint 2B #183               | **🟡 C (65%)** | 2~3d                                                   |
| O8  | Owner Settings      | `settings-app.jsx` (1257) + `settings.css` (1554)                                                   | `store/settings/page.tsx` (312) + features/store-settings/ (2 ~880)    | ~45%       | Sprint 2B #181               | **🟡 C (60%)** | 3~4d                                                   |
| O9  | Owner Store Login   | `login-store-app.jsx` + `login-store.css` (764)                                                     | `sign-in/page.tsx` + form-panel + brand-panel                          | ~55%       | M1.4                         | **🟢 B (75%)** | 1~2d (디테일 polish)                                   |

**Owner 영역 합**: ~26~36일

### Admin 영역 (5 페이지)

| #   | 페이지          | Reference                                     | 현재 코드                                                                                  | Line ratio | PR history                     | 일치도         | 예상 작업           |
| --- | --------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------ | ---------- | ------------------------------ | -------------- | ------------------- |
| A1  | Admin Dashboard | HTML self (702) + `admin-dashboard.css` (912) | `admin/dashboard/page.tsx` (538) + AdminShell                                              | ~70%       | PR #151 + #158 (5/5 위젯 wire) | **🟢 B (85%)** | 1~2d (minor polish) |
| A2  | Admin AI Cost   | HTML self (665) + `admin-ai-cost.css` (1153)  | `admin/ai-cost/page.tsx` (261) + mock-extras (352)                                         | ~50%       | Sprint 2C #184                 | **🟡 C (65%)** | 2~3d                |
| A3  | Admin KYC       | HTML self (792) + `admin-kyc.css` (1702)      | `admin/kyc-test/page.tsx` (789) + store-verifications/page.tsx (93) + kyc-queue-mock (264) | ~60%       | Sprint 2C #185                 | **🟡 C (65%)** | 3~4d                |
| A4  | Admin Payments  | HTML self (869) + `admin-payments.css` (1865) | `admin/payment-monitoring/page.tsx` (253) + mock-extras (276)                              | ~30%       | Sprint 2C #186                 | **🟡 C (55%)** | 4~5d                |
| A5  | Admin Login     | HTML self (175) + `admin-login.css`           | (별도 admin login 없음, owner sign-in 공유)                                                | ~0%        | —                              | **🔴 D (0%)**  | 1d (또는 폐기 결정) |

**Admin 영역 합**: ~11~15일

---

## 단계 분리 + Priority 분류

### P0 — 베타 출시 차단선 (8 페이지, ~17~25일)

L-082 외부 시연 baseline. 베타 매장 매칭 전에도 시연 가능해야 함.

1. **O1 Store Dashboard** 🔴 (5~7d) ← 가장 큰 차단선
2. **C1 Customer Landing** 🟢 (1~2d)
3. **C2 Customer Chat** 🟡 (2~3d)
4. **C3 Customer MyPage** 🟢 (2d)
5. **C4 Customer Sign-in** 🟢 (1d)
6. **C5 Customer Store Detail** 🟡 (3~4d)
7. **O2 Owner Inbox** 🟢 (2~3d)
8. **O9 Owner Store Login** 🟢 (1~2d)

### P1 — 베타 후 1주 내 (9 페이지, ~24~32일)

1. **C6 Booking Schedule** 🟡 (2~3d)
2. **C7 Booking Confirmation** 🔴 (3d)
3. **C8 Payment** 🟡 (2~3d)
4. **C9 AI Photo Analysis** 🟡 (3~4d)
5. **C10 Customer Store Photos** 🔴 (4~5d)
6. **O3 Owner Bookings** 🟡 (3~4d)
7. **O4 Owner Services** 🟡 (3~4d)
8. **O7 Owner Store Photos** 🟡 (2~3d)
9. **O8 Owner Settings** 🟡 (3~4d)

### P2 — 베타 후 1개월 (7 페이지, ~19~26일)

1. **O5 Owner Customers** 🔴 (4~5d)
2. **O6 Owner Analytics** 🟡 (3~4d)
3. **A1 Admin Dashboard** 🟢 (1~2d)
4. **A2 Admin AI Cost** 🟡 (2~3d)
5. **A3 Admin KYC** 🟡 (3~4d)
6. **A4 Admin Payments** 🟡 (4~5d)
7. **A5 Admin Login** 🔴 (1d, 폐기 가능)

---

## 전체 분량 추정 (정밀도 ±30%)

| Priority              | 페이지 수 | 예상 분량               | 데이터 prerequisite                            |
| --------------------- | --------- | ----------------------- | ---------------------------------------------- |
| P0 (베타 출시 차단선) | 8         | **3~5주**               | 일부 mock (베타 매장 prerequisite은 후속 wire) |
| P1 (베타 후 1주)      | 9         | **5~7주**               | 베타 매장 매칭 후                              |
| P2 (베타 후 1개월)    | 7         | **4~6주**               | 운영 1개월 누적 데이터                         |
| **합계**              | 24        | **12~18주 (3~4.5개월)** | —                                              |

---

## 페이지 batch 진행 방식 (세션 34 패턴 차용)

각 페이지 = **1 PR + 단일 세션 또는 다세션**:

1. **0. Inventory** — reference HTML + JSX + CSS 정독 + 현재 코드 diff (30분~1h)
2. **1. Plan v1** — 누락 elements 리스트 + 시간 추정 + Jayden 승인
3. **2. 코드 작업** — i18n 동반 (6 locale) + 시각 검증
4. **3. CI dispatch + main sanity** — e2e-integration 통과 (L-100 cadence)
5. **4. PROGRESS + L-082 시연 % 갱신** — 객관 측정 후 % 반영

batch cadence: P0 페이지 8개 → 8 PR + 페이지당 1~5일 분량.

---

## 권장 진행 순서 (P0)

L-082 (외부 시연 baseline) + 페이지 의존도 고려:

```
주 1: O9 Owner Store Login (polish, 1~2d) + C4 Customer Sign-in (polish, 1d) + C1 Customer Landing (1~2d)
주 2: C3 Customer MyPage (2d) + C2 Customer Chat (2~3d)
주 3~4: C5 Customer Store Detail (3~4d) + O2 Owner Inbox (2~3d)
주 5~6: O1 Owner Store Dashboard (5~7d) ← 가장 큰 차단선, 마지막
```

→ **5~7주 (~25~35 영업일)** 가장 차단선 큰 부분 완료.

---

## Jayden 결정 필요 4항목

### 1. Epic 우선순위 vs 베타 매장 매칭

본 Epic 5~7주 분량 vs 베타 매장 매칭 (Jayden 비즈니스 액션). **순서 결정**:

- **옵션 α**: 본 Epic P0 먼저 완성 → 그 후 베타 매장 매칭 (디자인 완성 시연 영상 촬영 가능)
- **옵션 β**: 베타 매장 매칭 먼저 (실 데이터 충족) → Epic 진행 시 실 데이터로 정합 검증
- **옵션 γ**: 병렬 (Jayden은 매장 매칭, Claude는 디자인 작업)

### 2. P0 페이지 정밀 inventory 시점

본 doc은 line ratio 기반 rough 등급. P0 8 페이지 각각 정밀 inventory (reference 정독 → diff → 누락 elements 리스트)는 **batch 시작 직전 진행 권장**. 미리 8 페이지 다 inventory하면 1~2일 소요.

### 3. mock-first 페이지 처리 정책

C8 Payment / C10 Customer Photos / A2/A3/A4 Admin 영역은 mock 의존. 100% 정합 = **mock data가 reference와 동일**을 의미. 베타 매장 매칭 후 실 데이터 wire는 별도 (`docs/post-design-dev-tasks.md` B 참조).

### 4. 진행 cadence

- **fast track**: 1 페이지 / 1 세션 (P0 8 페이지 = 8 세션)
- **batch**: 2~3 페이지 / 1 세션 (전체 P0 = 3~4 세션)
- **단일 세션 full Epic**: 불가능 (분량 초과)

---

## 다음 단계

1. **Jayden 결정 4항목 응답**
2. **Phase 1 시작 (P0 첫 페이지 정밀 inventory)** — 권장 O9 Owner Store Login 또는 C1 Customer Landing (가장 작은 분량)
3. 각 페이지 PR cadence → main 머지 → PROGRESS 갱신 → 다음 페이지

---

## 참조

- `docs/design/reference/` — 80 files 디자인 청사진 (claude.ai/design 출력, 2026-05-13)
- `docs/post-design-dev-tasks.md` — 디자인 외 마무리 코드 작업 목록
- 본 세션 PDF 검토 결과 — Owner Store Dashboard 30% 시연 분석 baseline
- L-082 (e2e 시연 기준 자기평가) / L-100 (vitest 0 fail cadence)
