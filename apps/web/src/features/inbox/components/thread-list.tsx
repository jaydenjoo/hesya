"use client";

/**
 * Epic 1B-UI A-2 + M6.3b — Col 1 헤더 + Search + ThreadList.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Col 1 + `inbox.css` .ix-*) :
 * - col-head: 제목 + total badge ✅
 * - search bar (.ix-search): peach-50 bg + peach-200 border + 32px height ✅ M6.3b 추가
 * - thread-list ✅
 *
 * 채널 chip(IG/KT/WA/LINE/FB) + Filter pill(미답/AI 대기/완료/VIP)는 미구현
 * (1A는 IG only, filter 로직 미구현 — 시각만 추가하면 UX 함정).
 *
 * Search: client-side filter — customerId 8-prefix 또는 lastMessagePreview에
 * search term 포함 시 표시. 빈 결과는 ThreadListEmpty.
 */

import { useMemo, useState } from "react";

import type { Conversation } from "../types";
import { ThreadItem } from "./thread-item";
import { ThreadListEmpty } from "./thread-list-empty";

export function ThreadList({
  conversations,
  activeId,
  onSelect,
  labels,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
  labels?: {
    title?: string;
    unread?: string;
    searchPlaceholder?: string;
    searchAriaLabel?: string;
    searchClearLabel?: string;
  };
}) {
  const title = labels?.title ?? "스레드";
  const unreadLabel = labels?.unread ?? "미답";
  const searchPlaceholder =
    labels?.searchPlaceholder ?? "이름 또는 메시지 검색";
  const searchAriaLabel = labels?.searchAriaLabel ?? "스레드 검색";
  const searchClearLabel = labels?.searchClearLabel ?? "검색 지우기";
  const [searchTerm, setSearchTerm] = useState("");
  const trimmed = searchTerm.trim().toLowerCase();

  const filtered = useMemo(() => {
    if (trimmed.length === 0) return conversations;
    return conversations.filter((c) => {
      const idMatch = c.customerId.toLowerCase().includes(trimmed);
      const previewMatch = (c.lastMessagePreview ?? "")
        .toLowerCase()
        .includes(trimmed);
      return idMatch || previewMatch;
    });
  }, [conversations, trimmed]);

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
        data-testid="thread-list-search"
        className="flex flex-shrink-0 items-center gap-1.5 border-b border-hesya-peach-100 bg-white px-3 py-2"
      >
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
