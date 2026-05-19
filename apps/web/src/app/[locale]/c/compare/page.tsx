import type { Metadata } from "next";

import { CompareView } from "./CompareView";
import "./compare.css";

/**
 * /[locale]/c/compare — 손님이 저장한 매장들 시술/결제/신뢰 비교.
 * Reference: docs/design/reference/Hesya Customer Compare.html
 *
 * 베타: MOCK 데이터 (saved_stores 미존재 — Round B.1 Saved와 동일 fixture).
 * 추후 URL ?ids= 파싱 + 실제 DAL fetch.
 */

export const metadata: Metadata = {
  title: "매장 비교 · Hesya",
  description:
    "Hesya에서 저장한 매장의 시술 / 결제 / 신뢰를 한눈에 비교하세요.",
  robots: { index: false, follow: false },
};

export default function ComparePage() {
  return <CompareView />;
}
