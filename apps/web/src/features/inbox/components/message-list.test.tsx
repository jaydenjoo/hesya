import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "ko",
}));

import { MessageList } from "./message-list";
import type { Message } from "../types";

function makeMsg(id: string, text: string, createdAt?: Date): Message {
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
    createdAt: createdAt ?? new Date("2026-05-05T12:00:00Z"),
  } as Message;
}

describe("MessageList", () => {
  it("renders each message originalText", () => {
    const msgs = [makeMsg("m1", "첫 메시지"), makeMsg("m2", "두 번째")];
    render(<MessageList messages={msgs} />);
    expect(screen.getByText("첫 메시지")).toBeInTheDocument();
    expect(screen.getByText("두 번째")).toBeInTheDocument();
  });

  it("empty messages → renders no bubbles", () => {
    const { container } = render(<MessageList messages={[]} />);
    expect(container.querySelectorAll("[data-direction]")).toHaveLength(0);
  });

  it("M6.3d — 같은 날짜는 day-mark 1개, 날짜 바뀌면 +1", () => {
    const msgs = [
      makeMsg("m1", "어제1", new Date("2026-05-11T10:00:00Z")),
      makeMsg("m2", "어제2", new Date("2026-05-11T15:00:00Z")),
      makeMsg("m3", "오늘1", new Date("2026-05-12T09:00:00Z")),
    ];
    render(<MessageList messages={msgs} />);
    expect(screen.getAllByTestId("day-mark")).toHaveLength(2);
  });

  it("M6.3d — 빈 메시지 → day-mark 0개", () => {
    render(<MessageList messages={[]} />);
    expect(screen.queryAllByTestId("day-mark")).toHaveLength(0);
  });
});
