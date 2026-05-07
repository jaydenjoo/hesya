import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "ko",
}));

vi.mock("../actions/send-outbound", () => ({
  sendOutbound: vi.fn(),
}));

vi.mock("../actions/accept-ai-draft", () => ({
  acceptAiDraft: vi.fn(async () => ({ ok: true, externalMessageId: "out_1" })),
}));

// Phase 1-β Task D — DraftReviewPanel가 import하는 server actions 차단.
vi.mock("../actions/approve-draft", () => ({
  approveDraft: vi.fn(async () => ({ ok: true })),
}));
vi.mock("../actions/edit-and-send", () => ({
  editAndSend: vi.fn(async () => ({ ok: true })),
}));
vi.mock("../actions/skip-draft", () => ({
  skipDraft: vi.fn(async () => ({ ok: true })),
}));

import { MessageView } from "./message-view";
import { acceptAiDraft } from "../actions/accept-ai-draft";
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

function makeMsg(
  id: string,
  text: string,
  overrides: Partial<Message> = {},
): Message {
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
    ...overrides,
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

  it("마지막 메시지가 ai_draft outbound → AIAssist 패널 표시 (B-3b)", () => {
    render(
      <MessageView
        conversation={conv}
        messages={[
          makeMsg("m1", "안녕", { direction: "inbound" }),
          makeMsg("m2", "안녕하세요! 도와드릴게요.", {
            direction: "outbound",
            status: "ai_draft",
          }),
        ]}
        customerName="홍길동"
      />,
    );
    expect(screen.getByText(/AI가 답변을 준비/)).toBeInTheDocument();
    expect(
      screen.getByRole("button", { name: /편집 후 보내기/ }),
    ).toBeInTheDocument();
  });

  it("마지막 메시지가 inbound → AIAssist 미표시", () => {
    render(
      <MessageView
        conversation={conv}
        messages={[makeMsg("m1", "안녕", { direction: "inbound" })]}
        customerName="홍길동"
      />,
    );
    expect(screen.queryByText(/AI가 답변을 준비/)).not.toBeInTheDocument();
  });

  it("마지막 메시지가 일반 outbound (status='sent') → AIAssist 미표시", () => {
    render(
      <MessageView
        conversation={conv}
        messages={[
          makeMsg("m1", "안녕", { direction: "outbound", status: "sent" }),
        ]}
        customerName="홍길동"
      />,
    );
    expect(screen.queryByText(/AI가 답변을 준비/)).not.toBeInTheDocument();
  });

  it("'편집 후 보내기' 클릭 → composer textarea에 prefill (B-3b)", async () => {
    render(
      <MessageView
        conversation={conv}
        messages={[
          makeMsg("m1", "안녕", { direction: "inbound" }),
          makeMsg("m2", "AI가 만든 한국어 초안", {
            direction: "outbound",
            status: "ai_draft",
          }),
        ]}
        customerName="홍길동"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /편집 후 보내기/ }),
    );
    expect(screen.getByRole("textbox")).toHaveValue("AI가 만든 한국어 초안");
  });

  it("'그대로 보내기' 클릭 → acceptAiDraft 호출 (B-3c)", async () => {
    vi.mocked(acceptAiDraft).mockClear();
    render(
      <MessageView
        conversation={conv}
        messages={[
          makeMsg("m1", "안녕", { direction: "inbound" }),
          makeMsg("m2", "안녕하세요!", {
            direction: "outbound",
            status: "ai_draft",
          }),
        ]}
        customerName="홍길동"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /^그대로 보내기$/ }),
    );
    expect(acceptAiDraft).toHaveBeenCalledWith({ messageId: "m2" });
  });

  it("'거절하고 직접 작성' 클릭 → AIAssist 사라짐", async () => {
    render(
      <MessageView
        conversation={conv}
        messages={[
          makeMsg("m1", "안녕", { direction: "inbound" }),
          makeMsg("m2", "초안", {
            direction: "outbound",
            status: "ai_draft",
          }),
        ]}
        customerName="홍길동"
      />,
    );
    await userEvent.click(
      screen.getByRole("button", { name: /거절하고 직접 작성/ }),
    );
    expect(screen.queryByText(/AI가 답변을 준비/)).not.toBeInTheDocument();
  });
});
