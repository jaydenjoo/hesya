/**
 * Plan v3 M6 — Top 5 categories (30D GMV 기준).
 *
 * 디자인 ref: admin-dashboard.css `Top 5 categories` (line 640~).
 * Server component (차트 라이브러리 X — flex + bar 만).
 * Mock data — Phase 2 `services.category` aggregate 추가 후 wire.
 */

interface CategoryRow {
  readonly name: string;
  readonly gmvKrw: number;
  readonly shareRatio: number;
}

const MOCK: readonly CategoryRow[] = [
  { name: "헤어 컬러", gmvKrw: 38_400_000, shareRatio: 1 },
  { name: "K-드라마 단발", gmvKrw: 22_650_000, shareRatio: 0.59 },
  { name: "글래스 스킨 케어", gmvKrw: 18_120_000, shareRatio: 0.47 },
  { name: "퍼머넌트", gmvKrw: 14_280_000, shareRatio: 0.37 },
  { name: "두피 트리트먼트", gmvKrw: 9_840_000, shareRatio: 0.26 },
];

function formatKrw(n: number): string {
  return n.toLocaleString("ko-KR");
}

export function DashboardTopCategories() {
  return (
    <ol className="flex flex-col gap-3">
      {MOCK.map((row, i) => (
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
