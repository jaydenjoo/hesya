/**
 * Plan v3 Phase D2-B2-a — Safety Profile Strip.
 *
 * 매장 hero 바로 아래 4-chip 신뢰 신호. 외국인 손님이 매장에 대한 첫 신뢰감을
 * 얻는 핵심 요소 (PRD § 6.5 K-Verified). 데이터 부족한 항목은 의미 있는 fallback.
 *
 * Batch 3 (2026-05-14): 유니코드 아이콘 → lucide-react 정합 아이콘 (Check/Clock/Columns3/Globe).
 */

import { Check, Clock, Columns3, Globe } from "lucide-react";
import { SafetyChip } from "@/features/customer-frame/badges/safety-chip";

interface Props {
  readonly kVerifiedLabel: string;
  readonly verifiedValue: string;
  readonly hoursLabel: string;
  readonly hoursValue: string;
  readonly staffLabel: string;
  readonly staffValue: string;
  readonly langLabel: string;
  readonly langValue: string;
}

export function SafetyProfileStrip({
  kVerifiedLabel,
  verifiedValue,
  hoursLabel,
  hoursValue,
  staffLabel,
  staffValue,
  langLabel,
  langValue,
}: Props) {
  return (
    <div className="flex gap-2 px-5 pt-4">
      <SafetyChip
        icon={<Check size={16} strokeWidth={2.5} />}
        value={verifiedValue}
        label={kVerifiedLabel}
        active
      />
      <SafetyChip
        icon={<Clock size={16} strokeWidth={1.8} />}
        value={hoursValue}
        label={hoursLabel}
      />
      <SafetyChip
        icon={<Columns3 size={16} strokeWidth={1.8} />}
        value={staffValue}
        label={staffLabel}
      />
      <SafetyChip
        icon={<Globe size={16} strokeWidth={1.8} />}
        value={langValue}
        label={langLabel}
      />
    </div>
  );
}
