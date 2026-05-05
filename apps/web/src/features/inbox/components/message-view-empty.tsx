"use client";

import { useTranslations } from "next-intl";

export function MessageViewEmpty() {
  const t = useTranslations("Inbox.thread");
  return <p>{t("noSelection")}</p>;
}
