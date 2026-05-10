"use client";

/**
 * Epic 1B-UI A-3a — ThreadHeader 시각 풍부화.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` ix-thread-head) 기반.
 * 1B 데이터 한계 — 고객 국적 flag, 온라인 상태, "처리 완료/VIP" action은
 * 1B 스코프 밖. avatar + 채널 아이콘 + 이름 + 채널 라벨 + window status만.
 */

import { useTranslations } from "next-intl";
import { WindowStatus } from "./window-status";

const CHANNEL_ICONS: Record<string, string> = {
  instagram: "📱",
  whatsapp: "📲",
  kakao: "💬",
  line: "💚",
  messenger: "📘",
};

function avatarChar(name: string): string {
  return (name.trim().charAt(0) || "?").toUpperCase();
}

export function ThreadHeader({
  customerName,
  channel,
  windowExpiresAt,
}: {
  customerName: string;
  channel: string;
  windowExpiresAt: Date | null;
}) {
  const t = useTranslations("Inbox.thread");
  const channelKey =
    channel === "instagram" ? "channelInstagram" : "channelUnknown";
  const channelIcon = CHANNEL_ICONS[channel] ?? "💬";

  return (
    <header className="flex h-16 flex-shrink-0 items-center justify-between border-b border-hesya-peach-100 bg-white px-5">
      <div className="flex items-center gap-3">
        <div className="relative">
          <div
            data-testid="thread-header-avatar"
            className="flex h-9 w-9 items-center justify-center rounded-full bg-hesya-peach-200 text-[13px] font-semibold text-hesya-navy-900"
          >
            {avatarChar(customerName)}
          </div>
          <div
            data-testid="thread-header-channel-icon"
            aria-label={channel}
            className="absolute -bottom-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full bg-white text-[10px] shadow-sm"
          >
            {channelIcon}
          </div>
        </div>
        <div className="flex min-w-0 flex-col">
          <span className="kr text-sm font-semibold text-hesya-navy-900">
            {customerName || "—"}
          </span>
          <span
            data-testid="thread-header-meta"
            className="kr mt-0.5 text-[11px] text-gray-500"
          >
            {t(channelKey)}
          </span>
        </div>
      </div>
      <WindowStatus expiresAt={windowExpiresAt} />
    </header>
  );
}
