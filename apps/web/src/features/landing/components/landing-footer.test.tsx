import { describe, it, expect } from "vitest";
import { render } from "@testing-library/react";
import { LandingFooter } from "./landing-footer";

describe("LandingFooter — γ.2.3.5", () => {
  it("active locale link — navy-900 font-medium + aria-current", () => {
    const { container } = render(<LandingFooter locale="ko" hint="hint" />);
    const koLink = container.querySelector('a[href="/ko"]');
    expect(koLink?.getAttribute("aria-current")).toBe("page");
    expect(koLink?.className).toContain("text-hesya-navy-900");
    expect(koLink?.className).toContain("font-medium");
  });

  it("inactive locale link — navy/60 + hover amber-500", () => {
    const { container } = render(<LandingFooter locale="ko" hint="hint" />);
    const enLink = container.querySelector('a[href="/en"]');
    expect(enLink?.getAttribute("aria-current")).toBeNull();
    expect(enLink?.className).toContain("text-hesya-navy-900/60");
    expect(enLink?.className).toContain("hover:text-hesya-amber-500");
  });

  it("border-top peach-100", () => {
    const { container } = render(<LandingFooter locale="en" hint="hint" />);
    expect(
      container.querySelector("footer.border-hesya-peach-100"),
    ).toBeTruthy();
  });
});
