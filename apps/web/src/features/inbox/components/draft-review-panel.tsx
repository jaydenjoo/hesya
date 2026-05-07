/**
 * Phase 1-β Task D — pending_review 초안용 검수 패널.
 *
 * draft_status='pending_review' outbound 메시지에 대해 사장이:
 *   - 그대로 승인 + 전송 (텍스트 변경 없음 시 활성)
 *   - 수정 후 전송 (텍스트 변경 시 활성)
 *   - 무시 (항상 활성)
 *
 * AIAssist (B-3c, bot_mode=true legacy)와의 차이: 텍스트 편집을 textarea로 인라인
 * 처리 (별도 composer 이동 없음). Phase 1-β 단순화.
 */
"use client";

import { useState, useTransition } from "react";
import { approveDraft } from "../actions/approve-draft";
import { editAndSend } from "../actions/edit-and-send";
import { skipDraft } from "../actions/skip-draft";

export function DraftReviewPanel({
  messageId,
  aiText,
}: {
  messageId: string;
  aiText: string;
}) {
  const [text, setText] = useState(aiText);
  const [pending, startTransition] = useTransition();

  const trimmed = text.trim();
  const aiTrimmed = aiText.trim();
  const unchanged = trimmed === aiTrimmed;
  const empty = trimmed.length === 0;

  const onApprove = () => {
    startTransition(async () => {
      const r = await approveDraft({ messageId });
      if (!r.ok) alert(`승인 실패: ${r.error}`);
    });
  };

  const onEditSend = () => {
    if (empty) return;
    startTransition(async () => {
      const r = await editAndSend({ messageId, newText: trimmed });
      if (!r.ok) alert(`수정 후 전송 실패: ${r.error}`);
    });
  };

  const onSkip = () => {
    startTransition(async () => {
      const r = await skipDraft({ messageId });
      if (!r.ok) alert(`무시 실패: ${r.error}`);
    });
  };

  return (
    <div
      data-testid="draft-review-panel"
      className="border-t border-hesya-amber-500 bg-hesya-peach-100 px-4 py-3"
    >
      <div className="kr mb-2 text-[11px] font-semibold text-hesya-amber-600">
        <span aria-hidden="true">🤖 </span>AI 초안 검수 — 승인하시면 전송됩니다
      </div>
      <textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        rows={4}
        disabled={pending}
        className="kr mb-2 w-full break-keep rounded-md border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] leading-[1.65] text-hesya-navy-900 disabled:opacity-50"
        aria-label="AI 초안 편집"
      />
      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          onClick={onApprove}
          disabled={pending || !unchanged || empty}
          className="kr rounded-md bg-emerald-500 px-3.5 py-2 text-xs font-semibold text-white not-disabled:cursor-pointer not-disabled:hover:bg-emerald-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          승인 + 전송
        </button>
        <button
          type="button"
          onClick={onEditSend}
          disabled={pending || unchanged || empty}
          className="kr rounded-md bg-hesya-amber-500 px-3.5 py-2 text-xs font-semibold text-white not-disabled:cursor-pointer not-disabled:hover:bg-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          수정 후 전송
        </button>
        <button
          type="button"
          onClick={onSkip}
          disabled={pending}
          className="kr ml-auto rounded-md border border-hesya-peach-200 px-3.5 py-2 text-xs font-medium text-gray-700 not-disabled:cursor-pointer not-disabled:hover:border-hesya-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          무시
        </button>
      </div>
    </div>
  );
}
