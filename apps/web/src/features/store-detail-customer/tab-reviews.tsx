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
}

const STARS = "★★★★★";

interface Review {
  author: string;
  quote: string;
  flag: string;
  country: string;
}

export function TabReviews({
  comingSoonLabel,
  sampleAuthor1,
  sampleAuthor2,
  sampleAuthor3,
  sampleQuote1,
  sampleQuote2,
  sampleQuote3,
  filterAllLabel,
}: Props) {
  const items: Review[] = [
    { author: sampleAuthor1, quote: sampleQuote1, flag: "🇯🇵", country: "JP" },
    { author: sampleAuthor2, quote: sampleQuote2, flag: "🇺🇸", country: "US" },
    { author: sampleAuthor3, quote: sampleQuote3, flag: "🇨🇳", country: "CN" },
  ];
  const [filter, setFilter] = useState<string>("All");

  const filters = [
    { key: "All", label: filterAllLabel ?? "All", icon: "🌐" },
    { key: "JP", label: "JP", icon: "🇯🇵" },
    { key: "US", label: "US", icon: "🇺🇸" },
    { key: "CN", label: "CN", icon: "🇨🇳" },
    { key: "VN", label: "VN", icon: "🇻🇳" },
  ];

  const filtered =
    filter === "All" ? items : items.filter((r) => r.country === filter);

  return (
    <div>
      <p className="px-5 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
        {comingSoonLabel}
      </p>
      <div className="c-detail-review-filter">
        {filters.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={"c-detail-chip-r" + (f.key === filter ? " active" : "")}
          >
            <span aria-hidden="true">{f.icon}</span>
            {f.key === "All" && <span>{f.label}</span>}
          </button>
        ))}
      </div>
      <ul className="space-y-2 px-5 pb-4">
        {filtered.length === 0 ? (
          <li className="rounded-2xl bg-white/50 px-4 py-8 text-center text-[12px] text-hesya-navy-900/55">
            —
          </li>
        ) : (
          filtered.map((r, i) => (
            <li
              key={i}
              className="rounded-2xl border border-hesya-peach-200 bg-white px-4 py-3"
            >
              <div className="mb-1 flex items-center justify-between">
                <p className="text-[13px] font-medium text-hesya-navy-900">
                  <span aria-hidden="true" className="mr-1.5">
                    {r.flag}
                  </span>
                  {r.author}
                </p>
                <span className="font-mono text-[11px] text-hesya-amber-500">
                  {STARS}
                </span>
              </div>
              <p className="text-[12px] leading-relaxed text-hesya-navy-900/75">
                &ldquo;{r.quote}&rdquo;
              </p>
            </li>
          ))
        )}
      </ul>
    </div>
  );
}
