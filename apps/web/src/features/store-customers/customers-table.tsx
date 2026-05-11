"use client";

/**
 * Plan v3 M3.2 / Phase D3-C2 — Customers DataTable.
 *
 * 디자인 정합: 10-col grid (Avatar / Name / Channel / Language / Nationality /
 * Visits / LTV / Allergy / Preferred Designer / Action). 현재 DAL 미지원
 * 컬럼(LastSeen, Status, Tags)은 placeholder. M4.x booker 통합 시 확장.
 */

import type { CustomerRow } from "./types";

export interface CustomersTableLabels {
  readonly columnName: string;
  readonly columnChannel: string;
  readonly columnLanguage: string;
  readonly columnNationality: string;
  readonly columnVisits: string;
  readonly columnLtv: string;
  readonly columnAllergy: string;
  readonly columnDesigner: string;
  readonly columnAction: string;
  readonly viewButton: string;
  readonly unknownName: string;
  readonly emptyDash: string;
}

interface Props {
  readonly rows: ReadonlyArray<CustomerRow>;
  readonly labels: CustomersTableLabels;
  readonly onSelect: (row: CustomerRow) => void;
  readonly selectedId: string | null;
}

function initialOf(name: string | null): string {
  if (!name) return "·";
  const t = name.trim();
  if (!t) return "·";
  return t.charAt(0).toUpperCase();
}

function fmtKRW(v: number | null): string {
  if (v == null || v <= 0) return "—";
  return `₩${v.toLocaleString("ko-KR")}`;
}

export function CustomersTable({ rows, labels, onSelect, selectedId }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hesya-peach-200 bg-white">
      <div className="hidden grid-cols-[40px_1.5fr_0.8fr_0.7fr_0.7fr_0.6fr_0.9fr_1fr_1fr_72px] gap-3 border-b border-hesya-peach-200 bg-hesya-peach-50/50 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-hesya-navy-900/65 md:grid">
        <span />
        <span>{labels.columnName}</span>
        <span>{labels.columnChannel}</span>
        <span>{labels.columnLanguage}</span>
        <span>{labels.columnNationality}</span>
        <span className="text-right font-mono">{labels.columnVisits}</span>
        <span className="text-right font-mono">{labels.columnLtv}</span>
        <span>{labels.columnAllergy}</span>
        <span>{labels.columnDesigner}</span>
        <span className="text-right">{labels.columnAction}</span>
      </div>

      <ul className="divide-y divide-hesya-peach-100">
        {rows.map((row) => {
          const isActive = selectedId === row.id;
          return (
            <li
              key={row.id}
              className={[
                "grid grid-cols-[40px_1fr_auto] gap-3 px-4 py-3 text-[13px] transition md:grid-cols-[40px_1.5fr_0.8fr_0.7fr_0.7fr_0.6fr_0.9fr_1fr_1fr_72px] md:py-2.5",
                isActive
                  ? "bg-hesya-amber-500/10"
                  : "hover:bg-hesya-peach-50/60",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                className="grid h-8 w-8 place-items-center rounded-full bg-hesya-peach-100 text-[12px] font-semibold text-hesya-navy-900"
              >
                {initialOf(row.name)}
              </span>

              <div className="min-w-0">
                <p className="truncate font-medium text-hesya-navy-900">
                  {row.name ?? labels.unknownName}
                </p>
                <p className="mt-0.5 truncate text-[11px] text-hesya-navy-900/55 md:hidden">
                  {row.channel ?? "—"} ·{" "}
                  {row.preferredLanguage?.toUpperCase() ?? "—"}
                </p>
              </div>

              <span className="hidden truncate text-[11px] uppercase tracking-wide text-hesya-navy-900/65 md:block">
                {row.channel ?? labels.emptyDash}
              </span>
              <span className="hidden font-mono text-[12px] text-hesya-navy-900/75 md:block">
                {row.preferredLanguage?.toUpperCase() ?? labels.emptyDash}
              </span>
              <span className="hidden font-mono text-[12px] text-hesya-navy-900/75 md:block">
                {row.nationality?.toUpperCase() ?? labels.emptyDash}
              </span>
              <span className="hidden text-right font-mono text-[12px] text-hesya-navy-900/85 md:block">
                {row.totalVisits ?? 0}
              </span>
              <span className="hidden text-right font-mono text-[12px] text-hesya-navy-900/85 md:block">
                {fmtKRW(row.ltvKrw)}
              </span>
              <span className="hidden truncate text-[12px] text-hesya-navy-900/75 md:block">
                {row.allergyNote ?? labels.emptyDash}
              </span>
              <span className="hidden truncate text-[12px] text-hesya-navy-900/75 md:block">
                {row.preferredDesigner ?? labels.emptyDash}
              </span>

              <div className="flex items-center justify-end md:justify-end">
                <button
                  type="button"
                  onClick={() => onSelect(row)}
                  className={[
                    "rounded-full px-3 py-1 text-[11px] font-semibold transition",
                    isActive
                      ? "bg-hesya-navy-900 text-hesya-peach-50"
                      : "border border-hesya-peach-200 text-hesya-navy-900 hover:border-hesya-amber-500",
                  ].join(" ")}
                >
                  {labels.viewButton}
                </button>
              </div>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
