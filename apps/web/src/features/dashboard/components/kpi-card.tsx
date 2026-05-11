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
 * Epic 4 (ε) — 단일 KPI 카드.
 *
 * 두 상태:
 * - **active**: 실측 값 표시 (현 phase: 3개 KPI — 미응답 / 분쟁 / KYC)
 * - **coming-soon**: 12개 PRD KPI 중 미구현 9개 — placeholder 텍스트
 *
 * 시각 시그널 (γ.2.3.4 admin 토큰 일관):
 * - peach-100 border + white bg
 * - 값: 2xl bold tracking[-0.01em] navy-900
 * - coming-soon: navy/40 + peach-50/60 bg + dashed border
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
      className={`rounded-md border p-4 transition-colors ${
        isPending
          ? "border-dashed border-hesya-peach-200 bg-hesya-peach-50/60"
          : "border-hesya-peach-100 bg-white"
      }`}
    >
      <div
        className={`text-xs font-medium ${
          isPending ? "text-hesya-navy-900/45" : "text-hesya-navy-900/70"
        }`}
      >
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`text-2xl font-bold tracking-[-0.01em] ${
            isPending ? "text-hesya-navy-900/35" : "text-hesya-navy-900"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span
            className={`text-sm ${
              isPending ? "text-hesya-navy-900/40" : "text-hesya-navy-900/70"
            }`}
          >
            {unit}
          </span>
        )}
      </div>
      {!isPending && subtext && (
        <div className="mt-1 text-xs text-hesya-navy-900/60">{subtext}</div>
      )}
      {isPending && (
        <div className="mt-1 text-[11px] uppercase tracking-[0.08em] text-hesya-navy-900/40">
          {comingSoonNote}
        </div>
      )}
      {chart && <div className="mt-3">{chart}</div>}
    </div>
  );
}
