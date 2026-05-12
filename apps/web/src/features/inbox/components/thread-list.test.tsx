import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

import { ThreadList } from "./thread-list";
import type { Conversation } from "../types";

function makeConv(id: string, preview: string): Conversation {
  return {
    id,
    storeId: "s1",
    customerId: "cust_" + id,
    channel: "instagram",
    status: "open",
    externalThreadId: null,
    messagingWindowExpiresAt: null,
    lastInboundAt: null,
    unreadCount: 0,
    lastMessagePreview: preview,
    lastMessageAt: new Date(),
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

describe("ThreadList", () => {
  it("conversations 빈 배열 → ThreadListEmpty 렌더 (key 'empty')", () => {
    render(
      <ThreadList conversations={[]} activeId={null} onSelect={() => {}} />,
    );
    expect(screen.getByText("empty")).toBeInTheDocument();
  });

  it("conversations 매핑 → 각 ThreadItem 렌더", () => {
    const convs = [makeConv("a", "안녕"), makeConv("b", "예약 가능?")];
    render(
      <ThreadList conversations={convs} activeId="a" onSelect={() => {}} />,
    );
    expect(screen.getByText("안녕")).toBeInTheDocument();
    expect(screen.getByText("예약 가능?")).toBeInTheDocument();
  });

  it("ThreadItem 클릭 → onSelect(conv.id) 호출", () => {
    const convs = [makeConv("conv_x", "hi")];
    const onSelect = vi.fn();
    render(
      <ThreadList conversations={convs} activeId={null} onSelect={onSelect} />,
    );
    // M6.3c 이후: channel chip + filter pill button 추가. preview 텍스트로 thread row 식별.
    const previewSpan = screen.getByText("hi");
    fireEvent.click(previewSpan.closest("button")!);
    expect(onSelect).toHaveBeenCalledWith("conv_x");
  });

  it("A-2 헤더: '통합 인박스' + unread 미답 카운트 표시", () => {
    const convs = [
      { ...makeConv("a", "x"), unreadCount: 2 },
      { ...makeConv("b", "y"), unreadCount: 0 },
      { ...makeConv("c", "z"), unreadCount: 5 },
    ];
    render(
      <ThreadList conversations={convs} activeId={null} onSelect={() => {}} />,
    );
    expect(screen.getByText("스레드")).toBeInTheDocument();
    // unread > 0 인 thread 수 (메시지 수가 아닌 미답 thread 수). 2개.
    expect(screen.getByTestId("thread-list-unread-total")).toHaveTextContent(
      "2",
    );
  });

  it("빈 상태에서도 헤더 표시 (사장이 빈 인박스에서도 매장 상태 인지)", () => {
    render(
      <ThreadList conversations={[]} activeId={null} onSelect={() => {}} />,
    );
    expect(screen.getByText("스레드")).toBeInTheDocument();
    expect(screen.getByTestId("thread-list-unread-total")).toHaveTextContent(
      "0",
    );
  });
});
