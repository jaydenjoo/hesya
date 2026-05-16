/**
 * Sprint 2C PR-A4 — Owner Services AI proposal cards.
 *
 * Server component. env.MOCK_FIXTURES=true 일 때 /store/services 페이지
 * 상단에 노출. 데이터 적재 후 AI 분석 기반 실 추천으로 swap.
 */

import type { ServiceAiProposal } from "@/lib/mock-fixtures/services-ai";

export interface ServiceAiLabels {
  readonly bandTitle: string;
  readonly bandSubtitle: string;
  readonly scannedFromMessages: string;
  readonly lastScanLabel: string;
  readonly demandScore: string;
  readonly competitorAvg: string;
  readonly projectedBookings: string;
  readonly evidenceTitle: string;
  readonly suggestedPrice: string;
  readonly minutesSuffix: string;
  readonly perMonth: string;
  readonly badgeTrending: string;
  readonly badgeGap: string;
  readonly badgeVip: string;
  readonly actionAdd: string;
  readonly actionDismiss: string;
}

export function ServiceAiProposalBand({
  proposals,
  stats,
  labels,
}: {
  proposals: ReadonlyArray<ServiceAiProposal>;
  stats: {
    totalEvidence: number;
    scanWindowDays: number;
    lastScanAt: string;
    newProposals: number;
  };
  labels: ServiceAiLabels;
}) {
  return (
    <section
      data-testid="service-ai-proposals"
      className="mb-8 rounded-2xl border border-hesya-amber-500/20 bg-white p-6 shadow-[0_1px_2px_rgba(26,34,56,0.04)]"
    >
      <header className="mb-4 flex flex-wrap items-end justify-between gap-3">
        <div>
          <div className="mb-1.5 flex items-baseline gap-2">
            <span aria-hidden="true" className="text-[18px]">
              ✨
            </span>
            <h2 className="font-display text-[20px] font-semibold italic text-hesya-navy-900">
              {labels.bandTitle}
            </h2>
            <span className="rounded-full bg-hesya-amber-500/15 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.14em] text-hesya-amber-600">
              {stats.newProposals}
            </span>
          </div>
          <p className="text-[12.5px] text-hesya-navy-900/65 [word-break:keep-all]">
            {labels.bandSubtitle}
          </p>
        </div>
        <p className="font-mono text-[10.5px] text-hesya-navy-900/55">
          {labels.scannedFromMessages}{" "}
          <strong className="text-hesya-navy-900">{stats.totalEvidence}</strong>
          {" · "}
          {labels.lastScanLabel}{" "}
          {stats.lastScanAt.slice(5, 16).replace("T", " ")}
        </p>
      </header>

      <div className="grid grid-cols-1 gap-3 md:grid-cols-2 xl:grid-cols-3">
        {proposals.map((p) => (
          <ProposalCard key={p.id} proposal={p} labels={labels} />
        ))}
      </div>
    </section>
  );
}

function ProposalCard({
  proposal,
  labels,
}: {
  proposal: ServiceAiProposal;
  labels: ServiceAiLabels;
}) {
  const badgeText =
    proposal.badge === "trending"
      ? labels.badgeTrending
      : proposal.badge === "gap"
        ? labels.badgeGap
        : labels.badgeVip;
  const badgeColor = {
    trending: "bg-emerald-50 text-emerald-700",
    gap: "bg-rose-50 text-rose-700",
    vip: "bg-violet-50 text-violet-700",
  };
  const priceDiff = proposal.suggestedPriceKrw - proposal.competitorAvgKrw;
  const priceDiffPct = (priceDiff / proposal.competitorAvgKrw) * 100;

  return (
    <article
      data-testid={`service-proposal-${proposal.id}`}
      className="flex flex-col gap-3 rounded-xl border border-hesya-navy-900/8 bg-hesya-peach-50/30 p-4 transition hover:border-hesya-amber-500/40 hover:bg-white"
    >
      <header className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-2.5">
          <span aria-hidden="true" className="text-[20px]">
            {proposal.icon}
          </span>
          <div className="min-w-0">
            <p className="font-display text-[14px] font-semibold italic text-hesya-navy-900 [word-break:keep-all]">
              {proposal.nameKo}
            </p>
            <p className="mt-0.5 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
              {proposal.category}
            </p>
          </div>
        </div>
        <span
          className={`shrink-0 rounded-full px-2 py-0.5 font-mono text-[9.5px] font-semibold uppercase tracking-[0.12em] ${badgeColor[proposal.badge]}`}
        >
          {badgeText}
        </span>
      </header>

      <div className="grid grid-cols-3 gap-2 border-y border-hesya-navy-900/8 py-2.5">
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-hesya-navy-900/50">
            {labels.demandScore}
          </p>
          <p
            className={`mt-0.5 font-mono text-[14px] font-semibold ${
              proposal.demandScore >= 80
                ? "text-emerald-700"
                : proposal.demandScore >= 60
                  ? "text-amber-600"
                  : "text-hesya-navy-900/75"
            }`}
          >
            {proposal.demandScore}
          </p>
          <div
            className="mt-1 h-1 overflow-hidden rounded-full bg-hesya-peach-50"
            aria-hidden="true"
          >
            <div
              className={`h-full ${
                proposal.demandScore >= 80
                  ? "bg-emerald-500"
                  : proposal.demandScore >= 60
                    ? "bg-hesya-amber-500"
                    : "bg-hesya-navy-900/30"
              }`}
              style={{ width: `${Math.min(100, proposal.demandScore)}%` }}
            />
          </div>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-hesya-navy-900/50">
            {labels.suggestedPrice}
          </p>
          <p className="mt-0.5 font-mono text-[12px] font-semibold text-hesya-navy-900">
            ₩{(proposal.suggestedPriceKrw / 1000).toFixed(0)}K
          </p>
          <p
            className={`text-[9px] ${priceDiff > 0 ? "text-rose-600" : "text-emerald-700"}`}
          >
            vs ₩{(proposal.competitorAvgKrw / 1000).toFixed(0)}K (
            {priceDiff > 0 ? "+" : ""}
            {priceDiffPct.toFixed(0)}%)
          </p>
        </div>
        <div>
          <p className="font-mono text-[9px] uppercase tracking-[0.12em] text-hesya-navy-900/50">
            {labels.projectedBookings}
          </p>
          <p className="mt-0.5 font-mono text-[14px] font-semibold text-hesya-navy-900">
            {proposal.projectedMonthlyBookings}
          </p>
          <p className="text-[9px] text-hesya-navy-900/55">
            {labels.perMonth} · {proposal.suggestedDurationMin}
            {labels.minutesSuffix}
          </p>
        </div>
      </div>

      <div>
        <p className="mb-1.5 flex items-center gap-1.5 font-mono text-[9px] uppercase tracking-[0.12em] text-hesya-amber-600">
          <span aria-hidden="true">▸</span>
          {labels.evidenceTitle}
        </p>
        <ul className="space-y-1">
          {proposal.evidence.map((e, i) => (
            <li
              key={i}
              className="flex items-start gap-1.5 text-[11px] text-hesya-navy-900/75 [word-break:keep-all]"
            >
              <span
                aria-hidden="true"
                className="mt-0.5 inline-flex h-3.5 w-3.5 shrink-0 items-center justify-center rounded-full bg-hesya-amber-500/15 font-mono text-[8.5px] font-bold text-hesya-amber-700"
              >
                {i + 1}
              </span>
              <span>{e}</span>
            </li>
          ))}
        </ul>
      </div>

      <div className="flex gap-2">
        <button
          type="button"
          disabled
          className="flex-1 cursor-not-allowed rounded-md bg-hesya-amber-600 px-3 py-1.5 text-[11.5px] font-semibold text-white opacity-90"
        >
          + {labels.actionAdd}
        </button>
        <button
          type="button"
          disabled
          className="cursor-not-allowed rounded-md border border-hesya-navy-900/15 bg-white px-3 py-1.5 text-[11.5px] font-medium text-hesya-navy-900/70"
        >
          {labels.actionDismiss}
        </button>
      </div>
    </article>
  );
}
