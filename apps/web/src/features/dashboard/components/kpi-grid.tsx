import { KpiCard, type KpiState } from "./kpi-card";

export type KpiEntry = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  state: KpiState;
  subtext?: string;
};

type Props = {
  entries: ReadonlyArray<KpiEntry>;
  comingSoonNote: string;
};

/**
 * Epic 4 (ε) — KPI 카드 12개 grid.
 *
 * Tailwind 반응형: mobile 1col / tablet 2col / desktop 4col.
 * 현 phase: 3개 active (inbox 미응답 / 분쟁 활성 / KYC 상태) + 9개 coming-soon.
 */
export function KpiGrid({ entries, comingSoonNote }: Props) {
  return (
    <section
      data-testid="kpi-grid"
      className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
    >
      {entries.map((e) => (
        <KpiCard
          key={e.key}
          label={e.label}
          value={e.value}
          unit={e.unit}
          state={e.state}
          subtext={e.subtext}
          comingSoonNote={comingSoonNote}
        />
      ))}
    </section>
  );
}
