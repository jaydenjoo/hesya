"use client";

import { useState } from "react";

/**
 * C5 100% — Allergy / Treatment safety disclosure 3-accordion.
 *
 * Reference: `docs/design/reference/detail-app.jsx:576-638` `Allergy disclosure`.
 * 3 row accordion (ingredients / allergy / aftercare) + footer note + send Q link.
 *
 * **mock-first**: 모든 텍스트는 i18n props로 주입. 실제 ingredients DB / 매장
 * 별 allergy 정책 wire 별도 task.
 */

interface IngredientRow {
  readonly name: string;
  readonly ewg: string;
  /** EWG 점수 색 (e.g., "low" / "mid" — 시각 구분). */
  readonly tone?: "low" | "mid" | "high";
}

interface Props {
  readonly title: string;
  readonly productsTitle: string;
  readonly allergyTitle: string;
  readonly aftercareTitle: string;
  readonly products: ReadonlyArray<IngredientRow>;
  readonly allergyBody: string;
  readonly aftercareBody: string;
  readonly footerNote: string;
  readonly sendQsLabel: string;
}

const TONE_BG: Record<NonNullable<IngredientRow["tone"]>, string> = {
  low: "bg-emerald-50 text-emerald-700",
  mid: "bg-yellow-50 text-yellow-700",
  high: "bg-red-50 text-red-700",
};

export function AllergyDisclosure({
  title,
  productsTitle,
  allergyTitle,
  aftercareTitle,
  products,
  allergyBody,
  aftercareBody,
  footerNote,
  sendQsLabel,
}: Props) {
  const [openIdx, setOpenIdx] = useState<number | null>(0);

  const items = [
    { key: "products", title: productsTitle },
    { key: "allergy", title: allergyTitle },
    { key: "aftercare", title: aftercareTitle },
  ] as const;

  return (
    <section
      data-testid="store-detail-allergy-disclosure"
      aria-label={title}
      className="mt-4 rounded-lg border border-hesya-peach-200 bg-hesya-peach-50/40 p-4"
    >
      <h4 className="kr mb-3 text-[13px] font-semibold text-hesya-navy-900">
        {title}
      </h4>

      <div className="flex flex-col gap-1.5">
        {items.map((it, i) => {
          const isOpen = openIdx === i;
          return (
            <div
              key={it.key}
              data-testid={`allergy-acc-${it.key}`}
              className="overflow-hidden rounded-md border border-hesya-peach-200 bg-white"
            >
              <button
                type="button"
                onClick={() => setOpenIdx(isOpen ? null : i)}
                aria-expanded={isOpen}
                className="kr flex w-full items-center justify-between px-3 py-2.5 text-left text-[12px] font-medium text-hesya-navy-900 hover:bg-hesya-peach-50/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
              >
                <span>{it.title}</span>
                <span
                  aria-hidden="true"
                  className={
                    "text-[10px] text-gray-500 transition-transform " +
                    (isOpen ? "rotate-90" : "")
                  }
                >
                  ▶
                </span>
              </button>
              {isOpen ? (
                <div className="border-t border-hesya-peach-200 px-3 py-3 text-[12px] text-gray-700">
                  {it.key === "products" ? (
                    <ul className="flex flex-col gap-1.5">
                      {products.map((p, pi) => (
                        <li
                          key={pi}
                          className="kr flex items-center justify-between gap-2"
                        >
                          <span className="truncate">{p.name}</span>
                          <span
                            className={
                              "shrink-0 rounded px-1.5 py-0.5 mono text-[10px] font-medium tabular-nums " +
                              TONE_BG[p.tone ?? "low"]
                            }
                          >
                            {p.ewg}
                          </span>
                        </li>
                      ))}
                    </ul>
                  ) : null}
                  {it.key === "allergy" ? (
                    <p className="leading-relaxed">{allergyBody}</p>
                  ) : null}
                  {it.key === "aftercare" ? (
                    <p className="leading-relaxed">{aftercareBody}</p>
                  ) : null}
                </div>
              ) : null}
            </div>
          );
        })}
      </div>

      <div className="kr mt-3 flex items-center justify-between gap-2 text-[11px]">
        <span className="text-gray-600">{footerNote}</span>
        <span
          className="cursor-not-allowed text-hesya-amber-600 hover:underline"
          aria-disabled="true"
        >
          {sendQsLabel} →
        </span>
      </div>
    </section>
  );
}
