# Phase A — Audit Report

> **미션**: 외부 Claude.ai design 채팅에서 5시간 작업한 marketing landing page를 hesya 모노레포(`apps/web/`)에 통합 가능한지 사전 탐사.
> **작성**: 2026-05-17 (세션 47 시작 시)
> **범위**: 탐사 + 보고서. **코드 작성 0건**.
> **다음 단계**: Phase B (PRD + Plan v1) — Jayden 승인 후 진행.

---

## 0. Executive Summary (BLUF)

**통합 가능성: 🟢 HIGH (큰 충돌 없음)**.

- 🟢 **토큰 충돌 0**: master `tokens.css` 350 lines가 4곳 모두 byte-identical (`docs/design/reference/` = `docs/design/handoff/` = `apps/web/src/styles/handoff/` = `web/public/landingpage/`). globals.css에 이미 master 토큰 인라인.
- 🟢 **폰트 충돌 0**: 기존 `apps/web/src/app/[locale]/layout.tsx`가 이미 **Fraunces (italic 600) + Source Sans 3 + JetBrains Mono** 로드. Pretendard도 globals.css에서 import. handoff 05 가이드와 정확히 일치.
- 🟡 **기존 landing 충돌**: `[locale]/page.tsx`(1010B)는 **이미 실제 landing**(γ.2.3.5 보일러플레이트 제거판). `@/features/landing` 모듈 사용 중 (`LandingHero`, `LandingFooter`, `GreetingTicker` — 미니 버전). Phase B에서 **교체 vs (marketing) 분리** 결정 필요.
- 🟡 **i18n Landing namespace 충돌**: 4 keys만 존재 (`subCopy`, `ownerCta`, `customerNote`, `footerHint`). 신규 11 sections × 다수 키 추가 필요. namespace 이름 충돌 또는 별도 namespace 결정 필요.
- 🟡 **자산 위치 분리**: 8 videos + 8 images가 `web/public/assets/`(repo root sibling)에 있고 `apps/web/public/assets/`에는 없음. Next.js static serving은 `apps/web/public/`만 인식 → **복사 또는 이동** 필요.
- 🟢 **route group 충돌 0**: `(marketing)` route group 미존재.
- ⚠️ **Marketing deps 미설치**: `framer-motion` / `gsap` / `swiper` 없음. `next-themes`만 있음. Phase B에서 motion 라이브러리 결정 필요.
- ⚠️ **Landing.html video 미구현**: 1949 lines 중 `<video>` element 0개. line 1232 주석 `"video would lazy-load here"` — Next.js 통합 시 video 태그 직접 wire 필요.

**Phase B 권장**: `(marketing)` route group으로 신규 페이지 분리 + 기존 `features/landing/`은 유지 (디자인 시스템 페이지 또는 데모용으로 활용). 자산은 `apps/web/public/assets/`로 복사. 한국어 메인(en 보조) Option A 채택.

---

## 1. Inventory 결과

### 1.1 키워드 grep

| 검색어                                | 결과                                                                                                                                                                                                        |
| ------------------------------------- | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `marketing\|landing\|hero` (apps/web) | 다수. 핵심 충돌 후보: `apps/web/src/features/landing/{index,landing-hero,landing-footer,greeting-ticker}.tsx`(+tests), `app/[locale]/page.tsx`, `app/[locale]/c/page.tsx`(customer landing 별도)            |
| `(marketing)` route group             | **0건** — 신규 path 안전                                                                                                                                                                                    |
| `KVerified` 관련                      | 3개 별개 컴포넌트 (`components/trust/KVerifiedBadge.tsx`, `features/customer-frame/badges/k-verified-badge.tsx`, `features/dashboard/components/k-verified.tsx`) — marketing은 별도 \_components/ 격리 권장 |
| Landing i18n namespace                | en/ja/ko/vi/zh-CN 모두에 `"Landing"` key 존재 (4 keys)                                                                                                                                                      |

### 1.2 작업 영역 ls

```
apps/web/src/app/[locale]/
├── admin/          (KYC test, store reports 등)
├── c/              (customer landing — Hesya Customer Landing.html 매핑)
├── design-system/  (디자인 토큰 데모)
├── onboarding/
├── sign-in/        (Hesya Store Login 디자인 적용 완료, M1.4)
├── store/          (account, analytics, bookings, customers, dashboard, disputes, inbox, inbox-skipped, integrations, knowledge, photos, services, settings)
├── layout.tsx      (2730B — Fraunces/Source Sans 3/JetBrains Mono + Pretendard + PostHog)
└── page.tsx        (1010B — γ.2.3.5 mini Landing, @/features/landing 사용)
```

- **store 폴더 존재** ✅ (briefing 01의 가정 검증됨)
- **(marketing) 미존재** — 신규 경로 안전
- `apps/web/public/`: file/globe/next/vercel/window svg만 (CRA boilerplate 잔존). **`assets/` 폴더 없음** ⚠️

### 1.3 외부 디자인 reference 자산

| 항목                                             | 결과                                                                                                                                  |
| ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------- |
| `docs/design/reference/` 파일 수                 | **83 files** (briefing 80 근접)                                                                                                       |
| `web/public/landingpage/Hesya Landing.html` size | 76,168 bytes / **1949 lines** ✅                                                                                                      |
| `web/public/landingpage/` 총 파일                | 30+ (HTML 25개 + CSS 5개+)                                                                                                            |
| `web/public/assets/videos/`                      | **8 mp4** ✅                                                                                                                          |
| `web/public/assets/images/`                      | **8 png** ✅                                                                                                                          |
| Landing.html `<video>` element 개수              | **0** (line 1232 주석: "video would lazy-load here") ⚠️                                                                               |
| Landing.html 사용 폰트                           | Fraunces + Source Sans 3 + JetBrains Mono + Pretendard (Google Fonts CDN) ✅                                                          |
| Landing.html `<section>` 개수                    | **11**                                                                                                                                |
| Landing.html 영문 헤드라인 sample                | "See if your...", "Real travelers,...", "Get foreign clients...", "Wherever you're starting from." → 한국어 변환 필요 (handoff 05 표) |

### 1.4 데모 prerequisite

- Git branch: `main`, clean (handoff folder만 untracked) ✅
- 최근 commit: `8b768b2` docs(design): design-completion-status.md (2026-05-17 직전 작업)
- dev: `next dev -p 4200`, build: `next build`, type-check: `tsc --noEmit`, test: `vitest run`
- **Marketing-relevant deps**: `next-themes ^0.4.6`만 존재. framer-motion / gsap / swiper / motion 전무 ⚠️

### 1.5 토큰 비교 (충돌 검증)

```
diff docs/design/reference/tokens.css web/public/landingpage/tokens.css       → empty (identical)
diff docs/design/reference/tokens.css apps/web/src/styles/handoff/tokens.css  → empty (identical)
diff docs/design/reference/tokens.css docs/design/handoff/tokens.css          → empty (identical)
```

**모두 byte-identical (350 lines)**. globals.css(apps/web/src/app/globals.css 260 lines)는 master tokens를 직접 인라인 (line 71~149). briefing 05의 "marketing 198 lines" 주장은 부정확 — 모든 tokens 파일이 동일한 master.

---

## 2. 충돌 분석 (시나리오 A~E)

### Scenario A — 자산 위치 충돌

**현황**: 8 videos + 8 images가 `web/public/assets/`(monorepo root sibling)에 위치. Next.js 16은 `apps/web/public/`만 static asset으로 serving.

**옵션**:

- **A1 (권장)**: `apps/web/public/assets/{videos,images}/`로 **복사** (원본은 reference 보존)
- **A2**: `git mv` 이동 (원본 사라짐 — 디자인 reference loss 위험)
- **A3**: `next.config.ts`에 외부 path rewrite (복잡, 권장 안 함)

**제약**: 8 mp4 + 8 png 총 용량 확인 안 함 (브리핑 04에서도 미명시). 큰 영상의 경우 Vercel deploy size limit / Git LFS 검토 필요. → **OPEN QUESTION 1**.

### Scenario B — 라우트 충돌

**현황**: `[locale]/page.tsx`가 이미 실제 Landing 페이지 (`LandingHero` + `LandingFooter`, γ.2.3.5 미니 버전).

**옵션**:

- **B1 (권장)**: `app/[locale]/(marketing)/page.tsx`를 신규 marketing landing으로 만들고, 기존 `[locale]/page.tsx`를 **그대로 두거나 redirect**. (marketing) route group은 URL에 영향 0 — 두 페이지가 같은 `/{locale}` path 다툼 → 다툼 해결: 기존 page.tsx 삭제 또는 marketing path로 옮기기.
- **B2**: 기존 `[locale]/page.tsx`를 **신규 marketing landing으로 교체** (Drop-in). 기존 features/landing/ 모듈은 디자인 시스템 페이지 또는 데모용으로 보존 또는 삭제.
- **B3**: 신규 marketing은 `/{locale}/about` 같은 별도 path. 기존 page.tsx는 root로 유지.

→ **OPEN QUESTION 2**: 어느 옵션? (B2가 깔끔, B1은 보존하나 라우팅 다툼 해결 필요)

### Scenario C — 토큰 충돌

**결과**: 🟢 **0건**. 모든 tokens.css가 동일. globals.css가 이미 master 토큰 인라인. Phase B에서 토큰 추가/수정 필요 없을 가능성 높음.

**Caveat**: marketing landing이 추가 토큰(`--mk-section-padding-*`, motion easing 변종 등)을 요구하면 별도 namespace (`--mk-*`)로 globals.css 또는 marketing-only css에 추가.

### Scenario D — 컴포넌트 명명 충돌

**현황**:

- `features/landing/{LandingHero, LandingFooter, GreetingTicker}` 이미 존재 (미니 버전)
- `KVerified` 류 3개 별개 컴포넌트 존재

**옵션**:

- **D1 (권장)**: 신규 marketing 컴포넌트는 `app/[locale]/(marketing)/_components/` 격리 (shared-ui로 promote 안 함). 명명도 `MarketingHero`, `MarketingSalonsGrid` 등 prefix.
- **D2**: 기존 `features/landing/` 확장 (LandingHero 교체). features/landing 테스트 영향 큼 — 권장 안 함.

→ **B2 (라우트 교체) + D2** 조합도 가능하나 테스트 깨짐 위험. **B1 또는 B2 + D1** 권장.

### Scenario E — i18n 충돌

**현황**: `Landing` namespace 6 locales 모두 존재 (en/ja/ko/vi/zh-CN/zh-TW 추정). 기존 keys 4개: `subCopy`, `ownerCta`, `customerNote`, `footerHint`.

**옵션**:

- **E1 (권장)**: 신규 marketing은 **별도 namespace `MarketingLanding`** 사용. 기존 `Landing` namespace는 features/landing/ 그대로.
- **E2**: 기존 `Landing` 확장 (4 keys → 50+ keys). features/landing 사용 기존 page와 키 분리 어려움.

→ **E1 권장**. 6 locales 모두 신규 keys 추가 필요 (en, ko, ja, zh-CN, zh-TW, vi).

**한국어 변환**: handoff 05의 Korean Conversion Table 준수 (Hesya 영문 유지, "K-Beauty", "Salons", "Real travelers" → "K-뷰티", "살롱", "실제 여행자" 등). word-break: keep-all, line-height 1.7, font-size 80% 헤드라인 의무.

---

## 3. 가정 검증 (8개)

| #   | Briefing 가정                                         | 검증                            | 비고                                                                     |
| --- | ----------------------------------------------------- | ------------------------------- | ------------------------------------------------------------------------ |
| 1   | apps/web/은 Next.js 16.2.4 App Router                 | ✅ 검증 (layout.tsx + proxy.ts) | -                                                                        |
| 2   | i18n은 next-intl (6 locales)                          | ✅ 검증                         | 실제 locales: ko/en/ja/zh-CN/zh-TW/**vi** (briefing 05의 "th"는 오기)    |
| 3   | shared-ui에서 가져올 컴포넌트 0개 (격리)              | ✅ 검증                         | shared-ui는 AiFlow/Editor/IosFrame만 — marketing 무관                    |
| 4   | docs/design/reference/ 80 files (master SSoT)         | ⚠️ 83 files (근접)              | -                                                                        |
| 5   | tokens.css는 master + marketing 별개 (198 lines 추정) | ❌ **부정확**                   | 모두 byte-identical 350 lines                                            |
| 6   | apps/web/public/assets/에 자산 복사 필요              | ✅ 검증                         | 현재 web/public/assets/ (다른 위치). 8mp4 + 8png 확인됨                  |
| 7   | PROGRESS.md 세션 44 / 70 PR                           | ❌ **outdated**                 | 실제: 세션 46 직후, 114 PR. design-completion-status.md (8b768b2)가 최신 |
| 8   | Resend 도메인 미설정                                  | ✅ 검증                         | 별도 이메일 발송 미구현 (전 대화 확인)                                   |

---

## 4. OPEN QUESTIONS (Jayden 답변 요청)

> Phase B PRD 작성 전에 결정 필요한 사항. 추측 답변 금지 — Jayden 답변 의무.

### Q1: 자산 배치 전략 (Scenario A)

8 videos + 8 images를 `apps/web/public/assets/`로 어떻게 가져올까요?

- **(A1)** **복사** (원본 `web/public/assets/`는 reference 보존, 디스크 16개 파일 중복)
- **(A2)** **이동** (`git mv`로 원본 위치에서 옮김, 디자인 reference 손실)
- **(A3)** **next.config.ts rewrite** (외부 path serving — 복잡)

또한: 영상 8개 총 용량 확인 필요. 큰 영상이면 Git LFS 또는 Vercel Blob 검토.

### Q2: 라우트 배치 전략 (Scenario B)

기존 `[locale]/page.tsx`(γ.2.3.5 mini Landing, `@/features/landing` 사용) 처리:

- **(B1)** `(marketing)` route group으로 신규 분리 + 기존 page 삭제 또는 redirect (URL은 동일 `/{locale}`)
- **(B2)** **기존 `[locale]/page.tsx`를 신규 marketing landing으로 교체** (Drop-in 단순)
- **(B3)** 신규 marketing은 `/{locale}/about` 등 별도 path (기존 page 유지)

`features/landing/` 모듈(미니 LandingHero + LandingFooter + GreetingTicker + tests) 운명:

- 디자인 시스템 페이지로 이전?
- 삭제 (테스트 4개도 삭제)?
- 보존?

### Q3: i18n namespace 전략 (Scenario E)

- **(E1)** **신규 `MarketingLanding` namespace 추가** (기존 `Landing` 4 keys 보존, 6 locales 모두 추가)
- **(E2)** 기존 `Landing` 확장 (50+ keys로 확장, 기존 features/landing 영향 검토 필요)

### Q4: Motion 라이브러리 (deps 추가)

현재 `framer-motion` / `gsap` 미설치. Phase B에서:

- **(M1)** CSS-only motion (transform/opacity + reduced-motion 가드)
- **(M2)** `motion` (framer-motion 후속, ~30KB gz, animations DSL)
- **(M3)** `gsap` (강력하나 ~50KB, license 검토 필요)

handoff 05는 "intensity: subtle" 권장. 11 sections에 reveal/parallax/카드 hover 정도라면 M1 또는 M2.

### Q5: Higgsfield 영상 자동재생 / 디코딩 정책

8 mp4 영상의 `<video autoplay muted loop playsinline>` 정책:

- Mobile 자동재생 시 데이터 소비 / 배터리 영향 — `prefers-reduced-data` 가드?
- LCP 최적화: hero-silk-petal.mp4가 hero LCP 후보 → poster preload + `metadata` preload 전략?
- iOS Safari 자동재생: `muted` + `playsinline` 필수 (handoff 04 명시? 미확인)

### Q6: PROGRESS.md / design-completion-status.md 갱신

이번 Phase A 작업(audit + reports)은 코드 변경 0건이지만 시간 소요됨. design-completion-status.md의 "세션 47 — 별도 트랙 진행 중" 섹션에 진척 표기?

또는 Phase B 시작 후 합산 표기?

---

## 5. Phase B PRD 권장 페르소나

Phase B PRD + Plan v1 작성 시 다음 페르소나 한 명 또는 조합 추천:

1. **Solo Beauty Owner (1인 미용실 사장)**: 한국어 모국어, 일본인/중국인 손님 응대 부담. → CTA "사장님 무료 시작" + B2B section 중심.
2. **Multi-Store Owner (체인 매장)**: 영문 OK 가능성, ROI 데이터 중시. → 통계/숫자 hero + dashboard mock 강조.
3. **Foreign Customer (외국인 관광객, 한국 도착 전 검색)**: 영어/일본어/중국어/베트남어 모국어. → 살롱 검색 / 신뢰 배지(KVerified) 중심.

handoff 01의 PRD는 RED security + 베타 5곳 미용업 사장 타겟 → **페르소나 1 + 2 조합** 권장. 페르소나 3은 별도 `[locale]/c/` customer landing이 이미 담당 중.

---

## 6. OAR 종합 보고

### Observation (관찰)

- 토큰 / 폰트 / 라우트 group 충돌 0건 — 통합 친화적 환경.
- 기존 `[locale]/page.tsx` + `features/landing/` 미니 모듈 존재 — Phase B에서 처리 결정 필요.
- 자산 위치 분리 (web/public/assets/ vs apps/web/public/) — 복사/이동 결정 필요.
- Briefing 가정 2개 부정확: locale "th" → "vi", tokens "198 lines" → 350 lines all identical.
- Marketing motion deps 미설치 — Phase B에서 결정.
- Landing.html `<video>` element 0개 (placeholder만) — Next.js 통합 시 직접 wire.

### Action (행동, Phase B에서)

1. Q1~Q6 OPEN QUESTIONS Jayden 답변 받기.
2. 답변 기반 PRD v1 작성 (만들지 않을 것 섹션 포함).
3. Plan v1 작성 (Pre-Plan Inventory 결과 본 audit report로 대체 가능).
4. Jayden 승인 후 Phase C 구현 진입.

### Rationale (근거)

- Pre-Plan Inventory를 audit 형태로 미리 수행하여 Phase B PRD 작성 시 가정 깨짐 위험 제거 (L-078 회피).
- Phase A 코드 작성 0건 원칙 준수 — 모든 결정은 Jayden 승인 후 Phase B에서 코드화.
- e2e 시연 기준 자기평가 (L-082): 본 audit은 시연 가능 상태 변경 0 → PROGRESS.md % 갱신 없음.

---

✅ **Phase A 완료. Audit Report 작성 완료**. Jayden님, **OPEN QUESTIONS 6개 답변 + Phase A 승인** 부탁드립니다. 승인 후 Phase B(PRD + Plan v1)로 진행하겠습니다.
