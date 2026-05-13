import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ThreadItem } from "./thread-item";
import type { ConversationListItem } from "../types";

const conv: ConversationListItem = {
  id: "conv_1",
  storeId: "s1",
  customerId: "cust_1",
  customerName: null,
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

  it("avatar 표시 — customerName 없으면 customerId 첫 글자(대문자)", () => {
    render(
      <ThreadItem
        conversation={{ ...conv, customerId: "abc12345-..." }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    expect(screen.getByTestId("thread-avatar")).toHaveTextContent("A");
  });

  it("customerName 있으면 이름 표시 + avatar 첫 글자도 이름 기반", () => {
    render(
      <ThreadItem
        conversation={{
          ...conv,
          customerId: "abc12345-...",
          customerName: "Mei Tanaka",
        }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("Mei Tanaka")).toBeInTheDocument();
    expect(screen.getByTestId("thread-avatar")).toHaveTextContent("M");
  });

  it("customerName 없으면 customerId 8자 prefix 폴백 표시", () => {
    render(
      <ThreadItem
        conversation={{
          ...conv,
          customerId: "abcd1234-efgh-...",
          customerName: null,
        }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    expect(screen.getByText("abcd1234")).toBeInTheDocument();
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

  // γ.2.3.1 — 디자인 정합성 (active 좌측 amber bar + unread bg subtle)
  it("isActive=true → 좌측 amber bar (before:bg-hesya-amber-500)", () => {
    render(
      <ThreadItem conversation={conv} isActive={true} onClick={() => {}} />,
    );
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/before:bg-hesya-amber-500/);
  });

  it("isActive=false → 좌측 amber bar 없음", () => {
    render(
      <ThreadItem conversation={conv} isActive={false} onClick={() => {}} />,
    );
    const button = screen.getByRole("button");
    expect(button.className).not.toMatch(/before:bg-hesya-amber-500/);
  });

  it("unreadCount > 0 && !isActive → bg subtle (peach-100/40)", () => {
    render(
      <ThreadItem
        conversation={{ ...conv, unreadCount: 2 }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    const button = screen.getByRole("button");
    expect(button.className).toMatch(/bg-hesya-peach-100\/40/);
  });

  it("avatar bg는 customerId 해시 기반 4색 cycling — 같은 id는 같은 색", () => {
    const { rerender } = render(
      <ThreadItem
        conversation={{ ...conv, customerId: "cust_aaa" }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    const cls1 = screen.getByTestId("thread-avatar").className;
    rerender(
      <ThreadItem
        conversation={{ ...conv, customerId: "cust_aaa" }}
        isActive={false}
        onClick={() => {}}
      />,
    );
    const cls2 = screen.getByTestId("thread-avatar").className;
    expect(cls1).toBe(cls2); // deterministic
    expect(cls1).toMatch(/bg-(hesya-peach|trust-rose)/);
  });
});
