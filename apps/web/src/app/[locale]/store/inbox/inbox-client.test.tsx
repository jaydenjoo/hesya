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

const { fetchMock } = vi.hoisted(() => ({ fetchMock: vi.fn() }));

beforeEach(() => {
  fetchMock.mockReset();
  vi.stubGlobal("fetch", fetchMock);
  fetchMock.mockResolvedValue({
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
  it("hasIgIntegration=false → ThreadListConnectCTA 렌더 (notConnected key)", () => {
    render(
      <InboxClient
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
      json: async () => ({ conversations: [conv], messages: {} }),
    });
    await act(async () => {
      render(
        <InboxClient
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
          initialConversations={[]}
          hasIgIntegration={true}
          igTokenExpiresAt={past}
        />,
      );
    });
    expect(screen.getByText("banner")).toBeInTheDocument();
  });
});
