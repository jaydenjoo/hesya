import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { Dispute } from "@hesya/database";
import { DisputesList } from "./disputes-list";

/**
 * γ.2.3.4 + M6.9b — admin 분쟁 큐 디자인 정합성 검증.
 *
 * Hesya 디자인 토큰 적용 (reference 정합):
 * - filter pill active: amber-500 border + bg-white + navy
 * - filter pill inactive: peach-200 border + white/50 + gray
 * - table row: peach-100 border + peach-50 hover
 * - SLA urgent: bg-hesya-danger-100 + text-hesya-danger-600
 * - SLA warn: amber-600
 * - 상세 링크: amber-600 + hover underline
 */
function buildDispute(overrides: Partial<Dispute> = {}): Dispute {
  return {
    id: "d-1",
    storeId: "store-1",
    conversationId: null,
    filedByUserId: null,
    category: "no_show",
    status: "open",
    description: "test",
    resolution: null,
    slaDueAt: new Date("2026-05-20T00:00:00Z"),
    createdAt: new Date("2026-05-10T00:00:00Z"),
    resolvedAt: null,
    updatedAt: new Date("2026-05-10T00:00:00Z"),
    ...overrides,
  } as Dispute;
}

describe("DisputesList — M6.9b 디자인 정합성", () => {
  it("active filter pill — amber-500 border + bg-white + navy", () => {
    const { container } = render(
      <DisputesList rows={[]} activeFilter="open" nowMs={Date.now()} />,
    );
    const active = container.querySelector(
      "nav a.border-hesya-amber-500.bg-white",
    );
    expect(active).toBeTruthy();
    expect(active?.textContent).toBe("접수");
  });

  it("inactive filter pill — peach-200 border + white/50 + gray", () => {
    const { container } = render(
      <DisputesList rows={[]} activeFilter="open" nowMs={Date.now()} />,
    );
    const inactive = container.querySelector(
      "nav a.border-hesya-peach-200.text-gray-700",
    );
    expect(inactive).toBeTruthy();
  });

  it("empty state — peach-50 carded + round emoji", () => {
    const { container } = render(
      <DisputesList rows={[]} activeFilter="all" nowMs={Date.now()} />,
    );
    expect(container.querySelector("div.bg-hesya-peach-50")).toBeTruthy();
    expect(container.querySelector("p.text-gray-500")).toBeTruthy();
  });

  it("table row — peach-100 border + peach-50 hover", () => {
    const now = new Date("2026-05-10T00:00:00Z").getTime();
    const { container } = render(
      <DisputesList rows={[buildDispute()]} activeFilter="all" nowMs={now} />,
    );
    const row = container.querySelector(
      "tbody tr.border-hesya-peach-100.hover\\:bg-hesya-peach-50",
    );
    expect(row).toBeTruthy();
  });

  it("SLA urgent (초과) — crit token (hesya-danger-100 + hesya-danger-600)", () => {
    const slaDueAt = new Date("2026-05-09T00:00:00Z"); // 어제
    const now = new Date("2026-05-10T00:00:00Z").getTime();
    const { container } = render(
      <DisputesList
        rows={[buildDispute({ slaDueAt })]}
        activeFilter="all"
        nowMs={now}
      />,
    );
    // SLA pill은 mono + crit token. 상태 pill (open=접수)와 구별되는 .mono class로 식별.
    const urgent = container.querySelector(
      "span.mono.bg-hesya-danger-100.text-hesya-danger-600",
    );
    expect(urgent).toBeTruthy();
    expect(urgent?.textContent).toMatch(/초과/);
  });

  it("SLA warn (D-1 이하) — amber-600 text", () => {
    const slaDueAt = new Date("2026-05-10T12:00:00Z"); // 오늘
    const now = new Date("2026-05-10T00:00:00Z").getTime();
    const { container } = render(
      <DisputesList
        rows={[buildDispute({ slaDueAt })]}
        activeFilter="all"
        nowMs={now}
      />,
    );
    const warn = container.querySelector("span.text-hesya-amber-600");
    expect(warn).toBeTruthy();
    expect(warn?.textContent).toMatch(/D-/);
  });

  it("상세 링크 — amber-600 (blue 미사용)", () => {
    const { container } = render(
      <DisputesList
        rows={[buildDispute()]}
        activeFilter="all"
        nowMs={Date.now()}
      />,
    );
    const link = container.querySelector("a.text-hesya-amber-600");
    expect(link).toBeTruthy();
    expect(link?.textContent).toMatch(/상세/);
    expect(container.querySelector("a.text-blue-600")).toBeNull();
  });
});
