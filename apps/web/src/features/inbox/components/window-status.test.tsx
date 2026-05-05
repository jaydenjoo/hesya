import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string, vars?: Record<string, unknown>) => {
    if (vars) return `${key}|${Object.values(vars).join(",")}`;
    return key;
  },
}));

import { WindowStatus } from "./window-status";

describe("WindowStatus", () => {
  it("expiresAt null → null (no render)", () => {
    const { container } = render(<WindowStatus expiresAt={null} />);
    expect(container.firstChild).toBeNull();
  });

  it("미래 12h → 'openWithTime' 텍스트", () => {
    const future = new Date(Date.now() + 12 * 60 * 60 * 1000);
    render(<WindowStatus expiresAt={future} />);
    expect(screen.getByText(/openWithTime/)).toBeInTheDocument();
  });

  it("미래 30분 → 'closingSoon' Alert", () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000);
    render(<WindowStatus expiresAt={soon} />);
    expect(screen.getByText(/closingSoon/)).toBeInTheDocument();
  });

  it("과거 → 'expired' Alert (variant destructive)", () => {
    const past = new Date(Date.now() - 1000);
    render(<WindowStatus expiresAt={past} />);
    expect(screen.getByText(/expired/)).toBeInTheDocument();
  });
});
