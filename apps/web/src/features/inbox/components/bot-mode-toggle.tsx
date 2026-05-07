/**
 * Phase 1-β Task D — 매장 bot_mode 토글 (인박스 헤더에 배치).
 *
 * `false` (기본): 검수·승인 모드 — 새 inbound는 draft_status='pending_review' 마킹.
 * `true`: AI 자동 응답 (legacy ai_draft 흐름). H1 학습 가설 검증용.
 *
 * 클릭 시 useTransition으로 toggleBotMode 호출, 응답에 따라 로컬 state 갱신.
 * 실패 시 alert (Phase 1-β 단순화 — Task C 패턴 동일).
 */
"use client";

import { useState, useTransition } from "react";
import { toggleBotMode } from "../actions/toggle-bot-mode";

export function BotModeToggle({
  storeId,
  initialValue,
}: {
  storeId: string;
  initialValue: boolean;
}) {
  const [value, setValue] = useState(initialValue);
  const [pending, startTransition] = useTransition();

  const onClick = () => {
    const next = !value;
    startTransition(async () => {
      const result = await toggleBotMode({ storeId, nextValue: next });
      if (result.ok) {
        setValue(next);
      } else {
        alert(`모드 전환 실패: ${result.error}`);
      }
    });
  };

  const label = value ? "🤖 Bot 자동" : "✋ 검수·승인";
  const tone = value
    ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
    : "bg-gray-100 text-gray-700 hover:bg-gray-200";

  return (
    <button
      type="button"
      onClick={onClick}
      disabled={pending}
      aria-pressed={value}
      className={`kr rounded-full px-3 py-1 text-xs font-semibold transition-colors disabled:opacity-50 ${tone}`}
    >
      {label}
    </button>
  );
}
