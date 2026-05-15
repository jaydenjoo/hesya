"use client";

/**
 * Epic 1B + M6.3f — reference `.ix-composer` 정합.
 *
 * - 외곽: 흰 배경 + peach-100 border-top
 * - 입력: peach-50 bg + peach-200 border + focus-within → amber + white
 * - 톤 학습 버튼: dashed peach-200 → solid amber on hover (`.ix-store-tone`)
 * - 발송: 입력 비어있을 때 gray-300 / 활성 시 amber-500 (`.ix-send-btn`)
 */

import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
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

  // γ.2.3.3 — `.ix-comp-toolbar` 4 tool 버튼 (photo/voice/attach/templates) 시각 도입.
  // 모두 비활성 + "곧 출시" tooltip — L-082 정직 처리 (UI 약속 ≠ 기능 약속).
  // 실제 기능 도입은 별 PR (Vision photo / voice memo / file attach / template lib).
  const TOOL_BUTTONS = [
    { key: "photo", icon: "📷", labelKey: "toolPhoto" as const },
    { key: "voice", icon: "🎙️", labelKey: "toolVoice" as const },
    { key: "attach", icon: "📎", labelKey: "toolAttach" as const },
    { key: "templates", icon: "💡", labelKey: "toolTemplates" as const },
  ];

  return (
    <div
      data-testid="reply-composer"
      className="flex-shrink-0 border-t border-hesya-peach-100 bg-white px-4 pt-2.5 pb-3.5"
    >
      {/* `.ix-comp-toolbar` 정합: 좌측 tool 4 버튼 (disabled) + 우측 tone learn */}
      <div className="mb-2 flex items-center gap-1.5">
        {TOOL_BUTTONS.map((tool) => (
          <button
            key={tool.key}
            type="button"
            disabled
            aria-label={`${t(tool.labelKey)} — ${t("toolComingSoon")}`}
            title={`${t(tool.labelKey)} · ${t("toolComingSoon")}`}
            className="kr inline-flex h-7 w-7 flex-shrink-0 cursor-not-allowed items-center justify-center rounded border border-transparent text-[14px] opacity-40 transition-opacity hover:opacity-60"
          >
            <span aria-hidden="true">{tool.icon}</span>
          </button>
        ))}
        <span
          aria-hidden="true"
          className="mx-1 h-4 w-px flex-shrink-0 bg-hesya-peach-100"
        />
        <div className="flex-1" />
        <button
          type="button"
          onClick={handleLearnTone}
          disabled={!canLearn}
          aria-label={t("learnTone")}
          className="kr cursor-pointer whitespace-nowrap rounded border border-dashed border-hesya-peach-200 bg-transparent px-2.5 py-1 text-[11px] font-medium text-gray-700 transition-colors hover:border-solid hover:border-hesya-amber-500 hover:text-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {t("learnTone")}
        </button>
      </div>
      {/* reference `.ix-comp-shortcuts` — 단축키 행 (kbd 1~9 = 템플릿 슬롯). */}
      <div className="mb-2 hidden items-center gap-1.5 text-[10px] text-gray-500 sm:flex">
        <span className="kr">{t("shortcutsLabel")}</span>
        {[1, 2, 3, 4, 5, 6, 7, 8, 9].map((n) => (
          <kbd
            key={n}
            className="mono inline-flex h-4 min-w-[14px] items-center justify-center rounded border border-hesya-peach-200 bg-hesya-peach-50 px-1 font-medium text-gray-700"
          >
            {n}
          </kbd>
        ))}
      </div>
      {/* `.ix-comp-input-wrap` 정합: peach-50 + peach-200 → focus-within amber+white */}
      <div className="flex items-end gap-2.5 rounded-md border border-hesya-peach-200 bg-hesya-peach-50 px-3 py-2.5 transition-colors focus-within:border-hesya-amber-500 focus-within:bg-white">
        <textarea
          value={text}
          onChange={(e) => {
            setText(e.target.value);
            if (learnNotice) setLearnNotice(null);
          }}
          placeholder={t("placeholder")}
          aria-label={t("label")}
          disabled={disabled || busy}
          rows={1}
          className="kr min-h-[38px] max-h-[100px] flex-1 resize-none border-none bg-transparent text-[13px] leading-relaxed text-hesya-navy-900 outline-none placeholder:text-gray-400 disabled:cursor-not-allowed"
        />
        <button
          type="button"
          onClick={handleSend}
          disabled={!canSend}
          className={
            "kr inline-flex items-center gap-1.5 rounded px-3 py-1.5 text-[12px] font-semibold transition-colors " +
            (canSend
              ? "bg-hesya-amber-500 text-white hover:bg-hesya-amber-600 cursor-pointer"
              : "bg-gray-300 text-white cursor-not-allowed")
          }
        >
          <span>{t("send")}</span>
          {/* reference `.ix-send-kbd` — Cmd+Enter 단축키 indicator. 실제 키 바인딩은 별 PR. */}
          <span
            aria-hidden="true"
            className="ml-0.5 hidden items-center gap-0.5 sm:inline-flex"
          >
            <kbd className="mono rounded bg-white/20 px-1 py-px text-[9px] font-medium leading-none">
              ⌘
            </kbd>
            <kbd className="mono rounded bg-white/20 px-1 py-px text-[9px] font-medium leading-none">
              ↵
            </kbd>
          </span>
        </button>
      </div>
      {error ? <p className="mt-2 text-xs text-destructive">{error}</p> : null}
      {learnNotice ? (
        <p
          className={
            "mt-1.5 text-[11px] " +
            (learnNotice.kind === "ok"
              ? "text-emerald-700"
              : "text-destructive")
          }
        >
          {t(learnNotice.key)}
        </p>
      ) : null}
    </div>
  );
}
