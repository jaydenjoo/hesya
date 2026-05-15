"use client";

/**
 * Plan v3 Phase D2-B2-a — Safety Profile Strip.
 *
 * 매장 hero 바로 아래 4-chip 신뢰 신호. 외국인 손님이 매장에 대한 첫 신뢰감을
 * 얻는 핵심 요소 (PRD § 6.5 K-Verified).
 *
 * - Batch 3 (2026-05-14): 유니코드 → lucide-react (Check/Clock/Columns3/Globe).
 * - C5 100% (2026-05-15): 칩 클릭 시 SafetySheetModal 표시 (4 sheet kinds:
 *   designers / hours / walk / verified). reference detail-app.jsx:677-783 정합.
 */

import { useState } from "react";
import { Check, Clock, Columns3, Globe } from "lucide-react";
import { SafetyChip } from "@/features/customer-frame/badges/safety-chip";
import {
  SafetySheetModal,
  type SheetKind,
} from "@/features/store-detail-customer/safety-sheet-modal";

interface SheetRow {
  readonly icon: string;
  readonly body: React.ReactNode;
}

interface SheetContent {
  readonly title: string;
  readonly rows: ReadonlyArray<SheetRow>;
  readonly footer?: string;
}

interface Props {
  readonly kVerifiedLabel: string;
  readonly verifiedValue: string;
  readonly hoursLabel: string;
  readonly hoursValue: string;
  readonly staffLabel: string;
  readonly staffValue: string;
  readonly langLabel: string;
  readonly langValue: string;
  /** C5 100% — 4 sheet contents (i18n에서 page가 주입). */
  readonly sheets: Record<SheetKind, SheetContent>;
  readonly closeAria: string;
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
  sheets,
  closeAria,
}: Props) {
  const [activeSheet, setActiveSheet] = useState<SheetKind | null>(null);

  return (
    <>
      <div className="flex gap-2 px-5 pt-4">
        <SafetyChip
          icon={<Check size={16} strokeWidth={2.5} />}
          value={verifiedValue}
          label={kVerifiedLabel}
          active
          onClick={() => setActiveSheet("verified")}
          clickAriaLabel={`${verifiedValue} ${kVerifiedLabel}`}
        />
        <SafetyChip
          icon={<Clock size={16} strokeWidth={1.8} />}
          value={hoursValue}
          label={hoursLabel}
          onClick={() => setActiveSheet("hours")}
          clickAriaLabel={`${hoursValue} ${hoursLabel}`}
        />
        <SafetyChip
          icon={<Columns3 size={16} strokeWidth={1.8} />}
          value={staffValue}
          label={staffLabel}
          onClick={() => setActiveSheet("designers")}
          clickAriaLabel={`${staffValue} ${staffLabel}`}
        />
        <SafetyChip
          icon={<Globe size={16} strokeWidth={1.8} />}
          value={langValue}
          label={langLabel}
          onClick={() => setActiveSheet("walk")}
          clickAriaLabel={`${langValue} ${langLabel}`}
        />
      </div>

      <SafetySheetModal
        activeKind={activeSheet}
        onClose={() => setActiveSheet(null)}
        sheets={sheets}
        closeAria={closeAria}
      />
    </>
  );
}
