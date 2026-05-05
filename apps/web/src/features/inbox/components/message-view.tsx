"use client";

import type { Conversation, Message } from "../types";
import { getWindowStatus } from "../lib/window-utils";
import { MessageViewEmpty } from "./message-view-empty";
import { ThreadHeader } from "./thread-header";
import { MessageList } from "./message-list";
import { ReplyComposer } from "./reply-composer";

export function MessageView({
  conversation,
  messages,
  customerName,
}: {
  conversation: Conversation | null;
  messages: Message[];
  customerName: string;
}) {
  if (!conversation) return <MessageViewEmpty />;

  const windowState = getWindowStatus(
    conversation.messagingWindowExpiresAt,
  ).state;
  const isWindowOpen = windowState === "open" || windowState === "closing-soon";

  return (
    <div className="flex h-full flex-col">
      <ThreadHeader
        customerName={customerName}
        channel={conversation.channel}
        windowExpiresAt={conversation.messagingWindowExpiresAt}
      />
      <div className="flex-1 overflow-y-auto">
        <MessageList messages={messages} />
      </div>
      <ReplyComposer
        conversationId={conversation.id}
        disabled={!isWindowOpen}
      />
    </div>
  );
}
