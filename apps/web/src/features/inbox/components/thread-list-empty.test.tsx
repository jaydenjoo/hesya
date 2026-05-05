import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ThreadListEmpty } from "./thread-list-empty";

describe("ThreadListEmpty", () => {
  it("renders 'empty' translation key", () => {
    render(<ThreadListEmpty />);
    expect(screen.getByText("empty")).toBeInTheDocument();
  });
});
