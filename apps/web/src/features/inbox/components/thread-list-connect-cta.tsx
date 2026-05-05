"use client";

import { useTranslations } from "next-intl";

export function ThreadListConnectCTA({ locale }: { locale: string }) {
  const t = useTranslations("Inbox.notConnected");
  return (
    <div>
      <p>{t("title")}</p>
      <p>{t("description")}</p>
      <a href={`/${locale}/store/inbox/connect`}>{t("button")}</a>
    </div>
  );
}
