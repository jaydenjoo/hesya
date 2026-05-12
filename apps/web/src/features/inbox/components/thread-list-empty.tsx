"use client";

/**
 * M6.3g — col-1 빈 thread 상태. ThreadList 내부에서 호출되므로 peach-50 wrap.
 */

import { useTranslations } from "next-intl";

export function ThreadListEmpty() {
  const t = useTranslations("Inbox");
  return (
    <div
      data-testid="thread-list-empty"
      className="flex flex-1 flex-col items-center justify-center gap-2.5 px-6 py-12 text-center"
    >
      <div
        aria-hidden="true"
        className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-100 text-lg"
      >
        ✨
      </div>
      <p className="kr text-[13px] text-gray-500">{t("empty")}</p>
    </div>
  );
}
