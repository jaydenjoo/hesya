import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent, waitFor } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
}));

const { updateCustomerNotesMock } = vi.hoisted(() => ({
  updateCustomerNotesMock: vi.fn(),
}));

vi.mock("../actions/update-customer-notes", () => ({
  updateCustomerNotes: updateCustomerNotesMock,
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
    // 8자 short ID 표시 — M6.3e 이후: ctx-head + Info tab 두 군데 (헤더 + block)
    expect(screen.getAllByText(/cust_abc/).length).toBeGreaterThanOrEqual(1);
    // 채널 — M6.3e 이후: ctx-head + Info tab 두 군데
    expect(screen.getAllByText(/instagram/i).length).toBeGreaterThanOrEqual(1);
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

  it("Notes 탭 — customer 미전달 시 로딩 안내 (caller가 다음 poll에서 채움)", () => {
    render(<ContextPanel conversation={makeConv()} messages={[]} />);
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    expect(screen.getByText(/고객 정보 로딩 중/)).toBeInTheDocument();
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

  it("M6.3e — ctx-head: 64px avatar + customer name + channel (tabs 상단)", () => {
    render(
      <ContextPanel
        conversation={makeConv()}
        messages={[]}
        customer={{
          id: "cust_abc",
          externalId: "ig_1",
          channel: "instagram",
          name: "Alice Kim",
          nationality: null,
          preferredLanguage: "en",
          paymentMethodPreferred: null,
          totalVisits: 0,
          ltvKrw: 0,
          allergyNote: null,
          preferredDesigner: null,
          igProfileFetched: false,
          email: null,
          lastSeenAt: null,
        }}
      />,
    );
    const head = screen.getByTestId("ctx-head");
    expect(head).toHaveTextContent("Alice Kim");
    expect(head).toHaveTextContent("instagram");
    // avatar 첫 글자 "A"
    expect(head.querySelector("div")?.textContent).toBe("A");
  });

  // ─── Customer 확장 (CC-5) ───

  it("customer prop 있음 → Info 탭에 name 표시", () => {
    render(
      <ContextPanel
        conversation={makeConv()}
        messages={[]}
        customer={{
          id: "cust_abc",
          externalId: "ig_1",
          channel: "instagram",
          name: "Alice Kim",
          nationality: null,
          preferredLanguage: "en",
          paymentMethodPreferred: null,
          totalVisits: 0,
          ltvKrw: 0,
          allergyNote: null,
          preferredDesigner: null,
          igProfileFetched: false,
          email: null,
          lastSeenAt: null,
        }}
      />,
    );
    expect(screen.getByText("Alice Kim")).toBeInTheDocument();
  });

  it("customer.totalVisits + ltvKrw 표시 (Info 탭)", () => {
    render(
      <ContextPanel
        conversation={makeConv()}
        messages={[]}
        customer={{
          id: "cust_abc",
          externalId: "ig_1",
          channel: "instagram",
          name: "Bob",
          nationality: null,
          preferredLanguage: "ko",
          paymentMethodPreferred: null,
          totalVisits: 7,
          ltvKrw: 245000,
          allergyNote: null,
          preferredDesigner: null,
          igProfileFetched: false,
          email: null,
          lastSeenAt: null,
        }}
      />,
    );
    expect(screen.getByText("7")).toBeInTheDocument();
    // 천 단위 포맷 (245,000 또는 ₩245,000)
    expect(screen.getByText(/245,000/)).toBeInTheDocument();
  });

  it("Notes 탭 — customer 데이터로 form prefill (allergyNote/preferredDesigner)", () => {
    render(
      <ContextPanel
        conversation={makeConv()}
        messages={[]}
        customer={{
          id: "cust_abc",
          externalId: "ig_1",
          channel: "instagram",
          name: null,
          nationality: null,
          preferredLanguage: null,
          paymentMethodPreferred: null,
          totalVisits: 0,
          ltvKrw: 0,
          allergyNote: "땅콩 알러지",
          preferredDesigner: "민지",
          igProfileFetched: true,
          email: null,
          lastSeenAt: null,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    // textarea / input value로 표시
    expect(screen.getByDisplayValue("땅콩 알러지")).toBeInTheDocument();
    expect(screen.getByDisplayValue("민지")).toBeInTheDocument();
  });

  it("Notes 탭 — 저장 버튼 클릭 → updateCustomerNotes 호출 + ok notice", async () => {
    updateCustomerNotesMock.mockResolvedValueOnce({ ok: true });
    render(
      <ContextPanel
        conversation={makeConv()}
        messages={[]}
        customer={{
          id: "cust_abc",
          externalId: "ig_1",
          channel: "instagram",
          name: null,
          nationality: null,
          preferredLanguage: null,
          paymentMethodPreferred: null,
          totalVisits: 0,
          ltvKrw: 0,
          allergyNote: "이전 메모",
          preferredDesigner: "이전",
          igProfileFetched: true,
          email: null,
          lastSeenAt: null,
        }}
      />,
    );
    fireEvent.click(screen.getByRole("tab", { name: "Notes" }));
    fireEvent.change(screen.getByLabelText("알러지 메모"), {
      target: { value: "수정된 메모" },
    });
    fireEvent.click(screen.getByRole("button", { name: /저장/ }));
    await waitFor(() => {
      expect(updateCustomerNotesMock).toHaveBeenCalledWith({
        conversationId: "conv_1",
        customerId: "cust_abc",
        allergyNote: "수정된 메모",
        preferredDesigner: "이전",
      });
    });
    expect(screen.getByText("저장됨")).toBeInTheDocument();
  });
});
