"use client";

import { useTranslations, useLocale } from "next-intl";
import { Button } from "@/components/ui/button";

export function ThreadListConnectCTA() {
  const t = useTranslations("Inbox.notConnected");
  const locale = useLocale();
  return (
    <div className="flex flex-col items-center gap-2 p-6 text-center">
      <p className="font-semibold">{t("title")}</p>
      <p className="text-sm text-muted-foreground">{t("description")}</p>
      <Button asChild>
        <a href={`/${locale}/store/inbox/connect`}>{t("button")}</a>
      </Button>
    </div>
  );
}
