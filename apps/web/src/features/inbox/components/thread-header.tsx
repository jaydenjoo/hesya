"use client";

import { useTranslations } from "next-intl";
import { Badge } from "@/components/ui/badge";
import { WindowStatus } from "./window-status";

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
  const channelKey = channel === "instagram" ? "channelInstagram" : channel;

  return (
    <header className="flex items-center justify-between border-b px-4 py-3">
      <div className="flex items-center gap-2">
        <span className="font-semibold">{customerName}</span>
        <Badge variant="secondary">{t(channelKey)}</Badge>
      </div>
      <WindowStatus expiresAt={windowExpiresAt} />
    </header>
  );
}
