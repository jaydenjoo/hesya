/**
 * Phase B-3b — 사장 검수용 AI 답변 초안 패널.
 *
 * `messages.status === 'ai_draft'` outbound가 conversation 마지막에 있으면
 * MessageView가 본 컴포넌트를 표시. 디자인 출처: `docs/design/reference/inbox-app.jsx`
 * AIAssist 함수 (라인 249~321) — MVP 적용 (1 draft + 액션 3개).
 *
 * **MVP 범위 (B-3b)**:
 *   - 한국어 원문 1 draft 표시 (번역본/audit는 MessageBubble에서 처리)
 *   - 액션 3개: 그대로 보내기 / 편집 후 보내기 / 거절하고 직접 작성
 *
 * **B-3b 미적용 (B-3 후속 또는 별 Phase)**:
 *   - 톤 4탭 (warm/formal/short/friendly)
 *   - 톤 검증 pill ("따뜻한 톤 유지" / "약간 사무적인 톤")
 *   - "이유 보기" 팝업
 *   - "내 매장 톤 학습" 버튼
 */
"use client";

export function AIAssist({
  draftText,
  onAcceptAsIs,
  onEditDraft,
  onReject,
}: {
  draftText: string;
  onAcceptAsIs: () => void;
  onEditDraft: () => void;
  onReject: () => void;
}) {
  return (
    <div className="bg-hesya-peach-100 border-t border-hesya-amber-500 px-4 py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="kr text-xs font-semibold text-hesya-amber-600">
          🤖 AI가 답변을 준비했어요
        </span>
      </div>
      <div className="kr mb-2 rounded-xl bg-white px-3 py-2.5 text-sm font-medium text-hesya-navy-900">
        {draftText}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAcceptAsIs}
          className="kr cursor-pointer rounded-md bg-hesya-peach-200 px-3.5 py-2 text-xs font-semibold text-hesya-navy-900 hover:bg-hesya-amber-500 hover:text-white"
        >
          그대로 보내기
        </button>
        <button
          type="button"
          onClick={onEditDraft}
          className="kr cursor-pointer rounded-md bg-hesya-amber-500 px-3.5 py-2 text-xs font-semibold text-white hover:bg-hesya-amber-600"
        >
          편집 후 보내기 →
        </button>
        <button
          type="button"
          onClick={onReject}
          className="kr ml-auto cursor-pointer rounded-md border border-hesya-peach-200 px-3.5 py-2 text-xs font-medium text-gray-700 hover:border-hesya-amber-500"
        >
          거절하고 직접 작성
        </button>
      </div>
    </div>
  );
}
