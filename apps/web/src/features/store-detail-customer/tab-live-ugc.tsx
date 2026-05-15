"use client";

/**
 * C2 Live UGC tab — 외국인 손님의 Instagram/Xiaohongshu 게시물 9-tile grid.
 *
 * reference 'detail-app.jsx' ugcTiles + Live UGC tab (448-490).
 * 실제 social API 연동은 phase ζ. 현재 mock 9-tile + JP/CN/US filter.
 */

import { useState } from "react";

interface Props {
  readonly comingSoonLabel: string;
  readonly filterAllLabel?: string;
  readonly disclaimerLabel?: string;
}

type Source = "insta" | "xhs";

interface UgcTile {
  readonly id: string;
  readonly source: Source;
  readonly author: string;
  readonly country: "JP" | "CN" | "US" | "VN" | "TW";
  readonly stars: 4 | 5;
  readonly tone: string;
}

const TONES = [
  "linear-gradient(135deg, #F5DDC8, #D88B5B)",
  "linear-gradient(135deg, #E8C4D6, #D88B5B)",
  "linear-gradient(135deg, #D6E8C9, #D88B5B)",
  "linear-gradient(135deg, #C9D6E8, #D88B5B)",
  "linear-gradient(135deg, #F5DDC8, #1A2238)",
  "linear-gradient(135deg, #D88B5B, #1A2238)",
] as const;

const TILES: ReadonlyArray<UgcTile> = [
  {
    id: "u1",
    source: "insta",
    author: "@aoi.tokyo",
    country: "JP",
    stars: 5,
    tone: TONES[0],
  },
  {
    id: "u2",
    source: "xhs",
    author: "Mei_06",
    country: "CN",
    stars: 5,
    tone: TONES[1],
  },
  {
    id: "u3",
    source: "insta",
    author: "@emma.k",
    country: "US",
    stars: 4,
    tone: TONES[2],
  },
  {
    id: "u4",
    source: "insta",
    author: "@yi_ling",
    country: "TW",
    stars: 5,
    tone: TONES[3],
  },
  {
    id: "u5",
    source: "xhs",
    author: "Lina_xhs",
    country: "CN",
    stars: 5,
    tone: TONES[4],
  },
  {
    id: "u6",
    source: "insta",
    author: "@hina.kyoto",
    country: "JP",
    stars: 5,
    tone: TONES[5],
  },
  {
    id: "u7",
    source: "insta",
    author: "@anna.korea",
    country: "US",
    stars: 4,
    tone: TONES[0],
  },
  {
    id: "u8",
    source: "xhs",
    author: "Yuki_xhs",
    country: "JP",
    stars: 5,
    tone: TONES[2],
  },
  {
    id: "u9",
    source: "insta",
    author: "@mira.kpop",
    country: "VN",
    stars: 5,
    tone: TONES[3],
  },
];

const FILTERS = [
  { key: "All", flag: "🌐" },
  { key: "JP", flag: "🇯🇵" },
  { key: "CN", flag: "🇨🇳" },
  { key: "US", flag: "🇺🇸" },
  { key: "TW", flag: "🇹🇼" },
] as const;

export function TabLiveUgc({
  comingSoonLabel,
  filterAllLabel,
  disclaimerLabel,
}: Props) {
  const [filter, setFilter] = useState<string>("All");
  const filtered =
    filter === "All" ? TILES : TILES.filter((t) => t.country === filter);

  return (
    <div>
      <p className="px-5 pb-2 pt-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
        {comingSoonLabel}
      </p>
      <div className="c-detail-review-filter">
        {FILTERS.map((f) => (
          <button
            key={f.key}
            type="button"
            onClick={() => setFilter(f.key)}
            className={"c-detail-chip-r" + (f.key === filter ? " active" : "")}
          >
            <span aria-hidden="true">{f.flag}</span>
            {f.key === "All" && <span>{filterAllLabel ?? "All"}</span>}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1.5 px-5 pb-3">
        {filtered.map((tile) => (
          <article
            key={tile.id}
            className="relative aspect-square overflow-hidden rounded-2xl shadow-[0_1px_4px_rgba(26,34,56,0.08)]"
            style={{ background: tile.tone }}
          >
            <span
              aria-label={tile.source === "insta" ? "Instagram" : "Xiaohongshu"}
              className="absolute right-1.5 top-1.5 grid h-6 w-6 place-items-center rounded-full bg-white/85 font-mono text-[10px] font-bold text-hesya-navy-900 backdrop-blur-sm"
            >
              {tile.source === "insta" ? "📷" : "📕"}
            </span>
            <div className="absolute inset-x-1.5 bottom-1.5 flex items-center justify-between rounded-xl bg-black/30 px-2 py-1 backdrop-blur-sm">
              <span className="truncate text-[10px] font-medium text-white">
                {tile.author}
              </span>
              <span className="font-mono text-[9px] text-hesya-amber-200">
                {"★".repeat(tile.stars)}
              </span>
            </div>
          </article>
        ))}
        {filtered.length === 0 && (
          <p className="col-span-3 rounded-2xl bg-white/50 px-4 py-8 text-center text-[12px] text-hesya-navy-900/55">
            —
          </p>
        )}
      </div>
      {disclaimerLabel && (
        <p className="px-5 pb-4 text-[10px] leading-relaxed text-hesya-navy-900/50">
          {disclaimerLabel}
        </p>
      )}
    </div>
  );
}
