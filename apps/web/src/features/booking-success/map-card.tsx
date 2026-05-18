"use client";

/**
 * Plan v3 Phase D2-B1 — 지도 카드. PR 21 (2026-05-15) — interactive tab state.
 * Reference: booking-app.jsx `.map-pill` — selected `bg: amber-600/white`,
 * non-selected `bg: peach-100`. Naver Map은 "추천" 표기.
 */

import { useState } from "react";

interface Props {
  readonly title: string;
  readonly addressText: string;
  readonly labels: {
    readonly apple: string;
    readonly google: string;
    readonly naver: string;
    readonly naverRecommended?: string;
  };
}

type MapKey = "apple" | "google" | "naver";

function buildLinks(query: string) {
  const q = encodeURIComponent(query);
  return {
    apple: `https://maps.apple.com/?q=${q}`,
    google: `https://www.google.com/maps/search/?api=1&query=${q}`,
    naver: `https://map.naver.com/v5/search/${q}`,
  };
}

export function MapCard({ title, addressText, labels }: Props) {
  const links = buildLinks(addressText);
  const [selected, setSelected] = useState<MapKey>("naver");
  const pills: Array<{
    key: MapKey;
    label: string;
    suffix?: string;
    icon: string;
    href: string;
  }> = [
    { key: "apple", label: labels.apple, icon: "", href: links.apple },
    { key: "google", label: labels.google, icon: "◯", href: links.google },
    {
      key: "naver",
      label: labels.naver,
      suffix: labels.naverRecommended,
      icon: "N",
      href: links.naver,
    },
  ];
  return (
    <section className="overflow-hidden rounded-2xl bg-white shadow-[0_4px_16px_rgba(26,34,56,0.06)]">
      <div
        aria-hidden="true"
        className="relative h-[140px] overflow-hidden rounded-[14px] bg-gradient-to-br from-hesya-peach-200 to-hesya-amber-500"
      >
        {/* reference booking.css L368-389 — radial spots + 45deg hatch pattern */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(circle at 30% 60%, rgba(26,34,56,0.18) 0%, transparent 30%), radial-gradient(circle at 70% 40%, rgba(26,34,56,0.12) 0%, transparent 25%), repeating-linear-gradient(45deg, transparent, transparent 14px, rgba(255,255,255,0.25) 14px, rgba(255,255,255,0.25) 16px)",
          }}
        />
        <span className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-[100%] text-[28px] drop-shadow-[0_2px_4px_rgba(26,34,56,0.4)]">
          📍
        </span>
      </div>
      <div className="px-5 py-5">
        <p className="mb-1 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
          {title}
        </p>
        <p className="mb-4 text-sm leading-relaxed text-hesya-navy-900">
          {addressText}
        </p>
        <div role="tablist" className="flex flex-wrap gap-2">
          {pills.map((p) => {
            const active = selected === p.key;
            return (
              <a
                key={p.key}
                role="tab"
                aria-selected={active}
                href={p.href}
                target="_blank"
                rel="noopener noreferrer"
                onMouseEnter={() => setSelected(p.key)}
                onFocus={() => setSelected(p.key)}
                className={
                  "inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-xs font-semibold transition " +
                  (active
                    ? "bg-hesya-amber-600 text-white shadow-[0_4px_10px_rgba(216,139,91,0.35)]"
                    : "bg-hesya-peach-100 text-hesya-navy-900 hover:bg-hesya-peach-200")
                }
              >
                <span aria-hidden="true" className="text-sm">
                  {p.icon}
                </span>
                {p.label}
                {p.suffix && (
                  <span
                    className={
                      "ml-0.5 text-[10px] font-medium " +
                      (active ? "text-white/85" : "text-hesya-amber-600")
                    }
                  >
                    · {p.suffix}
                  </span>
                )}
              </a>
            );
          })}
        </div>
      </div>
    </section>
  );
}
