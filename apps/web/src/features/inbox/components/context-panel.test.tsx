import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ContextPanel } from "./context-panel";
import type { Conversation, Message } from "../types";

function makeConv(overrides: Partial<Conversation> = {}): Conversation {
  return {
    id: "conv_1",
    storeId: "s1",
    customerId: "cust_abc12345_xyz",
    channel: "instagram",
    status: "open",
    externalThreadId: null,
    messagingWindowExpiresAt: null,
    lastInboundAt: null,
    unreadCount: 0,
    lastMessagePreview: null,
    lastMessageAt: new Date("2026-05-05T10:00:00Z"),
    createdAt: new Date("2026-04-01T09:00:00Z"),
    updatedAt: new Date(),
    ...overrides,
  };
}

function makeMsg(overrides: Partial<Message> = {}): Message {
  return {
    id: "m1",
    storeId: "s1",
    customerId: "cust_abc",
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
    createdAt: new Date("2026-05-05T10:00:00Z"),
    ...overrides,
  } as Message;
}

describe("ContextPanel (Epic 1B-UI A-4)", () => {
  it("conversation 미선택 → 안내 메시지", () => {
    render(<ContextPanel conversation={null} messages={[]} />);
    expect(screen.getByText(/대화를 선택/)).toBeInTheDocument();
  });

  it("기본 탭은 Info — customerId, 채널, 메시지 수, 첫 대화일 표시", () => {
    const conv = makeConv();
    const msgs = [makeMsg(), makeMsg({ id: "m2" })];
    render(<ContextPanel conversation={conv} messages={msgs} />);
    expect(screen.getByText("Info")).toBeInTheDocument();
    // 8자 short ID 표시
    expect(screen.getByText(/cust_abc/)).toBeInTheDocument();
    // 채널
    expect(screen.getByText(/instagram/i)).toBeInTheDocument();
    // 메시지 수 = 2
    expect(screen.getByTestId("ctx-msg-count")).toHaveTextContent("2");
  });

  it("History 탭 클릭 → 최근 메시지 timeline (최대 5개, 최신순)", () => {
    const conv = makeConv();
    const msgs = [
      makeMsg({
        id: "m1",
        originalText: "처음",
        direction: "inbound",
        createdAt: new Date("2026-05-05T10:00:00Z"),
      }),
      makeMsg({
        id: "m2",
        originalText: "둘째",
        direction: "outbound",
        createdAt: new Date("2026-05-05T10:01:00Z"),
      }),
      makeMsg({
        id: "m3",
        originalText: "셋째",
        direction: "inbound",
        createdAt: new Date("2026-05-05T10:02:00Z"),
      }),
    ];
    render(<ContextPanel conversation={conv} messages={msgs} />);
    fireEvent.click(screen.getByRole("tab", { name: "History" }));
    // 최신순 → 셋째가 먼저 (testid로 순서 검증)
    const items = screen.getAllByTestId("ctx-history-item");
    expect(items).toHaveLength(3);
    expect(items[0]).toHaveTextContent("셋째");
  });

  it("Notes 탭 → 1B 스코프 밖 placeholder", () => {
    render(<ContextPanel conversation={makeConv()} messages={[]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText(/메모 기능은 다음 업데이트/)).toBeInTheDocument();
  });

  it("Risk 탭 → 1B 스코프 밖 placeholder", () => {
    render(<ContextPanel conversation={makeConv()} messages={[]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Risk" }));
    expect(
      screen.getByText(/위험 신호 감지는 다음 업데이트/),
    ).toBeInTheDocument();
  });

  it("탭 클릭 → active 시각 상태 (aria-selected)", () => {
    render(<ContextPanel conversation={makeConv()} messages={[]} />);
    const infoBtn = screen.getByRole("tab", { name: "Info" });
    const historyBtn = screen.getByRole("tab", { name: "History" });
    expect(infoBtn).toHaveAttribute("aria-selected", "true");
    fireEvent.click(historyBtn);
    expect(historyBtn).toHaveAttribute("aria-selected", "true");
    expect(infoBtn).toHaveAttribute("aria-selected", "false");
  });
});
