"use client";

/**
 * Epic 1B-UI A-2 — ThreadRow 시각 풍부화 (γ.2.3.1 디자인 정합성).
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` Col 1 thread row +
 * `inbox.css` `.ix-thread-row`) 기반. 1B 데이터 한계 — VIP, urgent, 번역
 * preview, 고객 이름은 1B 스코프 밖 → 생략. 다음 Epic(고객 정보 적재)에서
 * 자연 추가.
 *
 * 구성: avatar(첫 글자, 38px, 4색 cycling) + 채널 아이콘 + customerId(8자
 *      short) + 시간 + preview + unread badge + active 시 좌측 amber bar.
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

// reference inbox-app.jsx — avatar bg 4색 cycling으로 thread list 다채로움.
const AVATAR_BGS = [
  "bg-hesya-peach-200",
  "bg-hesya-peach-100",
  "bg-hesya-peach-50",
  "bg-trust-rose",
] as const;

const TIME_FMT = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
  hour12: false,
});

function avatarChar(customerId: string): string {
  return (customerId.charAt(0) || "?").toUpperCase();
}

function avatarBg(customerId: string): string {
  let h = 0;
  for (let i = 0; i < customerId.length; i++) {
    h = (h * 31 + customerId.charCodeAt(i)) | 0;
  }
  return AVATAR_BGS[Math.abs(h) % AVATAR_BGS.length] ?? AVATAR_BGS[0];
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

  // active → peach-100, unread → peach-100/40 (옅음), default → white.
  const rowBg = isActive
    ? "bg-hesya-peach-100"
    : hasUnread
      ? "bg-hesya-peach-100/40 hover:bg-hesya-peach-50"
      : "bg-white hover:bg-hesya-peach-50";

  // active 시 좌측 3px amber bar (reference `.ix-thread-row.current::before`).
  const activeBar = isActive
    ? "before:absolute before:bottom-0 before:left-0 before:top-0 before:w-[3px] before:bg-hesya-amber-500 before:content-['']"
    : "";

  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={isActive ? "page" : undefined}
      className={`kr relative flex w-full items-start gap-2.5 px-3.5 py-2.5 text-left transition-colors ${rowBg} ${activeBar}`}
    >
      <div className="relative flex-shrink-0">
        <div
          data-testid="thread-avatar"
          className={`kr flex h-[38px] w-[38px] items-center justify-center rounded-full text-sm font-semibold text-hesya-navy-900 ${avatarBg(conversation.customerId)}`}
        >
          {avatarChar(conversation.customerId)}
        </div>
        <div
          data-testid="thread-channel-icon"
          aria-label={conversation.channel}
          className="absolute -bottom-0.5 -right-1 flex h-[18px] w-[18px] items-center justify-center rounded-full border-[1.5px] border-hesya-peach-50 bg-white text-[10px]"
        >
          {channelIcon}
        </div>
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-baseline justify-between gap-2">
          <span
            className={`truncate text-[13px] text-hesya-navy-900 ${hasUnread ? "font-bold" : "font-semibold"}`}
          >
            {conversation.customerId.slice(0, 8)}
          </span>
          {time ? (
            <span
              data-testid="thread-time"
              className="mono flex-shrink-0 text-[10px] text-gray-500"
            >
              {time}
            </span>
          ) : null}
        </div>
        <p
          className={`mt-0.5 truncate break-keep text-[12px] ${hasUnread ? "font-medium text-hesya-navy-900" : "text-gray-700"}`}
        >
          {conversation.lastMessagePreview ?? ""}
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
