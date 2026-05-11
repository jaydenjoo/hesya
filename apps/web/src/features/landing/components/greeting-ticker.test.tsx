import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, act } from "@testing-library/react";
import { GreetingTicker } from "./greeting-ticker";

/**
 * γ.2.3.5 — Hesya landing 다국어 인사 ticker 검증.
 *
 * 5개 언어(en/ko/ja/zh/vi) cycling + amber underline + 한글 폰트 분기.
 */
describe("GreetingTicker — γ.2.3.5", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("초기 active = en (index 0)", () => {
    const { container } = render(<GreetingTicker />);
    const active = container.querySelector('[data-active="true"]');
    expect(active?.getAttribute("data-lang")).toBe("en");
    expect(active?.textContent).toBe("Welcome to Korea.");
  });

  it("3.2초 경과 → ko (index 1) active 전환", () => {
    const { container } = render(<GreetingTicker />);
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    const active = container.querySelector('[data-active="true"]');
    expect(active?.getAttribute("data-lang")).toBe("ko");
  });

  it("kr 그리팅은 Pretendard bold (italic 미적용)", () => {
    const { container } = render(<GreetingTicker />);
    const ko = container.querySelector('[data-lang="ko"]');
    expect(ko?.className).toContain("font-bold");
    expect(ko?.className).not.toContain("italic");
  });

  it("non-kr 그리팅은 italic font-display", () => {
    const { container } = render(<GreetingTicker />);
    const en = container.querySelector('[data-lang="en"]');
    expect(en?.className).toContain("italic");
    expect(en?.className).toContain("font-semibold");
  });

  it("amber underline 28→36 width 전환 (en 활성 시 36)", () => {
    const { container } = render(<GreetingTicker />);
    const bar = container.querySelector(".bg-hesya-amber-500");
    expect(bar).toBeTruthy();
    expect((bar as HTMLElement).style.width).toBe("36px");
  });

  it("ko 활성 시 underline 28", () => {
    const { container } = render(<GreetingTicker />);
    act(() => {
      vi.advanceTimersByTime(3200);
    });
    const bar = container.querySelector(".bg-hesya-amber-500");
    expect((bar as HTMLElement).style.width).toBe("28px");
  });
});
