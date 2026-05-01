# DESIGN-PLAN.md — Hesya UX/UI 디자인 계획서

> **버전**: v1.0
> **작성일**: 2026-04-30
> **작업 도구**: [Claude Design](https://claude.ai/design) (Anthropic Labs Research Preview)
> **연관 문서**: PRD.md (§ 6.3, § 13), DECISIONS.md (§ 1.1, § 2.1), DEVELOPMENT-PLAN.md (§ 3.1)
> **연관 디자인 시스템**: `~/.claude/skills/design-system.md` v3.0

---

## 1. 디자인 작업 도구 — Claude Design

**위치**: https://claude.ai/design (Anthropic Labs Research Preview)

### 시작 옵션 4가지

| 옵션          | 용도                 | Hesya 사용     |
| ------------- | -------------------- | -------------- |
| **Prototype** | 페이지·플로우 디자인 | ✅ 모든 페이지 |
| Slide deck    | 발표 자료            | ❌             |
| From template | 기존 템플릿 시작     | ❌             |
| Other         | 기타                 | ❌             |

### Prototype 모드

| 모드              | 용도                | Hesya 권장                    |
| ----------------- | ------------------- | ----------------------------- |
| Wireframe         | 구조·레이아웃 검증  | 옵션 (P0 페이지 사전 검토 시) |
| **High fidelity** | 실제 픽셀·색상 적용 | ✅ 기본                       |

### 권장 워크플로우

```
[1] Claude Design에서 "Hesya Design System" Prototype 1개 만들기 (토큰 + 컴포넌트 12개)
[2] 페이지별 Prototype 별도 생성, 동일 Design System 참조
[3] Jayden이 결과를 스크린샷·링크로 공유 → Claude Code가 shadcn/ui + Tailwind 코드로 변환
```

---

## 2. 사용자 그룹 (3개)

> 비유: **"3개의 다른 입구를 가진 한 건물"**. 같은 데이터를 보지만 화면 구성이 완전히 다름.

| 그룹                   | 누구                  | 주 디바이스       | 디자인 방향                         |
| ---------------------- | --------------------- | ----------------- | ----------------------------------- |
| 🛍️ **고객** (Customer) | 한국 매장 찾는 외국인 | 모바일 (PWA)      | **Mobile-first**, 사진 중심, 다국어 |
| 🏪 **매장** (Store)    | 가맹점 사장·직원      | 데스크톱 + 태블릿 | **Desktop-first**, 정보 밀도 높게   |
| 🛠️ **운영자** (Admin)  | Hesya 본사            | 데스크톱          | **데이터 테이블 중심**, 검수 도구   |

---

## 3. Phase 1 (Day 0~30) 페이지 목록 — 총 23개

### 🛍️ 고객 앱 (Customer, PWA — Mobile-first) — 9페이지

| #   | 페이지                     | 우선순위 | 핵심 UX                                                 |
| --- | -------------------------- | -------- | ------------------------------------------------------- |
| 1   | 랜딩 (검색·지역)           | 🔴 P0    | 큰 검색바, 지역 칩, 인기 매장 카드                      |
| 2   | 매장 상세                  | 🔴 P0    | 사진 갤러리(스와이프), 시술 메뉴, 리뷰, 예약 CTA 고정   |
| 3   | 시술 사진 업로드 + AI 분석 | 🔴 P0    | 카메라/갤러리 → 업로드 → AI 결과 카드 (Opus 4.7 Vision) |
| 4   | 예약 일정 선택             | 🔴 P0    | 캘린더 + 시간 슬롯, 직원 선택                           |
| 5   | 결제                       | 🔴 P0    | Stripe / Alipay / WeChat Pay 탭, 금액 요약              |
| 6   | 예약 확인                  | 🔴 P0    | QR 코드, 매장 지도, 알림 안내                           |
| 7   | 채팅 (AI 통역)             | 🟡 P1    | 메시지 버블, 자동 번역 토글, 사진 첨부                  |
| 8   | 마이페이지                 | 🟡 P1    | 탭(진행중/완료/취소), 즐겨찾기                          |
| 9   | 로그인 / 가입              | 🔴 P0    | Google OAuth 큰 버튼 + 이메일 보조                      |

### 🏪 매장 대시보드 (Store, Desktop-first) — 9페이지

| #   | 페이지                  | 우선순위 | 핵심 UX                                               |
| --- | ----------------------- | -------- | ----------------------------------------------------- |
| 10  | 매장 로그인             | 🔴 P0    | 단일 폼, 매장 식별 명확                               |
| 11  | 대시보드 홈             | 🔴 P0    | KPI 4카드(오늘 예약/매출/대기/알림) + 그래프          |
| 12  | 통합 인박스 (Epic 1)    | 🔴 P0    | 좌측 채널 리스트 + 중앙 채팅 + 우측 고객 정보 (3컬럼) |
| 13  | 예약 관리               | 🔴 P0    | 캘린더 뷰 + 리스트 토글, 드래그로 시간 변경           |
| 14  | 시술 메뉴 관리          | 🔴 P0    | 카드 그리드, 다국어 탭(ko/en/ja/zh-CN/zh-TW/vi)       |
| 15  | 고객 관리               | 🟡 P1    | 데이터 테이블 + 검색, 시술 이력 모달                  |
| 16  | 사진 분석 결과 (Epic 3) | 🟡 P1    | 원본 vs AI 분석 비교 뷰                               |
| 17  | 매출/통계               | 🟡 P1    | 차트 위주(일/주/월 토글)                              |
| 18  | 매장 설정               | 🟡 P1    | 폼(영업시간/직원/연락처)                              |

### 🛠️ 관리자 패널 (Admin, Hesya 운영자) — 5페이지 (Phase 1 핵심)

| #   | 페이지         | 우선순위 | 핵심 UX                                      |
| --- | -------------- | -------- | -------------------------------------------- |
| 19  | 운영자 로그인  | 🔴 P0    | 매장 로그인과 시각적 구분                    |
| 20  | Admin 대시보드 | 🟡 P1    | 전체 매장 현황 + 주요 알림                   |
| 21  | 매장 KYC 검증  | 🔴 P0    | LOCALDATA 미용업 등록 + 승인/거절 워크플로우 |
| 22  | 결제/정산      | 🔴 P0    | 매장별 정산 표, 환불 처리                    |
| 23  | AI 비용 관리   | 🟡 P1    | Opus/Sonnet 사용량 그래프, task_budget 설정  |

> ⚠️ Epic 12의 나머지 3개 운영자 플로우(공지·분쟁CS·고객관리)는 **Phase 1.5로 연기**.

### 우선순위 요약

| 우선순위          | 페이지 수 | 디자인 작업 시점                         |
| ----------------- | --------- | ---------------------------------------- |
| 🔴 P0 (필수)      | 14페이지  | Phase 1A·1B·1C·1D (디자인 시작 ~ Day 10) |
| 🟡 P1 (중요)      | 9페이지   | Phase 1E (Day 10~15)                     |
| 🟢 P2 (Phase 1.5) | 미정      | Day 38 이후                              |

---

## 4. 디자인 시스템 토큰 — v4.1 글로벌 + 핸드오프 v1.0 확정

> 글로벌 가이드 `~/.claude/skills/design-system.md` v4.1을 base로 하고, Hesya 고유 결정은 **핸드오프 v1.0 (2026-05-01 수령, `docs/design/handoff/tokens.css`)** 으로 확정.

### 4.1 색상 — 확정 (Peach + Amber + Navy)

```css
/* 핸드오프 v1.0 tokens.css 발췌 — 단일 진실 소스 */

/* Brand — Peach scale + Amber accent + Navy text */
--hesya-peach-50: #fdf8f1; /* 페이지 기본 배경 (body) */
--hesya-peach-100: #f8e9d9; /* 카드·섹션 배경 */
--hesya-peach-200: #f5ddc8; /* hover·강조 표면 */
--hesya-amber-500: #e8a97a; /* primary brand color */
--hesya-amber-600: #d88b5b; /* primary hover */
--hesya-navy-900: #1a2238; /* 본문 텍스트 (대비 ≥ 4.5:1) */

/* Trust 레이어 ⭐ Hesya 고유 — PRD § 6 K-Verified 시각 시스템 */
--trust-rose: #e8c4d6; /* 매장 트러스트 보조 */
--share-glow: #f8d7c8; /* SNS 공유 액션 강조 */
--kverified-gold: #d4af37; /* 한국 정부 검증(KYC 통과) 매장 골드 뱃지 */

/* Semantic */
--semantic-success: #2a9d5c;
--semantic-warning: #e8a117;
--semantic-danger: #dc3545;
--semantic-info: #5b9bd5;

/* Neutrals */
--gray-50: #fafbfc;
--gray-100: #f1f3f5;
--gray-300: #adb5bd;
--gray-500: #6c757d;
--gray-700: #3d4551;
--gray-800: #2b3038;
--gray-900: #1a1e24;
```

> **결정 근거 (2026-05-01)**: § 4 권장안(따뜻한 코랄/살구톤)을 채택. Peach/Amber 조합은 미용·환대 업종 정체성에 부합 + 외국인 관광객의 따뜻한 환대감 전달. Navy 900 텍스트는 본문 대비 7:1 확보 (WCAG 2.2 AAA 가능 영역).

### 4.2 폰트 — 확정

```css
--font-display:
  "Fraunces", "Pretendard Variable", "Pretendard", ui-serif, Georgia, serif;
--font-body-en:
  "Source Sans 3", "Pretendard Variable", "Pretendard", ui-sans-serif,
  system-ui, sans-serif;
--font-body-kr:
  "Pretendard Variable", "Pretendard", "Source Sans 3", ui-sans-serif,
  sans-serif;
--font-mono: "JetBrains Mono", ui-monospace, SFMono-Regular, Menlo, monospace;
```

> **결정 근거**: Fraunces(editorial serif, variable axis 풍부) + Source Sans 3(영문 본문) + Pretendard Variable(한글 본문). 모두 글로벌 v4.1 허용 리스트 안. 한글 본문은 `word-break: keep-all` + `line-height: 1.8` (글로벌 A2.2 준수).

### 4.3 공간·모서리·그림자 — 확정

| 토큰       | 값                                                                                                                     |
| ---------- | ---------------------------------------------------------------------------------------------------------------------- |
| **space**  | 4 / 8 / 12 / 16 / 20 / 24 / 32 / 40 / 48 / 64 / 80 px (글로벌 v4.1 base grid)                                          |
| **radius** | 8 / 12 / 16 / 20 / 24 / 9999 (sm/md/lg/xl/2xl/full)                                                                    |
| **shadow** | `--shadow-{0,1,2,3,4}` 5단계 — 모두 2-layer composite (가까운 + 먼). `none / 1px+3px / 2px+12px / 4px+32px / 8px+64px` |

### 4.4 모션 — 확정

```css
--duration-fast: 120ms; /* 글로벌 150ms보다 sharp */
--duration-normal: 220ms;
--duration-slow: 420ms;
--easing-standard: cubic-bezier(0.4, 0, 0.2, 1);
--easing-spring: cubic-bezier(0.34, 1.56, 0.64, 1);

/* prefers-reduced-motion: reduce → 0ms 강제 (글로벌 A3.4 준수) */
```

### 4.5 공용 컴포넌트 (디자인 시스템 첫 산출물 — 14개로 확장)

핸드오프 v1.0에서 **AI Flow + iOS Frame** 추가됨:

```
1.  Button       — primary / secondary / ghost / destructive
2.  Card         — 매장 / 시술 / 예약 / KPI (K-Verified 골드 뱃지 변형 포함)
3.  Input        — 텍스트 / 텍스트영역
4.  Select       — 단일 / 다중
5.  DatePicker   — 캘린더 + 시간 슬롯
6.  Modal        — 중앙 확인용
7.  Sheet        — 모바일 슬라이드업, 사이드 패널
8.  Toast        — 성공 / 경고 / 에러 / 정보
9.  Badge        — 상태 라벨 + ⭐ K-Verified 골드 (kverified-gold)
10. Avatar       — 매장 로고 / 직원 / 고객
11. Tabs         — 콘텐츠 분리
12. Navigation   — 헤더 / 사이드바 / 모바일 탭바
13. AiFlow       ⭐ — AI 통역·응답 흐름 시각화 (Inbox·Chat·Photo Analysis 가로질러 사용)
14. IosFrame     ⭐ — PWA 모바일 미리보기 (개발 시 iOS Safe Area + status bar 시뮬레이션)
```

> 13·14 구현 위치: `packages/shared-ui/src/`. 핸드오프 `ai-flow-app.jsx` / `ios-frame.jsx` 시각만 매칭하고 React 19 + Tailwind v4로 재작성 (handoff README 원칙).

### 4.6 핸드오프 → 코드 매핑 위치

```
docs/design/handoff/                 ← 시각 진실 소스 (HTML 프로토타입)
├── tokens.css                        → apps/web/src/app/globals.css  (@theme 매핑)
├── components.css                    → packages/shared-ui/src/*       (컴포넌트별 분해)
├── *.css (페이지별)                   → apps/web/src/app/<route>/page.module.css 또는 Tailwind
└── *.jsx (40개)                      → 시각 참조 전용. 그대로 import 금지.
```

---

## 5. 그룹별 UX/UI 가이드

### 🛍️ 고객 (외국인 모바일 사용자)

- **언어 자동 감지** + 우상단 언어 스위처 (5개 언어 + 베트남어, 총 6개)
- **사진 우선** — 시술 결과 사진이 텍스트보다 강력. 매장 카드의 50% 이상이 이미지
- **결제 통화 자동 변환** — 한국은행 환율 API 사용, 자국 통화 보조 표시
- **터치 영역 최소 44×44pt** (Apple HIG)
- **하단 고정 CTA** — 예약/결제 버튼 항상 보이게 (sticky bottom)
- **로딩 상태 명확히** — AI Vision 분석 1~3초, 진행 표시 + 친절한 메시지
- **PWA 설치 유도** — 첫 방문 시 홈화면 추가 프롬프트 (저빈도)

### 🏪 매장 (한국인 데스크톱 사용자)

- **정보 밀도 높음** — 한 화면에 많이 보이게, 모바일 대비 폰트 작게도 OK
- **단축키 지원** — ⌘K 검색, ⌘N 새 예약 등 (Phase 1 후반)
- **알림은 우상단 + 소리** — 새 인박스 메시지 즉시 인지
- **다국어 입력 도움** — 시술 메뉴 한국어 입력 → AI 자동 번역 옵션
- **테이블 정렬·필터** 필수 — 고객/예약/매출 모두
- **바쁜 시간대 빠른 조작** — 예약 변경 드래그앤드롭, 인박스 키보드 탐색

### 🛠️ 운영자 (Hesya 본사)

- **데이터 테이블 위주** — 50~100행 한 페이지에 표시
- **승인/거절 워크플로우 명확** — KYC 검수 시 단계 진행 막대
- **감사 로그(audit trail)** — "누가 언제 무엇을 했는지" 모든 액션에 기록
- **위험 작업 2단계 확인** — 매장 정지, 환불 등은 입력 + 확인
- **시각적 톤 매장과 구분** — 운영자임을 한눈에 알 수 있게 색상 차이

---

## 6. 디자인 작업 순서 (10~15일 소요)

```
[Phase 1A — 디자인 시스템] (1~2일)
  └─ Claude Design에서 "Hesya Design System" Prototype 생성
  └─ 색상 토큰, 타이포그래피, 공용 컴포넌트 12개
  └─ 한국어 + 영어 텍스트 자간 차이 적용

[Phase 1B — 고객 P0] (3~4일)
  └─ 페이지 1, 2, 3, 4, 5, 6, 9 (7페이지)

[Phase 1C — 매장 P0] (3~4일)
  └─ 페이지 10, 11, 12, 13, 14 (5페이지)

[Phase 1D — 운영자 P0] (1~2일)
  └─ 페이지 19, 21, 22 (3페이지)

[Phase 1E — P1 보강] (2~3일)
  └─ 페이지 7, 8, 15, 16, 17, 18, 20, 23 (8페이지)
```

### 시작 추천 5단계

1. **공용 컴포넌트 12개 먼저** — 모든 페이지가 이걸 가져다 씀
2. **페이지 1: 고객 랜딩** — 첫 인상, 가장 중요
3. **페이지 12: 매장 통합 인박스** — Hesya의 차별화 포인트
4. **페이지 3: AI 사진 분석** — 시각 임팩트 큰 핵심 기능
5. **나머지 P0 페이지 빠르게**

---

## 7. 디자인 → 코드 변환 흐름

```
[디자인 단계 — Claude Design]
  Jayden이 직접 작업
       ↓ (스크린샷 또는 Prototype 링크 공유)
[코드 변환 단계 — Claude Code]
  frontend-dev / frontend-design 에이전트 호출
       ↓
  apps/web/src/features/<feature>/components/  ← 페이지별 컴포넌트
  packages/shared-ui/src/                       ← 재사용 공용 컴포넌트
       ↓
[검증 단계]
  next dev 4200 → Jayden 브라우저 확인 → 피드백 반영
```

---

## 8. 결정 필요 항목 ⏳

다음 세션에서 디자인 작업 시작 전에 정해야 할 것:

| #   | 결정 사항                | 선택지                                                   | 추천                                                                            |
| --- | ------------------------ | -------------------------------------------------------- | ------------------------------------------------------------------------------- |
| 1   | Brand 색상               | A. 파랑 / B. 코랄 / C. 미정 (Prototype에서 시각 비교 후) | **C** (디자인 시스템 단계에서 시각 비교)                                        |
| 2   | 첫 작업 시작점           | A. 디자인 시스템 / B. 특정 페이지(랜딩 등)               | **A** (공용 컴포넌트 먼저)                                                      |
| 3   | Wireframe 단계 포함 여부 | A. 바로 High fidelity / B. P0만 Wireframe 먼저           | **A** (1인 작업 효율)                                                           |
| 4   | 다국어 우선순위          | 한국어·영어 먼저 vs 6개 동시                             | **한국어·영어 먼저** (Phase 1), 나머지는 AI 자동 번역으로 채우기 (Phase 1 후반) |

---

## 9. 변경 이력

| 버전 | 날짜       | 변경 사항                                                                            |
| ---- | ---------- | ------------------------------------------------------------------------------------ |
| v1.0 | 2026-04-30 | 초안 작성 — Phase 1 23페이지 정의, 디자인 시스템 v3.0 매핑, Claude Design 워크플로우 |
