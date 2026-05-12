import type { ReactNode } from "react";

export type KpiState = "active" | "coming-soon";

type Props = {
  label: string;
  value: string;
  unit?: string;
  state: KpiState;
  comingSoonNote: string;
  /** active KPI에서 보조 텍스트 (예: "open thread 5건") */
  subtext?: string;
  /** 옵션: chart slot — recharts 도입 후 wire (현재 phase 무시) */
  chart?: ReactNode;
};

/**
 * Epic 4 (ε) / Phase D4-D1 — 단일 KPI 카드 (디자인 정합 재구성).
 *
 * - **active**: 실측 값 (peach-200 border + white + mono 숫자)
 * - **coming-soon**: dashed border + peach-50 bg + 흐린 텍스트
 *
 * 디자인 정합: label은 uppercase tracking + 10px (settings field label과 동일).
 * value는 font-mono로 숫자 정렬. 2xl rounded card.
 */
export function KpiCard({
  label,
  value,
  unit,
  state,
  comingSoonNote,
  subtext,
  chart,
}: Props) {
  const isPending = state === "coming-soon";
  return (
    <div
      data-state={state}
      data-testid="kpi-card"
      className={[
        "flex flex-col rounded-lg border px-5 py-4 transition",
        isPending
          ? "border-dashed border-hesya-peach-200 bg-hesya-peach-50/60"
          : "border-hesya-peach-100 bg-white shadow-[0_1px_2px_rgba(26,34,56,0.04)] hover:border-hesya-amber-500/40 hover:shadow-[0_4px_12px_rgba(26,34,56,0.06)]",
      ].join(" ")}
    >
      <div className="mb-1 flex items-baseline justify-between gap-2">
        <p
          className={[
            "truncate font-mono text-[11px] font-semibold uppercase tracking-[0.16em]",
            isPending ? "text-hesya-navy-900/40" : "text-gray-700",
          ].join(" ")}
        >
          {label}
        </p>
      </div>
      <div className="mt-1 flex items-baseline gap-2">
        <span
          className={[
            "font-heading text-[36px] font-medium italic leading-none tracking-[-0.03em]",
            isPending ? "text-hesya-navy-900/25" : "text-hesya-navy-900",
          ].join(" ")}
        >
          {value}
        </span>
        {unit && (
          <span
            className={[
              "text-[12px] font-medium",
              isPending ? "text-hesya-navy-900/30" : "text-gray-500",
            ].join(" ")}
          >
            {unit}
          </span>
        )}
      </div>
      {!isPending && subtext && (
        <p className="mt-2 text-[11.5px] text-gray-500">{subtext}</p>
      )}
      {isPending && (
        <p className="mt-2 font-mono text-[9.5px] uppercase tracking-[0.18em] text-hesya-navy-900/35">
          {comingSoonNote}
        </p>
      )}
      {chart && <div className="mt-3 flex-1">{chart}</div>}
    </div>
  );
}
