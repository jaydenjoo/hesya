import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";

import { MessageBubble } from "./message-bubble";
import type { Message } from "../types";

function makeMsg(overrides: Partial<Message> = {}): Message {
  return {
    id: "m1",
    storeId: "s1",
    customerId: "cust_1",
    conversationId: "conv_1",
    channel: "instagram",
    direction: "inbound",
    externalMessageId: null,
    status: "delivered",
    originalText: "안녕하세요",
    translatedText: null,
    languageFrom: null,
    languageTo: null,
    aiResponded: false,
    aiModel: null,
    createdAt: new Date("2026-05-05T12:00:00Z"),
    ...overrides,
  } as Message;
}

describe("MessageBubble", () => {
  it("renders originalText", () => {
    render(<MessageBubble message={makeMsg()} />);
    expect(screen.getByText("안녕하세요")).toBeInTheDocument();
  });

  it("inbound → data-direction='inbound'", () => {
    const { container } = render(
      <MessageBubble message={makeMsg({ direction: "inbound" })} />,
    );
    expect(container.firstChild).toHaveAttribute("data-direction", "inbound");
  });

  it("outbound → data-direction='outbound'", () => {
    const { container } = render(
      <MessageBubble message={makeMsg({ direction: "outbound" })} />,
    );
    expect(container.firstChild).toHaveAttribute("data-direction", "outbound");
  });

  it("status='failed' → data-status='failed'", () => {
    const { container } = render(
      <MessageBubble message={makeMsg({ status: "failed" })} />,
    );
    expect(container.firstChild).toHaveAttribute("data-status", "failed");
  });

  it("renders <time> with createdAt ISO datetime attribute", () => {
    const created = new Date("2026-05-05T12:00:00Z");
    const { container } = render(
      <MessageBubble message={makeMsg({ createdAt: created })} />,
    );
    const timeEl = container.querySelector("time");
    expect(timeEl).not.toBeNull();
    expect(timeEl).toHaveAttribute("datetime", created.toISOString());
  });
});
