"use client";

import { useState } from "react";
import type { Conversation, Message } from "../types";
import { getWindowStatus } from "../lib/window-utils";
import { MessageViewEmpty } from "./message-view-empty";
import { ThreadHeader } from "./thread-header";
import { MessageList } from "./message-list";
import { ReplyComposer } from "./reply-composer";
import { AIAssist } from "./ai-assist";

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
  // active 변경 시 내부 상태(AIAssist dismiss / composer prefill) 자동 reset.
  // useEffect로 prop 동기화하면 react-hooks/set-state-in-effect 위반.
  return (
    <MessageViewActive
      key={conversation.id}
      conversation={conversation}
      messages={messages}
      customerName={customerName}
    />
  );
}

function MessageViewActive({
  conversation,
  messages,
  customerName,
}: {
  conversation: Conversation;
  messages: Message[];
  customerName: string;
}) {
  const [dismissed, setDismissed] = useState(false);
  const [composerInit, setComposerInit] = useState("");
  const [composerKey, setComposerKey] = useState(0);

  const windowState = getWindowStatus(
    conversation.messagingWindowExpiresAt,
  ).state;
  const isWindowOpen = windowState === "open" || windowState === "closing-soon";

  const lastMessage = messages[messages.length - 1] ?? null;
  const aiDraft =
    !dismissed &&
    lastMessage?.direction === "outbound" &&
    lastMessage?.status === "ai_draft" &&
    lastMessage.originalText
      ? lastMessage
      : null;

  function handleEditDraft() {
    if (!aiDraft?.originalText) return;
    setComposerInit(aiDraft.originalText);
    setComposerKey((k) => k + 1);
    setDismissed(true);
  }

  function handleAcceptAsIs() {
    // B-3c에서 IG send 트리거 + status 'sent' 전환으로 교체 예정.
    // 현재는 placeholder — 사장은 '편집 후 보내기' → 수정 → 발송 흐름 사용.
    alert("AI 답변 자동 발송은 다음 단계(B-3c)에서 구현됩니다.");
  }

  function handleReject() {
    setDismissed(true);
  }

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
      {aiDraft ? (
        <AIAssist
          draftText={aiDraft.originalText!}
          onAcceptAsIs={handleAcceptAsIs}
          onEditDraft={handleEditDraft}
          onReject={handleReject}
        />
      ) : null}
      <ReplyComposer
        key={composerKey}
        conversationId={conversation.id}
        disabled={!isWindowOpen}
        initialValue={composerInit}
      />
    </div>
  );
}
