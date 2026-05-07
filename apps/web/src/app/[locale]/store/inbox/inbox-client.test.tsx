import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { render, screen, act } from "@testing-library/react";

vi.mock("next-intl", () => ({
  useTranslations: () => (key: string) => key,
  useLocale: () => "ko",
}));

// react-resizable-panels uses ResizeObserver — bypass in jsdom.
vi.mock("@/components/ui/resizable", () => {
  const Pass = ({ children }: { children?: React.ReactNode }) => (
    <>{children}</>
  );
  return {
    ResizablePanelGroup: Pass,
    ResizablePanel: Pass,
    ResizableHandle: () => null,
  };
});

// Server actions transitively imported via BotModeToggle / DraftReviewPanel —
// jsdom에서 "use server" + server-only 모듈 로드 차단.
vi.mock("@/features/inbox/actions/toggle-bot-mode", () => ({
  toggleBotMode: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/features/inbox/actions/approve-draft", () => ({
  approveDraft: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/features/inbox/actions/edit-and-send", () => ({
  editAndSend: vi.fn(async () => ({ ok: true })),
}));
vi.mock("@/features/inbox/actions/skip-draft", () => ({
  skipDraft: vi.fn(async () => ({ ok: true })),
}));

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
    ok: true,
    status: 200,
    json: async () => ({ conversations: [], messages: {} }),
  });
});

afterEach(() => {
  vi.unstubAllGlobals();
});

import { InboxClient } from "./inbox-client";
import type { Conversation } from "@/features/inbox/types";

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

describe("InboxClient", () => {
  const baseProps = {
    storeId: "11111111-1111-4111-8111-111111111111",
    storeBotMode: false,
  };

  it("hasIgIntegration=false → ThreadListConnectCTA 렌더 (notConnected key)", () => {
    render(
      <InboxClient
        {...baseProps}
        initialConversations={[]}
        hasIgIntegration={false}
        igTokenExpiresAt={null}
      />,
    );
    expect(screen.getByText("title")).toBeInTheDocument();
  });

  it("hasIgIntegration=true → ThreadList 렌더 (폴링 후에도 유지)", async () => {
    const conv = makeConv("c1", "안녕");
    fetchMock.mockResolvedValue({
      ok: true,
      status: 200,
      json: async () => ({ conversations: [conv], messages: {} }),
    });
    await act(async () => {
      render(
        <InboxClient
          {...baseProps}
          initialConversations={[conv]}
          hasIgIntegration={true}
          igTokenExpiresAt={null}
        />,
      );
    });
    expect(screen.getByText("안녕")).toBeInTheDocument();
  });

  it("토큰 만료 (igTokenExpiresAt이 과거) → TokenExpiredBanner 렌더", async () => {
    const past = new Date(Date.now() - 60_000);
    await act(async () => {
      render(
        <InboxClient
          {...baseProps}
          initialConversations={[]}
          hasIgIntegration={true}
          igTokenExpiresAt={past}
        />,
      );
    });
    expect(screen.getByText("banner")).toBeInTheDocument();
  });

  it("폴링 응답이 401 → 인터벌 중단 (다음 tick 호출 없음)", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 401,
      json: async () => ({}),
    });
    await act(async () => {
      render(
        <InboxClient
          {...baseProps}
          initialConversations={[]}
          hasIgIntegration={true}
          igTokenExpiresAt={null}
        />,
      );
    });
    const callsAfterFirst = fetchMock.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(15_000);
    });
    expect(fetchMock.mock.calls.length).toBe(callsAfterFirst);
    vi.useRealTimers();
  });

  it("폴링 응답이 500 → 인터벌 유지 (다음 tick 재시도)", async () => {
    vi.useFakeTimers();
    fetchMock.mockResolvedValue({
      ok: false,
      status: 500,
      json: async () => ({}),
    });
    await act(async () => {
      render(
        <InboxClient
          {...baseProps}
          initialConversations={[]}
          hasIgIntegration={true}
          igTokenExpiresAt={null}
        />,
      );
    });
    const callsAfterFirst = fetchMock.mock.calls.length;
    await act(async () => {
      vi.advanceTimersByTime(5_000);
    });
    expect(fetchMock.mock.calls.length).toBeGreaterThan(callsAfterFirst);
    vi.useRealTimers();
  });
});
