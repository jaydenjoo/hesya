"use client";

/**
 * Epic 1B-UI A-3a + γ.2.3.2 — MessageBubble 시각 hesya tone + reference 정합.
 *
 * 디자인 ref(`docs/design/reference/inbox-app.jsx` ix-msg/ix-bubble) 색상 + 형태.
 * 기능 무변경 — 시각 토큰 + 비대칭 corner + 시간 버블 외부.
 *
 * 톤 매핑:
 * - outbound (owner): amber-500 배경 + 흰 글씨, 우측 정렬, 우하단 4px corner (꼬리)
 * - inbound (customer): peach-100 배경 + navy 글씨, 좌측 정렬, 좌하단 4px corner (꼬리)
 * - ai_draft: amber dashed ring (사장이 검토 필요 시각 신호)
 * - failed: red ring
 *
 * γ.2.3.2 변경:
 * - inbound bg peach-50 → peach-100 (reference 매칭)
 * - max-w 75% → 78%
 * - asymmetric corner (꼬리 효과): outbound 우하 4px, inbound 좌하 4px
 * - <time>을 버블 외부로 분리 (ref `.ix-msg-time`: 10/gray-500, 버블 아래 별도 줄)
 * - bubble-trans border 색: customer navy/10, owner white/25 (rgba 정합)
 */

import { useState } from "react";
import { useTranslations } from "next-intl";
import type { Message } from "../types";
import { toDate } from "@/shared/lib/date-utils";

const HOUR_MIN_FORMATTER = new Intl.DateTimeFormat(undefined, {
  hour: "2-digit",
  minute: "2-digit",
});

export function MessageBubble({ message }: { message: Message }) {
  const t = useTranslations("Inbox.thread");
  const [auditOpen, setAuditOpen] = useState(false);
  const isOutbound = message.direction === "outbound";
  const isFailed = message.status === "failed";
  const isAIDraft = message.status === "ai_draft";
  const created = toDate(message.createdAt) ?? new Date();

  const bubbleClass = isOutbound
    ? "bg-hesya-amber-500 text-white rounded-br-[4px]"
    : "bg-hesya-peach-100 text-hesya-navy-900 rounded-bl-[4px]";
  const translatedClass = isOutbound
    ? "border-white/25 text-white/90"
    : "border-hesya-navy-900/10 text-gray-700";

  // O2 fast track #7 (#2) — audit panel: 감지 언어 / 번역 신뢰도 / 원문 보기.
  // translated 있을 때만 toggle 표시 (audit 의미 있음).
  const hasTranslation = !!message.translatedText;
  // mock confidence: lang detection은 translatedLang fallback / confidence는
  // 글자수 휴리스틱(>200 = medium, else high). DAL 확장 후 metadata로 교체.
  const detectedLangLabel = isOutbound ? "한국어" : "外國語";
  const confidence =
    (message.originalText ?? "").length > 200 ? "medium" : "high";
  const confidenceLabel =
    confidence === "high" ? "신뢰도 높음" : "약간 모호 — 원문 확인 권장";

  return (
    <div
      data-direction={message.direction}
      data-status={message.status}
      className={`ix-msg-${isOutbound ? "owner" : "customer"} flex ${isOutbound ? "justify-end" : "justify-start"}`}
    >
      <div
        className={`flex max-w-[78%] flex-col ${
          isOutbound ? "items-end" : "items-start"
        }`}
      >
        <div
          data-testid="message-bubble-body"
          className={`kr rounded-2xl px-3.5 py-2.5 text-[13px] leading-relaxed shadow-sm ${bubbleClass} ${
            isFailed ? "ring-1 ring-red-500" : ""
          } ${isAIDraft ? "ring-1 ring-dashed ring-hesya-amber-500" : ""}`}
        >
          {isAIDraft ? (
            <div className="kr mb-1 inline-flex items-center gap-1 rounded bg-hesya-amber-500/15 px-1.5 py-0.5 text-[10px] font-semibold text-hesya-amber-600">
              🤖 AI 초안
            </div>
          ) : null}
          <p className="whitespace-pre-wrap break-keep">
            {message.originalText}
          </p>
          {message.translatedText ? (
            <p
              className={`kr mt-1 break-keep border-t pt-1 text-[11.5px] italic ${translatedClass}`}
            >
              <span className="mr-1 opacity-70" aria-hidden="true">
                🌐
              </span>
              {message.translatedText}
            </p>
          ) : null}
          {auditOpen && hasTranslation ? (
            <div data-testid="bubble-audit" className="ix-bubble-audit kr">
              <div className="ix-audit-row">
                <span className="ix-audit-key">감지 언어</span>
                <span className="ix-audit-val">{detectedLangLabel}</span>
              </div>
              <div className="ix-audit-row">
                <span className="ix-audit-key">번역 신뢰도</span>
                <span className={`ix-audit-val ${confidence}`}>
                  {confidenceLabel}
                </span>
              </div>
              <div className="ix-audit-row">
                <span className="ix-audit-key">원문 보기</span>
                <span className="ix-audit-val">{message.originalText}</span>
              </div>
            </div>
          ) : null}
          {hasTranslation ? (
            <button
              type="button"
              data-testid="bubble-audit-toggle"
              onClick={() => setAuditOpen((v) => !v)}
              className="ix-bubble-more kr"
            >
              {auditOpen ? "닫기" : "원문 / 신뢰도 보기"}
            </button>
          ) : null}
        </div>
        <time
          dateTime={created.toISOString()}
          className="mono mt-0.5 block px-1.5 text-[10px] text-gray-500"
        >
          {isFailed ? (
            <>
              <span aria-hidden="true">⚠️ </span>
              <span className="sr-only">{t("failedLabel")} </span>
            </>
          ) : null}
          {HOUR_MIN_FORMATTER.format(created)}
        </time>
      </div>
    </div>
  );
}
