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
