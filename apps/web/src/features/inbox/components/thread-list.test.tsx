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
    fireEvent.click(screen.getByRole("button"));
    expect(onSelect).toHaveBeenCalledWith("conv_x");
  });
});
