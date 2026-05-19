import type { Metadata } from "next";

import { SavedView } from "./SavedView";
import "./saved.css";

/**
 * /[locale]/c/saved — 손님이 저장한 매장 목록.
 * Reference: docs/design/reference/Hesya Customer Saved.html
 *
 * 베타: MOCK 데이터 (saved_stores 테이블 미존재). Compare 페이지로 link.
 */

export const metadata: Metadata = {
  title: "저장한 매장 · Hesya",
  description: "Hesya에서 저장한 매장을 비교하고 예약하세요.",
  robots: { index: false, follow: false },
};

export default function SavedPage() {
  return <SavedView />;
}
