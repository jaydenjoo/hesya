import Link from "next/link";

type Row = { id: string; name: string; createdAt: Date | null };
type Props = { rows: Row[] };

/**
 * Phase 1-β Task C + M6.9b — manual_review 매장 목록 (reference list 정합).
 */
export function StoreVerificationsList({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <div className="flex flex-col items-center gap-2.5 rounded-md bg-hesya-peach-50 px-8 py-12 text-center">
        <div
          aria-hidden="true"
          className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-100 text-lg"
        >
          ✨
        </div>
        <p className="kr text-[13px] text-gray-500">
          검토 대기 중인 매장이 없습니다.
        </p>
      </div>
    );
  }
  return (
    <div className="overflow-hidden rounded-md border border-hesya-peach-100 bg-white">
      <table className="w-full text-[13px]">
        <thead className="bg-hesya-peach-50">
          <tr className="text-left">
            <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
              매장명
            </th>
            <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
              접수일
            </th>
            <th className="px-4 py-3"></th>
          </tr>
        </thead>
        <tbody>
          {rows.map((r) => (
            <tr
              key={r.id}
              className="border-t border-hesya-peach-100 transition-colors hover:bg-hesya-peach-50"
            >
              <td className="kr px-4 py-3 font-medium text-hesya-navy-900">
                {r.name}
              </td>
              <td className="mono px-4 py-3 text-gray-700">
                {r.createdAt?.toISOString().slice(0, 10) ?? "-"}
              </td>
              <td className="px-4 py-3 text-right">
                <Link
                  href={`/admin/store-verifications/${r.id}`}
                  className="kr text-[12px] font-semibold text-hesya-amber-600 hover:underline"
                >
                  상세 →
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
