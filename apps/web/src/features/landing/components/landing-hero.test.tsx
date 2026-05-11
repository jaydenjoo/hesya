import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LandingHero } from "./landing-hero";

describe("LandingHero — γ.2.3.5", () => {
  const baseProps = {
    locale: "ko",
    subCopy: "테스트 카피",
    ctaLabel: "사장님 로그인",
    customerNote: "검색은 베타 합류 후",
  };

  it("primary CTA — amber-500 bg + hover amber-600 + locale-aware sign-in href", () => {
    const { container } = render(<LandingHero {...baseProps} />);
    const cta = container.querySelector(
      "a.bg-hesya-amber-500.hover\\:bg-hesya-amber-600",
    );
    expect(cta).toBeTruthy();
    expect(cta?.getAttribute("href")).toBe("/ko/sign-in");
    expect(cta?.textContent).toBe("사장님 로그인");
  });

  it("sub copy max-w 30ch + navy-900/75 text", () => {
    const { container } = render(<LandingHero {...baseProps} />);
    const sub = container.querySelector("p.text-hesya-navy-900\\/75");
    expect(sub).toBeTruthy();
    expect(sub?.className).toContain("max-w-[30ch]");
  });

  it("customer note navy/55 + locale en CTA href", () => {
    const { container } = render(
      <LandingHero
        {...baseProps}
        locale="en"
        ctaLabel="Salon owner sign-in →"
      />,
    );
    const cta = container.querySelector("a.bg-hesya-amber-500");
    expect(cta?.getAttribute("href")).toBe("/en/sign-in");
  });
});
