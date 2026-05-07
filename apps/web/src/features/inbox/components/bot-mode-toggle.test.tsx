import { describe, it, expect, vi, beforeEach } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("../actions/toggle-bot-mode", () => ({
  toggleBotMode: vi.fn(async () => ({ ok: true })),
}));

import { BotModeToggle } from "./bot-mode-toggle";
import { toggleBotMode } from "../actions/toggle-bot-mode";

const STORE_ID = "11111111-1111-4111-8111-111111111111";

describe("BotModeToggle", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("initialValue=false → '검수·승인' 라벨, aria-pressed=false", () => {
    render(<BotModeToggle storeId={STORE_ID} initialValue={false} />);
    const btn = screen.getByRole("button");
    expect(btn).toHaveTextContent("검수·승인");
    expect(btn.getAttribute("aria-pressed")).toBe("false");
  });

  it("클릭 → toggleBotMode 호출 + 라벨 'Bot 자동'으로 전환", async () => {
    render(<BotModeToggle storeId={STORE_ID} initialValue={false} />);
    const btn = screen.getByRole("button");
    fireEvent.click(btn);

    await waitFor(() => {
      expect(toggleBotMode).toHaveBeenCalledWith({
        storeId: STORE_ID,
        nextValue: true,
      });
    });
    await waitFor(() => {
      expect(btn).toHaveTextContent("Bot 자동");
    });
  });
});
