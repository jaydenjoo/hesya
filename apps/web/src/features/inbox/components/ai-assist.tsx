/**
 * Phase B-3b — 사장 검수용 AI 답변 초안 패널.
 *
 * `messages.status === 'ai_draft'` outbound가 conversation 마지막에 있으면
 * MessageView가 본 컴포넌트를 표시. 디자인 출처: `docs/design/reference/inbox-app.jsx`
 * AIAssist 함수 (라인 249~321) — MVP 적용 (1 draft + 액션 3개).
 *
 * **MVP 범위 (B-3b → B-3c)**:
 *   - 한국어 원문 1 draft 표시 (번역본/audit는 MessageBubble에서 처리)
 *   - 액션 3개: 그대로 보내기 (B-3c 활성) / 편집 후 보내기 / 거절하고 직접 작성
 *   - 처리 중: '그대로 보내기' disabled + 라벨 "발송 중..."
 *
 * **B-3b 미적용 (B-3 후속 또는 별 Phase)**:
 *   - 톤 4탭 (warm/formal/short/friendly)
 *   - 톤 검증 pill ("따뜻한 톤 유지" / "약간 사무적인 톤")
 *   - "이유 보기" 팝업
 *   - "내 매장 톤 학습" 버튼
 *
 * **i18n**: 한국어 사장님 전용 화면이므로 next-intl 키 대신 한국어 리터럴.
 * 영어 사장님 지원 시 messages/{ko,en}.json으로 이관.
 *
 * 디자인 ref와의 매핑 (`docs/design/reference/inbox.css` `.ix-assist*`):
 *   - panel: padding 12px 18px, border-top 1px solid hesya-amber-500
 *   - eyebrow: font-size 11px, font-weight 600, color hesya-amber-600
 *   - draft: padding 10px 12px, font-size 13px, line-height 1.65, font-weight 500
 *   - 버튼: padding 8px 14px, font-size 12px, font-weight 600, radius --r-sm (8px)
 *   - actions gap 8px
 */
"use client";

export function AIAssist({
  draftText,
  onAcceptAsIs,
  onEditDraft,
  onReject,
  isAccepting = false,
}: {
  draftText: string;
  /** undefined → '그대로 보내기' 비활성 (B-3c 이전 호환용 — 현재는 MessageView가 항상 전달). */
  onAcceptAsIs: (() => void) | undefined;
  onEditDraft: () => void;
  onReject: () => void;
  /** B-3c useTransition pending — true면 모든 액션 disabled + '발송 중...' 라벨. */
  isAccepting?: boolean;
}) {
  const acceptUnavailable = onAcceptAsIs === undefined;
  const acceptDisabled = acceptUnavailable || isAccepting;
  return (
    <div className="bg-hesya-peach-100 border-t border-hesya-amber-500 px-[18px] py-3">
      <div className="mb-2 flex items-center gap-2">
        <span className="kr text-[11px] font-semibold text-hesya-amber-600">
          <span aria-hidden="true">🤖 </span>AI가 답변을 준비했어요
        </span>
      </div>
      <div className="mb-2 break-keep rounded-xl bg-white px-3 py-2.5 text-[13px] font-medium leading-[1.65] text-hesya-navy-900">
        {draftText}
      </div>
      <div className="flex gap-2">
        <button
          type="button"
          onClick={onAcceptAsIs}
          disabled={acceptDisabled}
          title={
            acceptUnavailable ? "다음 단계(B-3c)에서 활성화됩니다" : undefined
          }
          className="kr rounded-md bg-hesya-peach-200 px-3.5 py-2 text-xs font-semibold text-hesya-navy-900 not-disabled:cursor-pointer not-disabled:hover:bg-hesya-amber-500 not-disabled:hover:text-white disabled:cursor-not-allowed disabled:opacity-50"
        >
          {isAccepting ? "발송 중..." : "그대로 보내기"}
        </button>
        <button
          type="button"
          onClick={onEditDraft}
          disabled={isAccepting}
          className="kr rounded-md bg-hesya-amber-500 px-3.5 py-2 text-xs font-semibold text-white not-disabled:cursor-pointer not-disabled:hover:bg-hesya-amber-600 disabled:cursor-not-allowed disabled:opacity-50"
        >
          편집 후 보내기 →
        </button>
        <button
          type="button"
          onClick={onReject}
          disabled={isAccepting}
          className="kr ml-auto rounded-md border border-hesya-peach-200 px-3.5 py-2 text-xs font-medium text-gray-700 not-disabled:cursor-pointer not-disabled:hover:border-hesya-amber-500 disabled:cursor-not-allowed disabled:opacity-50"
        >
          거절하고 직접 작성
        </button>
      </div>
    </div>
  );
}
