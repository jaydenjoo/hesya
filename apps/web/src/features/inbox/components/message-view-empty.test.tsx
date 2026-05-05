import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { MessageViewEmpty } from "./message-view-empty";

describe("MessageViewEmpty", () => {
  it("renders 'noSelection' text", () => {
    render(<MessageViewEmpty />);
    expect(screen.getByText("noSelection")).toBeInTheDocument();
  });
});
