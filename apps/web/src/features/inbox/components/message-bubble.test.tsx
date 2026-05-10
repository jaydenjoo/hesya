import { describe, it, expect, vi } from "vitest";
import { render, screen } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

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

  it("status='failed' → 이모지는 aria-hidden, sr-only 라벨 동반", () => {
    const { container } = render(
      <MessageBubble message={makeMsg({ status: "failed" })} />,
    );
    const emoji = container.querySelector('[aria-hidden="true"]');
    expect(emoji?.textContent).toContain("⚠️");
    expect(container.querySelector(".sr-only")?.textContent).toContain(
      "failedLabel",
    );
  });

  it("status≠'failed' → 이모지/sr-only 라벨 모두 없음", () => {
    const { container } = render(
      <MessageBubble message={makeMsg({ status: "delivered" })} />,
    );
    expect(container.querySelector('[aria-hidden="true"]')).toBeNull();
    expect(container.querySelector(".sr-only")).toBeNull();
  });

  it("translatedText 있으면 번역본 표시 (B-3b)", () => {
    render(
      <MessageBubble
        message={makeMsg({
          direction: "outbound",
          originalText: "안녕하세요!",
          translatedText: "Hello!",
          languageTo: "en",
        })}
      />,
    );
    expect(screen.getByText("안녕하세요!")).toBeInTheDocument();
    expect(screen.getByText("Hello!")).toBeInTheDocument();
  });

  it("translatedText 없으면 원문만 표시 (회귀)", () => {
    const { container } = render(
      <MessageBubble
        message={makeMsg({
          direction: "outbound",
          originalText: "안녕",
          translatedText: null,
        })}
      />,
    );
    expect(screen.getByText("안녕")).toBeInTheDocument();
    expect(container.querySelectorAll("p").length).toBe(1);
  });

  it("status='ai_draft' → 'AI 초안' 뱃지 표시 + data-status='ai_draft' (B-3b)", () => {
    const { container } = render(
      <MessageBubble
        message={makeMsg({ direction: "outbound", status: "ai_draft" })}
      />,
    );
    expect(container.firstChild).toHaveAttribute("data-status", "ai_draft");
    expect(screen.getByText(/AI 초안/)).toBeInTheDocument();
  });

  it("γ.2.3.2: customer 버블은 peach-100 + 좌하단 4px corner (꼬리)", () => {
    render(<MessageBubble message={makeMsg({ direction: "inbound" })} />);
    const body = screen.getByTestId("message-bubble-body");
    expect(body.className).toContain("bg-hesya-peach-100");
    expect(body.className).toContain("rounded-bl-[4px]");
  });

  it("γ.2.3.2: owner 버블은 amber-500 + 우하단 4px corner (꼬리)", () => {
    render(<MessageBubble message={makeMsg({ direction: "outbound" })} />);
    const body = screen.getByTestId("message-bubble-body");
    expect(body.className).toContain("bg-hesya-amber-500");
    expect(body.className).toContain("rounded-br-[4px]");
  });

  it("γ.2.3.2: <time>이 버블 외부 (sibling)에 위치, 10px gray-500", () => {
    const { container } = render(<MessageBubble message={makeMsg()} />);
    const body = container.querySelector('[data-testid="message-bubble-body"]');
    const timeEl = container.querySelector("time");
    expect(timeEl).not.toBeNull();
    expect(body?.contains(timeEl)).toBe(false);
    expect(timeEl?.className).toContain("text-[10px]");
    expect(timeEl?.className).toContain("text-gray-500");
  });

  it("γ.2.3.2: 메시지 wrapper에 max-w-[78%] (reference 정합)", () => {
    const { container } = render(<MessageBubble message={makeMsg()} />);
    const wrapper = container.querySelector(".max-w-\\[78\\%\\]");
    expect(wrapper).not.toBeNull();
  });
});
