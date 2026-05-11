import Link from "next/link";

type Row = { id: string; name: string; createdAt: Date | null };
type Props = { rows: Row[] };

/**
 * Phase 1-β Task C — manual_review 매장 목록.
 *
 * server-rendered. 페이지가 `listStoresPendingReview` 결과를 그대로 전달.
 * 빈 상태(검토 대기 0건) 별도 표시.
 */
export function StoreVerificationsList({ rows }: Props) {
  if (rows.length === 0) {
    return (
      <p className="text-hesya-navy-900/60">검토 대기 중인 매장이 없습니다.</p>
    );
  }
  return (
    <table className="w-full">
      <thead>
        <tr className="border-b border-hesya-peach-100 text-left">
          <th className="py-2">매장명</th>
          <th>접수일</th>
          <th></th>
        </tr>
      </thead>
      <tbody>
        {rows.map((r) => (
          <tr
            key={r.id}
            className="border-b border-hesya-peach-100 transition-colors hover:bg-hesya-peach-50/40"
          >
            <td className="py-2">{r.name}</td>
            <td>{r.createdAt?.toISOString().slice(0, 10) ?? "-"}</td>
            <td>
              <Link
                href={`/admin/store-verifications/${r.id}`}
                className="text-hesya-amber-500 hover:underline"
              >
                상세
              </Link>
            </td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
