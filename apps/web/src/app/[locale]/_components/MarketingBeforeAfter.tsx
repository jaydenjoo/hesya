"use client";

import { useTranslations } from "next-intl";
import {
  useCallback,
  useRef,
  useState,
  type KeyboardEvent,
  type MouseEvent,
  type TouchEvent,
} from "react";

const KEYBOARD_STEP_PCT = 5;

const BEFORE_BG = "linear-gradient(135deg, #2A3148 0%, #4A4E5C 100%)";
const AFTER_BG =
  "linear-gradient(135deg, #FDF8F1 0%, #E8A97A 60%, #D88B5B 100%)";

const THUMB_GRADIENTS = [
  "linear-gradient(135deg, #2A3148, #FDF8F1)",
  "linear-gradient(135deg, #4A2820, #E8A97A)",
  "linear-gradient(135deg, #3D3850, #F8E9D9)",
] as const;

export function MarketingBeforeAfter() {
  const t = useTranslations("MarketingLanding");
  const thumbs = t.raw("baThumbAlts") as string[];
  const [pct, setPct] = useState(50);
  const [activeIdx, setActiveIdx] = useState(0);
  const frameRef = useRef<HTMLDivElement>(null);

  const updateFromX = useCallback((clientX: number) => {
    const frame = frameRef.current;
    if (!frame) return;
    const rect = frame.getBoundingClientRect();
    if (rect.width === 0) return;
    const next = ((clientX - rect.left) / rect.width) * 100;
    setPct(Math.max(0, Math.min(100, next)));
  }, []);

  const onMouseMove = (e: MouseEvent<HTMLDivElement>) => {
    if (e.buttons !== 1) return;
    updateFromX(e.clientX);
  };

  const onTouchMove = (e: TouchEvent<HTMLDivElement>) => {
    const touch = e.touches[0];
    if (!touch) return;
    updateFromX(touch.clientX);
  };

  const onKeyDown = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key === "ArrowLeft") {
      e.preventDefault();
      setPct((p) => Math.max(0, p - KEYBOARD_STEP_PCT));
    }
    if (e.key === "ArrowRight") {
      e.preventDefault();
      setPct((p) => Math.min(100, p + KEYBOARD_STEP_PCT));
    }
  };

  return (
    <section
      id="reviews"
      aria-labelledby="ba-h2"
      className="bg-hesya-navy-900 px-6 py-20 text-hesya-peach-50 md:py-32"
    >
      <div className="mx-auto max-w-6xl">
        <p className="mb-6 text-sm uppercase tracking-[0.16em] text-hesya-amber-500">
          {t("baEyebrow")}
        </p>
        <h2
          id="ba-h2"
          className="font-heading text-4xl leading-[1.1] tracking-tight md:text-5xl lg:text-6xl"
        >
          {t("baTitle")}
        </h2>
        <p className="mt-6 max-w-3xl text-base leading-relaxed text-hesya-peach-50/80 md:text-lg">
          {t("baSub")}
        </p>

        <div
          ref={frameRef}
          role="region"
          aria-label={t("baTitle")}
          className="relative mx-auto mt-12 aspect-[16/9] max-w-3xl touch-none select-none overflow-hidden rounded-2xl shadow-[0_30px_80px_rgba(0,0,0,0.4)]"
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
        >
          <div
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center font-heading text-3xl italic text-white/45"
            style={{ background: BEFORE_BG }}
          >
            before
          </div>

          <div
            aria-hidden="true"
            className="absolute inset-0 grid place-items-center font-heading text-3xl italic text-hesya-navy-900/45"
            style={{
              background: AFTER_BG,
              clipPath: `inset(0 0 0 ${pct}%)`,
            }}
          >
            after
          </div>

          <span className="absolute left-4 top-4 rounded-full bg-black/50 px-3 py-1 text-xs uppercase tracking-[0.16em] text-white">
            {t("baLabelBefore")}
          </span>
          <span className="absolute right-4 top-4 rounded-full bg-hesya-amber-500 px-3 py-1 text-xs uppercase tracking-[0.16em] text-hesya-navy-900">
            {t("baLabelAfter")}
          </span>

          <button
            type="button"
            role="slider"
            aria-label={t("baTitle")}
            aria-valuemin={0}
            aria-valuemax={100}
            aria-valuenow={Math.round(pct)}
            tabIndex={0}
            onKeyDown={onKeyDown}
            className="absolute top-0 h-full w-[3px] -translate-x-1/2 cursor-ew-resize bg-share-glow shadow-[0_0_24px_var(--share-glow)] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
            style={{ left: `${pct}%` }}
          >
            <span className="absolute left-1/2 top-1/2 grid h-11 w-11 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-share-glow font-mono text-base text-hesya-navy-900 shadow-[0_4px_16px_rgba(0,0,0,0.25)]">
              ⇆
            </span>
          </button>
        </div>

        <p className="mt-6 text-center text-sm text-hesya-peach-50/60">
          {t("baCaption")}
        </p>

        <div
          role="tablist"
          aria-label={t("baEyebrow")}
          className="mt-8 flex flex-wrap justify-center gap-3"
        >
          {thumbs.map((label, i) => (
            <button
              key={label}
              role="tab"
              type="button"
              aria-label={label}
              aria-selected={i === activeIdx}
              onClick={() => setActiveIdx(i)}
              style={{ background: THUMB_GRADIENTS[i] ?? THUMB_GRADIENTS[0] }}
              className="h-[60px] w-[100px] rounded-lg border-2 border-transparent opacity-65 transition hover:border-hesya-amber-500 hover:opacity-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500 aria-selected:border-hesya-amber-500 aria-selected:opacity-100"
            >
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
