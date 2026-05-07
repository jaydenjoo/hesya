"use client";

import { useEffect, useState } from "react";
import {
  ThreadList,
  ThreadListConnectCTA,
  MessageView,
  TokenExpiredBanner,
  BotModeToggle,
  getWindowStatus,
} from "@/features/inbox";
import { InboxShell } from "@/features/inbox/components/inbox-shell";
import { ContextPanel } from "@/features/inbox/components/context-panel";
import type { Conversation, Customer, Message } from "@/features/inbox";

const POLL_INTERVAL_MS = 5000;

export function InboxClient({
  initialConversations,
  hasIgIntegration,
  igTokenExpiresAt,
  storeId,
  storeBotMode,
}: {
  initialConversations: Conversation[];
  hasIgIntegration: boolean;
  igTokenExpiresAt: Date | null;
  storeId: string;
  storeBotMode: boolean;
}) {
  const [conversations, setConversations] =
    useState<Conversation[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // Customer 확장 (CC-5) — activeId의 customer 정보. /api/inbox/refresh 응답에서 동봉.
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);

  useEffect(() => {
    if (!hasIgIntegration) return;
    let cancelled = false;
    let intervalId: ReturnType<typeof setInterval> | null = null;
    const stop = () => {
      cancelled = true;
      if (intervalId !== null) clearInterval(intervalId);
    };
    const tick = async () => {
      if (cancelled) return;
      const url = new URL("/api/inbox/refresh", window.location.origin);
      if (activeId) url.searchParams.set("activeId", activeId);
      try {
        const res = await fetch(url);
        if (!res.ok) {
          // 401/403: 세션 만료/권한 박탈 → 폴링 영구 중단.
          if (res.status === 401 || res.status === 403) {
            stop();
            return;
          }
          // 5xx 등 일시 오류 → 다음 tick에서 재시도.
          console.error("inbox poll failed", res.status);
          return;
        }
        const data = (await res.json()) as {
          conversations: Conversation[];
          messages: Record<string, Message[]>;
          customers?: Record<string, Customer>;
        };
        if (cancelled) return;
        setConversations(data.conversations);
        if (activeId && data.messages[activeId]) {
          setMessages(data.messages[activeId]);
        }
        if (activeId && data.customers?.[activeId]) {
          setActiveCustomer(data.customers[activeId]);
        } else if (!activeId) {
          setActiveCustomer(null);
        }
      } catch (err) {
        // 네트워크 오류 → 다음 tick 재시도. console에만 남김.
        console.error("inbox poll error", err);
      }
    };
    void tick();
    intervalId = setInterval(() => void tick(), POLL_INTERVAL_MS);
    return stop;
  }, [activeId, hasIgIntegration]);

  if (!hasIgIntegration) return <ThreadListConnectCTA />;

  const active = conversations.find((c) => c.id === activeId) ?? null;
  const tokenExpired = getWindowStatus(igTokenExpiresAt).state === "expired";
  const customerName = active ? active.customerId.slice(0, 8) : "";

  return (
    <div className="flex h-screen flex-col">
      {tokenExpired ? <TokenExpiredBanner /> : null}
      <div
        data-testid="inbox-store-header"
        className="flex items-center justify-end border-b border-hesya-peach-200 bg-white px-4 py-2"
      >
        <BotModeToggle storeId={storeId} initialValue={storeBotMode} />
      </div>
      <div className="flex-1 overflow-hidden">
        <InboxShell
          threadColumn={
            <ThreadList
              conversations={conversations}
              activeId={activeId}
              onSelect={(id) => {
                // HIGH-1 사후 리뷰: conversation 전환 시 즉시 reset → 다음 poll까지
                // 이전 customer/messages 잔류 방지 (Notes form stale 차단).
                setActiveId(id);
                setActiveCustomer(null);
                setMessages([]);
              }}
            />
          }
          messageColumn={
            <MessageView
              conversation={active}
              messages={messages}
              customerName={customerName}
            />
          }
          contextColumn={
            <ContextPanel
              conversation={active}
              messages={messages}
              customer={activeCustomer}
            />
          }
        />
      </div>
    </div>
  );
}
