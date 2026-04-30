# 폰트 셋업 가이드 (Next.js 16 + 안티-AI)

> v10.1 자동 생성 — globals.css의 `--font-display`, `--font-sans` 토큰을 실제 폰트와 연결.

## 1단계: 폰트 import (src/app/layout.tsx)

기존 layout.tsx에 추가:

```typescript
import { Fraunces, Geist, Geist_Mono } from "next/font/google";
import { Pretendard } from "next/font/local";  // 한글 폴백

// 편집형 serif (display)
const fraunces = Fraunces({
  subsets: ["latin"],
  variable: "--font-display",
  display: "swap",
});

// 본문 sans
const geist = Geist({
  subsets: ["latin"],
  variable: "--font-sans",
  display: "swap",
});

// 코드/라벨 monospace
const geistMono = Geist_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
  display: "swap",
});

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko" className={`${fraunces.variable} ${geist.variable} ${geistMono.variable}`}>
      <body>{children}</body>
    </html>
  );
}
```

## 2단계: 한글 Pretendard (선택, 권장)

```bash
# 설치
pnpm add pretendard
```

```css
/* src/app/globals.css 상단에 추가 */
@import "pretendard/dist/web/static/pretendard.css";
```

## 3단계: 사용

이미 `globals.css @theme`에 토큰 정의됨 → 자동 적용:

```tsx
// 자동으로 Fraunces 사용 (heading 클래스 + h1~h6 태그)
<h1 className="text-4xl">제목</h1>

// 자동으로 Geist 사용 (body)
<p>본문</p>

// 명시적 (display)
<span className="font-display">강조 제목</span>

// 명시적 (mono)
<code className="font-mono">EST-2026-001</code>
```

## 안티-AI 디자인 검증

✅ Fraunces + Geist = 편집형 + 깔끔 (안티-AI)
❌ Inter, Roboto, Arial, Space Grotesk = AI 룩
❌ Playfair만 단독 사용 = 디자인 진부함

## 폰트 로딩 성능 (Next.js 16.2)

- `display: "swap"` → 폰트 로드 전 시스템 폰트 폴백
- `subsets: ["latin"]` → 라틴 문자만 (한글은 Pretendard CSS)
- variable 사용 → CSS 변수로 노출 → globals.css `@theme`이 활용

## Tailwind v4 통합

`globals.css @theme`에 이미 토큰 정의됨:

```css
--font-display: "Fraunces", "Pretendard", Georgia, serif;
--font-sans: "Geist", "Pretendard", -apple-system, sans-serif;
```

→ Next.js의 `--font-display` CSS 변수가 이걸 덮어씀 → 실제 폰트 적용 ✅
