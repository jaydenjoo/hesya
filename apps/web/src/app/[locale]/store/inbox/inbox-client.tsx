"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
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
import { ShortcutFab } from "@/features/inbox";
import type { ConversationListItem, Customer, Message } from "@/features/inbox";
import "./inbox.css";

const POLL_INTERVAL_MS = 5000;

export function InboxClient({
  initialConversations,
  hasIgIntegration,
  igTokenExpiresAt,
  storeId,
  storeBotMode,
}: {
  initialConversations: ConversationListItem[];
  hasIgIntegration: boolean;
  igTokenExpiresAt: Date | null;
  storeId: string;
  storeBotMode: boolean;
}) {
  const t = useTranslations("Inbox");
  const [conversations, setConversations] =
    useState<ConversationListItem[]>(initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);
  // Customer 확장 (CC-5) — activeId의 customer 정보. /api/inbox/refresh 응답에서 동봉.
  const [activeCustomer, setActiveCustomer] = useState<Customer | null>(null);
  // O2 fast track #7 (#5) — Shortcut modal open state.
  const [shortcutOpen, setShortcutOpen] = useState(false);

  // O2 fast track #7 (#6) — keyboard binding: J/K (이전/다음), ? (modal toggle).
  // 입력 요소 focus 중에는 무시 (composer 타이핑 방해 방지).
  useEffect(() => {
    function isTypingTarget(target: EventTarget | null): boolean {
      if (!(target instanceof HTMLElement)) return false;
      const tag = target.tagName;
      return (
        tag === "INPUT" ||
        tag === "TEXTAREA" ||
        tag === "SELECT" ||
        target.isContentEditable
      );
    }
    function onKey(e: KeyboardEvent) {
      if (e.metaKey || e.ctrlKey || e.altKey) return;
      if (isTypingTarget(e.target)) return;
      if (e.key === "?" || (e.shiftKey && e.key === "/")) {
        e.preventDefault();
        setShortcutOpen((v) => !v);
        return;
      }
      if (e.key === "Escape" && shortcutOpen) {
        setShortcutOpen(false);
        return;
      }
      const k = e.key.toLowerCase();
      if (k !== "j" && k !== "k") return;
      const ids = conversations.map((c) => c.id);
      if (ids.length === 0) return;
      const cur = activeId ?? ids[0]!;
      const idx = ids.indexOf(cur);
      const baseIdx = idx === -1 ? 0 : idx;
      const nextIdx =
        k === "j"
          ? Math.min(ids.length - 1, baseIdx + 1)
          : Math.max(0, baseIdx - 1);
      const nextId = ids[nextIdx];
      if (nextId && nextId !== activeId) {
        setActiveId(nextId);
        setActiveCustomer(null);
        setMessages([]);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [conversations, activeId, shortcutOpen]);

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
          conversations: ConversationListItem[];
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
  const customerName = active
    ? (active.customerName ?? active.customerId.slice(0, 8))
    : "";

  return (
    <div className="flex h-[calc(100vh-64px)] flex-col bg-hesya-peach-50">
      {tokenExpired ? <TokenExpiredBanner /> : null}
      <div
        data-testid="inbox-store-header"
        className="flex items-center justify-between border-b border-hesya-peach-100 bg-white px-6 py-2.5"
      >
        <div className="flex items-baseline gap-2.5">
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            Operator · Inbox
          </p>
          <h1 className="text-[15px] font-semibold tracking-[-0.005em] text-hesya-navy-900">
            통합 인박스
          </h1>
        </div>
        <BotModeToggle storeId={storeId} initialValue={storeBotMode} />
      </div>
      <ShortcutFab open={shortcutOpen} onOpenChange={setShortcutOpen} />
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
              labels={{
                title: t("threadListTitle"),
                unread: t("threadListUnread"),
                searchPlaceholder: t("searchPlaceholder"),
                searchAriaLabel: t("searchAriaLabel"),
                searchClearLabel: t("searchClearLabel"),
                channelAll: t("channelAll"),
                filterUnread: t("filterUnread"),
                filterAi: t("filterAi"),
                filterDone: t("filterDone"),
                filterVip: t("filterVip"),
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
