"use client";

import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getWindowStatus } from "../lib/window-utils";

function formatRemaining(ms: number): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

export function WindowStatus({ expiresAt }: { expiresAt: Date | null }) {
  const t = useTranslations("Inbox.window");
  const status = getWindowStatus(expiresAt);

  if (status.state === "no-inbound") return null;

  if (status.state === "expired") {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t("expired")} — {t("expiredHelp")}
        </AlertDescription>
      </Alert>
    );
  }

  const time = formatRemaining(status.remainingMs ?? 0);
  if (status.state === "closing-soon") {
    return (
      <Alert>
        <AlertDescription>{t("closingSoon", { time })}</AlertDescription>
      </Alert>
    );
  }

  return (
    <span className="text-sm text-muted-foreground">
      {t("openWithTime", { time })}
    </span>
  );
}
