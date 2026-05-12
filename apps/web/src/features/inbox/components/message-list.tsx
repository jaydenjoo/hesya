"use client";

import { useLocale } from "next-intl";
import type { Message } from "../types";
import { toDate } from "@/shared/lib/date-utils";
import { MessageBubble } from "./message-bubble";

/**
 * M6.3d — reference `.ix-day-mark` 날짜 구분자.
 *
 * 같은 날짜끼리 묶고, 날짜가 바뀌면 chip을 삽입한다.
 * 형식: locale 기반 "5월 12일" / "May 12" 등 (intl native).
 */
export function MessageList({ messages }: { messages: Message[] }) {
  const locale = useLocale();
  const dateFormatter = new Intl.DateTimeFormat(locale, {
    month: "long",
    day: "numeric",
    weekday: "short",
  });

  let lastDayKey = "";
  const items: React.ReactNode[] = [];
  for (const m of messages) {
    const d = toDate(m.createdAt) ?? new Date();
    const key = `${d.getFullYear()}-${d.getMonth()}-${d.getDate()}`;
    if (key !== lastDayKey) {
      items.push(
        <div
          key={`day-${key}`}
          data-testid="day-mark"
          className="kr self-center rounded-full bg-white/60 px-3 py-1 text-[11px] text-gray-500"
        >
          {dateFormatter.format(d)}
        </div>,
      );
      lastDayKey = key;
    }
    items.push(<MessageBubble key={m.id} message={m} />);
  }

  return <div className="flex flex-col gap-2.5 px-5 py-4">{items}</div>;
}
