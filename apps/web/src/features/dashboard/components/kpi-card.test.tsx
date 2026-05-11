import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { KpiCard } from "./kpi-card";

describe("KpiCard — Epic 4 ε / D4-D1", () => {
  it("active state — peach-200 border + white bg + navy-900 value", () => {
    const { container } = render(
      <KpiCard
        label="미응답"
        value="5"
        unit="건"
        state="active"
        comingSoonNote="곧 제공"
      />,
    );
    const card = container.querySelector('[data-testid="kpi-card"]');
    expect(card?.getAttribute("data-state")).toBe("active");
    expect(card?.className).toContain("border-hesya-peach-200");
    expect(card?.className).toContain("bg-white");
    expect(container.querySelector(".text-hesya-navy-900")).toBeTruthy();
  });

  it("coming-soon state — dashed border + peach-50 bg + navy/30 value", () => {
    const { container } = render(
      <KpiCard
        label="월 매출"
        value="—"
        state="coming-soon"
        comingSoonNote="결제 도입 후 활성화"
      />,
    );
    const card = container.querySelector('[data-testid="kpi-card"]');
    expect(card?.getAttribute("data-state")).toBe("coming-soon");
    expect(card?.className).toContain("border-dashed");
    expect(card?.className).toContain("border-hesya-peach-200");
    expect(card?.className).toContain("bg-hesya-peach-50/40");
    expect(container.querySelector(".text-hesya-navy-900\\/30")).toBeTruthy();
    expect(container.textContent).toContain("결제 도입 후 활성화");
  });

  it("active subtext 표시 / coming-soon은 subtext 숨김", () => {
    const { container: a } = render(
      <KpiCard
        label="x"
        value="3"
        state="active"
        comingSoonNote=""
        subtext="open 5건"
      />,
    );
    expect(a.textContent).toContain("open 5건");

    const { container: b } = render(
      <KpiCard
        label="x"
        value="—"
        state="coming-soon"
        comingSoonNote="곧"
        subtext="ignored subtext"
      />,
    );
    expect(b.textContent).not.toContain("ignored subtext");
  });

  it("unit prop optional", () => {
    const { container } = render(
      <KpiCard label="x" value="5" state="active" comingSoonNote="" />,
    );
    expect(container.querySelectorAll("span").length).toBeGreaterThan(0);
    expect(container.textContent).toBe("x5");
  });
});
