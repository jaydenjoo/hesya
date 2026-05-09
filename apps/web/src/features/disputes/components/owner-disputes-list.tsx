import Link from "next/link";
import type { Dispute } from "@hesya/database";

/**
 * Epic 12.4 — 사장 측 본인 매장 분쟁 목록 (server-rendered).
 *
 * 라벨 Record는 `Record<string, string>` — schema의 status/category가 plain
 * `text` 컬럼이라 `Dispute["status"]`가 `string`으로 추론되기 때문.
 */
const STATUS_LABELS: Record<string, string> = {
  open: "접수",
  in_review: "검토 중",
  resolved: "해결됨",
  rejected: "거절됨",
  sla_exceeded: "SLA 초과",
};

const CATEGORY_LABELS: Record<string, string> = {
  no_show: "노쇼",
  refund: "환불",
  complaint: "컴플레인",
};

type Props = { rows: Dispute[] };

export function OwnerDisputesList({ rows }: Props) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-medium">분쟁 내역</h2>
        <Link
          href="/store/disputes/new"
          className="rounded bg-black px-4 py-2 text-sm text-white"
        >
          신규 분쟁 신고
        </Link>
      </div>

      {rows.length === 0 ? (
        <p className="text-gray-500">접수된 분쟁이 없습니다.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left">
              <th className="py-2">유형</th>
              <th>상태</th>
              <th>접수일</th>
              <th>SLA 마감</th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => (
              <tr key={d.id} className="border-b">
                <td className="py-2">
                  {CATEGORY_LABELS[d.category] ?? d.category}
                </td>
                <td>{STATUS_LABELS[d.status] ?? d.status}</td>
                <td>{d.createdAt.toISOString().slice(0, 10)}</td>
                <td>{d.slaDueAt.toISOString().slice(0, 10)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
}
