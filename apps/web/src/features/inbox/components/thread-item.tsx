"use client";

/**
 * Epic 1B-UI A-2 — ThreadRow 시각 풍부화.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Col 1 thread row) 기반.
 * 1B 데이터 한계 — VIP, urgent, 번역 preview, 고객 이름은 1B 스코프 밖 →
 * 생략. 다음 Epic(고객 정보 적재)에서 자연 추가.
 *
 * 구성: avatar(첫 글자) + 채널 아이콘 + customerId(8자 short) + 시간 +
 *      preview + unread badge.
 *
 * 시간 포맷: HH:mm (Intl.DateTimeFormat 로컬타임존 — 사장 컴퓨터 시각 기준).
 */

import type { Conversation } from "../types";
import { safeFormat } from "@/shared/lib/date-utils";

const CHANNEL_ICONS: Record<string, string> = {
  instagram: "📱",
  whatsapp: "📲",
  kakao: "💬",
  line: "💚",
  messenger: "📘",
};

const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function avatarChar(customerId: string): string {
  return (customerId.charAt(0) || "?").toUpperCase();
}

export function ThreadItem({
  conversation,
  isActive,
  onClick,
}: {
  conversation: Conversation;
  isActive: boolean;
  onClick: () => void;
}) {
  const hasUnread = conversation.unreadCount > 0;
  const channelIcon = CHANNEL_ICONS[conversation.channel] ?? "💬";
  const time = safeFormat(conversation.lastMessageAt, TIME_FMT, "");

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={
        "kr flex w-full items-start gap-3 px-3 py-3 text-left transition-colors " +
        (isActive ? "bg-hesya-peach-100" : "bg-white hover:bg-hesya-peach-50")
      }
    >
      <div className="relative flex-shrink-0">
        <div
          data-testid="thread-avatar"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-200 text-sm font-semibold text-hesya-navy-900"
        >
          {avatarChar(conversation.customerId)}
        </div>
        <div
          data-testid="thread-channel-icon"
          aria-label={conversation.channel}
          className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] shadow-sm"
        >
          {channelIcon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span className="truncate text-sm font-semibold text-hesya-navy-900">
            {conversation.customerId.slice(0, 8)}
          </span>
          {time ? (
            <span
              data-testid="thread-time"
              className="mono flex-shrink-0 text-xs text-gray-500"
            >
              {time}
            </span>
          ) : null}
        </div>
        <p
          className={
            "mt-1 break-keep text-sm " +
            (hasUnread ? "font-medium text-hesya-navy-900" : "text-gray-700")
          }
        >
          <span className="line-clamp-2">
            {conversation.lastMessagePreview ?? ""}
          </span>
        </p>
        {hasUnread ? (
          <div className="mt-1 flex justify-end">
            <span
              data-testid="unread-badge"
              className="mono inline-flex h-5 min-w-[20px] items-center justify-center rounded-full bg-hesya-amber-500 px-1.5 text-xs font-semibold text-white"
            >
              {conversation.unreadCount}
            </span>
          </div>
        ) : null}
      </div>
    </button>
  );
}
