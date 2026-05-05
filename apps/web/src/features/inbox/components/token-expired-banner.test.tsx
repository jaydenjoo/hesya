import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "ko",
}));

import { TokenExpiredBanner } from "./token-expired-banner";

describe("TokenExpiredBanner", () => {
  it("renders banner text", () => {
    render(<TokenExpiredBanner />);
    expect(screen.getByText("banner")).toBeInTheDocument();
  });

  it("button links to connect page with current locale", () => {
    render(<TokenExpiredBanner />);
    const link = screen.getByRole("link", { name: "button" });
    expect(link).toHaveAttribute("href", "/ko/store/inbox/connect");
  });
});
