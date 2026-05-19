import type { Metadata } from "next";

import { WalkthroughView } from "./WalkthroughView";
import "./walkthrough.css";

/**
 * /[locale]/c/walkthrough — 첫 방문 손님용 3-step intro tour.
 * Reference: docs/design/reference/Hesya First-Visit Walkthrough.html
 *
 * 베타 압축 (영문, localStorage 플래그).
 */

export const metadata: Metadata = {
  title: "First-Visit Walkthrough · Hesya",
  description: "Quick 3-step intro to using Hesya for Korean salons.",
  robots: { index: false, follow: false },
};

export default function WalkthroughPage() {
  return <WalkthroughView />;
}
