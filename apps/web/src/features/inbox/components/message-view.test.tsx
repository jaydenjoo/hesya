import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "ko",
}));

vi.mock("../actions/send-outbound", () => ({
  sendOutbound: vi.fn(),
}));

import { MessageView } from "./message-view";
import type { Conversation, Message } from "../types";

const conv: Conversation = {
  id: "conv_1",
  storeId: "s1",
  customerId: "cust_1",
  channel: "instagram",
  status: "open",
  externalThreadId: null,
  messagingWindowExpiresAt: new Date(Date.now() + 5 * 60 * 60 * 1000),
  lastInboundAt: null,
  unreadCount: 0,
  lastMessagePreview: null,
  lastMessageAt: null,
  createdAt: new Date(),
  updatedAt: new Date(),
};

function makeMsg(id: string, text: string): Message {
  return {
    id,
    storeId: "s1",
    customerId: "cust_1",
    conversationId: "conv_1",
    channel: "instagram",
    direction: "inbound",
    externalMessageId: null,
    status: "delivered",
    originalText: text,
    translatedText: null,
    languageFrom: null,
    languageTo: null,
    aiResponded: false,
    aiModel: null,
    createdAt: new Date(),
  } as Message;
}

describe("MessageView", () => {
  it("conversation=null → MessageViewEmpty 렌더", () => {
    render(<MessageView conversation={null} messages={[]} customerName="" />);
    expect(screen.getByText("noSelection")).toBeInTheDocument();
  });

  it("conversation 있음 → ThreadHeader + MessageList + ReplyComposer 렌더", () => {
    render(
      <MessageView
        conversation={conv}
        messages={[makeMsg("m1", "안녕")]}
        customerName="홍길동"
      />,
    );
    expect(screen.getByText("홍길동")).toBeInTheDocument();
    expect(screen.getByText("안녕")).toBeInTheDocument();
    expect(screen.getByRole("textbox")).toBeInTheDocument();
    expect(screen.getByRole("button", { name: "send" })).toBeInTheDocument();
  });
});
