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

export function MarketingBeforeAfter() {
  const t = useTranslations("MarketingLanding");
  const thumbs = t.raw("baThumbAlts") as string[];
  const [pct, setPct] = useState(50);
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
          className="relative mt-12 aspect-[16/9] touch-none select-none overflow-hidden rounded-3xl bg-hesya-peach-100/10"
          onMouseMove={onMouseMove}
          onTouchMove={onTouchMove}
        >
          <video
            autoPlay
            muted
            loop
            playsInline
            preload="metadata"
            width={1920}
            height={1080}
            className="absolute inset-0 h-full w-full object-cover"
            aria-hidden="true"
          >
            <source src="/assets/videos/transformation.mp4" type="video/mp4" />
          </video>

          <div
            className="absolute inset-0 bg-hesya-navy-900/55 mix-blend-multiply"
            style={{ clipPath: `inset(0 0 0 ${pct}%)` }}
            aria-hidden="true"
          />

          <span className="absolute left-4 top-4 rounded-full bg-hesya-navy-900/60 px-3 py-1 text-xs uppercase tracking-[0.16em] text-hesya-peach-50/80">
            {t("baLabelBefore")}
          </span>
          <span className="absolute right-4 top-4 rounded-full bg-hesya-amber-600/80 px-3 py-1 text-xs uppercase tracking-[0.16em] text-hesya-peach-50">
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
            className="absolute top-0 h-full w-1 -translate-x-1/2 cursor-ew-resize bg-hesya-peach-50/80 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
            style={{ left: `${pct}%` }}
          >
            <span className="absolute left-1/2 top-1/2 grid h-12 w-12 -translate-x-1/2 -translate-y-1/2 place-items-center rounded-full bg-hesya-peach-50 text-sm text-hesya-navy-900 shadow-lg">
              ⇄
            </span>
          </button>
        </div>

        <p className="mt-6 text-sm text-hesya-peach-50/60">{t("baCaption")}</p>

        <div
          role="tablist"
          aria-label={t("baEyebrow")}
          className="mt-8 flex flex-wrap gap-3"
        >
          {thumbs.map((label, i) => (
            <button
              key={label}
              role="tab"
              type="button"
              aria-label={label}
              aria-selected={i === 0}
              className="h-16 w-24 rounded-lg border border-hesya-peach-50/20 bg-hesya-peach-50/10 transition hover:bg-hesya-peach-50/20 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500 aria-selected:border-hesya-amber-500 aria-selected:bg-hesya-amber-600/40"
            >
              <span className="sr-only">{label}</span>
            </button>
          ))}
        </div>
      </div>
    </section>
  );
}
