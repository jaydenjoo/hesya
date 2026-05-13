/**
 * Plan v3 Phase D1-A3 — Safety Profile 칩.
 *
 * 외국인 손님 신뢰 신호 (M2.1 detail Safety Profile Strip 등에서 사용).
 * 아이콘 + 값 + 짧은 라벨 (예: 운영 시간 / 역 거리 / 여성 디자이너 비율 등).
 *
 * Batch 3 (2026-05-14): icon은 string 또는 ReactNode (lucide-react 등) 둘 다 허용.
 */

import type { ReactNode } from "react";

interface Props {
  readonly icon: ReactNode;
  readonly value: string;
  readonly label: string;
  readonly active?: boolean;
}

export function SafetyChip({ icon, value, label, active = false }: Props) {
  return (
    <span
      className={[
        "flex flex-1 min-w-[68px] flex-col items-center gap-1 rounded-xl border px-2 py-2.5 text-center transition",
        active
          ? "border-trust-rose bg-trust-rose/10"
          : "border-hesya-peach-200 bg-white",
      ].join(" ")}
    >
      <span
        aria-hidden="true"
        className="flex h-4 w-4 items-center justify-center text-hesya-navy-900/75"
      >
        {icon}
      </span>
      <span className="text-[13px] font-semibold leading-none text-hesya-navy-900">
        {value}
      </span>
      <span className="text-[9.5px] uppercase tracking-[0.06em] text-hesya-navy-900/55">
        {label}
      </span>
    </span>
  );
}
