"use client";

import { useEffect, useState } from "react";
import {
  ResizablePanelGroup,
  ResizablePanel,
  ResizableHandle,
} from "@/components/ui/resizable";
import { ThreadList } from "@/features/inbox/components/thread-list";
import { ThreadListConnectCTA } from "@/features/inbox/components/thread-list-connect-cta";
import { MessageView } from "@/features/inbox/components/message-view";
import { TokenExpiredBanner } from "@/features/inbox/components/token-expired-banner";
import { getWindowStatus } from "@/features/inbox/lib/window-utils";
import type { Conversation, Message } from "@/features/inbox/types";

const POLL_INTERVAL_MS = 5000;

export function InboxClient({
  initialConversations,
  hasIgIntegration,
  igTokenExpiresAt,
}: {
  initialConversations: Conversation[];
  hasIgIntegration: boolean;
  igTokenExpiresAt: Date | null;
}) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    if (!hasIgIntegration) return;
    let cancelled = false;
    const tick = async () => {
      const url = new URL("/api/inbox/refresh", window.location.origin);
      if (activeId) url.searchParams.set("activeId", activeId);
      try {
        const res = await fetch(url);
        const data = (await res.json()) as {
          conversations: Conversation[];
          messages: Record<string, Message[]>;
        };
        if (cancelled) return;
        setConversations(data.conversations);
        if (activeId && data.messages[activeId]) {
          setMessages(data.messages[activeId]);
        }
      } catch {
        // 폴링 실패는 다음 tick에서 자연 복구.
      }
    };
    void tick();
    const id = setInterval(() => void tick(), POLL_INTERVAL_MS);
    return () => {
      cancelled = true;
      clearInterval(id);
    };
  }, [activeId, hasIgIntegration]);

  if (!hasIgIntegration) return <ThreadListConnectCTA />;

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const tokenExpired = getWindowStatus(igTokenExpiresAt).state === "expired";
  const customerName = active ? active.customerId.slice(0, 8) : "";

  return (
    <div className="flex h-screen flex-col">
      {tokenExpired ? <TokenExpiredBanner /> : null}
      <ResizablePanelGroup orientation="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={15}>
          <ThreadList
            conversations={conversations}
            activeId={activeId}
            onSelect={setActiveId}
          />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75}>
          <MessageView
            conversation={active}
            messages={messages}
            customerName={customerName}
          />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
