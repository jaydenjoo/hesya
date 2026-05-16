"use client";

/**
 * Plan v3 M3.2 / Phase D3-C2 — Customers Manager (디자인 정합 재구성).
 *
 * FilterRow + CustomersTable + DetailSheet (right-slide). 기존
 * `customers-list.tsx`의 inline edit는 DetailSheet의 Notes 탭으로 흡수.
 */

import { useMemo, useState } from "react";

import { CustomersTable, type CustomersTableLabels } from "./customers-table";
import { DetailSheet, type DetailSheetLabels } from "./detail-sheet";
import { FilterRow, type FilterRowLabels } from "./filter-row";
import type { CustomerRow } from "./types";

export interface CustomersManagerLabels {
  readonly emptyText: string;
  readonly filter: FilterRowLabels;
  readonly table: CustomersTableLabels;
  readonly detail: DetailSheetLabels;
}

interface Props {
  readonly rows: ReadonlyArray<CustomerRow>;
  readonly labels: CustomersManagerLabels;
}

const ALL = "__all__";

type CustomerStatus = "vip" | "active" | "dormant" | "new";

function deriveStatus(row: CustomerRow): CustomerStatus {
  const visits = row.totalVisits ?? 0;
  const ltv = row.ltvKrw ?? 0;
  if (visits >= 5 && ltv >= 300000) return "vip";
  if (visits >= 3) return "active";
  if (visits === 0) return "new";
  return "dormant";
}

function matchesSearch(row: CustomerRow, q: string): boolean {
  if (!q) return true;
  const needle = q.trim().toLowerCase();
  if (!needle) return true;
  return (
    (row.name ?? "").toLowerCase().includes(needle) ||
    (row.externalId ?? "").toLowerCase().includes(needle) ||
    (row.allergyNote ?? "").toLowerCase().includes(needle) ||
    (row.preferredDesigner ?? "").toLowerCase().includes(needle)
  );
}

export function CustomersManager({ rows, labels }: Props) {
  const [search, setSearch] = useState("");
  const [channel, setChannel] = useState(ALL);
  const [language, setLanguage] = useState(ALL);
  const [selectedId, setSelectedId] = useState<string | null>(null);

  const channels = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.channel) set.add(r.channel);
    return Array.from(set).sort();
  }, [rows]);

  const languages = useMemo(() => {
    const set = new Set<string>();
    for (const r of rows) if (r.preferredLanguage) set.add(r.preferredLanguage);
    return Array.from(set).sort();
  }, [rows]);

  const filtered = useMemo(() => {
    return rows.filter(
      (r) =>
        (channel === ALL || r.channel === channel) &&
        (language === ALL || r.preferredLanguage === language) &&
        matchesSearch(r, search),
    );
  }, [rows, channel, language, search]);

  const selected = useMemo(
    () => rows.find((r) => r.id === selectedId) ?? null,
    [rows, selectedId],
  );

  const statusCounts = useMemo(() => {
    let vip = 0;
    let active = 0;
    let newCount = 0;
    let dormant = 0;
    for (const r of rows) {
      const s = deriveStatus(r);
      if (s === "vip") vip += 1;
      else if (s === "active") active += 1;
      else if (s === "new") newCount += 1;
      else dormant += 1;
    }
    return { vip, active, new: newCount, dormant };
  }, [rows]);

  if (rows.length === 0) {
    return (
      <p className="rounded-2xl border border-hesya-peach-200 bg-white px-6 py-12 text-center text-sm text-hesya-navy-900/55">
        {labels.emptyText}
      </p>
    );
  }

  const hasSelection = selected != null;

  return (
    <div>
      <section
        aria-label="고객 KPI"
        className="mb-4 grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hesya-peach-100 bg-hesya-peach-100 sm:grid-cols-4"
      >
        <CustomerKpiCell
          label="VIP"
          count={statusCounts.vip}
          tone={statusCounts.vip > 0 ? "vip" : "muted"}
        />
        <CustomerKpiCell
          label="활성"
          count={statusCounts.active}
          tone={statusCounts.active > 0 ? "ok" : "muted"}
        />
        <CustomerKpiCell
          label="신규"
          count={statusCounts.new}
          tone={statusCounts.new > 0 ? "warm" : "muted"}
        />
        <CustomerKpiCell
          label="휴면"
          count={statusCounts.dormant}
          tone="muted"
        />
      </section>
      <FilterRow
        search={search}
        onSearchChange={setSearch}
        activeChannel={channel}
        onChannelChange={setChannel}
        channels={channels}
        activeLanguage={language}
        onLanguageChange={setLanguage}
        languages={languages}
        resultCount={filtered.length}
        labels={labels.filter}
      />

      <div
        className={
          hasSelection ? "grid items-start gap-4 lg:grid-cols-[1fr_440px]" : ""
        }
      >
        <div className="min-w-0">
          {filtered.length === 0 ? (
            <p className="rounded-2xl border border-hesya-peach-200 bg-white px-6 py-10 text-center text-[13px] text-hesya-navy-900/55">
              {labels.emptyText}
            </p>
          ) : (
            <CustomersTable
              rows={filtered}
              labels={labels.table}
              onSelect={(r) => setSelectedId(r.id)}
              selectedId={selectedId}
            />
          )}
        </div>

        {hasSelection && (
          <>
            {/* Mobile/tablet (<lg): modal mode */}
            <div className="lg:hidden">
              <DetailSheet
                row={selected}
                onClose={() => setSelectedId(null)}
                labels={labels.detail}
                mode="modal"
              />
            </div>
            {/* Desktop (lg+): inline split-view column */}
            <div className="hidden lg:block">
              <DetailSheet
                row={selected}
                onClose={() => setSelectedId(null)}
                labels={labels.detail}
                mode="inline"
              />
            </div>
          </>
        )}
      </div>
    </div>
  );
}

const CUSTOMER_KPI_TONE: Record<
  "vip" | "ok" | "warm" | "muted",
  { num: string; chip: string }
> = {
  vip: {
    num: "text-hesya-amber-700",
    chip: "bg-hesya-amber-500/15 text-hesya-amber-700",
  },
  ok: {
    num: "text-emerald-700",
    chip: "bg-emerald-50 text-emerald-700",
  },
  warm: {
    num: "text-hesya-amber-600",
    chip: "bg-hesya-peach-100 text-hesya-amber-600",
  },
  muted: {
    num: "text-hesya-navy-900/45",
    chip: "bg-hesya-peach-50 text-hesya-navy-900/55",
  },
};

function CustomerKpiCell({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "vip" | "ok" | "warm" | "muted";
}) {
  const t = CUSTOMER_KPI_TONE[tone];
  return (
    <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
      <span className="kr font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={`font-heading text-[24px] font-medium italic leading-none tabular-nums ${t.num}`}
        >
          {count}
        </span>
        <span
          className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] ${t.chip}`}
        >
          {count > 0 ? "명" : "—"}
        </span>
      </span>
    </div>
  );
}
