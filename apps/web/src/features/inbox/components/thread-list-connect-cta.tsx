"use client";

/**
 * M6.3g — hasIgIntegration=false 매장용 connect CTA. peach-50 bg + amber 강조.
 */

import { useTranslations, useLocale } from "next-intl";

export function ThreadListConnectCTA() {
  const t = useTranslations("Inbox.notConnected");
  const locale = useLocale();
  return (
    <div
      data-testid="thread-list-connect-cta"
      className="flex h-full flex-col items-center justify-center gap-3.5 bg-hesya-peach-50 px-8 py-12 text-center"
    >
      <div
        aria-hidden="true"
        className="flex h-16 w-16 items-center justify-center rounded-full bg-hesya-peach-100 text-2xl"
      >
        📱
      </div>
      <div className="flex flex-col gap-1.5">
        <p className="font-display text-[18px] italic text-hesya-navy-900">
          {t("title")}
        </p>
        <p className="kr max-w-xs break-keep text-[13px] leading-relaxed text-gray-600">
          {t("description")}
        </p>
      </div>
      <a
        href={`/${locale}/store/inbox/connect`}
        className="kr mt-1 inline-flex items-center gap-1.5 rounded-md bg-hesya-amber-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-amber-600"
      >
        {t("button")}
        <span aria-hidden="true">→</span>
      </a>
    </div>
  );
}
