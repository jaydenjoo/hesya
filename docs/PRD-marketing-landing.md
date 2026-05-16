# PRD — Marketing Landing Page (Phase B v1)

> **문서 정보**
>
> - **버전**: v1 (Phase B 산출, 2026-05-17)
> - **작성자**: Jayden + Claude Opus 4.7
> - **상태**: 검토 대기 (Jayden 승인 시 Plan v1 + T1 진입)
> - **부속 문서**:
>   - [`AUDIT_REPORT.md`](handoff-marketing-landing/AUDIT_REPORT.md) — Phase A 인벤토리 + 충돌 분석
>   - [`Plan-marketing-landing-v1.md`](Plan-marketing-landing-v1.md) — Task 분해 (T1~T11)
>   - [`01_CONTEXT_BRIEFING.md`](handoff-marketing-landing/01_CONTEXT_BRIEFING.md) — 외부 Claude 작업 핸드오프
>   - [`04_ASSETS_INVENTORY.md`](handoff-marketing-landing/04_ASSETS_INVENTORY.md) — 16개 Higgsfield 자산
>   - [`05_DESIGN_REFERENCE_GUIDE.md`](handoff-marketing-landing/05_DESIGN_REFERENCE_GUIDE.md) — 디자인 SSoT + 한글 변환표

---

## ⚠️ OPEN QUESTIONS 처리 정책

본 PRD는 Phase A AUDIT_REPORT의 OPEN QUESTIONS 6개에 대해 **권장값(default) 가정**을 적용하여 작성. Jayden 검토 후 답변 → PRD v2로 갱신.

| Q   | 항목               | 본 PRD default                                                                        | 변경 시 영향                 |
| --- | ------------------ | ------------------------------------------------------------------------------------- | ---------------------------- |
| Q1  | 자산 배치          | **A1 (복사)** — `web/public/assets/` → `apps/web/public/assets/`                      | T1만 변경 (이동 vs rewrite)  |
| Q2  | 라우트 배치        | **B2 (기존 page 교체)** — `[locale]/page.tsx`를 신규 marketing landing으로 교체       | T4/T5/T11에 영향             |
| Q3  | i18n namespace     | **E1 (MarketingLanding 신규 namespace)** — 기존 `Landing` 4 keys 보존                 | T2/T3                        |
| Q4  | Motion 라이브러리  | **M1 (CSS-only)** — transform/opacity + `prefers-reduced-motion` 가드                 | T5~T8 (deps 추가 필요 시 T0) |
| Q5  | 영상 정책          | `muted+autoplay+playsinline+preload="metadata"+poster`, `prefers-reduced-motion` 가드 | T5 (hero 영상)               |
| Q6  | PROGRESS 갱신 시점 | **T11 (전체 e2e 통과 후 합산 갱신)**                                                  | 자기평가 % 갱신 타이밍       |

---

## 1. 목적

Hesya의 **공개 마케팅 랜딩페이지**를 외부 Claude.ai 디자인 출력(5시간 작업, 1949 lines HTML)을 기반으로 본 모노레포(`apps/web/`)에 통합. 외국인 여행자 + 사장님 첫 방문 시 hesya.com 첫 인상을 결정짓는 페이지.

**차별점**: 한국식 환대 + 6개 언어 + K-Verified 살롱 + AI 스타일 매칭 + Higgsfield 영상 8개 + 살롱 이미지 6개.

**핵심**: 보일러플레이트(γ.2.3.5 미니 LandingHero)를 정식 marketing landing으로 교체. 베타 5곳 매칭 phase ζ 전에 hesya.com 외부 시연 가능 상태 달성.

---

## 2. 사용자 시나리오 (e2e 시연 기준 — L-082)

### 시나리오 A — 한국인 사장님 (페르소나 1)

1. 사용자가 `/ko` 접속
2. Hero 영상(hero-silk-petal.mp4) 자동 재생 + 한국어 메인 카피
3. Before/After 슬라이더 → Salons 카드 6개 → UGC 후기 3개 → B2B 사장님 섹션
4. CTA "사장님 무료 시작 →" 클릭 → `/ko/sign-in` 이동
5. **시연 통과 조건**: 모든 한국어 텍스트 word-break:keep-all 적용 / 영상 LCP < 2.5s / CLS 0 / 6개 살롱 이미지 lazy-load

### 시나리오 B — 외국인 여행자 (페르소나 3)

1. 사용자가 `/en` (또는 `/ja`, `/zh-CN`, `/zh-TW`, `/vi`) 접속
2. 동일 layout, locale별 번역된 카피
3. CTA "Find Your Salon →" 클릭 → `/en/c/sign-in` 이동 (Customer flow)
4. **시연 통과 조건**: locale 자동 라우팅 동작 / Korean Typography는 ko만 적용 / 영문 폰트는 Source Sans 3

### 시나리오 C — 다국어 + Reduced Motion

1. 사용자가 OS 접근성 "동작 줄이기" 활성화 후 접속
2. 모든 영상은 poster 정적 이미지로 대체
3. CSS animation 모두 비활성 (duration 0.01ms)
4. **시연 통과 조건**: `@media (prefers-reduced-motion: reduce)` 가드 모든 motion에 적용 — 영상 자동재생 차단 포함

### 시나리오 D — 모바일 (iOS Safari + Android Chrome)

1. iPhone 13 Pro / Pixel 8 Pro 폭(393~412px)에서 모든 sections 정렬
2. 영상 자동재생 (muted + playsinline 필수)
3. CTA tap target ≥ 44×44px
4. **시연 통과 조건**: Lighthouse Mobile Performance 80+, INP < 200ms

---

## 3. 기능 명세

### 3.1 라우트 구조 (Phase A 충돌 분석 B 결과 — default B2)

```
apps/web/src/app/[locale]/
├── page.tsx               (교체 대상 — 신규 marketing landing)
├── layout.tsx             (변경 없음 — 폰트/PostHog 이미 wire됨)
├── _components/           (신규 — marketing-only 컴포넌트 11개)
│   ├── MarketingHero.tsx
│   ├── MarketingBeforeAfter.tsx
│   ├── MarketingSalonsGrid.tsx
│   ├── MarketingUgcWall.tsx
│   ├── MarketingSafety.tsx
│   ├── MarketingB2bOwners.tsx
│   ├── MarketingTrending.tsx
│   ├── MarketingFaq.tsx
│   ├── MarketingFinalCta.tsx
│   ├── MarketingFooter.tsx
│   └── MarketingHowItWorks.tsx
├── c/                     (변경 없음)
├── store/                 (변경 없음)
├── admin/                 (변경 없음)
├── sign-in/               (변경 없음)
└── ...
```

**기존 `@/features/landing/` 처리 (Q2 default B2)**: 보존 (디자인 시스템 데모로 활용 가능). 실제 import는 제거되어 dead code 처리되나 테스트는 남김. 별도 cleanup PR로 후속 결정.

**Alternative (Q2 답변 시)**: B1 = `app/[locale]/(marketing)/page.tsx` 신규 + 기존 `[locale]/page.tsx` 삭제 또는 redirect. B3 = `/about` 분리.

### 3.2 디자인 시스템 통합 (Phase A 충돌 C 결과)

- **토큰 소스**: [`docs/design/reference/tokens.css`](design/reference/tokens.css) (master, 350 lines)
- **현재 상태**: `apps/web/src/app/globals.css`(260 lines)에 master 토큰 직접 인라인 완료
- **차이**: **0건** (4개 tokens.css 파일 byte-identical)
- **신규 토큰 필요 여부**: marketing-specific (`--mk-section-padding-*`, motion easing 변종 등) 필요 시 globals.css 또는 marketing-only css에 `--mk-*` namespace로 추가. **현재 단계는 추가 0개 가정**, 구현 중 필요 시 plan v2에서 추가.

### 3.3 자산 (16개) — Q1 default A1

- **위치 변경**: `web/public/assets/{videos,images}/` → `apps/web/public/assets/{videos,images}/` (복사)
- **사용 매핑**: [`04_ASSETS_INVENTORY.md`](handoff-marketing-landing/04_ASSETS_INVENTORY.md) 참조
- **목록**:
  - **Videos (8 mp4)**: hero-silk-petal, transformation, glass-skin-macro, ugc-sakura, ugc-mei, ugc-linh, coloring-macro, logo-ink
  - **Images (8 png)**: hero-poster, salon-01~06 (stylista/yuri/mirror-glass/nail-atelier/color-lab/soohair), dashboard-mock
- **용량 미확인** (Phase A에서 size 측정 안 함): T1 직전에 `du -sh web/public/assets/` 확인. **100MB 초과 시 Vercel Blob 또는 Git LFS 검토** (Plan v1 위험 #1).

### 3.4 다국어 (i18n) — Q3 default E1

- **locale**: ko / en / ja / zh-CN / zh-TW / **vi** (Phase A 검증 — handoff 05의 "th"는 오기)
- **메시지 구조**: 단일 파일 `packages/translations/messages/{locale}.json` (briefing 03 미션 문서의 `{locale}/marketing.json` 폴더 구조는 부정확 — 실제는 namespace 추가)
- **신규 namespace**: `MarketingLanding` (기존 `Landing` 4 keys 보존)
- **예상 keys**: 11 sections × 평균 5 keys = ~55 keys × 6 locales = **~330 strings 번역 필요**
- **변환 원칙**: 한국어 메인 + 영문 보조 (Option A — [05_DESIGN_REFERENCE_GUIDE.md](handoff-marketing-landing/05_DESIGN_REFERENCE_GUIDE.md) Korean Conversion Table 준수)
- **Korean Typography 의무 (.kr class)**: `word-break: keep-all`, `line-height: 1.7`, 헤드라인 영문 대비 -20% font-size, `letter-spacing: -0.01em`

### 3.5 영상/이미지 통합 — Q5 default

#### 영상 정책

```html
<video
  autoplay
  muted
  loop
  playsinline
  preload="metadata"
  poster="/assets/images/hero-poster.png"
  width="1280"
  height="720"
>
  <source src="/assets/videos/hero-silk-petal.mp4" type="video/mp4" />
</video>
```

- **iOS Safari 필수**: `muted` + `playsinline` 없으면 자동재생 차단
- **LCP 최적화**: hero-poster.png를 LCP 후보로 우선 디코딩 (`<link rel="preload" as="image">` 검토)
- **`prefers-reduced-motion: reduce`**: 자동재생 차단, poster 정적 표시 (`autoplay` 동적 토글 또는 `media` 쿼리)
- **데이터 절약 가드 (옵션)**: `prefers-reduced-data: reduce` 시 모든 영상 placeholder만

#### 이미지 정책

- Next.js `next/image` 강제 사용 (`<img>` 직접 X)
- `width`/`height` 명시 필수 (CLS 0)
- viewport 밖은 `loading="lazy"`
- Salons 6개는 `priority={false}`, hero-poster만 `priority={true}`

### 3.6 접근성 (WCAG 2.2 AA)

- 본문 대비 ≥ 4.5:1, UI 컴포넌트 ≥ 3:1
- 모든 인터랙티브 요소 ≥ 24×24px (모바일 CTA ≥ 44×44px 권장)
- `:focus-visible` outline 2px solid + offset 2px
- 시맨틱 HTML: `<h1>` 1개, heading 레벨 건너뛰기 금지
- `<button>` / `<a>` 적절 사용 (`<div onClick>` 금지)
- 영상 자동재생은 sound 없음 (`muted`)
- `prefers-reduced-motion` 무조건 존중
- 모든 image `alt` 명시 (decorative는 `alt=""`)
- 키보드 전용 사용자: Tab 순서 자연, focus trap 없음

### 3.7 성능 (Core Web Vitals 2026)

| 지표              | 목표            | 측정 도구                  |
| ----------------- | --------------- | -------------------------- |
| **LCP**           | < 2.0s (모바일) | Lighthouse + RUM (PostHog) |
| **INP**           | < 200ms         | Lighthouse                 |
| **CLS**           | < 0.05          | Lighthouse                 |
| **TBT**           | < 200ms         | Lighthouse                 |
| **First Load JS** | ≤ 250KB gz      | Next.js build report       |

### 3.8 SEO

- `<title>` + `<meta description>` locale별
- Open Graph + Twitter Card
- `<html lang="ko/en/...">` 정확히
- `hreflang` 6 locales 상호 참조 (next-intl alternates)
- structured data (JSON-LD): `WebSite` + `Organization` (옵션)

---

## 4. ⛔️ Not Doing (12개 항목)

이번 PRD 범위 외 — 별도 PRD/세션으로 분리:

1. ❌ Supabase 회원가입 / sign-in 로직 변경 (CTA는 기존 `/sign-in` redirect만)
2. ❌ `docs/design/reference/` 마스터 수정 (read-only SSoT)
3. ❌ `web/public/landingpage/` 정적 HTML 수정 (read-only reference)
4. ❌ `(marketing)/travelers/`, `(marketing)/owners/` 별도 페이지 (Phase 2)
5. ❌ 기존 `/c/`, `/store/`, `/admin/`, `/design-system/` 디자인/기능 변경
6. ❌ 새 DAL / auth guard / DB 스키마 추가
7. ❌ Vercel Blob / Git LFS 이전 (트래픽 임계 도달 또는 100MB 초과 전까지)
8. ❌ A/B 테스트 도구 통합 (PostHog flags 등)
9. ❌ PostHog 신규 이벤트 (기본 pageview만, 기존 설정 유지)
10. ❌ 모바일 PWA / 별도 customer landing (`/c/`) 디자인 변경
11. ❌ Blog / CMS / 동적 콘텐츠 (마케팅은 정적 페이지)
12. ❌ Newsletter / 이메일 캡처 폼 (Resend 도메인 미설정 — 별도 PRD)

---

## 5. 완료 기준

### 5.1 코드 머지 기준 (Task 단위)

- [ ] T1 — 자산 16개 `apps/web/public/assets/` 위치 확인 (`ls | wc -l` 16)
- [ ] T2 — `messages/ko.json`에 `MarketingLanding` namespace 50+ keys 추가
- [ ] T3 — 5 locale 번역 (en, ja, zh-CN, zh-TW, vi) `messages/{locale}.json` 동기화
- [ ] T4 — `[locale]/page.tsx` 교체 + 11 컴포넌트 골격 (`_components/`)
- [ ] T5 — Hero + BeforeAfter (영상 wire 완료, LCP poster preload)
- [ ] T6 — HowItWorks + SalonsGrid + UGC Wall
- [ ] T7 — Safety + B2BOwners + Trending
- [ ] T8 — FAQ + FinalCta + Footer
- [ ] T9 — `pnpm type-check` / `pnpm lint` / `pnpm build` 경고 0건 / 기존 `vitest` 통과 유지
- [ ] T10 — Vercel preview deploy + Lighthouse Performance 80+ (mobile) / Accessibility 95+
- [ ] T11 — Jayden 데스크톱 + iOS Safari + Android Chrome 직접 시연 OK

### 5.2 e2e 시연 기준 (L-082)

**90%+ 도달 조건 (모두 ✅)**:

- [ ] localhost:4200/ko 접속 → Hero 영상 자동 재생 + 한국어 메인 카피
- [ ] localhost:4200/en, /ja, /zh-CN, /zh-TW, /vi 접속 → locale별 번역 정상
- [ ] OS 동작 줄이기 활성 → 영상 정지, motion 제거
- [ ] Lighthouse Mobile Performance 80+ / Accessibility 95+ / Best Practices 90+ / SEO 95+
- [ ] CLS 0 (영상/이미지 모두 width/height 명시 확인)
- [ ] CTA 클릭 → `/{locale}/sign-in` 또는 `/{locale}/c/sign-in` 정상 이동
- [ ] Jayden 데스크톱 + 모바일 직접 시연 OK

### 5.3 자기평가 목표

**T11 통과 후 90%+** (e2e 시연 + 디자인 정합 + a11y/perf 검증 모두 통과). [`docs/design-completion-status.md`](design-completion-status.md) "세션 47+ 별도 트랙" 섹션에 합산 표기.

---

## 6. Task 분해 (요약)

총 **11 Tasks, ~12시간 (1.5일)**. 자세한 분해는 [`Plan-marketing-landing-v1.md`](Plan-marketing-landing-v1.md).

| Task | 활동                            | 예상 |
| ---- | ------------------------------- | ---- |
| T1   | 자산 16개 복사 + 검증           | 10m  |
| T2   | ko.json MarketingLanding 신규   | 1h   |
| T3   | 5 locale 번역 동기화            | 1h   |
| T4   | page.tsx 교체 + 컴포넌트 골격   | 30m  |
| T5   | Hero + BeforeAfter              | 2h   |
| T6   | HowItWorks + Salons + UGC       | 2h   |
| T7   | Safety + B2B + Trending         | 2h   |
| T8   | FAQ + FinalCta + Footer         | 1.5h |
| T9   | a11y / perf 검증                | 1h   |
| T10  | Vercel preview deploy           | 30m  |
| T11  | Jayden e2e 시연 + PROGRESS 갱신 | 30m  |

---

## 7. 보안 고려사항

- **보안 등급**: 🟡 **YELLOW** (마케팅 페이지, PII 수집 0, 결제 0)
- **CSP**: globals.css에 `img-src 'self' data:`, `media-src 'self'`, `font-src https://fonts.gstatic.com data:` 권장
- **Google Fonts**: 현재 layout.tsx에서 `next/font/google`로 self-host 처리 — CSP 외부 도메인 추가 불필요 (실제 fetch 안 됨)
- **외부 CDN 의존성**: Pretendard는 globals.css에서 `pretendard/dist/...` (node_modules) — CDN fetch 0
- **PostHog**: 기존 설정 유지 (`autocapture: false`, `respect_dnt: true`)
- **개인정보**: 0건 (newsletter / email capture 없음)

---

## 8. 종속성

| 종속성                                | 상태                       | 비고                              |
| ------------------------------------- | -------------------------- | --------------------------------- |
| Higgsfield 자산 16개                  | ✅ web/public/assets/      | T1에서 복사                       |
| Claude Design 출력                    | ✅ web/public/landingpage/ | Hesya Landing.html 1949 lines     |
| 디자인 마스터 토큰                    | ✅ docs/design/reference/  | byte-identical 350 lines 4곳      |
| Pretendard / Fraunces / Source Sans 3 | ✅ layout.tsx에 wire됨     | next/font/google + pretendard pkg |
| next-intl 6 locales                   | ✅ 검증됨                  | ko/en/ja/zh-CN/zh-TW/vi           |
| Q1~Q6 OPEN QUESTIONS 답변             | ⏳ Jayden 답변 대기        | default 적용 중                   |

---

## 9. 리스크 & 완화

| #   | 리스크                                                             | 영향    | 확률  | 완화 방안                                                                                  |
| --- | ------------------------------------------------------------------ | ------- | ----- | ------------------------------------------------------------------------------------------ |
| R1  | 영상 8개 총 용량 100MB+ → Vercel deploy size 초과                  | 🔴 높음 | 🟡 중 | T1 직전 `du -sh` 확인. 초과 시 ffmpeg 압축 또는 Vercel Blob 이전 (별도 task)               |
| R2  | iOS Safari 자동재생 실패 (muted/playsinline 누락)                  | 🟡 중   | 🟢 낮 | T5에서 실 iOS device 테스트 필수                                                           |
| R3  | LCP > 2.5s (영상 디코딩 오버헤드)                                  | 🟡 중   | 🟡 중 | poster preload + `next/image priority` + 영상 lazy + 외부 RUM (PostHog) 측정               |
| R4  | i18n 6 locales 번역 품질 (Claude 자동 번역 의존)                   | 🟡 중   | 🟡 중 | T3에서 ko 마스터를 신중 작성, 5 locale은 Claude 번역 후 native speaker 추후 검수 (Phase 2) |
| R5  | 기존 `[locale]/page.tsx` 교체 시 features/landing 미사용 dead code | 🟢 낮   | 🟢 낮 | 후속 cleanup PR에서 삭제 결정 (Q2 답변 시 명확화)                                          |
| R6  | Hesya Landing.html `<video>` element 0개 — 디자인 의도 해석 차이   | 🟡 중   | 🟡 중 | T5에서 04_ASSETS_INVENTORY.md 매핑 표 엄격 준수. 디자인 의도 불명확 시 Jayden 확인         |
| R7  | 한국어 word-break:keep-all 미적용 시 헤드라인 가독성 깨짐          | 🟢 낮   | 🟢 낮 | T2~T8 모든 .kr 텍스트 클래스 의무. Lint 가능하면 추가 (eslint-plugin?)                     |

---

## 10. 후속 작업 (이번 PRD 범위 외)

| 항목                                            | 시점                |
| ----------------------------------------------- | ------------------- |
| `(marketing)/travelers/page.tsx`                | Phase 2 (베타 후)   |
| `(marketing)/owners/page.tsx` 별도              | Phase 2             |
| Blog / CMS                                      | Phase 2             |
| A/B 테스트 (PostHog Feature Flags)              | 베타 후 운영 1개월  |
| Vercel Blob / Git LFS 이전                      | 트래픽 임계 도달 시 |
| Resend 도메인 설정 + Newsletter capture         | 별도 PRD            |
| Native speaker 5 locales 번역 검수              | Phase 2             |
| Open Graph 이미지 동적 생성 (`@vercel/og`)      | Phase 2             |
| `features/landing/` cleanup (γ.2.3.5 미니 모듈) | Q2 답변 후          |

---

## 11. 승인 체크리스트

- [ ] Jayden Phase A AUDIT_REPORT 검토 완료
- [ ] Jayden OPEN QUESTIONS 6개 답변 완료 (또는 default 채택 명시)
- [ ] Jayden PRD-marketing-landing.md 검토 완료
- [ ] Jayden Plan-marketing-landing-v1.md 검토 완료
- [ ] Jayden 최종 e2e 시연 (T11 완료 후)
- [ ] design-completion-status.md 세션 47 합산 갱신 승인

---

## 12. 참고 문서

### Phase A 산출

- [`docs/handoff-marketing-landing/AUDIT_REPORT.md`](handoff-marketing-landing/AUDIT_REPORT.md)
- [`docs/handoff-marketing-landing/01_CONTEXT_BRIEFING.md`](handoff-marketing-landing/01_CONTEXT_BRIEFING.md)
- [`docs/handoff-marketing-landing/02_MISSION_PHASE_A_AUDIT.md`](handoff-marketing-landing/02_MISSION_PHASE_A_AUDIT.md)
- [`docs/handoff-marketing-landing/03_MISSION_PHASE_B_PRD_AND_PLAN.md`](handoff-marketing-landing/03_MISSION_PHASE_B_PRD_AND_PLAN.md)
- [`docs/handoff-marketing-landing/04_ASSETS_INVENTORY.md`](handoff-marketing-landing/04_ASSETS_INVENTORY.md)
- [`docs/handoff-marketing-landing/05_DESIGN_REFERENCE_GUIDE.md`](handoff-marketing-landing/05_DESIGN_REFERENCE_GUIDE.md)

### 디자인 reference

- [`docs/design/reference/`](design/reference/) (83 files — master SSoT, read-only)
- [`web/public/landingpage/Hesya Landing.html`](../web/public/landingpage/Hesya%20Landing.html) (1949 lines — read-only)

### 코드 reference

- [`apps/web/src/app/[locale]/layout.tsx`](../apps/web/src/app/%5Blocale%5D/layout.tsx) — 폰트/PostHog wire 완료
- [`apps/web/src/app/globals.css`](../apps/web/src/app/globals.css) — master 토큰 인라인
- [`apps/web/src/features/landing/`](../apps/web/src/features/landing/) — 기존 γ.2.3.5 미니 모듈
- [`packages/translations/messages/ko.json`](../packages/translations/messages/ko.json) — 54KB 마스터

### Hesya 일반

- [`CLAUDE.md`](../CLAUDE.md) + [`AGENTS.md`](../AGENTS.md) — 프로젝트 컨텍스트
- [`docs/PRD.md`](PRD.md) v1.3 — 본 PRD의 상위 컨텍스트
- [`docs/design-completion-status.md`](design-completion-status.md) — 24 페이지 정합 트랙
- [`docs/learnings.md`](learnings.md) — L-082 등 누적 교훈
