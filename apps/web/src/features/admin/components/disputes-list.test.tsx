import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import type { Dispute } from "@hesya/database";
import { DisputesList } from "./disputes-list";

/**
 * γ.2.3.4 — admin 분쟁 큐 디자인 정합성 검증.
 *
 * Hesya 디자인 토큰 적용 5종 시그널: filter pill 3-state, 테이블 row peach-100
 * border, SLA urgent/warn 색상, 상세 링크 amber-500.
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

describe("DisputesList — γ.2.3.4 디자인 정합성", () => {
  it("active filter pill — hesya-navy bg + peach-50 text", () => {
    const { container } = render(
      <DisputesList rows={[]} activeFilter="open" nowMs={Date.now()} />,
    );
    const active = container.querySelector(
      "nav a.bg-hesya-navy-900.text-hesya-peach-50",
    );
    expect(active).toBeTruthy();
    expect(active?.textContent).toBe("접수");
  });

  it("inactive filter pill — gray-200 border + navy text + hover navy", () => {
    const { container } = render(
      <DisputesList rows={[]} activeFilter="open" nowMs={Date.now()} />,
    );
    const inactive = container.querySelector(
      "nav a.border-gray-200.text-hesya-navy-900.hover\\:border-hesya-navy-900",
    );
    expect(inactive).toBeTruthy();
  });

  it("empty state — hesya-navy/60 text", () => {
    const { container } = render(
      <DisputesList rows={[]} activeFilter="all" nowMs={Date.now()} />,
    );
    expect(container.querySelector("p.text-hesya-navy-900\\/60")).toBeTruthy();
  });

  it("table row — peach-100 border + peach-50/40 hover", () => {
    const now = new Date("2026-05-10T00:00:00Z").getTime();
    const { container } = render(
      <DisputesList rows={[buildDispute()]} activeFilter="all" nowMs={now} />,
    );
    const row = container.querySelector(
      "tbody tr.border-hesya-peach-100.hover\\:bg-hesya-peach-50\\/40",
    );
    expect(row).toBeTruthy();
  });

  it("SLA urgent (초과) — peach-100 bg + red-500 text", () => {
    const slaDueAt = new Date("2026-05-09T00:00:00Z"); // 어제
    const now = new Date("2026-05-10T00:00:00Z").getTime();
    const { container } = render(
      <DisputesList
        rows={[buildDispute({ slaDueAt })]}
        activeFilter="all"
        nowMs={now}
      />,
    );
    const urgent = container.querySelector(
      "span.bg-hesya-peach-100.text-red-500",
    );
    expect(urgent).toBeTruthy();
    expect(urgent?.textContent).toMatch(/초과/);
  });

  it("SLA warn (D-1 이하) — hesya-amber-500 text", () => {
    const slaDueAt = new Date("2026-05-10T12:00:00Z"); // 오늘
    const now = new Date("2026-05-10T00:00:00Z").getTime();
    const { container } = render(
      <DisputesList
        rows={[buildDispute({ slaDueAt })]}
        activeFilter="all"
        nowMs={now}
      />,
    );
    const warn = container.querySelector("span.text-hesya-amber-500");
    expect(warn).toBeTruthy();
    expect(warn?.textContent).toMatch(/D-/);
  });

  it("상세 링크 — hesya-amber-500 (blue underline 제거)", () => {
    const { container } = render(
      <DisputesList
        rows={[buildDispute()]}
        activeFilter="all"
        nowMs={Date.now()}
      />,
    );
    const link = container.querySelector("a.text-hesya-amber-500");
    expect(link).toBeTruthy();
    expect(link?.textContent).toBe("상세");
    expect(container.querySelector("a.text-blue-600")).toBeNull();
  });
});
