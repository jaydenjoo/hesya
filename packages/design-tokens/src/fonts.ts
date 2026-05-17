/**
 * next/font/google 명세 — single source of truth.
 *
 * 컴포넌트에서:
 *   import { Fraunces, JetBrains_Mono } from "next/font/google";
 *   import { fraunceSpec, jetbrainsMonoSpec } from "@hesya/design-tokens/fonts";
 *   const fraunces = Fraunces(fraunceSpec);
 *
 * next/font 는 caller 에서 직접 호출해야 Next.js 최적화 (subset)가
 * 작동. 그래서 여기는 명세 객체만 export. as const 미사용 — next/font
 * 의 mutable string[] 시그니처와 호환되도록 작성.
 */

export const fraunceSpec = {
  // reference HTML head: Fraunces:ital,opsz,wght@0,9..144,400..700;1,9..144,400..700
  // .mk-num 사용: italic 500. heading: italic 600. body em: italic 500.
  subsets: ["latin"],
  weight: ["400", "500", "600", "700"],
  style: ["normal", "italic"],
  variable: "--font-heading",
  display: "swap",
} as const;

export const jetbrainsMonoSpec = {
  subsets: ["latin"],
  weight: ["400", "600"],
  variable: "--font-mono",
  display: "swap",
  preload: false,
} as const;

export const pretendardImports = {
  regular: "pretendard/dist/web/static/Pretendard-Regular.css",
  bold: "pretendard/dist/web/static/Pretendard-Bold.css",
} as const;
