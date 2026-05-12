# Plan v3 M6 — Owner/Admin 디자인 정합성 (전면)

> 작성: 2026-05-12 (세션 19) | Plan v3 M1~M5 완료 후 신설.
> 트리거: Jayden 직접 지시 — "비개발자 외부사람은 시스템보다 디자인을 먼저 보고 판단. 디자인은 완벽해야 함."
> Memory: `feedback_design_first.md` (모든 프로젝트 적용 원칙).

## 0. 비전 + 전제

**비전**: 외부인이 Hesya 어떤 화면을 보더라도 **claude.ai/design 레퍼런스와 90%+ 시각 정합**. owner/admin 화면도 사장 시연 시 노출되므로 customer 측과 동일 수준의 디자인 완성도 보장.

**전제**:

1. 디자인 reference 81개 파일 `docs/design/reference/` 보유 ✅ (학습 완료)
2. 토큰 (`hesya-peach/amber/navy`, Fraunces, shadows 2-layer) `globals.css` 등록 완료 ✅
3. 필요한 건 **적용 작업** — 페이지 코드에서 토큰 실제 사용
4. 시연 % 산정 = `min(기능 %, 디자인 %)` (memory L-094 강화)

## 1. 페이지별 작업 분해 (10~13일)

### 우선순위 — 외부 시연 노출 빈도 + Jayden 지적 순서

| Task     | 페이지                                                          | 레퍼런스 파일                                                                                                   | 현재 충실도 | 예상      | 누적   |
| -------- | --------------------------------------------------------------- | --------------------------------------------------------------------------------------------------------------- | ----------- | --------- | ------ |
| **M6.1** | `/store/settings`                                               | `Hesya Store Settings.html` + `settings.css` (1554) + `settings-app.jsx` (1257)                                 | 21%         | **2일**   | 2일    |
| **M6.2** | `/store/dashboard`                                              | `Hesya Store Dashboard.html` + `dashboard.css` (1573) + `dashboard-app.jsx` (998)                               | 9%          | **2~3일** | 5일    |
| **M6.3** | `/store/inbox`                                                  | `Hesya Inbox.html` + `inbox.css` + `inbox-app.jsx`                                                              | ~10%        | **3~4일** | 9일    |
| **M6.4** | `/store/bookings` + `bookings/[id]`                             | `Hesya Bookings.html` + `bookings.css` + `bookings-app.jsx` + `bookings-views.jsx`                              | ~25%        | **1일**   | 10일   |
| **M6.5** | `/store/services`                                               | `Hesya Services.html` + `services.css` + `services-app.jsx` + `services-views.jsx`                              | ~10%        | **1일**   | 11일   |
| **M6.6** | `/store/customers`                                              | `Hesya Customers.html` + `customers.css` + `customers-app.jsx` + `customers-table.jsx` + `customers-detail.jsx` | ~10%        | **0.5일** | 11.5일 |
| **M6.7** | `/store/knowledge` + `/store/inbox-skipped` + `/store/disputes` | (관련 reference 없음 → owner 패턴 자체 사용)                                                                    | 10~20%      | **0.5일** | 12일   |
| **M6.8** | `/admin/dashboard`                                              | `Hesya Admin Dashboard.html` + `admin-dashboard.css`                                                            | 35%         | **1일**   | 13일   |
| **M6.9** | `/admin/ai-cost` + 기타 admin sub-page                          | `Hesya Admin AI Cost.html` + `admin-ai-cost.css` + 공통 `admin-chrome.css`                                      | 30%         | **1일**   | 14일   |

> M6.7은 별도 reference 없음 — M6.1~M6.6에서 추출한 공통 owner 패턴 (TopBar, NavSidebar, 페이지 chrome)을 재사용.

### Customer 측 (이미 70~90% 적용, 미세 polish만)

- M6.10 `/c/store/[id]/photos` (5 tokens → 50+) — **0.5일**
- M6.11 `/c/store/[id]/book/schedule` (3 → 50+) — **0.5일**
- M6.12 `/c/mypage` (3 → 50+) — **0.5일**
- M6.13 `/sign-in` polish + `/c/sign-in` polish — **0.5일**

**Customer polish 합산 2일 추가** = M6 전체 약 16일.

## 2. 페이지당 작업 절차 (의무)

각 M6.x task는 다음 순서로:

### 2-1. 인벤토리 (~15분)

- 레퍼런스 jsx + css 읽기 (full)
- 현재 page.tsx + 관련 features 코드 grep
- 차이점 표로 정리: 컴포넌트 / 레이아웃 / 색상 / 폰트 / 토큰 사용

### 2-2. Plan v1 작성

- 변경 파일 list
- 컴포넌트 분해 (어떤 부분을 별 component로 추출할지)
- 토큰 매핑 (reference CSS class → Tailwind utility 또는 globals.css 변환)
- Jayden 승인 대기

### 2-3. 구현

- page.tsx 위에 직접 또는 별 component 파일 신규
- Next.js 16 App Router + Tailwind v4 + `font-heading` (Fraunces) + `hesya-*` 토큰 사용
- 6 locale i18n 유지
- 반응형 (1440 → 768 → 모바일)

### 2-4. 검증

- type-check / lint / test / build 통과
- Playwright 또는 dev server에서 시각 확인 (가능하면 reference HTML과 side-by-side 비교 캡처)
- 토큰 grep 빈도: 최소 30+ 사용 (대시보드 같은 큰 페이지는 50+)

### 2-5. commit + push

- 브랜치: `design/m6-<task>` (예: `design/m6.1-settings`)
- PR auto-merge 라벨
- 한 페이지 한 PR (atomic review)

## 3. 공통 컴포넌트 우선 추출 (Phase 0)

여러 페이지가 공유하는 컴포넌트는 **M6.1 시작 전 공통 모듈 추출**. 그래야 M6.2~M6.7 작업이 빠름.

### Phase 0 산출물 (1일)

- `apps/web/src/features/shell/top-bar.tsx` 강화 — 검색바 + 알림 + 언어 토글 + 아바타
- `apps/web/src/features/shell/nav-sidebar.tsx` 강화 — 아이콘 + 카운트 뱃지 + 매장 카드
- `apps/web/src/components/ui/page-header.tsx` 신규 — eyebrow + Fraunces 큰 제목 + 우상단 액션
- `apps/web/src/components/ui/category-panel.tsx` 신규 (Settings에서 사용)
- 디자인 시스템 페이지(`/design-system`) 갱신 — 추출한 컴포넌트 데모 추가

이후 M6.1~M6.9는 이 컴포넌트들을 import해서 페이지별 콘텐츠만 채우는 패턴.

## 4. 검증 기준 (페이지당)

| 항목                                  | 합격선                   |
| ------------------------------------- | ------------------------ |
| 토큰 사용 빈도 grep                   | 30+ (큰 페이지 50+)      |
| Fraunces `font-heading` 사용          | 페이지 제목 1+           |
| reference HTML vs 실 렌더링 픽셀 차이 | ≤ 10% (구도 / 색 / 간격) |
| 6 locale 번역 유지                    | ✅                       |
| type-check / lint / test / build      | ✅                       |
| 반응형 (1440 / 768 / 모바일)          | ✅                       |
| 접근성 (focus-visible, contrast, alt) | WCAG 2.2 AA              |

## 5. 타임라인

```
Phase 0 (공통 컴포넌트 추출) ──── 1일
M6.1 Settings              ──── 2일   (Jayden 캡처 지적 페이지)
M6.2 Dashboard             ──── 2~3일 (첫 진입)
M6.3 Inbox                 ──── 3~4일 (핵심 운영)
M6.4 Bookings              ──── 1일
M6.5 Services              ──── 1일
M6.6 Customers             ──── 0.5일
M6.7 보조 페이지            ──── 0.5일
M6.8 Admin Dashboard       ──── 1일
M6.9 Admin sub-pages       ──── 1일
M6.10~13 Customer polish   ──── 2일
        ↓
약 15~17일 작업 (단일 작업자)
```

## 6. 디자인-First 원칙 적용 (memory 강화)

본 M6 phase는 memory `feedback_design_first.md` 첫 실행 case. 향후 모든 프로젝트의 PRD/Plan은:

1. 새 기능 PRD에 "디자인 레퍼런스" + "충실도 목표" 의무 섹션
2. Plan에 페이지 Task = (기능 + 디자인 토큰 + 레퍼런스 정합) 묶음 강제
3. PROGRESS 자기평가 갱신 시 `min(기능, 디자인) %` 계산

## 7. 관련 문서

- 전체 Plan v3: `docs/Plan-v3-mock-first.md`
- 베타 출시 갭 분석: `docs/beta-launch-gap-analysis.md`
- 디자인 레퍼런스: `docs/design/reference/` (81 files)
- 토큰 정의: `apps/web/src/styles/handoff/tokens.css` + `apps/web/src/app/globals.css`
- 디자인 시스템 데모: `/design-system` 라우트
- 디자인-First 원칙: `~/.claude/projects/.../memory/feedback_design_first.md`
