"use client";

/**
 * Plan v3 M6.1 — Settings 좌측 SectionNav (reference 정합).
 *
 * 240px 좌측 분리 (settings.css `.set-snav`).
 * head: eyebrow (uppercase amber-600 10px tracking-0.16em) + title (navy-900 19px bold)
 * list: 9 sections, 활성 시 border-left 2px amber-500 + bg peach-50 + num amber italic
 * foot: storeName + 마지막 저장 시각 + 편집자
 *
 * anchor link 형식 — 우측 scroll container 내 `#section-{id}` 로 jump.
 * IntersectionObserver로 active section 자동 highlight.
 */

import { useEffect, useState } from "react";

export interface SectionItem {
  readonly id: string;
  readonly num: string;
  readonly label: string;
  readonly status: "active" | "placeholder" | "info";
  readonly danger?: boolean;
}

interface NavHead {
  readonly eyebrow: string;
  readonly title: string;
}

interface NavFoot {
  readonly storeName: string;
  readonly savedLabel: string;
  readonly editorLabel: string;
  readonly editorName: string;
}

interface Props {
  readonly items: ReadonlyArray<SectionItem>;
  readonly sectionIds: ReadonlyArray<string>;
  readonly head: NavHead;
  readonly foot: NavFoot;
}

export function SectionNav({ items, sectionIds, head, foot }: Props) {
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
    <aside
      aria-label="Settings sections"
      className="flex flex-col border-b border-hesya-peach-100 bg-white md:sticky md:top-[64px] md:h-[calc(100vh-64px)] md:w-[240px] md:flex-shrink-0 md:border-b-0 md:border-r"
    >
      <div className="border-b border-hesya-peach-100 px-5 py-6">
        <p className="mb-1.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-amber-600">
          {head.eyebrow}
        </p>
        <h2 className="text-[19px] font-bold tracking-[-0.01em] text-hesya-navy-900">
          {head.title}
        </h2>
      </div>
      <ul className="flex gap-1 overflow-x-auto px-2 py-3 md:flex-1 md:flex-col md:gap-0 md:overflow-y-auto md:overflow-x-hidden md:px-0">
        {items.map((item) => {
          const isActive = item.id === activeId;
          const borderClass = isActive
            ? item.danger
              ? "border-l-[#c9483a]"
              : "border-l-hesya-amber-500"
            : "border-l-transparent";
          return (
            <li key={item.id} className="flex-shrink-0 md:flex-shrink">
              <button
                type="button"
                onClick={() => handleClick(item.id)}
                className={[
                  "flex w-full items-center gap-2.5 border-l-2 px-5 py-2.5 text-left text-[13.5px] transition-colors",
                  borderClass,
                  isActive
                    ? "bg-hesya-peach-50 font-semibold text-hesya-navy-900"
                    : "font-medium text-gray-700 hover:bg-hesya-peach-50 hover:text-hesya-navy-900",
                ].join(" ")}
              >
                <span
                  aria-hidden="true"
                  className="min-w-[14px] font-heading text-[12px] font-medium italic text-hesya-amber-600"
                >
                  {item.num}
                </span>
                <span className="flex-1 truncate">{item.label}</span>
                {item.status === "placeholder" ? (
                  <span
                    aria-hidden="true"
                    className="rounded-full bg-hesya-peach-100 px-1.5 font-mono text-[9px] text-hesya-navy-900/55"
                  >
                    soon
                  </span>
                ) : null}
                {item.danger ? (
                  <span
                    aria-hidden="true"
                    className="ml-auto h-1.5 w-1.5 rounded-full bg-[#c9483a]"
                  />
                ) : null}
              </button>
            </li>
          );
        })}
      </ul>
      <div className="hidden border-t border-hesya-peach-100 px-5 py-4 font-mono text-[11px] leading-relaxed text-gray-500 md:block">
        <p className="font-semibold text-gray-700">{foot.storeName}</p>
        <p>{foot.savedLabel}</p>
        <p>
          {foot.editorLabel} · {foot.editorName}
        </p>
      </div>
    </aside>
  );
}
