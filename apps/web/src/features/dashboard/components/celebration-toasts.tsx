"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 5b — W11 알림 Toast stack.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:763-905` `Celebrations`.
 * 4 toast (star / photo / growth / verified) — sketch SVG + title + body +
 * time + dismiss X.
 *
 * **mock-first**: 4 fixed toasts hardcoded (mock customer/service 이름은
 * Timeline 패턴 따름 — locale 무관). 실 notifications 파이프라인은 별도 task
 * (notifications 테이블 + 실시간 push + dismiss persistence).
 *
 * Section title / dismiss aria / time labels는 6 locale i18n.
 */

type ToastKind = "star" | "photo" | "growth" | "verified";

interface Toast {
  readonly id: number;
  readonly kind: ToastKind;
  readonly title: string;
  readonly body: string;
  readonly timeKey: "justNow" | "minutesAgo" | "morning" | "yesterday";
  readonly minutes?: number;
}

const INITIAL_TOASTS: ReadonlyArray<Toast> = [
  {
    id: 1,
    kind: "star",
    title: "사쿠라님이 5점을 남겼어요",
    body: '"한국에서 최고의 경험!"',
    timeKey: "justNow",
  },
  {
    id: 2,
    kind: "photo",
    title: "포토 후기가 도착했어요",
    body: "Emma · Glow Makeup 시술",
    timeKey: "minutesAgo",
    minutes: 3,
  },
  {
    id: 3,
    kind: "growth",
    title: "이번 주 외국인 매출이 한 단계 올라갔어요",
    body: "전주 대비 +24% — 기록 갱신 중",
    timeKey: "morning",
  },
  {
    id: 4,
    kind: "verified",
    title: "100번째 외국인 손님 — 정말 대단해요",
    body: "K-Verified Gold 갱신 가능",
    timeKey: "yesterday",
  },
];

function Sketch({ kind }: { readonly kind: ToastKind }) {
  if (kind === "star") {
    return (
      <svg viewBox="0 0 60 60" className="h-9 w-9 shrink-0">
        <path
          d="M30 10 L36 24 L52 26 L40 36 L44 52 L30 44 L16 52 L20 36 L8 26 L24 24 Z"
          fill="none"
          stroke="var(--color-hesya-amber-600)"
          strokeWidth="2"
          strokeLinejoin="round"
        />
        <circle cx="30" cy="30" r="2.5" fill="var(--color-hesya-amber-500)" />
      </svg>
    );
  }
  if (kind === "photo") {
    return (
      <svg viewBox="0 0 60 60" className="h-9 w-9 shrink-0">
        <rect
          x="10"
          y="20"
          width="40"
          height="28"
          rx="4"
          fill="none"
          stroke="var(--color-hesya-amber-600)"
          strokeWidth="2"
        />
        <path
          d="M22 20 L26 14 L34 14 L38 20"
          fill="none"
          stroke="var(--color-hesya-amber-600)"
          strokeWidth="2"
        />
        <circle
          cx="30"
          cy="34"
          r="7"
          fill="none"
          stroke="var(--color-hesya-amber-600)"
          strokeWidth="2"
        />
        <circle cx="42" cy="26" r="1.5" fill="var(--color-hesya-amber-500)" />
      </svg>
    );
  }
  if (kind === "growth") {
    return (
      <svg viewBox="0 0 60 60" className="h-9 w-9 shrink-0">
        <path
          d="M10 46 Q22 42 28 32 Q34 22 48 14"
          fill="none"
          stroke="var(--color-hesya-amber-600)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <path
          d="M40 14 L48 14 L48 22"
          fill="none"
          stroke="var(--color-hesya-amber-600)"
          strokeWidth="2.5"
          strokeLinecap="round"
        />
        <circle cx="14" cy="46" r="1.5" fill="var(--color-hesya-amber-500)" />
        <circle cx="48" cy="14" r="1.5" fill="var(--color-hesya-amber-500)" />
      </svg>
    );
  }
  // verified
  return (
    <svg viewBox="0 0 60 60" className="h-9 w-9 shrink-0">
      <path
        d="M16 14 L44 14 L40 30 L44 46 L30 40 L16 46 L20 30 Z"
        fill="none"
        stroke="var(--color-hesya-amber-600)"
        strokeWidth="2"
        strokeLinejoin="round"
      />
      <path
        d="M22 26 L28 32 L38 22"
        fill="none"
        stroke="var(--color-hesya-amber-500)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

export function CelebrationToasts() {
  const t = useTranslations("Dashboard.celebrations");
  const [items, setItems] = useState<ReadonlyArray<Toast>>(INITIAL_TOASTS);

  if (items.length === 0) return null;

  return (
    <section
      data-testid="dashboard-celebration-toasts"
      aria-label={t("title")}
      className="mb-4"
    >
      <header className="mb-3 flex items-center gap-2">
        <h2 className="kr text-[14px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h2>
        <span
          aria-hidden="true"
          className="kr rounded-full bg-hesya-peach-100 px-2 py-0.5 mono text-[10px] tabular-nums text-hesya-amber-600"
        >
          {items.length}
        </span>
      </header>

      <ul className="flex flex-col gap-2">
        {items.map((toast) => (
          <li
            key={toast.id}
            data-testid={`celebration-toast-${toast.kind}`}
            className="flex items-start gap-3 rounded-lg border border-hesya-peach-100 bg-gradient-to-br from-hesya-peach-100 to-hesya-peach-50 p-3 shadow-3"
          >
            <span
              aria-hidden="true"
              className="flex h-14 w-14 flex-shrink-0 items-center justify-center rounded-md bg-white/60"
            >
              <Sketch kind={toast.kind} />
            </span>
            <div className="flex-1 min-w-0">
              <p className="kr truncate text-[12px] font-semibold text-hesya-navy-900">
                {toast.title}
              </p>
              <p className="kr truncate text-[11px] text-gray-600">
                {toast.body}
              </p>
              <p className="kr mt-1 text-[10px] text-gray-500">
                {toast.timeKey === "minutesAgo" && toast.minutes
                  ? t("time.minutesAgo", { count: toast.minutes })
                  : t(`time.${toast.timeKey}`)}
              </p>
            </div>
            <button
              type="button"
              onClick={() =>
                setItems((prev) => prev.filter((x) => x.id !== toast.id))
              }
              aria-label={t("dismissAria")}
              className="shrink-0 rounded p-1 text-gray-400 hover:bg-hesya-peach-50 hover:text-hesya-navy-900 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
            >
              <span aria-hidden="true" className="text-[14px] leading-none">
                ✕
              </span>
            </button>
          </li>
        ))}
      </ul>
    </section>
  );
}
