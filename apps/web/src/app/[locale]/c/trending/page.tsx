import type { Metadata } from "next";

import { TrendingLooksView } from "@/features/trending/TrendingLooksView";
import "@/features/trending/trending.css";

/**
 * /[locale]/c/trending — 고객 측 진입 (mypage / saved와 동일 톤).
 * Reference: docs/design/reference/Hesya Trending Looks.html
 */

export const metadata: Metadata = {
  title: "Trending · Hesya",
  description: "이번 달 한국에서 가장 인기 있는 K-뷰티 시술 8가지.",
};

export default function CustomerTrendingPage() {
  return <TrendingLooksView ctaHref="/c" />;
}
