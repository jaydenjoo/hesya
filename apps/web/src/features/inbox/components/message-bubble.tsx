"use client";

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

  return (
    <div
      data-direction={message.direction}
      data-status={message.status}
      className={`flex ${isOutbound ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`max-w-[75%] rounded-2xl px-4 py-2 text-sm ${
          isOutbound
            ? "bg-primary text-primary-foreground"
            : "bg-muted text-foreground"
        } ${isFailed ? "ring-1 ring-destructive" : ""} ${
          isAIDraft ? "ring-1 ring-dashed ring-hesya-amber-500" : ""
        }`}
      >
        {isAIDraft ? (
          <div className="kr mb-1 inline-flex items-center gap-1 rounded bg-hesya-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-hesya-amber-600">
            🤖 AI 초안
          </div>
        ) : null}
        <p className="whitespace-pre-wrap break-words">
          {message.originalText}
        </p>
        {message.translatedText ? (
          <p
            className={`kr mt-1 border-t pt-1 text-xs italic ${
              isOutbound
                ? "border-primary-foreground/25 text-primary-foreground/85"
                : "border-foreground/10 text-muted-foreground"
            }`}
          >
            <span className="mr-1 opacity-70" aria-hidden="true">
              🌐
            </span>
            {message.translatedText}
          </p>
        ) : null}
        <time
          dateTime={created.toISOString()}
          className={`mt-1 block text-xs ${
            isOutbound ? "text-primary-foreground/80" : "text-muted-foreground"
          }`}
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
