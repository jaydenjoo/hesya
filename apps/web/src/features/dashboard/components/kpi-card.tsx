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
        "flex flex-col rounded-2xl border px-4 py-4 transition",
        isPending
          ? "border-dashed border-hesya-peach-200 bg-hesya-peach-50/40"
          : "border-hesya-peach-200 bg-white hover:border-hesya-amber-500/40",
      ].join(" ")}
    >
      <p
        className={[
          "text-[10px] font-semibold uppercase tracking-[0.16em]",
          isPending ? "text-hesya-navy-900/40" : "text-hesya-navy-900/60",
        ].join(" ")}
      >
        {label}
      </p>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={[
            "font-mono text-[26px] font-semibold tracking-tight",
            isPending ? "text-hesya-navy-900/30" : "text-hesya-navy-900",
          ].join(" ")}
        >
          {value}
        </span>
        {unit && (
          <span
            className={[
              "text-[12px]",
              isPending ? "text-hesya-navy-900/35" : "text-hesya-navy-900/55",
            ].join(" ")}
          >
            {unit}
          </span>
        )}
      </div>
      {!isPending && subtext && (
        <p className="mt-1 text-[11px] text-hesya-navy-900/60">{subtext}</p>
      )}
      {isPending && (
        <p className="mt-1 text-[10px] uppercase tracking-[0.14em] text-hesya-navy-900/35">
          {comingSoonNote}
        </p>
      )}
      {chart && <div className="mt-3 flex-1">{chart}</div>}
    </div>
  );
}
