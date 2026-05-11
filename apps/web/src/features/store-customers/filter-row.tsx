"use client";

/**
 * Plan v3 M3.2 / Phase D3-C2 — Customers FilterRow.
 *
 * search + channel pill toggle + language pill toggle. derive-from-data —
 * 실제 customers의 distinct channel/language로만 옵션 채움.
 */

export interface FilterRowLabels {
  readonly searchPlaceholder: string;
  readonly channelAll: string;
  readonly languageAll: string;
  readonly resultCount: string;
}

export interface FilterRowProps {
  readonly search: string;
  readonly onSearchChange: (v: string) => void;
  readonly activeChannel: string;
  readonly onChannelChange: (v: string) => void;
  readonly channels: ReadonlyArray<string>;
  readonly activeLanguage: string;
  readonly onLanguageChange: (v: string) => void;
  readonly languages: ReadonlyArray<string>;
  readonly resultCount: number;
  readonly labels: FilterRowLabels;
}

const ALL = "__all__";

export function FilterRow({
  search,
  onSearchChange,
  activeChannel,
  onChannelChange,
  channels,
  activeLanguage,
  onLanguageChange,
  languages,
  resultCount,
  labels,
}: FilterRowProps) {
  return (
    <div className="mb-4 flex flex-col gap-3 rounded-2xl border border-hesya-peach-200 bg-white px-4 py-3">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <span
            aria-hidden="true"
            className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-hesya-navy-900/45"
          >
            ⌕
          </span>
          <input
            type="search"
            value={search}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder={labels.searchPlaceholder}
            className="w-full rounded-lg border border-hesya-peach-200 bg-hesya-peach-50/50 py-2 pl-8 pr-3 text-[13px] focus:border-hesya-navy-900 focus:bg-white focus:outline-none"
          />
        </div>
        <p className="font-mono text-[11px] text-hesya-navy-900/65 sm:flex-shrink-0">
          {labels.resultCount.replace("{n}", String(resultCount))}
        </p>
      </div>

      <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
        <FilterPill
          active={activeChannel === ALL}
          onClick={() => onChannelChange(ALL)}
          label={labels.channelAll}
        />
        {channels.map((c) => (
          <FilterPill
            key={`ch-${c}`}
            active={activeChannel === c}
            onClick={() => onChannelChange(c)}
            label={c}
            kind="channel"
          />
        ))}
      </div>

      <div className="-mx-1 flex flex-wrap gap-1.5 px-1">
        <FilterPill
          active={activeLanguage === ALL}
          onClick={() => onLanguageChange(ALL)}
          label={labels.languageAll}
        />
        {languages.map((l) => (
          <FilterPill
            key={`lg-${l}`}
            active={activeLanguage === l}
            onClick={() => onLanguageChange(l)}
            label={l.toUpperCase()}
            kind="lang"
          />
        ))}
      </div>
    </div>
  );
}

function FilterPill({
  active,
  onClick,
  label,
  kind,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
  kind?: "channel" | "lang";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={[
        "rounded-full border px-2.5 py-1 text-[11px] font-semibold transition",
        active
          ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
          : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500",
        kind === "channel" && !active ? "uppercase tracking-wide" : "",
        kind === "lang" && !active ? "font-mono" : "",
      ].join(" ")}
    >
      {label}
    </button>
  );
}
