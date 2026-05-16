# 05 — Design Reference Guide (디자인 reference 처리 원칙)

> 외부 디자인 결과물 → 본 프로젝트 통합 시 변환 원칙 + Korean Typography 규칙

---

## 📁 디자인 reference 위치 (3종)

### 1. 마스터 SSoT — `docs/design/reference/`

본 프로젝트의 **단일 진실 소스** (80 files, 5월 13일 claude.ai/design 출력):

```
docs/design/reference/
├── tokens.css            (350줄 — 마스터 디자인 토큰)
├── components.css        (2,248줄 — 컴포넌트 라이브러리)
├── Hesya Customer Landing.html
├── Hesya Store Dashboard.html
├── Hesya Admin Dashboard.html
├── ...
└── (총 80개 파일 — Customer PWA + Store + Admin 전체 화면)
```

⛔ **수정 절대 금지**. 참조 + import만.

### 2. 마케팅 랜딩 reference — `web/public/landingpage/`

이번 작업의 디자인 출처 (5월 16일 Claude Design 출력, 82 files):

```
web/public/landingpage/
├── Hesya Landing.html        (1,949줄, 76KB — 본 랜딩 풀 HTML)
├── landing-app.jsx           (330줄 — React 컴포넌트 버전)
├── landing.css               (382줄)
├── tokens.css                (198줄 — 마스터의 서브셋, 사용하지 않음)
├── components.css            (1,012줄 — 마스터의 서브셋, 사용하지 않음)
└── (그 외 76개 파일 — 다른 화면들도 같이 export됨)
```

⛔ **수정 절대 금지**. 변환 시 참조만.

### 3. 글로벌 디자인 규칙 — `~/.claude/skills/design-system.md` v4.1

사용자 메모리에 명시된 글로벌 디자인 가드레일. Claude Code는 본 프로젝트 컨텍스트 외부의 이 파일도 자동 참조.

핵심 하드 룰:

- 금지 폰트: Inter / Roboto / Poppins / Montserrat / Open Sans / Lato / Space Grotesk
- 텍스트 opacity 금지
- 다크(gray-900) 배경 1페이지 최대 1회
- 비대칭 레이아웃 선호, 동등 3-column grid 금지
- WCAG 2.2 AA 의무
- Korean Typography 규칙 (아래)

---

## 🌐 한국어 변환 원칙 — 옵션 A (한글 메인 + 영문 보조)

### 변환 매핑 원칙

| 항목                       | 영문 원문                                  | 한글 변환                                  | 보조 영문 처리   |
| -------------------------- | ------------------------------------------ | ------------------------------------------ | ---------------- |
| **메인 헤드라인**          | "The Korean welcome, in 5 languages"       | "한국식 환대를 5개 언어로"                 | (한글만)         |
| **부 헤드라인**            | "Book K-beauty salons in your language..." | "당신의 언어로 K-beauty 살롱을 예약하세요" | (한글만)         |
| **브랜드명**               | Hesya                                      | Hesya                                      | (그대로 영문)    |
| **인증 마크**              | K-Verified                                 | K-Verified ✅                              | (그대로 영문)    |
| **기술 용어**              | AI Style Match                             | AI 스타일 매칭                             | (한글 메인)      |
| **카테고리**               | Hair / Nail / Skincare                     | 헤어 · 네일 · 스킨케어                     | (한글 메인)      |
| **CTA 버튼**               | "Find your salon"                          | "내게 맞는 살롱 찾기"                      | (한글 메인)      |
| **CTA 보조**               | "Try AI Style Match"                       | "AI 스타일 매칭 체험"                      | (한글 메인)      |
| **Nav 메뉴**               | Travelers / Salon Owners / Admin           | 여행자 / 사업자 / 관리자                   | (한글 메인)      |
| **지명**                   | Hongdae / Seongsu / Apgujeong              | 홍대 · 성수 · 압구정                       | (영문 보조 가능) |
| **신뢰 라벨**              | "1,284 K-Verified salons"                  | "1,284개의 K-Verified 살롱"                | (혼합)           |
| **세리프 디자인 시그니처** | "Premium Salons" (Fraunces italic)         | (영문 그대로 유지)                         | 디자인 보존      |

### 핵심 원칙 5가지

1. **메시지·CTA·설명** → 한글 메인
2. **브랜드명·기술 용어** (Hesya, K-Verified, AI) → **영문 보존**
3. **지명** → 한글 메인 + 어색하면 영문 보조 (예: 강남/Gangnam)
4. **이탤릭/세리프 디자인 시그니처** → 일부 영문 보존 (Aesop 톤 유지)
5. **Korean Typography 자동 적용** (`.kr` 클래스 + keep-all + 폰트 크기 80%)

---

## 🇰🇷 Korean Typography 규칙 (필수)

본 채팅 AI가 글로벌 design-system.md v4.1에서 가져온 한국어 타이포 규칙:

### CSS 의무

```css
.kr,
[lang="ko"] {
  font-family: var(--font-body-kr); /* Pretendard Variable */
  word-break: keep-all; /* 어절 단위 줄 바꿈 */
  letter-spacing: 0; /* 한국어는 letter-spacing 0 (영문은 -0.03em ~ 0.06em) */
  line-height: 1.7; /* 한국어 행간 (영문 1.55) */
  text-transform: none; /* uppercase 금지 */
  font-display: swap;
}

.kr-display {
  font-family: var(--font-body-kr);
  word-break: keep-all;
  font-size: 80%; /* 한글 헤드라인은 영문 대비 20% 축소 */
}
```

### 폰트 스택

| 용도                       | 폰트                | 이유                          |
| -------------------------- | ------------------- | ----------------------------- |
| 영문 디스플레이 (헤드라인) | Fraunces Variable   | 세리프 럭셔리 호스피탈리티 톤 |
| 한국어 본문 + 헤드라인     | Pretendard Variable | 한글 가독성 최상, 글자 균형   |
| 영문 본문                  | Source Sans 3       | 깔끔한 산세리프               |
| 숫자 (Mono)                | JetBrains Mono      | 데이터·가격·시간 표시용       |

⛔ **절대 사용 금지**: Inter / Roboto / Arial / Poppins / Montserrat / Open Sans / Lato / Space Grotesk

---

## 🎨 디자인 토큰 사용

### 통합 시 권장 방식

**Option A — 마스터 토큰을 그대로 import (권장)**:

```css
/* apps/web/src/styles/globals.css 또는 (marketing)/layout.tsx */
@import "../../../docs/design/reference/tokens.css";
/* 또는 packages/shared-ui에서 export */
```

**Option B — Next.js global CSS로 복사 (충돌 시)**:

`docs/design/reference/tokens.css` 350줄을 `apps/web/src/styles/tokens.css`로 복사 후 사용. 단 **마스터 변경 시 동기화 필요** → 깨끗하지 않음.

**Phase A에서 결정 필요**.

### 마케팅 페이지에만 필요한 추가 토큰

본 채팅 AI가 발견한 마케팅 reference의 추가 토큰 후보 (Phase A에서 검증):

- (Phase A의 `comm -13` 결과로 확인)

추가 토큰이 발견되면:

- **옵션 A**: 마스터 토큰 파일에 머지 → SSoT 유지 (권장)
- **옵션 B**: 마케팅 전용 토큰 파일 `(marketing)/marketing-tokens.css` 신규 → SSoT 분산

---

## 🧩 컴포넌트 재사용 원칙

### `packages/shared-ui/`에 있을 가능성

본 채팅 AI가 가정한 재사용 후보 (Phase A에서 검증):

- `KVerifiedBadge` — K-Verified 인증 마크
- `Button` (variants: primary/secondary/ghost)
- `LocaleSelector` — 언어 선택 드롭다운
- `Icon` (lucide-react 래핑)
- `Avatar` — 사용자 아바타

### 마케팅 페이지 전용 `_components/`

`shared-ui`에 없는 마케팅 전용 (격리):

- `Hero` — 영상 + 헤드라인
- `TrustBar` — 신뢰 지표 가로 스트립
- `HowItWorks` — 3-step 플로우
- `AIMatch` — AI 스타일 매칭 데모
- `FeaturedSalons` — 6개 살롱 카드
- `UGCWall` — 후기 카드 그리드
- `SafetyFemaleLens` — 안전 신뢰 섹션
- `B2BOwners` — 사업자 대시보드 mock
- `Trending` — 트렌딩 스타일
- `FAQ` — 자주 묻는 질문
- `FinalCTA` — 3-way 분기

⚠️ **이름 충돌 검증 의무** (Phase A에서):

```bash
grep -rn "export.*Hero\|export.*TrustBar\|export.*FeaturedSalon" \
  packages/shared-ui/src/ apps/web/src/components/
```

---

## 🎬 영상/이미지 통합 패턴

### Next.js + React 패턴

```tsx
// apps/web/src/app/[locale]/(marketing)/_components/Hero.tsx
"use client"; // 영상 자동 재생 필요 시

import { useTranslations } from "next-intl";

export function Hero() {
  const t = useTranslations("marketing.hero");
  return (
    <section className="hero">
      <div className="hero-grid">
        <div className="hero-left">
          <h1 className="kr">{t("headline")}</h1>
          <p className="hero-sub kr">{t("subheadline")}</p>
        </div>
        <div className="hero-right">
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            poster="/assets/images/hero-poster.png"
            aria-label={t("videoAriaLabel")}
            className="hero-video"
            width={720} // 명시적 width/height → CLS 0
            height={960}
          >
            <source src="/assets/videos/hero-silk-petal.mp4" type="video/mp4" />
          </video>
        </div>
      </div>
    </section>
  );
}
```

### `prefers-reduced-motion` 대응

```css
@media (prefers-reduced-motion: reduce) {
  .hero-video {
    display: none;
  }
  .hero-right::before {
    content: "";
    display: block;
    width: 100%;
    aspect-ratio: 3 / 4;
    background-image: url("/assets/images/hero-poster.png");
    background-size: cover;
  }
}
```

또는 React로:

```tsx
const prefersReducedMotion = useReducedMotion(); // shared-ui hook
return prefersReducedMotion ? (
  <img src="/assets/images/hero-poster.png" alt="..." width={720} height={960} />
) : (
  <video ... />
);
```

---

## 📐 디자인 변환 워크플로우 (Claude Code Phase C 시 참고)

```
[Phase C 작업 흐름]

1. web/public/landingpage/Hesya Landing.html에서 섹션 CSS + HTML 발췌
   ↓
2. 한글 변환 매핑 (위 표 참조)
   ↓
3. TSX 컴포넌트로 변환 (use client / use server 결정)
   ↓
4. 클래스명을 본 프로젝트 컨벤션에 맞춤 (Tailwind / CSS Modules / global)
   ↓
5. translations 메시지 키로 추출 (marketing.json)
   ↓
6. 영상/이미지 path를 `/assets/...` 절대 경로로 교체
   ↓
7. CLS 0 보장 (width/height 명시)
   ↓
8. Korean Typography 클래스 적용 (.kr)
   ↓
9. WCAG 2.2 AA 검증 (대비율 + 키보드 + aria)
   ↓
10. type-check + lint + build + dev 시연
```

---

## 🚨 변환 시 흔한 함정

| 함정                                 | 증상                          | 회피                                     |
| ------------------------------------ | ----------------------------- | ---------------------------------------- |
| HTML `class` → JSX `className` 누락  | TSX 컴파일 에러               | 일괄 치환                                |
| `<img>` → `<Image>` 미전환           | 자동 최적화 손실 + LCP 저하   | Next.js `<Image>` 의무                   |
| 영문 letter-spacing이 한글에 적용    | 한글 자음·모음 간격 깨짐      | `[lang="ko"] { letter-spacing: 0 }` 강제 |
| Fraunces 영문 폰트가 한글에 적용     | 한글이 시스템 폰트로 fallback | `font-family: Pretendard, Fraunces` 순서 |
| `<video>` width/height 누락          | CLS 발생                      | 명시 의무                                |
| 마스터 토큰 vs 마케팅 토큰 중복 정의 | CSS 충돌 (마지막 import 승)   | 단일 import 경로 (마스터만)              |
| Pretendard Variable subset 미로딩    | 한글 표시 안 됨               | `pretendard/dynamic-subset` 또는 풀 폰트 |
| 6 locale 메시지 누락                 | 폴백 영어로 표시              | `marketing.json` 6 locale 모두 작성      |

---

## 📌 Phase C 작업 시 Claude Code에게 알려줄 추가 사항

(별도 세션에서 사용)

- 본 프로젝트의 next-intl 메시지 패턴: `packages/translations/messages/{locale}/{namespace}.json`
- 본 프로젝트의 컴포넌트 명명 컨벤션: PascalCase + named export
- 본 프로젝트의 CSS 전략: (Phase A에서 확인 — Tailwind? CSS Modules? Global?)
- 본 프로젝트의 type-check 통과 기준: `pnpm type-check` (turbo + tsc --noEmit)
- 본 프로젝트의 lint 규칙: ESLint (config는 Phase A에서 확인)
- 본 프로젝트의 vitest 패턴: `*.test.tsx` 옆에 배치
