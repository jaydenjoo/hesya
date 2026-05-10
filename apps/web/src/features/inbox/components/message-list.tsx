"use client";

import type { Message } from "../types";
import { MessageBubble } from "./message-bubble";

export function MessageList({ messages }: { messages: Message[] }) {
  return (
    <div className="flex flex-col gap-2.5 px-5 py-4">
      {messages.map((m) => (
        <MessageBubble key={m.id} message={m} />
      ))}
    </div>
  );
}
