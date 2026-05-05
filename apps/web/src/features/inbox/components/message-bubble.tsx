"use client";

/**
 * Epic 1B-UI A-3a — MessageBubble 시각 hesya tone 통일.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` ix-msg/ix-bubble) 색상.
 * 기능 무변경 — 색상 토큰만 shadcn 기본 → hesya tone (peach/amber/navy).
 *
 * 톤 매핑:
 * - outbound: amber-500 배경 + 흰 글씨 (사장 메시지 강조)
 * - inbound: peach-50 배경 + navy 글씨 (고객 메시지 부드러움)
 * - ai_draft: amber dashed ring (사장이 검토 필요 시각 신호)
 * - failed: red ring
 */

import { useTranslations } from "next-intl";
import type { Message } from "../types";

const HOUR_MIN_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

export function MessageBubble({ message }: { message: Message }) {
  const t = useTranslations("Inbox.thread");
  const isOutbound = message.direction === "outbound";
  const isFailed = message.status === "failed";
  const isAIDraft = message.status === "ai_draft";
  const created = message.createdAt ?? new Date();

  const bubbleClass = isOutbound
    ? "bg-hesya-amber-500 text-white"
    : "bg-hesya-peach-50 text-hesya-navy-900";
  const translatedClass = isOutbound
    ? "border-white/30 text-white/90"
    : "border-hesya-peach-200 text-gray-700";
  const timeClass = isOutbound ? "text-white/80" : "text-gray-500";

  return (
    <div
      data-direction={message.direction}
      data-status={message.status}
      className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`kr max-w-[75%] rounded-2xl px-4 py-2 text-sm shadow-sm ${bubbleClass} ${
          isFailed ? "ring-1 ring-red-500" : ""
        } ${isAIDraft ? "ring-1 ring-dashed ring-hesya-amber-500" : ""}`}
      >
        {isAIDraft ? (
          <div className="kr mb-1 inline-flex items-center gap-1 rounded bg-hesya-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-hesya-amber-600">
            🤖 AI 초안
          </div>
        ) : null}
        <p className="whitespace-pre-wrap break-keep">{message.originalText}</p>
        {message.translatedText ? (
          <p
            className={`kr mt-1 break-keep border-t pt-1 text-xs italic ${translatedClass}`}
          >
            <span className="mr-1 opacity-70" aria-hidden="true">
              🌐
            </span>
            {message.translatedText}
          </p>
        ) : null}
        <time
          dateTime={created.toISOString()}
          className={`mono mt-1 block text-xs ${timeClass}`}
        >
          {isFailed ? (
            <>
              <span aria-hidden="true">⚠️ </span>
              <span className="sr-only">{t("failedLabel")} </span>
            </>
          ) : null}
          {HOUR_MIN_FORMATTER.format(created)}
        </time>
      </div>
    </div>
  );
}
