"use client";

/**
 * Plan v3 M3.3 / Phase D3-C3 — Settings 좌측 SectionNav.
 *
 * 9 sections (active 3 + placeholders 5 + risk 1). anchor link 형식 — 우측
 * scroll container 내 sections로 jump. IntersectionObserver로 active section
 * 자동 highlight (sticky sidebar).
 */

import { useEffect, useState } from "react";

export interface SectionItem {
  readonly id: string;
  readonly label: string;
  readonly icon: string;
  readonly status: "active" | "placeholder" | "info";
}

interface Props {
  readonly items: ReadonlyArray<SectionItem>;
  readonly sectionIds: ReadonlyArray<string>;
}

export function SectionNav({ items, sectionIds }: Props) {
  const [activeId, setActiveId] = useState<string>(items[0]?.id ?? "");

  useEffect(() => {
    if (typeof window === "undefined") return;
    const elements = sectionIds
      .map((id) => document.getElementById(`section-${id}`))
      .filter((el): el is HTMLElement => el !== null);
    if (elements.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            const id = entry.target.id.replace(/^section-/, "");
            setActiveId(id);
          }
        }
      },
      { rootMargin: "-30% 0px -60% 0px", threshold: 0 },
    );

    for (const el of elements) observer.observe(el);
    return () => observer.disconnect();
  }, [sectionIds]);

  const handleClick = (id: string) => {
    const el = document.getElementById(`section-${id}`);
    if (el) el.scrollIntoView({ behavior: "smooth", block: "start" });
  };

  return (
    <nav
      aria-label="Settings sections"
      className="md:sticky md:top-24 md:w-[220px] md:flex-shrink-0"
    >
      <ul className="flex gap-1 overflow-x-auto pb-2 md:flex-col md:gap-px md:overflow-visible md:pb-0">
        {items.map((item) => {
          const isActive = item.id === activeId;
          return (
            <li key={item.id} className="flex-shrink-0">
              <button
                type="button"
                onClick={() => handleClick(item.id)}
                className={[
                  "flex w-full items-center gap-2 rounded-lg px-3 py-2 text-left text-[13px] transition",
                  isActive
                    ? "bg-hesya-navy-900 font-semibold text-hesya-peach-50"
                    : "text-hesya-navy-900 hover:bg-hesya-peach-50",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className={[
                    "w-4 flex-shrink-0 text-center text-sm",
                    isActive
                      ? "text-hesya-amber-500"
                      : "text-hesya-navy-900/45",
                  ].join(" ")}
                >
                  {item.icon}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.status === "placeholder" ? (
                  <span
                    aria-hidden="true"
                    className={[
                      "rounded-full px-1.5 text-[9px] font-mono",
                      isActive
                        ? "bg-hesya-amber-500/30 text-hesya-peach-50"
                        : "bg-hesya-peach-100 text-hesya-navy-900/55",
                    ].join(" ")}
                  >
                    soon
                  </span>
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
