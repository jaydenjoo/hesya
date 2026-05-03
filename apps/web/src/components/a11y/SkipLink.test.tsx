/**
 * E9-13 SkipLink 단위 테스트.
 *
 * WCAG 2.4.1 (Level A): 키보드 사용자가 반복 탐색 영역(헤더·네비)을 건너뛰고
 * 본문으로 즉시 이동할 수 있어야 함. 평소엔 sr-only로 시각적으로 숨김 → Tab
 * focus 시 visible. AAA 강화 페이지(KYC·예약·결제) 첫 요소로 배치.
 */
import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import { SkipLink } from "./SkipLink";

describe("SkipLink", () => {
  it("href는 # + targetId로 anchor 점프", () => {
    render(<SkipLink targetId="main" label="본문으로 건너뛰기" />);
    const link = screen.getByRole("link", { name: "본문으로 건너뛰기" });
    expect(link.getAttribute("href")).toBe("#main");
  });

  it("기본 상태는 sr-only — 시각적으로 숨김 (a11y class 포함)", () => {
    render(<SkipLink targetId="main" label="Skip to main content" />);
    const link = screen.getByRole("link", {
      name: "Skip to main content",
    });
    expect(link.className).toContain("sr-only");
  });

  it("focus-visible 시 가시 — focus-visible:not-sr-only 토큰 포함", () => {
    // 실제 focus 시각화는 JSDOM에서 CSS 평가 안 함 → class 존재만 검증.
    render(<SkipLink targetId="main" label="본문으로" />);
    const link = screen.getByRole("link", { name: "본문으로" });
    expect(link.className).toMatch(/focus-visible:not-sr-only/);
  });
});
