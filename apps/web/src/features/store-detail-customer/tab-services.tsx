"use client";

/**
 * Plan v3 Phase D2-B2-b — Tab: 시술 메뉴 panel.
 *
 * C5 fast track (2026-05-15): reference rich card 정합 — thumbnail + duration +
 * price + 환산가격(mock) + 언어 태그 + 선택 highlight (item 2).
 */

import { useState } from "react";

export interface ServiceItem {
  readonly id: string;
  readonly name: string;
  readonly priceFormatted: string;
  readonly durationLabel: string | null;
  /** C5 fast track 추가: 환산가격 mock (예: ≈ ¥8,650). DAL 미존재 시 page에서 mock 생성. */
  readonly priceConverted?: string;
  /** C5 fast track 추가: 언어 태그 (예: ["EN", "JA"]). 비어있으면 미렌더. */
  readonly languageTags?: ReadonlyArray<string>;
  /** C5 fast track 추가: 카테고리 (예: "Hair"). 같은 카테고리끼리 묶어 cat-head 표시. */
  readonly category?: string;
  /** C5 fast track 추가: thumb variant 1~5 (gradient색). 없으면 default. */
  readonly thumbVariant?: 1 | 2 | 3 | 4 | 5;
}

interface Props {
  readonly items: readonly ServiceItem[];
  readonly emptyLabel: string;
  readonly langOkSuffix?: string;
}

export function TabServices({ items, emptyLabel, langOkSuffix }: Props) {
  const [selected, setSelected] = useState<string | null>(null);

  if (items.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-hesya-navy-900/55">
        {emptyLabel}
      </p>
    );
  }

  // 카테고리별 그룹핑 — 같은 category 묶음 + 첫 등장 순서 유지
  const groups = new Map<string, ServiceItem[]>();
  for (const item of items) {
    const cat = item.category ?? "Services";
    const arr = groups.get(cat) ?? [];
    arr.push(item);
    groups.set(cat, arr);
  }

  return (
    <div>
      {Array.from(groups.entries()).map(([cat, list]) => (
        <div key={cat}>
          <div className="c-detail-cat-head">
            <span>{cat}</span>
            <span
              aria-hidden="true"
              className="ml-2 inline-flex items-center rounded-full bg-hesya-peach-100 px-1.5 py-0.5 font-mono text-[9.5px] font-semibold tabular-nums text-hesya-amber-600"
            >
              {list.length}
            </span>
          </div>
          {list.map((s, i) => (
            <button
              key={s.id}
              type="button"
              onClick={() =>
                setSelected((prev) => (prev === s.id ? null : s.id))
              }
              className={
                "c-detail-svc-card" +
                (s.id === selected ? " selected" : "") +
                ` t${(s.thumbVariant ?? (i % 5) + 1) as number}-row`
              }
            >
              <span
                className={
                  "c-detail-svc-thumb t" +
                  ((s.thumbVariant ?? (i % 5) + 1) as number)
                }
              />
              <div className="c-detail-svc-info">
                <div className="c-detail-svc-name">{s.name}</div>
                <div className="c-detail-svc-meta">
                  {s.durationLabel && <span>{s.durationLabel}</span>}
                  {s.durationLabel && <span>·</span>}
                  <span className="c-detail-svc-price">{s.priceFormatted}</span>
                  {s.priceConverted && (
                    <span className="c-detail-svc-conv">
                      ≈ {s.priceConverted}
                    </span>
                  )}
                </div>
                {s.languageTags && s.languageTags.length > 0 && (
                  <div className="c-detail-svc-tags">
                    {s.languageTags.map((l) => (
                      <span key={l} className="c-detail-lang-tag">
                        {l} {langOkSuffix ?? "OK"}
                      </span>
                    ))}
                  </div>
                )}
              </div>
              <span className="c-detail-chev">›</span>
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
