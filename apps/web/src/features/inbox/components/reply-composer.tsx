"use client";

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { sendOutbound } from "../actions/send-outbound";
import { learnStoreTone } from "../actions/learn-store-tone";

type LearnNotice = {
  kind: "ok" | "err";
  key: "learnToneSuccess" | "learnToneError";
};

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
  // Phase 2-B — 톤 학습 결과 알림 (ok/err). 다음 입력/학습 시 reset.
  const [learnNotice, setLearnNotice] = useState<LearnNotice | null>(null);
  const [isPending, startTransition] = useTransition();
  const [isLearning, startLearning] = useTransition();

  // Phase 2-B HIGH-1 — stale notice/error는 caller(message-view)의 wrapper +
  // `key={activeId}` 패턴으로 자동 reset된다 (PROGRESS L293 결정). 본 컴포넌트
  // 안에서 useEffect로 setState하면 React 19 `react-hooks/set-state-in-effect`
  // 룰 위반이라 caller 책임으로 위임.

  const trimmed = text.trim();
  const busy = isPending || isLearning;
  const canSend = !disabled && trimmed.length > 0 && !busy;
  const canLearn = !disabled && trimmed.length > 0 && !busy;

  function handleSend() {
    setError(null);
    setLearnNotice(null);
    const value = trimmed;
    startTransition(async () => {
      try {
        await sendOutbound({ conversationId, text: value });
        setText("");
      } catch {
        // Server Action 측에서 captureServerActionError가 이미 Sentry capture.
        // 클라이언트는 일반화된 메시지만 표시 (err 원문 노출 금지).
        setError(t("sendErrorGeneric"));
      }
    });
  }

  // Phase 2-B — 사장이 textarea에 작성한 답변을 매장 톤 reference로 학습.
  // 디자인 ref `inbox-app.jsx` 라인 600 (`<button className="ix-store-tone kr">
  // 🎙️ 내 매장 톤 학습 →</button>`)와 매핑.
  function handleLearnTone() {
    setError(null);
    setLearnNotice(null);
    const value = trimmed;
    startLearning(async () => {
      try {
        await learnStoreTone({ text: value });
        setLearnNotice({ kind: "ok", key: "learnToneSuccess" });
      } catch {
        // Server Action에서 RateLimitError는 capture skip, 그 외 에러는 이미
        // captureServerActionError가 Sentry로. 클라이언트는 일반 메시지만 표시.
        setLearnNotice({ kind: "err", key: "learnToneError" });
      }
    });
  }

  return (
    <div className="border-t p-3">
      <div className="mb-2 flex justify-end">
        <button
          type="button"
          onClick={handleLearnTone}
          disabled={!canLearn}
          aria-label={t("learnTone")}
          className="text-xs text-muted-foreground transition-colors hover:text-foreground disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("learnTone")}
        </button>
      </div>
      <Textarea
        value={text}
        onChange={(e) => {
          setText(e.target.value);
          // Phase 2-B LOW-1 — 새 입력 시작 시 이전 학습 결과 메시지 제거.
          // 사용자가 다음 학습/발송 흐름을 명확히 인지하도록.
          if (learnNotice) setLearnNotice(null);
        }}
        placeholder={t("placeholder")}
        aria-label={t("label")}
        disabled={disabled || busy}
        rows={3}
        className="resize-none"
      />
      {error ? <p className="mt-2 text-sm text-destructive">{error}</p> : null}
      {learnNotice ? (
        <p
          className={
            "mt-1 text-xs " +
            (learnNotice.kind === "ok"
              ? "text-emerald-700"
              : "text-destructive")
          }
        >
          {t(learnNotice.key)}
        </p>
      ) : null}
      <div className="mt-2 flex justify-end">
        <Button onClick={handleSend} disabled={!canSend}>
          {t("send")}
        </Button>
      </div>
    </div>
  );
}
