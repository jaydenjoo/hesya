"use client";

import { useEffect, useState } from "react";

/**
 * Reference 정합 PR 4 — Rotating bright spot carousel.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:91-118` `BrightSpot`.
 * - 3 message rotating (15s interval) — `prefers-reduced-motion` 존중
 * - eyebrow: ✨ + 한국어 + 영어 italic subtitle ("Today's bright spot")
 * - 우측 dots indicator (active=amber-500, dim=peach-200)
 * - "더 보기 →" link (mock — Inbox/Reviews 페이지 연결은 별도 task)
 *
 * 이전 동적 brightSpot (dispute/inbox 상태 기반)은 제거. CriticalAlert가 urgent
 * 케이스를 별도 처리하므로 BrightSpot은 reference 의도 (celebratory 메시지
 * rotating)에 충실.
 */

const ROTATION_MS = 15_000;

type Props = {
  /** 회전 표시할 메시지 (3개 권장) — i18n 매핑은 page.tsx에서 */
  items: ReadonlyArray<string>;
  eyebrow: string;
  eyebrowEn: string;
  viewMoreLabel: string;
};

export function BrightSpot({
  items,
  eyebrow,
  eyebrowEn,
  viewMoreLabel,
}: Props) {
  const [idx, setIdx] = useState(0);

  useEffect(() => {
    if (items.length <= 1) return;
    if (typeof window === "undefined") return;
    const reduce = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;
    if (reduce) return;
    const t = setInterval(
      () => setIdx((i) => (i + 1) % items.length),
      ROTATION_MS,
    );
    return () => clearInterval(t);
  }, [items.length]);

  const currentBody = items[idx] ?? items[0] ?? "";

  return (
    <div className="relative mb-4 grid grid-cols-1 items-center gap-4 overflow-hidden rounded-lg border border-hesya-amber-500 bg-hesya-peach-100 px-5 py-3.5 sm:grid-cols-[auto_1fr_auto_auto]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent from-50% to-white/35"
      />
      <div className="relative flex items-baseline gap-1.5 whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-hesya-amber-600">
        <span aria-hidden="true" className="text-[14px]">
          ✨
        </span>
        {eyebrow}
        <span className="font-heading text-[11px] font-medium italic text-gray-500">
          {eyebrowEn}
        </span>
      </div>
      {/* 15s 마다 rotating 시 reference brightFade 애니메이션 (opacity 0→1,
          translateY 4px→0). 이전 animate-[fadeIn_...]는 globals.css에 정의
          안 된 keyframe 참조라 사실상 작동 안 함 — bright-fade class로 교체. */}
      <p
        key={idx}
        className="kr bright-fade relative min-w-0 text-[15px] font-medium leading-[1.45] text-hesya-navy-900"
        aria-live="polite"
      >
        {currentBody}
      </p>
      <button
        type="button"
        data-testid="bright-spot-view-more"
        className="kr relative text-[12px] font-medium text-hesya-amber-600 hover:underline"
      >
        {viewMoreLabel} →
      </button>
      <div
        className="relative flex items-center gap-1"
        aria-label={`${idx + 1} / ${items.length}`}
      >
        {items.map((_, i) => (
          <span
            key={i}
            aria-hidden="true"
            className={
              "h-[5px] w-[5px] rounded-full transition-colors " +
              (i === idx ? "bg-hesya-amber-500" : "bg-hesya-peach-200")
            }
          />
        ))}
      </div>
    </div>
  );
}
