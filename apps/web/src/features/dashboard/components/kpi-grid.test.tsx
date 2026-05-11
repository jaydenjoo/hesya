import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { KpiGrid, type KpiEntry } from "./kpi-grid";

const ENTRIES: ReadonlyArray<KpiEntry> = [
  { key: "a", label: "Active 1", value: "5", state: "active" },
  { key: "b", label: "Active 2", value: "12", state: "active" },
  { key: "c", label: "Pending", value: "—", state: "coming-soon" },
];

describe("KpiGrid — Epic 4 ε", () => {
  it("반응형 grid — 1col / sm 2col / lg 4col", () => {
    const { container } = render(
      <KpiGrid entries={ENTRIES} comingSoonNote="곧 제공" />,
    );
    const grid = container.querySelector('[data-testid="kpi-grid"]');
    expect(grid?.className).toContain("grid-cols-1");
    expect(grid?.className).toContain("sm:grid-cols-2");
    expect(grid?.className).toContain("lg:grid-cols-4");
  });

  it("entries 수와 카드 수 일치", () => {
    const { container } = render(
      <KpiGrid entries={ENTRIES} comingSoonNote="곧 제공" />,
    );
    expect(container.querySelectorAll('[data-testid="kpi-card"]').length).toBe(
      3,
    );
  });

  it("active / coming-soon 분리 data-state 정확", () => {
    const { container } = render(
      <KpiGrid entries={ENTRIES} comingSoonNote="곧 제공" />,
    );
    const cards = container.querySelectorAll('[data-testid="kpi-card"]');
    expect(cards[0]?.getAttribute("data-state")).toBe("active");
    expect(cards[1]?.getAttribute("data-state")).toBe("active");
    expect(cards[2]?.getAttribute("data-state")).toBe("coming-soon");
  });
});
