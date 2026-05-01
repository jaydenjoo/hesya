# Hesya Design Handoff v1.0 — 페이지 인덱스

> 출처: Jayden이 [Claude Design (claude.ai/design)](https://claude.ai/design)에서 제작한 24개 HTML 프로토타입 + 디자인 시스템 토큰
> 수령일: 2026-05-01
> 정식 source: `hesya.zip` (= `hesya-handoff/hesya/project/`, 두 ZIP 내용 동일)

## ⚠️ 구현 원칙 (HANDOFF-README.md 인용)

> **The design medium is HTML/CSS/JS — these are prototypes, not production code.**
> Your job is to recreate them **pixel-perfectly** in whatever technology makes
> sense for the target codebase (React, Vue, native, whatever fits).
> **Match the visual output; don't copy the prototype's internal structure.**

→ Hesya는 **Next.js 16.2 App Router + Tailwind v4 + shadcn/ui** 환경. JSX 파일은 시각 참조용이며 **그대로 import 금지**. tokens.css의 토큰 값은 Tailwind v4의 `@theme` 또는 globals.css `@layer base`에 1:1 매핑.

## 📑 24개 페이지 ↔ DESIGN-PLAN 매핑

### 디자인 시스템 가이드 (1)

| 파일                       | 역할                                             |
| -------------------------- | ------------------------------------------------ |
| `Hesya Design System.html` | 토큰·컴포넌트 시각 카탈로그 (Phase 1A 첫 산출물) |

### 🛍️ 고객 앱 (PWA, Mobile-first) — 9 페이지

| DP # | 디자인 파일                       | 우선순위 | 핵심 UX                   |
| ---- | --------------------------------- | -------- | ------------------------- |
| 1    | `Hesya Customer Landing.html`     | 🔴 P0    | 검색·지역 칩·매장 카드    |
| 2    | `Hesya Store Detail.html`         | 🔴 P0    | 갤러리·시술 메뉴·예약 CTA |
| 3    | `Hesya AI Photo Analysis.html`    | 🔴 P0    | 사진 업로드 → Opus Vision |
| 4    | `Hesya Booking Schedule.html`     | 🔴 P0    | 캘린더 + 시간 슬롯        |
| 5    | `Hesya Payment.html`              | 🔴 P0    | Stripe / Alipay / WeChat  |
| 6    | `Hesya Booking Confirmation.html` | 🔴 P0    | QR · 지도                 |
| 7    | `Hesya Chat.html`                 | 🟡 P1    | AI 통역 메시지            |
| 8    | `Hesya MyPage.html`               | 🟡 P1    | 예약 이력 탭              |
| 9    | `Hesya Login.html`                | 🔴 P0    | Google OAuth 큰 버튼      |

### 🏪 매장 대시보드 (Desktop-first) — 9 페이지

| DP # | 디자인 파일                  | 우선순위 | 핵심 UX               |
| ---- | ---------------------------- | -------- | --------------------- |
| 10   | `Hesya Store Login.html`     | 🔴 P0    | 매장용 단일 폼        |
| 11   | `Hesya Store Dashboard.html` | 🔴 P0    | KPI 4카드 + 그래프    |
| 12   | `Hesya Inbox.html`           | 🔴 P0    | 3컬럼 통합 인박스     |
| 13   | `Hesya Bookings.html`        | 🔴 P0    | 캘린더/리스트 토글    |
| 14   | `Hesya Services.html`        | 🔴 P0    | 다국어 탭 카드 그리드 |
| 15   | `Hesya Customers.html`       | 🟡 P1    | 데이터 테이블         |
| 16   | `Hesya Store Photos.html`    | 🟡 P1    | 사진 분석 비교 뷰     |
| 17   | `Hesya Analytics.html`       | 🟡 P1    | 매출 차트             |
| 18   | `Hesya Store Settings.html`  | 🟡 P1    | 영업시간·직원 폼      |

### 🛠️ 관리자 패널 (Hesya 운영자) — 5 페이지

| DP # | 디자인 파일                  | 우선순위 | 핵심 UX                          |
| ---- | ---------------------------- | -------- | -------------------------------- |
| 19   | `Hesya Admin Login.html`     | 🔴 P0    | 매장 로그인과 시각 구분          |
| 20   | `Hesya Admin Dashboard.html` | 🟡 P1    | 전체 매장 현황                   |
| 21   | `Hesya Admin KYC.html`       | 🔴 P0    | LOCALDATA 검증 + 승인            |
| 22   | `Hesya Admin Payments.html`  | 🔴 P0    | 매장별 정산표                    |
| 23   | `Hesya Admin AI Cost.html`   | 🟡 P1    | Opus/Sonnet 사용량 + task_budget |

## 🎨 디자인 토큰 단일 진실 소스

`tokens.css` — 모든 페이지가 import. 구현 시 `apps/web/src/app/globals.css`에 1:1 매핑:

| 카테고리            | 토큰                                                                                         |
| ------------------- | -------------------------------------------------------------------------------------------- |
| **Brand**           | `--hesya-peach-{50,100,200}`, `--hesya-amber-{500,600}`, `--hesya-navy-900`                  |
| **Trust 레이어** ⭐ | `--trust-rose`, `--share-glow`, `--kverified-gold` (PRD § 6 K-Verified 시각 시스템)          |
| **Semantic**        | `--semantic-{success,warning,danger,info}`                                                   |
| **Radius**          | `--r-{sm,md,lg,xl,2xl,full}` (글로벌 v4.1 일치)                                              |
| **Shadow**          | `--shadow-{0~4}` (2-layer composite)                                                         |
| **Motion**          | `--duration-{fast,normal,slow}` (120/220/420ms) + `--easing-{standard,spring}`               |
| **Type**            | display=Fraunces / body-en=Source Sans 3 / body-kr=Pretendard Variable / mono=JetBrains Mono |

## 🆕 재사용 컴포넌트 (페이지에서 import)

| 파일                              | 역할                                                               | 구현 위치 (예정)                                           |
| --------------------------------- | ------------------------------------------------------------------ | ---------------------------------------------------------- |
| `ai-flow-app.jsx` + `ai-flow.css` | AI 통역·응답 흐름 시각화 (Inbox·Chat·Photo Analysis 가로질러 사용) | `packages/shared-ui/src/AiFlow.tsx`                        |
| `ios-frame.jsx`                   | PWA 모바일 미리보기 (iOS Safe Area + status bar)                   | `packages/shared-ui/src/IosFrame.tsx` (개발 미리보기 전용) |
| `components.css`                  | 공용 컴포넌트 스타일                                               | shadcn/ui + Tailwind v4 컴포넌트로 분해                    |

## 📦 자산 통계

- 24 HTML 페이지 (디자인 모형)
- 1 디자인 시스템 가이드 페이지
- 16 CSS 파일 (페이지별 + tokens + components)
- 40 JSX 파일 (시각 참조 전용)
- 총 **80 파일 / 1.3MB**

## 🔗 관련 문서

- `docs/DESIGN-PLAN.md` — Phase 1 디자인 일정 + 토큰 가이드
- `docs/PRD.md` § 6 — K-Verified 시각 트러스트 시스템 (2026-05-01 추가)
- `~/.claude/skills/design-system.md` v4.1 — 글로벌 디자인 헌장
- `docs/design/handoff/HANDOFF-README.md` — Anthropic 공식 핸드오프 가이드
