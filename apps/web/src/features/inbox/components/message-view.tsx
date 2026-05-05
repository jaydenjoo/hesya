"use client";

import { useState, useTransition } from "react";
import type { Conversation, Message } from "../types";
import { getWindowStatus } from "../lib/window-utils";
import { acceptAiDraft } from "../actions/accept-ai-draft";
import { MessageViewEmpty } from "./message-view-empty";
import { ThreadHeader } from "./thread-header";
import { MessageList } from "./message-list";
import { ReplyComposer } from "./reply-composer";
import { AIAssist } from "./ai-assist";

type AIDraftMessage = Message & { originalText: string };

function pickAIDraft(message: Message | null): AIDraftMessage | null {
  if (!message) return null;
  if (message.direction !== "outbound") return null;
  if (message.status !== "ai_draft") return null;
  if (!message.originalText) return null;
  return message as AIDraftMessage;
}

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
  const [isAccepting, startAccepting] = useTransition();

  const windowState = getWindowStatus(
    conversation.messagingWindowExpiresAt,
  ).state;
  const isWindowOpen = windowState === "open" || windowState === "closing-soon";

  const lastMessage = messages[messages.length - 1] ?? null;
  const aiDraft = pickAIDraft(dismissed ? null : lastMessage);

  function handleEditDraft() {
    if (!aiDraft) return;
    setComposerInit(aiDraft.originalText);
    setComposerKey((k) => k + 1);
    setDismissed(true);
  }

  function handleReject() {
    setDismissed(true);
  }

  function handleAcceptAsIs() {
    if (!aiDraft) return;
    const messageId = aiDraft.id;
    startAccepting(async () => {
      // 발송 완료 시 revalidatePath로 messages 갱신 → status='sent' 전환되어
      // pickAIDraft가 null 반환 → AIAssist 자동 사라짐. 별 dismissed 호출 불필요.
      // 실패 시 acceptAiDraft가 throw → useTransition pending 해제 + 에러 노출.
      // (B-3c-follow-up: 사용자에게 toast 알림 추가 검토)
      await acceptAiDraft({ messageId });
    });
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
          draftText={aiDraft.originalText}
          onAcceptAsIs={handleAcceptAsIs}
          onEditDraft={handleEditDraft}
          onReject={handleReject}
          isAccepting={isAccepting}
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
