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
  readonly columnLastSeen: string;
  readonly columnStatus: string;
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

/** Avatar 3색 palette (reference cu-avatar id%3 color). */
const AVATAR_BGS = [
  "linear-gradient(135deg, #F5DDC8, #D88B5B)",
  "linear-gradient(135deg, #C9D6E8, #D88B5B)",
  "linear-gradient(135deg, #D6E8C9, #D88B5B)",
] as const;
function avatarBg(seed: string): string {
  let h = 0;
  for (let i = 0; i < seed.length; i++) {
    h = (h * 31 + seed.charCodeAt(i)) | 0;
  }
  return AVATAR_BGS[Math.abs(h) % AVATAR_BGS.length] ?? AVATAR_BGS[0]!;
}

const FLAGS: Record<string, string> = {
  jp: "🇯🇵",
  cn: "🇨🇳",
  tw: "🇹🇼",
  us: "🇺🇸",
  vn: "🇻🇳",
  kr: "🇰🇷",
  th: "🇹🇭",
  hk: "🇭🇰",
};
function flagForNationality(code: string): string {
  return FLAGS[code.toLowerCase()] ?? "🌍";
}

type CustomerStatus = "vip" | "active" | "dormant" | "new";

function deriveStatus(row: CustomerRow): CustomerStatus {
  const visits = row.totalVisits ?? 0;
  const ltv = row.ltvKrw ?? 0;
  if (visits >= 5 && ltv >= 300000) return "vip";
  if (visits >= 3) return "active";
  if (visits === 0) return "new";
  return "dormant";
}

const STATUS_STYLES: Record<
  CustomerStatus,
  { icon: string; label: string; cls: string }
> = {
  vip: {
    icon: "★",
    label: "VIP",
    cls: "bg-hesya-amber-500/15 text-hesya-amber-700 ring-1 ring-hesya-amber-500/40",
  },
  active: {
    icon: "●",
    label: "활성",
    cls: "bg-emerald-50 text-emerald-700 ring-1 ring-emerald-200",
  },
  new: {
    icon: "✦",
    label: "신규",
    cls: "bg-hesya-peach-100 text-hesya-amber-600 ring-1 ring-hesya-peach-200",
  },
  dormant: {
    icon: "○",
    label: "휴면",
    cls: "bg-hesya-navy-900/5 text-hesya-navy-900/45 ring-1 ring-hesya-navy-900/10",
  },
};

const TABLE_GRID =
  "md:grid-cols-[40px_minmax(180px,1.6fr)_0.7fr_0.7fr_0.55fr_0.85fr_0.7fr_0.95fr_0.85fr_28px]";

export function CustomersTable({ rows, labels, onSelect, selectedId }: Props) {
  return (
    <div className="overflow-hidden rounded-2xl border border-hesya-peach-200 bg-white">
      <div
        className={
          "hidden gap-3 border-b border-hesya-peach-200 bg-hesya-peach-50/60 px-4 py-2.5 text-[10px] font-semibold uppercase tracking-[0.14em] text-hesya-navy-900/65 md:grid " +
          TABLE_GRID
        }
      >
        <span />
        <span>{labels.columnName}</span>
        <span>{labels.columnLanguage}</span>
        <span>{labels.columnNationality}</span>
        <span className="text-right font-mono">{labels.columnVisits}</span>
        <span className="text-right font-mono">{labels.columnLtv}</span>
        <span>{labels.columnLastSeen}</span>
        <span>{labels.columnDesigner}</span>
        <span>{labels.columnStatus}</span>
        <span />
      </div>

      <ul className="divide-y divide-hesya-peach-100">
        {rows.map((row) => {
          const isActive = selectedId === row.id;
          const status = STATUS_STYLES[deriveStatus(row)];
          return (
            <li
              key={row.id}
              onClick={() => onSelect(row)}
              className={[
                "grid cursor-pointer grid-cols-[40px_1fr_auto] items-center gap-3 px-4 py-3 text-[13px] transition md:py-2.5",
                TABLE_GRID,
                isActive ? "bg-hesya-peach-100" : "hover:bg-hesya-peach-50/60",
              ].join(" ")}
            >
              <span
                aria-hidden="true"
                style={{ background: avatarBg(row.id) }}
                className="relative grid h-9 w-9 place-items-center rounded-full text-[12px] font-semibold text-white"
              >
                {initialOf(row.name)}
                {row.nationality && row.nationality.toLowerCase() !== "kr" && (
                  <span className="absolute -bottom-0.5 -right-0.5 grid h-4 w-4 place-items-center rounded-full border-2 border-white bg-white text-[9px]">
                    {flagForNationality(row.nationality)}
                  </span>
                )}
              </span>

              <div className="min-w-0">
                <p className="truncate font-medium text-hesya-navy-900">
                  {row.name ?? labels.unknownName}
                </p>
                <p className="mt-0.5 truncate text-[10.5px] text-hesya-navy-900/55">
                  {row.channel ?? labels.emptyDash}
                  {row.allergyNote ? ` · ${row.allergyNote}` : ""}
                </p>
              </div>

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
              <span className="hidden truncate text-[11.5px] text-hesya-navy-900/55 md:block">
                {labels.emptyDash}
              </span>
              <span className="hidden truncate text-[12px] text-hesya-navy-900/75 md:block">
                {row.preferredDesigner ?? labels.emptyDash}
              </span>

              <span className="hidden md:block">
                <span
                  className={
                    "inline-flex items-center gap-1 rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold " +
                    status.cls
                  }
                  title={status.label}
                >
                  <span aria-hidden="true">{status.icon}</span>
                  <span className="kr">{status.label}</span>
                </span>
              </span>

              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  onSelect(row);
                }}
                aria-label={labels.viewButton}
                className={[
                  "grid h-7 w-7 place-items-center justify-self-end rounded-full text-[12px] transition",
                  isActive
                    ? "bg-hesya-navy-900 text-hesya-peach-50"
                    : "text-hesya-navy-900/55 hover:bg-hesya-peach-100 hover:text-hesya-amber-700",
                ].join(" ")}
              >
                ▸
              </button>
            </li>
          );
        })}
      </ul>
    </div>
  );
}
