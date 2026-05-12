import type { ReactNode } from "react";
import { KpiCard, type KpiState } from "./kpi-card";

export type KpiEntry = {
  key: string;
  label: string;
  value: string;
  unit?: string;
  state: KpiState;
  subtext?: string;
  /** active card에 chart slot 부착 (recharts 등). coming-soon은 무시. */
  chart?: ReactNode;
};

type Props = {
  entries: ReadonlyArray<KpiEntry>;
  comingSoonNote: string;
  /** Grid layout class. 기본은 uniform 4-col. M6.2c bento 패턴은 caller가 지정. */
  className?: string;
  /** data-testid (여러 grid row 시 식별). 기본 "kpi-grid". */
  testId?: string;
};

/**
 * Epic 4 (ε) / M6.2c — KPI 카드 grid.
 *
 * 기본 layout: 1col / 2col / 4col uniform.
 * Caller가 className으로 비대칭 layout (reference .sd-row-2 등) 가능.
 */
export function KpiGrid({ entries, comingSoonNote, className, testId }: Props) {
  return (
    <section
      data-testid={testId ?? "kpi-grid"}
      className={
        className ?? "grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4"
      }
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
          chart={e.state === "active" ? e.chart : undefined}
        />
      ))}
    </section>
  );
}
