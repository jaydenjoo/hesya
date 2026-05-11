/**
 * Plan v3 Phase D2-B2-b — Tab: 시술 메뉴 panel.
 *
 * 가격 + 소요시간 표시. 빈 상태는 "—".
 */

export interface ServiceItem {
  readonly id: string;
  readonly name: string;
  readonly priceFormatted: string;
  readonly durationLabel: string | null;
}

interface Props {
  readonly items: readonly ServiceItem[];
  readonly emptyLabel: string;
}

export function TabServices({ items, emptyLabel }: Props) {
  if (items.length === 0) {
    return (
      <p className="px-5 py-8 text-center text-sm text-hesya-navy-900/55">
        {emptyLabel}
      </p>
    );
  }
  return (
    <ul className="divide-y divide-hesya-peach-100 px-5 py-2">
      {items.map((s) => (
        <li key={s.id} className="flex items-center justify-between gap-3 py-3">
          <div className="min-w-0 flex-1">
            <p className="truncate text-[14px] font-medium text-hesya-navy-900">
              {s.name}
            </p>
            {s.durationLabel && (
              <p className="mt-0.5 text-[11px] text-hesya-navy-900/55">
                {s.durationLabel}
              </p>
            )}
          </div>
          <p className="flex-shrink-0 text-[13px] font-semibold text-hesya-amber-600">
            {s.priceFormatted}
          </p>
        </li>
      ))}
    </ul>
  );
}
