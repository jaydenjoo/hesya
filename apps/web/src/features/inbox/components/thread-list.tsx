"use client";

/**
 * Epic 1B-UI A-2 + M6.3b/c — Col 1 헤더 + Channel chip + Filter pill + Search + ThreadList.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Col 1 + `inbox.css` .ix-*) :
 * - col-head: 제목 + total badge ✅
 * - channel-row (.ix-channel-row): All + 5 채널 chip (instagram/whatsapp/kakao/line/messenger) ✅ M6.3c
 * - filter-row (.ix-filter-row): 4 pills (미답/AI 대기/완료/VIP) — 미답만 functional, 나머지 visual ✅ M6.3c
 * - search bar (.ix-search) ✅ M6.3b
 * - thread-list ✅
 *
 * Filter 합성: channel ∩ search ∩ (unread filter 활성 시 unreadCount > 0).
 */

import { useMemo, useState } from "react";

import type { Conversation } from "../types";
import { ThreadItem } from "./thread-item";
import { ThreadListEmpty } from "./thread-list-empty";

type ChannelKey =
  | "all"
  | "instagram"
  | "whatsapp"
  | "kakao"
  | "line"
  | "messenger";

type FilterKey = null | "unread" | "ai" | "done" | "vip";

interface Labels {
  readonly title?: string;
  readonly unread?: string;
  readonly searchPlaceholder?: string;
  readonly searchAriaLabel?: string;
  readonly searchClearLabel?: string;
  readonly channelAll?: string;
  readonly filterUnread?: string;
  readonly filterAi?: string;
  readonly filterDone?: string;
  readonly filterVip?: string;
}

const CHANNELS: ReadonlyArray<{
  key: ChannelKey;
  icon: string;
  label: string;
}> = [
  { key: "all", icon: "●", label: "All" },
  { key: "instagram", icon: "📱", label: "IG" },
  { key: "kakao", icon: "💬", label: "KT" },
  { key: "whatsapp", icon: "📲", label: "WA" },
  { key: "line", icon: "💚", label: "LINE" },
  { key: "messenger", icon: "📘", label: "FB" },
];

export function ThreadList({
  conversations,
  activeId,
  onSelect,
  labels,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  labels?: Labels;
}) {
  const title = labels?.title ?? "스레드";
  const unreadLabel = labels?.unread ?? "미답";
  const searchPlaceholder =
    labels?.searchPlaceholder ?? "이름 또는 메시지 검색";
  const searchAriaLabel = labels?.searchAriaLabel ?? "스레드 검색";
  const searchClearLabel = labels?.searchClearLabel ?? "검색 지우기";
  const channelAll = labels?.channelAll ?? "All";
  const filterUnreadLabel = labels?.filterUnread ?? "미답";
  const filterAiLabel = labels?.filterAi ?? "AI 대기";
  const filterDoneLabel = labels?.filterDone ?? "완료";
  const filterVipLabel = labels?.filterVip ?? "VIP";

  const [searchTerm, setSearchTerm] = useState("");
  const [activeChannel, setActiveChannel] = useState<ChannelKey>("all");
  const [activeFilter, setActiveFilter] = useState<FilterKey>(null);

  // 채널별 카운트 — visible 표시용 (filter 적용 전 원본 기준).
  const channelCounts = useMemo(() => {
    const map: Partial<Record<ChannelKey, number>> = {
      all: conversations.length,
    };
    for (const c of conversations) {
      const key = c.channel as ChannelKey;
      map[key] = (map[key] ?? 0) + 1;
    }
    return map;
  }, [conversations]);

  // Filter pill 카운트 (visible). 미답만 데이터 기반, 나머지는 미정의 → undefined.
  const filterCounts = useMemo(() => {
    return {
      unread: conversations.reduce(
        (sum, c) => sum + (c.unreadCount > 0 ? 1 : 0),
        0,
      ),
      done: conversations.reduce(
        (sum, c) => sum + (c.unreadCount === 0 ? 1 : 0),
        0,
      ),
    };
  }, [conversations]);

  const trimmed = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    return conversations.filter((c) => {
      // Channel filter
      if (activeChannel !== "all" && c.channel !== activeChannel) return false;
      // Active filter (미답 / 완료 functional)
      if (activeFilter === "unread" && !(c.unreadCount > 0)) return false;
      if (activeFilter === "done" && !(c.unreadCount === 0)) return false;
      // ai / vip — functional 데이터 없음, 일치 항목 0건 처리
      if (activeFilter === "ai" || activeFilter === "vip") return false;
      // Search
      if (trimmed.length > 0) {
        const idMatch = c.customerId.toLowerCase().includes(trimmed);
        const previewMatch = (c.lastMessagePreview ?? "")
          .toLowerCase()
          .includes(trimmed);
        if (!idMatch && !previewMatch) return false;
      }
      return true;
    });
  }, [conversations, activeChannel, activeFilter, trimmed]);

  const unreadTotal = filtered.reduce(
    (sum, c) => sum + (c.unreadCount > 0 ? 1 : 0),
    0,
  );

  return (
    <>
      <header className="flex flex-shrink-0 items-center justify-between border-b border-hesya-peach-100 bg-white px-4 py-3.5">
        <h2 className="text-[15px] font-semibold tracking-[-0.005em] text-hesya-navy-900">
          {title}
        </h2>
        <span
          data-testid="thread-list-unread-total"
          className="rounded-full bg-hesya-peach-100 px-2.5 py-1 font-mono text-[10.5px] font-bold uppercase tracking-[0.04em] text-hesya-amber-600"
        >
          {unreadTotal} {unreadLabel}
        </span>
      </header>

      <div
        data-testid="thread-list-channels"
        className="flex flex-shrink-0 flex-wrap gap-1 border-b border-hesya-peach-100 bg-white px-3 py-2"
      >
        {CHANNELS.map((ch) => {
          const isActive = activeChannel === ch.key;
          const count =
            ch.key === "all"
              ? (channelCounts.all ?? 0)
              : (channelCounts[ch.key] ?? 0);
          return (
            <button
              key={ch.key}
              type="button"
              onClick={() => setActiveChannel(ch.key)}
              aria-pressed={isActive}
              className={[
                "flex flex-shrink-0 items-center gap-1 rounded-md border px-2 py-1 text-[11px] font-medium transition-colors",
                isActive
                  ? "border-hesya-amber-500 bg-hesya-peach-100 text-hesya-navy-900"
                  : "border-transparent bg-transparent text-gray-700 hover:bg-hesya-peach-50",
              ].join(" ")}
            >
              <span aria-hidden="true" className="text-[11px]">
                {ch.icon}
              </span>
              <span className="whitespace-nowrap">
                {ch.key === "all" ? channelAll : ch.label}
              </span>
              {count > 0 ? (
                <span
                  className={[
                    "font-mono text-[10px] font-bold",
                    isActive ? "text-hesya-amber-600" : "text-gray-500",
                  ].join(" ")}
                >
                  {count}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div
        data-testid="thread-list-filters"
        className="flex flex-shrink-0 flex-wrap gap-1 border-b border-hesya-peach-100 bg-white px-3 pb-2"
      >
        <FilterPill
          active={activeFilter === "unread"}
          onClick={() =>
            setActiveFilter(activeFilter === "unread" ? null : "unread")
          }
          dotColor="#c9483a"
          label={filterUnreadLabel}
          count={filterCounts.unread}
        />
        <FilterPill
          active={activeFilter === "ai"}
          onClick={() => setActiveFilter(activeFilter === "ai" ? null : "ai")}
          dotColor="#e0a85a"
          label={filterAiLabel}
        />
        <FilterPill
          active={activeFilter === "done"}
          onClick={() =>
            setActiveFilter(activeFilter === "done" ? null : "done")
          }
          dotColor="#4fae7e"
          label={filterDoneLabel}
          count={filterCounts.done}
        />
        <FilterPill
          active={activeFilter === "vip"}
          onClick={() => setActiveFilter(activeFilter === "vip" ? null : "vip")}
          icon="★"
          label={filterVipLabel}
        />
      </div>

      <div className="flex flex-shrink-0 items-center gap-1.5 border-b border-hesya-peach-100 bg-white px-3 py-2">
        <div className="flex h-8 w-full items-center gap-1.5 rounded-md border border-hesya-peach-200 bg-hesya-peach-50 px-2.5 focus-within:border-hesya-amber-500 focus-within:bg-white focus-within:ring-2 focus-within:ring-hesya-amber-500/20">
          <span aria-hidden="true" className="text-[12px] text-gray-500">
            ⌕
          </span>
          <input
            type="search"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder={searchPlaceholder}
            aria-label={searchAriaLabel}
            className="h-full flex-1 border-none bg-transparent text-[12px] text-hesya-navy-900 outline-none placeholder:text-gray-500"
          />
          {trimmed.length > 0 ? (
            <button
              type="button"
              onClick={() => setSearchTerm("")}
              aria-label={searchClearLabel}
              className="text-[11px] text-gray-500 hover:text-hesya-navy-900"
            >
              ✕
            </button>
          ) : null}
        </div>
      </div>

      {filtered.length === 0 ? (
        <ThreadListEmpty />
      ) : (
        <ul className="flex-1 divide-y divide-hesya-peach-100 overflow-y-auto">
          {filtered.map((c) => (
            <li key={c.id}>
              <ThreadItem
                conversation={c}
                isActive={c.id === activeId}
                onClick={() => onSelect(c.id)}
              />
            </li>
          ))}
        </ul>
      )}
    </>
  );
}

function FilterPill({
  active,
  onClick,
  dotColor,
  icon,
  label,
  count,
}: {
  active: boolean;
  onClick: () => void;
  dotColor?: string;
  icon?: string;
  label: string;
  count?: number;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={active}
      className={[
        "inline-flex items-center gap-1 rounded-full border px-2.5 py-1 text-[11px] transition-colors",
        active
          ? "border-hesya-amber-500 bg-hesya-peach-100 text-hesya-navy-900"
          : "border-transparent bg-hesya-peach-50 text-gray-700 hover:bg-hesya-peach-100",
      ].join(" ")}
    >
      {dotColor ? (
        <span
          aria-hidden="true"
          className="h-[7px] w-[7px] rounded-full"
          style={{ background: dotColor }}
        />
      ) : icon ? (
        <span aria-hidden="true" className="text-[11px]">
          {icon}
        </span>
      ) : null}
      <span className="whitespace-nowrap">{label}</span>
      {count != null ? (
        <span className="font-mono text-[10px] font-bold text-gray-500">
          {count}
        </span>
      ) : null}
    </button>
  );
}
