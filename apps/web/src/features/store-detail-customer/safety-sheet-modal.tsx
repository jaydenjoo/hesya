"use client";

import { useEffect } from "react";

/**
 * C5 100% — Safety chip 클릭 시 표시되는 bottom sheet modal.
 *
 * Reference: `docs/design/reference/detail-app.jsx:677-783` `Safety sheet`.
 * 4 종류 (designers / hours / walk / verified) — overlay + sheet card +
 * grab handle + 내용 row 리스트.
 *
 * **mock-first**: 모든 텍스트는 i18n props로 주입 (sheets prop). 실 staff
 * count / location / verified booking 데이터 wire 별도 task.
 */

export type SheetKind = "designers" | "hours" | "walk" | "verified";

interface SheetRow {
  readonly icon: string;
  readonly body: React.ReactNode;
}

interface SheetContent {
  readonly title: string;
  readonly rows: ReadonlyArray<SheetRow>;
  /** sheet 하단 미세 텍스트 (예: 247명 sheet의 "Numbers reflect verified Hesya bookings only"). */
  readonly footer?: string;
}

interface Props {
  readonly activeKind: SheetKind | null;
  readonly onClose: () => void;
  readonly sheets: Record<SheetKind, SheetContent>;
  readonly closeAria: string;
}

export function SafetySheetModal({
  activeKind,
  onClose,
  sheets,
  closeAria,
}: Props) {
  // ESC 키 닫기
  useEffect(() => {
    if (!activeKind) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [activeKind, onClose]);

  if (!activeKind) return null;
  const content = sheets[activeKind];

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="safety-sheet-title"
      data-testid={`safety-sheet-${activeKind}`}
      className="fixed inset-0 z-50 flex items-end justify-center bg-hesya-navy-900/40 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className="w-full max-w-md rounded-t-2xl bg-white p-5 shadow-2xl"
      >
        <div
          aria-hidden="true"
          className="mx-auto mb-4 h-1 w-10 rounded-full bg-hesya-peach-200"
        />
        <div className="mb-3 flex items-start justify-between gap-3">
          <h3
            id="safety-sheet-title"
            className="kr text-[16px] font-semibold text-hesya-navy-900"
          >
            {content.title}
          </h3>
          <button
            type="button"
            onClick={onClose}
            aria-label={closeAria}
            className="grid h-7 w-7 place-items-center rounded-full border border-hesya-peach-200 text-gray-500 transition hover:border-hesya-amber-500 hover:text-hesya-amber-600 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-hesya-amber-500"
          >
            <span aria-hidden="true" className="text-[12px] leading-none">
              ✕
            </span>
          </button>
        </div>

        <ul className="flex flex-col gap-2.5">
          {content.rows.map((row, i) => (
            <li
              key={i}
              className="flex items-start gap-3 rounded-md bg-hesya-peach-50/50 px-3 py-2.5 text-[13px]"
            >
              <span aria-hidden="true" className="text-[16px] leading-none">
                {row.icon}
              </span>
              <span className="kr flex-1 leading-relaxed text-hesya-navy-900">
                {row.body}
              </span>
            </li>
          ))}
        </ul>

        {content.footer ? (
          <p className="kr mt-3 text-[10px] text-gray-500">{content.footer}</p>
        ) : null}
      </div>
    </div>
  );
}
