import type { Metadata } from "next";

import { TrendingLooksView } from "@/features/trending/TrendingLooksView";
import "@/features/trending/trending.css";

/**
 * /[locale]/trending — 마케팅 진입 (외부 손님 + 사장님 모두 노출).
 * Reference: docs/design/reference/Hesya Trending Looks.html
 */

export const metadata: Metadata = {
  title: "이번 달 한국에서 사람들이 한 것 · Hesya",
  description:
    "외국인 손님 예약 빈도 기준, 이번 달 한국에서 가장 인기 있는 K-뷰티 시술 8가지.",
};

export default function TrendingPage() {
  return <TrendingLooksView ctaHref="/c" />;
}
