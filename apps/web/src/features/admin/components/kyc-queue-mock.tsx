/**
 * Sprint 2C PR-D2 — Admin KYC operator review queue rich mock UI.
 *
 * Server component. env.MOCK_FIXTURES=true 일 때만 노출.
 */

import type { KycQueueItem } from "@/lib/mock-fixtures/admin-kyc";

export interface KycQueueLabels {
  readonly statsPending: string;
  readonly statsSlaBreached: string;
  readonly statsAvgRisk: string;
  readonly statsToday: string;
  readonly statsApproved: string;
  readonly statsRejected: string;
  readonly statsAutoApproved: string;
  readonly riskLow: string;
  readonly riskMedium: string;
  readonly riskHigh: string;
  readonly slaRemaining: string;
  readonly slaBreached: string;
  readonly docStatus: {
    readonly ok: string;
    readonly blurry: string;
    readonly expired: string;
    readonly missing: string;
  };
  readonly aiHintsTitle: string;
  readonly priorIncidentsTitle: string;
  readonly actionApprove: string;
  readonly actionReject: string;
  readonly actionRequestMore: string;
  readonly pipelineExpand: string;
  readonly stepTitles: {
    readonly business: string;
    readonly license: string;
    readonly id: string;
    readonly address: string;
    readonly risk: string;
    readonly optional: string;
  };
  readonly stepStates: {
    readonly pass: string;
    readonly warn: string;
    readonly fail: string;
    readonly skip: string;
  };
}

export function KycQueueStats({
  stats,
  labels,
}: {
  stats: {
    pending: number;
    slaBreached: number;
    avgRiskScore: number;
    todayApproved: number;
    todayRejected: number;
    weekAutoApprovedPct: number;
  };
  labels: KycQueueLabels;
}) {
  return (
    <section data-testid="kyc-queue-stats" className="mb-6 space-y-3">
      <div className="flex flex-wrap items-center gap-2">
        <StatusPill
          icon="📋"
          label={labels.statsPending}
          value={stats.pending}
          tone={stats.pending > 0 ? "urgent" : "default"}
          active
        />
        <StatusPill
          icon="✅"
          label={labels.statsApproved}
          value={stats.todayApproved}
        />
        <StatusPill
          icon="❌"
          label={labels.statsRejected}
          value={stats.todayRejected}
        />
        <StatusPill
          icon="⚠"
          label={labels.statsSlaBreached}
          value={stats.slaBreached}
          tone={stats.slaBreached > 0 ? "warn" : "default"}
        />
      </div>
      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <StatTile
          label={labels.statsAvgRisk}
          value={`${stats.avgRiskScore}`}
          tone={
            stats.avgRiskScore >= 60
              ? "danger"
              : stats.avgRiskScore >= 30
                ? "warn"
                : "default"
          }
        />
        <StatTile
          label={labels.statsAutoApproved}
          value={`${stats.weekAutoApprovedPct}%`}
          hint={`${labels.statsApproved} ${stats.todayApproved} · ${labels.statsRejected} ${stats.todayRejected}`}
          tone="default"
        />
      </div>
    </section>
  );
}

function StatusPill({
  icon,
  label,
  value,
  tone = "default",
  active = false,
}: {
  icon: string;
  label: string;
  value: number;
  tone?: "default" | "urgent" | "warn";
  active?: boolean;
}) {
  const toneClass =
    tone === "urgent"
      ? "border-hesya-amber-500/40 bg-hesya-amber-500/10 text-hesya-amber-700"
      : tone === "warn"
        ? "border-rose-200 bg-rose-50 text-rose-700"
        : "border-hesya-peach-200 bg-white text-hesya-navy-900/75";
  const activeRing = active
    ? "ring-1 ring-hesya-amber-500/30 shadow-[0_1px_3px_rgba(232,169,122,0.18)]"
    : "";
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-[11.5px] ${toneClass} ${activeRing}`}
    >
      <span aria-hidden="true" className="text-[11px]">
        {icon}
      </span>
      <span className="kr font-medium">{label}</span>
      <span className="mono font-semibold tabular-nums">{value}</span>
    </span>
  );
}

function StatTile({
  label,
  value,
  hint,
  tone,
}: {
  label: string;
  value: string;
  hint?: string;
  tone: "default" | "warn" | "danger";
}) {
  const bg =
    tone === "danger"
      ? "border-rose-200 bg-rose-50/40"
      : tone === "warn"
        ? "border-amber-200 bg-amber-50/40"
        : "border-gray-200 bg-white";
  return (
    <div
      className={`rounded-md border p-4 shadow-[0_1px_2px_rgba(26,34,56,0.04)] ${bg}`}
    >
      <p className="font-mono text-[10px] uppercase tracking-[0.16em] text-hesya-navy-900/50">
        {label}
      </p>
      <p className="mt-1 font-heading text-[24px] font-medium italic leading-none text-hesya-navy-900">
        {value}
      </p>
      {hint && (
        <p className="mt-1.5 text-[10.5px] text-hesya-navy-900/55">{hint}</p>
      )}
    </div>
  );
}

export function KycQueueList({
  items,
  labels,
}: {
  items: ReadonlyArray<KycQueueItem>;
  labels: KycQueueLabels;
}) {
  return (
    <div className="space-y-3">
      {items.map((item) => (
        <KycQueueCard key={item.id} item={item} labels={labels} />
      ))}
    </div>
  );
}

type PipelineState = "pass" | "warn" | "fail" | "skip";

function derivePipelineSteps(item: KycQueueItem): ReadonlyArray<PipelineState> {
  const docState = (
    status: "ok" | "blurry" | "expired" | "missing",
  ): PipelineState =>
    status === "ok" ? "pass" : status === "blurry" ? "warn" : "fail";
  const find = (t: "business" | "license" | "id" | "address") =>
    item.documents.find((d) => d.type === t)?.status ?? "missing";
  const riskStep: PipelineState =
    item.riskTier === "low"
      ? "pass"
      : item.riskTier === "medium"
        ? "warn"
        : "fail";
  return [
    docState(find("business")),
    docState(find("license")),
    docState(find("id")),
    docState(find("address")),
    riskStep,
    "skip",
  ];
}

function KycQueueCard({
  item,
  labels,
}: {
  item: KycQueueItem;
  labels: KycQueueLabels;
}) {
  const slaBreached = item.slaHoursRemaining < 0;
  const pipelineSteps = derivePipelineSteps(item);
  const riskColor = {
    low: "bg-emerald-50 text-emerald-700",
    medium: "bg-amber-50 text-amber-700",
    high: "bg-rose-50 text-rose-700",
  };
  const riskLabel = {
    low: labels.riskLow,
    medium: labels.riskMedium,
    high: labels.riskHigh,
  };
  const docStatusColor = {
    ok: "bg-emerald-50 text-emerald-700 border-emerald-200",
    blurry: "bg-amber-50 text-amber-700 border-amber-200",
    expired: "bg-rose-50 text-rose-700 border-rose-200",
    missing: "bg-rose-50 text-rose-700 border-rose-300",
  };
  const stepClass: Record<PipelineState, string> = {
    pass: "border-emerald-200 bg-emerald-50 text-emerald-700",
    warn: "border-amber-200 bg-amber-50 text-amber-700",
    fail: "border-rose-200 bg-rose-50 text-rose-700",
    skip: "border-gray-200 bg-white text-hesya-navy-900/35",
  };

  return (
    <article
      data-testid={`kyc-queue-card-${item.id}`}
      className={`rounded-md border bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)] ${
        slaBreached ? "border-rose-200" : "border-gray-200"
      }`}
    >
      <header className="mb-3 flex flex-wrap items-start justify-between gap-3">
        <div className="flex items-start gap-3">
          <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-md bg-hesya-peach-50 font-display text-[16px] italic text-hesya-navy-900">
            {item.storeName.charAt(0)}
          </div>
          <div>
            <h3 className="font-display text-[16px] font-semibold italic text-hesya-navy-900">
              {item.storeName}
            </h3>
            <p className="mt-0.5 font-mono text-[10.5px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
              {item.storeNameRomanized} · {item.category}
            </p>
            <p className="mt-1 text-[11.5px] text-hesya-navy-900/65">
              <span aria-hidden="true">{item.flag}</span> {item.ownerName} ·{" "}
              {item.nationality}
            </p>
          </div>
        </div>
        <div className="flex flex-col items-end gap-1.5">
          <span
            className={`rounded-full px-2.5 py-0.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.1em] ${riskColor[item.riskTier]}`}
          >
            {riskLabel[item.riskTier]} · {item.riskScore}
          </span>
          <span
            className={`font-mono text-[10.5px] ${slaBreached ? "font-semibold text-rose-700" : "text-hesya-navy-900/60"}`}
          >
            {slaBreached
              ? `⏱ ${labels.slaBreached} ${Math.abs(item.slaHoursRemaining)}h`
              : `${labels.slaRemaining} ${item.slaHoursRemaining}h`}
          </span>
        </div>
      </header>

      <div
        aria-label="검증 파이프라인"
        className="mb-3 flex items-center gap-1"
      >
        {pipelineSteps.map((s, i) => (
          <span
            key={i}
            className={`grid h-5 w-5 place-items-center rounded-sm border font-mono text-[9.5px] font-semibold ${stepClass[s]}`}
            title={`STEP ${i + 1} · ${s}`}
          >
            {i + 1}
          </span>
        ))}
        <span className="ml-2 font-mono text-[9.5px] uppercase tracking-[0.12em] text-hesya-navy-900/45">
          5단계 자동 + 1단계 선택
        </span>
      </div>

      <details className="group mb-3 [&_summary::-webkit-details-marker]:hidden">
        <summary className="flex cursor-pointer list-none items-center gap-1.5 text-[11px] font-medium text-hesya-amber-600 hover:text-hesya-amber-700">
          <span className="inline-block transition-transform duration-200 group-open:rotate-90">
            ▸
          </span>
          {labels.pipelineExpand}
        </summary>
        <div className="mt-2.5 grid grid-cols-2 gap-2.5 sm:grid-cols-3">
          {pipelineSteps.map((s, i) => {
            const titleKey = (
              [
                "business",
                "license",
                "id",
                "address",
                "risk",
                "optional",
              ] as const
            )[i];
            const borderTone =
              s === "pass"
                ? "border-t-emerald-500"
                : s === "warn"
                  ? "border-t-amber-500"
                  : s === "fail"
                    ? "border-t-rose-500"
                    : "border-t-gray-300";
            const numTone =
              s === "warn"
                ? "text-amber-500"
                : s === "fail"
                  ? "text-rose-500"
                  : s === "pass"
                    ? "text-emerald-500"
                    : "text-gray-300";
            const stateTone =
              s === "pass"
                ? "text-emerald-700"
                : s === "warn"
                  ? "text-amber-700"
                  : s === "fail"
                    ? "text-rose-700"
                    : "text-gray-500";
            return (
              <div
                key={i}
                className={`relative rounded-md border border-gray-200 bg-white px-3.5 pb-3 pt-3 shadow-[0_1px_2px_rgba(26,34,56,0.04)] border-t-[3px] ${borderTone}`}
              >
                <span
                  className={`absolute right-3 top-2.5 font-display text-[20px] font-semibold italic leading-none tracking-tight ${numTone}`}
                >
                  {i + 1}
                </span>
                <p className="font-mono text-[8.5px] uppercase tracking-[0.22em] text-gray-500">
                  STEP {i + 1}
                </p>
                <p className="mt-1.5 text-[12.5px] font-medium text-hesya-navy-900 [word-break:keep-all]">
                  {labels.stepTitles[titleKey]}
                </p>
                <p
                  className={`mt-1 font-mono text-[10px] uppercase tracking-[0.16em] ${stateTone}`}
                >
                  {labels.stepStates[s]}
                </p>
              </div>
            );
          })}
        </div>
      </details>

      <div className="mb-3 flex flex-wrap gap-2">
        {item.documents.map((d, i) => (
          <span
            key={i}
            className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[11px] ${docStatusColor[d.status]}`}
          >
            <span className="font-medium">{d.label}</span>
            <span className="font-mono text-[9.5px] uppercase tracking-[0.1em]">
              {labels.docStatus[d.status]}
            </span>
          </span>
        ))}
      </div>

      {item.aiHints.length > 0 && (
        <div className="mb-3 rounded-md bg-hesya-peach-50/60 px-3 py-2">
          <p className="mb-1 font-mono text-[9.5px] uppercase tracking-[0.14em] text-hesya-amber-600">
            {labels.aiHintsTitle}
          </p>
          <ul className="space-y-0.5">
            {item.aiHints.map((h, i) => (
              <li
                key={i}
                className="text-[11.5px] text-hesya-navy-900/75 [word-break:keep-all]"
              >
                · {h}
              </li>
            ))}
          </ul>
        </div>
      )}

      {item.priorIncidents > 0 && (
        <p className="mb-3 text-[11px] font-semibold text-rose-700">
          ⚠ {labels.priorIncidentsTitle}: {item.priorIncidents}
        </p>
      )}

      <div className="flex flex-wrap gap-2">
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md bg-emerald-600 px-3 py-1.5 text-[11.5px] font-semibold text-white opacity-90"
        >
          ✓ {labels.actionApprove}
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md border border-amber-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-amber-700"
        >
          ↩ {labels.actionRequestMore}
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md border border-rose-300 bg-white px-3 py-1.5 text-[11.5px] font-semibold text-rose-700"
        >
          ✕ {labels.actionReject}
        </button>
      </div>
    </article>
  );
}
