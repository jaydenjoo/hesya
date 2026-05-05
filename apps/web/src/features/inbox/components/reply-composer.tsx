"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendOutbound } from "../actions/send-outbound";

export function ReplyComposer({
  conversationId,
  disabled,
  initialValue = "",
}: {
  conversationId: string;
  disabled: boolean;
  /**
   * 초기 입력값. Phase B-3b 'AI 초안 편집 후 보내기' 흐름에서 사장이
   * draft를 그대로 가져와 수정 가능하게 prefill. caller가 prefill 트리거
   * 시점을 React `key` prop으로 제어 (key 변경 → 새 마운트 → useState 재초기화).
   */
  initialValue?: string;
}) {
  const t = useTranslations("Inbox.composer");
  const [text, setText] = useState(initialValue);
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
      } catch {
        setError(t("sendErrorGeneric"));
      }
    });
  }

  return (
    <div className="border-t p-3">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("placeholder")}
        aria-label={t("label")}
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
