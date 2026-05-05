"use client";

import { useTranslations } from "next-intl";

export function ThreadListEmpty() {
  const t = useTranslations("Inbox");
  return <p>{t("empty")}</p>;
}
