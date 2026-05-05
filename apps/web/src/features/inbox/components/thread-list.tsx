"use client";

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
  if (conversations.length === 0) return <ThreadListEmpty />;

  return (
    <ul className="divide-y">
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
  );
}
