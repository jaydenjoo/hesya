"use client";

import type { Message } from "../types";

const HOUR_MIN_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

export function MessageBubble({ message }: { message: Message }) {
  const isOutbound = message.direction === "outbound";
  const isFailed = message.status === "failed";
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
        } ${isFailed ? "ring-1 ring-destructive" : ""}`}
      >
        <p className="whitespace-pre-wrap break-words">
          {message.originalText}
        </p>
        <time
          dateTime={created.toISOString()}
          className="mt-1 block text-xs opacity-70"
        >
          {isFailed ? "⚠️ " : ""}
          {HOUR_MIN_FORMATTER.format(created)}
        </time>
      </div>
    </div>
  );
}
