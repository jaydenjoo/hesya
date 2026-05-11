/**
 * Plan v3 Phase D2-B2-a — Safety Profile Strip.
 *
 * 매장 hero 바로 아래 4-chip 신뢰 신호. 외국인 손님이 매장에 대한 첫 신뢰감을
 * 얻는 핵심 요소 (PRD § 6.5 K-Verified). 데이터 부족한 항목은 의미 있는 fallback.
 */

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
        icon="✓"
        value={verifiedValue}
        label={kVerifiedLabel}
        active
      />
      <SafetyChip icon="⏱" value={hoursValue} label={hoursLabel} />
      <SafetyChip icon="◍" value={staffValue} label={staffLabel} />
      <SafetyChip icon="🌐" value={langValue} label={langLabel} />
    </div>
  );
}
