"use client";

/**
 * M6.3g — col-2 비선택 상태. peach-50 bg + 중앙 Fraunces italic 안내.
 */

import { useTranslations } from "next-intl";

export function MessageViewEmpty() {
  const t = useTranslations("Inbox.thread");
  return (
    <div
      data-testid="message-view-empty"
      className="flex h-full flex-col items-center justify-center gap-3 bg-hesya-peach-50 px-8 text-center"
    >
      <div
        aria-hidden="true"
        className="flex h-14 w-14 items-center justify-center rounded-full bg-hesya-peach-100 text-2xl"
      >
        💬
      </div>
      <p className="font-display text-[18px] italic text-hesya-navy-900">
        {t("noSelection")}
      </p>
    </div>
  );
}
