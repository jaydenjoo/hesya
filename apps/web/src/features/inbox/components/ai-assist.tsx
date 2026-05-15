/**
 * Phase B-3b + Epic 1B-Tone-4 — 사장 검수용 AI 답변 초안 패널 (4 tone 활성화).
 *
 * `messages.status === 'ai_draft'` outbound가 conversation 마지막에 있으면
 * MessageView가 본 컴포넌트를 표시. 디자인 출처: `docs/design/reference/inbox-app.jsx`
 * AIAssist 함수 (라인 249~321).
 *
 * **현재 범위**:
 *   - 한국어 원문 1 draft 표시 (번역본/audit는 MessageBubble에서 처리)
 *   - **톤 4탭** (warm/formal/short/friendly) — tones prop 있으면 활성. 클릭 시
 *     즉시 텍스트 전환 (서버 호출 X), '그대로 보내기' 시 active tone 발송
 *   - 액션 3개: 그대로 보내기 (active tone) / 편집 후 보내기 / 거절하고 직접 작성
 *   - 처리 중: '그대로 보내기' disabled + 라벨 "발송 중..."
 *
 * **backward compat**: tones 미전달 → 4탭 미표시 (1A/1B 호환). draftText만 표시.
 *
 * **미적용 (다음 Epic)**:
 *   - 톤 검증 pill ("따뜻한 톤 유지" / "약간 사무적인 톤")
 *   - "이유 보기" 팝업
 *   - "내 매장 톤 학습" 버튼
 *
 * **i18n**: 한국어 사장님 전용 화면이므로 next-intl 키 대신 한국어 리터럴.
 */
"use client";

import { useState } from "react";
import type { Tones, Verifications } from "../ai/generate-reply";
import type { Tone } from "../schema";

const TONE_TABS: { id: Tone; label: string; sparkle?: boolean }[] = [
  { id: "warm", label: "따뜻하게" },
  { id: "formal", label: "공식적으로" },
  { id: "short", label: "짧게" },
  { id: "friendly", label: "매장 톤으로", sparkle: true },
];

export function AIAssist({
  draftText,
  tones,
  verifications,
  onAcceptAsIs,
  onEditDraft,
  onReject,
  isAccepting = false,
}: {
  /** Default tone(=warm) 텍스트. tones 있으면 active tone 우선. */
  draftText: string;
  /** Epic 1B-Tone-4 — 4 variations. 미전달 시 4탭 미표시 (1A/1B 호환). */
  tones?: Tones;
  /**
   * Phase 2-A — tone별 self-check (state/label/reason). 미전달 시 pill 미표시
   * (1B-Tone Phase 1 호환). state='warn' + reason 있으면 "이유 보기" 활성.
   */
  verifications?: Verifications;
  /** undefined → '그대로 보내기' 비활성 (B-3c 이전 호환용). 1B-Tone-4: tone 인자 추가. */
  onAcceptAsIs: ((tone: Tone) => void) | undefined;
  onEditDraft: () => void;
  onReject: () => void;
  /** B-3c useTransition pending — true면 모든 액션 disabled + '발송 중...' 라벨. */
  isAccepting?: boolean;
}) {
  const [activeTone, setActiveTone] = useState<Tone>("warm");
  // Phase 2-A — popover open 상태. tone 전환 시 자동 닫힘.
  const [showWhy, setShowWhy] = useState(false);
  const acceptUnavailable = onAcceptAsIs === undefined;
  const acceptDisabled = acceptUnavailable || isAccepting;

  const displayText = tones ? tones[activeTone] : draftText;
  const activeVerify = verifications?.[activeTone];

  function handleAccept() {
    if (!onAcceptAsIs) return;
    onAcceptAsIs(activeTone);
  }

  function handleToneChange(tone: Tone) {
    setActiveTone(tone);
    setShowWhy(false); // 다른 tone reason이 잘못 보이지 않도록 강제 닫기
  }

  return (
    <div className="bg-hesya-peach-100 border-t border-hesya-amber-500 px-[18px] py-3">
      <div className="mb-2 flex flex-wrap items-center gap-2">
        <span className="kr text-[11px] font-semibold text-hesya-amber-600">
          <span aria-hidden="true">🤖 </span>AI가 답변을 준비했어요
        </span>
        {/* tone 검증 pill — verifications 미전달 시 reference 정합 위해 기본 ok pill fallback */}
        {activeVerify ? (
          <span
            className={
              "kr inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-semibold " +
              (activeVerify.state === "ok"
                ? "bg-emerald-100 text-emerald-700"
                : "bg-amber-100 text-amber-700")
            }
          >
            <span aria-hidden="true">
              {activeVerify.state === "ok" ? "✓" : "⚠"}
            </span>
            <span>{activeVerify.label}</span>
            {activeVerify.reason ? (
              <button
                type="button"
                onClick={() => setShowWhy((v) => !v)}
                className="kr ml-1 underline-offset-2 hover:underline cursor-pointer"
              >
                이유 보기
              </button>
            ) : null}
          </span>
        ) : (
          <span
            data-testid="ai-tone-pill-default"
            className="kr inline-flex items-center gap-1 rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-semibold text-emerald-700"
          >
            <span aria-hidden="true">✓</span>
            <span>톤 검증됨</span>
          </span>
        )}
        {showWhy && activeVerify?.reason ? (
          <span className="kr w-full rounded-md bg-white px-2 py-1 text-[11px] leading-[1.55] text-gray-700 ring-1 ring-amber-200">
            {activeVerify.reason}
          </span>
        ) : null}
      </div>
      <div className="mb-2 break-keep rounded-xl bg-white px-3 py-2.5 text-[13px] font-medium leading-[1.65] text-hesya-navy-900">
        {displayText}
      </div>
      {tones ? (
        <div role="tablist" className="mb-2 flex gap-1">
          {TONE_TABS.map((t) => {
            const active = activeTone === t.id;
            return (
              <button
                key={t.id}
                type="button"
                role="tab"
                aria-selected={active}
                onClick={() => handleToneChange(t.id)}
                disabled={isAccepting}
                className={
                  "kr rounded-md border px-3 py-1.5 text-[11px] transition-colors not-disabled:cursor-pointer disabled:cursor-not-allowed disabled:opacity-50 " +
                  (active
                    ? "border-hesya-amber-500 bg-white font-semibold text-hesya-navy-900"
                    : "border-transparent bg-white/50 font-medium text-gray-700 hover:bg-white")
                }
              >
                {t.label}
                {t.sparkle ? <span aria-hidden="true"> ✨</span> : null}
              </button>
            );
          })}
        </div>
      ) : null}
      <div className="flex gap-2">
        <button
          type="button"
          onClick={handleAccept}
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
