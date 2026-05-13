/**
 * Plan v3 M6 — Top N categories (30D GMV 기준).
 *
 * 디자인 ref: admin-dashboard.css `Top 5 categories` (line 640~).
 * Server component (차트 라이브러리 X — flex + bar만).
 */

import type { TopCategoryRow } from "@/shared/lib/dal/admin-dashboard";

interface Props {
  readonly rows: readonly TopCategoryRow[];
}

function formatKrw(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function DashboardTopCategories({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center gap-2 py-6">
        <span className="font-heading text-[24px] font-medium italic leading-none tracking-[-0.025em] text-gray-300">
          —
        </span>
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-400">
          최근 30일 예약 자료 없음
        </span>
      </div>
    );
  }

  return (
    <ol className="flex flex-col gap-3">
      {rows.map((row, i) => (
        <li key={row.name} className="flex items-baseline gap-3">
          <span className="w-4 flex-shrink-0 font-mono text-[10px] font-bold text-gray-400">
            {String(i + 1).padStart(2, "0")}
          </span>
          <div className="min-w-0 flex-1">
            <div className="flex items-baseline justify-between gap-2">
              <span className="truncate text-[12.5px] font-semibold text-hesya-navy-900">
                {row.name}
              </span>
              <span className="font-heading text-[13px] font-medium italic leading-none text-hesya-navy-900">
                <span className="mr-0.5 font-mono text-[9.5px] not-italic text-gray-500">
                  ₩
                </span>
                {formatKrw(row.gmvKrw)}
              </span>
            </div>
            <div className="mt-1.5 h-1 w-full overflow-hidden rounded-full bg-gray-100">
              <span
                aria-hidden="true"
                className="block h-full rounded-full bg-hesya-amber-500"
                style={{ width: `${Math.round(row.shareRatio * 100)}%` }}
              />
            </div>
          </div>
        </li>
      ))}
    </ol>
  );
}
