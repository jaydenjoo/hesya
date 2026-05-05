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

describe("ThreadItem", () => {
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
});
