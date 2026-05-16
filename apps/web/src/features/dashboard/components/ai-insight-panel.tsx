"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 5b — W8 AI 인사이트 panel.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:628-696` `AIInsight`.
 * 4-state machine (open / modify / dismissed / approved):
 * - open: insight 텍스트 + 3 액션 (메뉴 편집 / 제안 수정 / 다음에 보기)
 * - modify: textarea + (수정한 내용으로 진행 / 취소)
 * - approved: ✓ 승인됨 알림
 * - dismissed: 컴포넌트 unmount (return null)
 *
 * **mock-first**: insight 텍스트 + 신뢰도 라벨 mock i18n. "메뉴 편집" 액션은
 * 라우팅 없이 approved 상태로 전환만 (Stage 1/3 disabled 패턴 변형 — 인터랙션
 * 자체는 시연 가능, 실제 server action wire 별도 task).
 */

type InsightState = "open" | "modify" | "dismissed" | "approved";

const DEFAULT_MODIFY_TEXT =
  "메뉴 보강은 좋지만, 일본어 후기 강화가 먼저 필요해요.";

export function AiInsightPanel() {
  const t = useTranslations("Dashboard.aiInsight");
  const [state, setState] = useState<InsightState>("open");
  const [modifyText, setModifyText] = useState(DEFAULT_MODIFY_TEXT);

  if (state === "dismissed") return null;

  return (
    // Reference dashboard.css sd-insight (1275~1296) — peach-100 bg + 3px
    // left amber bar (::before) + shadow-md + 18px/22px padding. 이전 peach-50/50
    // (반투명) + border-only + no shadow는 "강조 카드" 신호 약함.
    <section
      data-testid="dashboard-ai-insight"
      aria-label={t("eyebrow")}
      className="relative mb-6 flex items-start gap-4 overflow-hidden rounded-lg bg-hesya-peach-100 px-[22px] py-[18px] shadow-md"
    >
      {/* ::before equivalent — 3px left amber bar (sd-insight::before). */}
      <span
        aria-hidden="true"
        className="absolute inset-y-0 left-0 w-[3px] bg-hesya-amber-500"
      />
      <span aria-hidden="true" className="mt-0.5 text-[22px]">
        💡
      </span>
      <div className="flex-1">
        <header className="mb-2 flex items-center gap-2">
          <span className="kr text-[11px] font-semibold uppercase tracking-[0.08em] text-hesya-amber-600">
            {t("eyebrow")}
          </span>
          <span className="kr rounded-full bg-emerald-100 px-2 py-0.5 text-[10px] font-medium text-emerald-700">
            {t("confidence")}
          </span>
        </header>

        {/* Reference sd-insight-text 16px font-medium leading-1.65 +
            em font-display italic (이전 14px + em font-semibold non-italic). */}
        <p className="kr text-[16px] font-medium leading-[1.65] text-hesya-navy-900">
          {t.rich("text", {
            em: (chunks) => (
              <em className="font-heading italic font-medium text-hesya-amber-600">
                {chunks}
              </em>
            ),
          })}
        </p>

        {state === "modify" ? (
          <div className="mt-3">
            <textarea
              data-testid="ai-insight-modify-textarea"
              value={modifyText}
              onChange={(e) => setModifyText(e.target.value)}
              className="kr w-full resize-none rounded-md border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] focus-visible:border-hesya-amber-500 focus-visible:outline-none"
              rows={2}
              aria-label={t("modifyAria")}
            />
            <div className="mt-2 flex gap-2">
              <button
                type="button"
                onClick={() => setState("approved")}
                className="kr rounded-md bg-hesya-amber-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-hesya-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
              >
                {t("modifyConfirm")}
              </button>
              <button
                type="button"
                onClick={() => setState("open")}
                className="kr rounded-md border border-hesya-peach-200 px-3 py-1.5 text-[12px] text-gray-700 hover:border-hesya-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
              >
                {t("modifyCancel")}
              </button>
            </div>
          </div>
        ) : null}

        {state === "approved" ? (
          <p
            role="status"
            data-testid="ai-insight-approved"
            className="kr mt-3 rounded-md bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700"
          >
            ✓ {t("approvedMessage")}
          </p>
        ) : null}
      </div>

      {state === "open" ? (
        <div className="flex shrink-0 flex-col gap-1.5">
          <button
            type="button"
            onClick={() => setState("approved")}
            className="kr rounded-md bg-hesya-amber-500 px-3 py-1.5 text-[12px] font-medium text-white hover:bg-hesya-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
          >
            {t("actionEdit")} →
          </button>
          <button
            type="button"
            onClick={() => setState("modify")}
            className="kr rounded-md border border-hesya-peach-200 px-3 py-1.5 text-[12px] text-gray-700 hover:border-hesya-amber-500 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
          >
            {t("actionModify")}
          </button>
          <button
            type="button"
            onClick={() => setState("dismissed")}
            className="kr rounded-md px-3 py-1.5 text-[12px] text-gray-500 hover:bg-hesya-peach-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
          >
            {t("actionDismiss")}
          </button>
        </div>
      ) : null}
    </section>
  );
}
