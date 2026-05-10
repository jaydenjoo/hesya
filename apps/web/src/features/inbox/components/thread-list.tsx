"use client";

/**
 * Epic 1B-UI A-2 — Col 1 헤더 + ThreadList.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Col 1) 헤더만 적용.
 * 채널 chip(IG/KT/WA/LINE/FB) + Filter pill(미답/AI 대기/완료/VIP)는 별 PR
 * (1A는 IG only, filter 로직 미구현 — 시각만 추가하면 UX 함정).
 *
 * unreadTotal: unreadCount > 0인 **thread 수** (메시지 수 아님). 디자인 ref
 * "12 미답"과 동일 의미.
 */

import type { Conversation } from "../types";
import { ThreadItem } from "./thread-item";
import { ThreadListEmpty } from "./thread-list-empty";

export function ThreadList({
  conversations,
  activeId,
  onSelect,
}: {
  conversations: Conversation[];
  activeId: string | null;
  onSelect: (id: string) => void;
}) {
  const unreadTotal = conversations.reduce(
    (sum, c) => sum + (c.unreadCount > 0 ? 1 : 0),
    0,
  );

  return (
    <>
      <header className="flex flex-shrink-0 items-baseline justify-between border-b border-hesya-peach-100 bg-white px-4 py-3">
        <h2 className="kr text-lg font-bold tracking-tight text-hesya-navy-900">
          통합 인박스
        </h2>
        <span
          data-testid="thread-list-unread-total"
          className="mono text-xs text-hesya-amber-600"
        >
          {unreadTotal} 미답
        </span>
      </header>
      {conversations.length === 0 ? (
        <ThreadListEmpty />
      ) : (
        <ul className="flex-1 divide-y divide-hesya-peach-100 overflow-y-auto">
          {conversations.map((c) => (
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
