"use client";

import { useTranslations, useLocale } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Button } from "@/components/ui/button";

export function TokenExpiredBanner() {
  const t = useTranslations("Inbox.tokenExpired");
  const locale = useLocale();

  return (
    <Alert variant="destructive" className="flex items-center justify-between">
      <AlertDescription>{t("banner")}</AlertDescription>
      <Button asChild variant="outline" size="sm">
        <a href={`/${locale}/store/inbox/connect`}>{t("button")}</a>
      </Button>
    </Alert>
  );
}
