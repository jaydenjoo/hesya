"use client";

import type { Conversation } from "../types";

export function ThreadItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "true" : undefined}
      className="block w-full p-3 text-left hover:bg-accent"
    >
      <p className="truncate text-sm">{conversation.lastMessagePreview}</p>
    </button>
  );
}
