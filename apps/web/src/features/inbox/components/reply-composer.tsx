"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendOutbound } from "../actions/send-outbound";

export function ReplyComposer({
  conversationId,
  disabled,
}: {
  conversationId: string;
  disabled: boolean;
}) {
  const t = useTranslations("Inbox.composer");
  const [text, setText] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const canSend = !disabled && text.trim().length > 0 && !isPending;

  function handleSend() {
    setError(null);
    const trimmed = text.trim();
    startTransition(async () => {
      try {
        await sendOutbound({ conversationId, text: trimmed });
        setText("");
      } catch (e) {
        const reason = e instanceof Error ? e.message : "unknown";
        setError(t("sendError", { reason }));
      }
    });
  }

  return (
    <div className="border-t p-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("placeholder")}
        disabled={disabled || isPending}
        rows={3}
        className="resize-none"
      />
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      <div className="mt-2 flex justify-end">
        <Button onClick={handleSend} disabled={!canSend}>
          {t("send")}
        </Button>
      </div>
    </div>
  );
}
