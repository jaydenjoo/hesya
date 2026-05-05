import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ThreadListConnectCTA } from "./thread-list-connect-cta";

describe("ThreadListConnectCTA", () => {
  it("renders title + description + button text", () => {
    render(<ThreadListConnectCTA locale="ko" />);
    expect(screen.getByText("title")).toBeInTheDocument();
    expect(screen.getByText("description")).toBeInTheDocument();
    expect(screen.getByRole("link", { name: "button" })).toBeInTheDocument();
  });

  it("button link points to /[locale]/store/inbox/connect", () => {
    render(<ThreadListConnectCTA locale="en" />);
    const link = screen.getByRole("link", { name: "button" });
    expect(link.getAttribute("href")).toBe("/en/store/inbox/connect");
  });
});
