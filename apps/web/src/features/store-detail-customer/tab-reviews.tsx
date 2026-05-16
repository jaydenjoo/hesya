"use client";

/**
 * Plan v3 Phase D2-B2-b — Tab: 후기 panel (mock placeholder).
 *
 * C5 fast track (2026-05-15): reference 정합 filter chips (All/JP/US/CN/VN, item 7).
 * 실제 reviews 테이블 도입은 phase ζ.
 */

import { useState } from "react";

interface Props {
  readonly comingSoonLabel: string;
  readonly sampleAuthor1: string;
  readonly sampleAuthor2: string;
  readonly sampleAuthor3: string;
  readonly sampleQuote1: string;
  readonly sampleQuote2: string;
  readonly sampleQuote3: string;
  readonly filterAllLabel?: string;
  readonly translateLabel?: string;
}

interface Review {
  author: string;
  quote: string;
  translation: string;
  flag: string;
  country: string;
  rating: number;
}

function renderStars(rating: number): string {
  const full = Math.round(rating);
  return "★".repeat(full) + "☆".repeat(Math.max(0, 5 - full));
}

const SAMPLE_TRANSLATIONS: Record<string, string> = {
  JP: "She made me the exact Song Hye-kyo bob! Designer spoke Japanese so I felt at ease.",
  US: "Pink balayage came out beautifully. Took 3+ hours but worth it.",
  CN: "The personal color diagnosis was spot on. I'm spring warm tone!",
};

export function TabReviews({
  comingSoonLabel,
  sampleAuthor1,
  sampleAuthor2,
  sampleAuthor3,
  sampleQuote1,
  sampleQuote2,
  sampleQuote3,
  filterAllLabel,
  translateLabel,
}: Props) {
  const items: Review[] = [
    {
      author: sampleAuthor1,
      quote: sampleQuote1,
      translation: SAMPLE_TRANSLATIONS.JP!,
      flag: "🇯🇵",
      country: "JP",
      rating: 5,
    },
    {
      author: sampleAuthor2,
      quote: sampleQuote2,
      translation: SAMPLE_TRANSLATIONS.US!,
      flag: "🇺🇸",
      country: "US",
      rating: 5,
    },
    {
      author: sampleAuthor3,
      quote: sampleQuote3,
      translation: SAMPLE_TRANSLATIONS.CN!,
      flag: "🇨🇳",
      country: "CN",
      rating: 4,
    },
  ];
  const [filter, setFilter] = useState<string>("All");

  const countByCountry = (c: string): number =>
    c === "All" ? items.length : items.filter((r) => r.country === c).length;
  const filters = [
    { key: "All", label: filterAllLabel ?? "All", icon: "🌐" },
    { key: "JP", label: "JP", icon: "🇯🇵" },
    { key: "US", label: "US", icon: "🇺🇸" },
    { key: "CN", label: "CN", icon: "🇨🇳" },
    { key: "VN", label: "VN", icon: "🇻🇳" },
  ];

  const filtered =
    filter === "All" ? items : items.filter((r) => r.country === filter);
  const avgRating =
    items.length === 0
      ? 0
      : items.reduce((s, r) => s + r.rating, 0) / items.length;

  return (
    <div>
      <div className="flex flex-wrap items-baseline justify-between gap-2 px-5 pb-2 pt-3">
        <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
          {comingSoonLabel}
        </p>
        {items.length > 0 && (
          <span className="inline-flex items-center gap-1.5 font-mono text-[11px] text-hesya-navy-900/75 tabular-nums">
            <span aria-hidden="true" className="text-hesya-amber-500">
              {renderStars(avgRating)}
            </span>
            <span>{avgRating.toFixed(1)}</span>
            <span className="text-hesya-navy-900/45">· {items.length}건</span>
          </span>
        )}
      </div>
      <div className="c-detail-review-filter">
        {filters.map((f) => {
          const n = countByCountry(f.key);
          return (
            <button
              key={f.key}
              type="button"
              onClick={() => setFilter(f.key)}
              className={
                "c-detail-chip-r" + (f.key === filter ? " active" : "")
              }
            >
              <span aria-hidden="true">{f.icon}</span>
              {f.key === "All" && <span>{f.label}</span>}
              {n > 0 && (
                <span className="ml-1 font-mono text-[9.5px] tabular-nums opacity-65">
                  {n}
                </span>
              )}
            </button>
          );
        })}
      </div>
      <ul className="space-y-2 px-5 pb-4">
        {filtered.length === 0 ? (
          <li className="rounded-2xl bg-white/50 px-4 py-8 text-center text-[12px] text-hesya-navy-900/55">
            —
          </li>
        ) : (
          filtered.map((r, i) => (
            <ReviewItem
              key={i}
              review={r}
              translateLabel={translateLabel ?? "Translate to English"}
            />
          ))
        )}
      </ul>
    </div>
  );
}

function ReviewItem({
  review,
  translateLabel,
}: {
  review: Review;
  translateLabel: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <li className="rounded-2xl border border-hesya-peach-200 bg-white px-4 py-3">
      <div className="mb-1 flex items-center justify-between">
        <p className="text-[13px] font-medium text-hesya-navy-900">
          <span aria-hidden="true" className="mr-1.5">
            {review.flag}
          </span>
          {review.author}
        </p>
        <span
          className="font-mono text-[11px] text-hesya-amber-500"
          aria-label={`${review.rating} out of 5`}
        >
          {renderStars(review.rating)}
        </span>
      </div>
      <p className="text-[12px] leading-relaxed text-hesya-navy-900/75">
        &ldquo;{review.quote}&rdquo;
      </p>
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="mt-2 inline-flex items-center gap-1 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-amber-600 transition hover:text-hesya-amber-700"
      >
        <span
          aria-hidden="true"
          className={"transition-transform " + (open ? "rotate-90" : "")}
        >
          ›
        </span>
        {translateLabel}
      </button>
      {open && (
        <p className="mt-2 rounded-xl bg-hesya-peach-50 px-3 py-2 text-[11.5px] italic leading-relaxed text-hesya-navy-900/75">
          &ldquo;{review.translation}&rdquo;
        </p>
      )}
    </li>
  );
}
