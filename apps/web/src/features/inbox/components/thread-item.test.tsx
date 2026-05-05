import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ThreadItem } from "./thread-item";
import type { Conversation } from "../types";

const conv: Conversation = {
  id: "conv_1",
  storeId: "s1",
  customerId: "cust_1",
  channel: "instagram",
  status: "open",
  externalThreadId: null,
  messagingWindowExpiresAt: null,
  lastInboundAt: null,
  unreadCount: 0,
  lastMessagePreview: "안녕하세요, 단발 가능?",
  lastMessageAt: new Date(),
  createdAt: new Date(),
  updatedAt: new Date(),
};

describe("ThreadItem (A-2 시각 풍부화)", () => {
  it("renders lastMessagePreview", () => {
    render(
      <ThreadItem conversation={conv} isActive={false} onClick={() => {}} />,
    );
    expect(screen.getByText(/안녕하세요/)).toBeInTheDocument();
  });

  it("onClick fires when clicked", () => {
    const onClick = vi.fn();
    render(
      <ThreadItem conversation={conv} isActive={false} onClick={onClick} />,
    );
    fireEvent.click(screen.getByRole("button"));
    expect(onClick).toHaveBeenCalledTimes(1);
  });

  it("isActive=true → aria-current='page'", () => {
    render(
      <ThreadItem conversation={conv} isActive={true} onClick={() => {}} />,
    );
    expect(screen.getByRole("button")).toHaveAttribute("aria-current", "page");
  });

  it("avatar 표시 — customerId 첫 글자(대문자)", () => {
    render(
      <ThreadItem
        conversation={{ ...conv, customerId: "abc12345-..." }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    expect(screen.getByTestId("thread-avatar")).toHaveTextContent("A");
  });

  it("unreadCount > 0 → unread badge + bold preview", () => {
    render(
      <ThreadItem
        conversation={{ ...conv, unreadCount: 3 }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    expect(screen.getByTestId("unread-badge")).toHaveTextContent("3");
  });

  it("unreadCount=0 → unread badge 없음", () => {
    render(
      <ThreadItem
        conversation={{ ...conv, unreadCount: 0 }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    expect(screen.queryByTestId("unread-badge")).not.toBeInTheDocument();
  });

  it("lastMessageAt 있으면 시간 표시 (HH:mm 형식)", () => {
    const at = new Date("2026-05-05T14:24:00Z");
    render(
      <ThreadItem
        conversation={{ ...conv, lastMessageAt: at }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    // 로컬타임존 의존 → 정규식으로 HH:mm 패턴만 검증
    expect(screen.getByTestId("thread-time").textContent).toMatch(
      /^\d{2}:\d{2}$/,
    );
  });

  it("channel='instagram' → IG 채널 아이콘 표시", () => {
    render(
      <ThreadItem conversation={conv} isActive={false} onClick={() => {}} />,
    );
    expect(screen.getByTestId("thread-channel-icon")).toBeInTheDocument();
  });
});
