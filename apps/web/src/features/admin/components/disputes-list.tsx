import Link from "next/link";
import type { Dispute, DisputeStatus } from "@hesya/database";

/**
 * Epic 12.4 — admin 분쟁 큐 목록.
 *
 * server-rendered. status 필터는 페이지 레벨에서 query param으로 처리.
 * SLA 마감 임박/초과 시각적 강조 (D-day 기준).
 *
 * 라벨 Record는 `Record<string, string>` — schema의 status/category가 plain
 * `text` 컬럼이라 `Dispute["status"]`가 `string`으로 추론되기 때문.
 * 키 타이포 위험은 const 정의 + 표시용 fallback(`?? raw`)으로 방어.
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

const STATUS_FILTERS: Array<{ key: DisputeStatus | "all"; label: string }> = [
  { key: "all", label: "전체" },
  { key: "open", label: "접수" },
  { key: "in_review", label: "검토 중" },
  { key: "resolved", label: "해결" },
  { key: "rejected", label: "거절" },
];

type Props = {
  rows: Dispute[];
  activeFilter: DisputeStatus | "all";
  /** 페이지(server component)에서 주입 — 컴포넌트 내부에서 `Date.now()` 호출 금지 (react-hooks/purity). */
  nowMs: number;
};

export function DisputesList({ rows, activeFilter, nowMs }: Props) {
  return (
    <div className="space-y-4">
      <nav className="flex gap-2">
        {STATUS_FILTERS.map((f) => {
          const href =
            f.key === "all"
              ? "/admin/disputes"
              : `/admin/disputes?status=${f.key}`;
          const active = activeFilter === f.key;
          return (
            <Link
              key={f.key}
              href={href}
              className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                  : "border-gray-200 bg-white text-hesya-navy-900 hover:border-hesya-navy-900"
              }`}
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <p className="text-hesya-navy-900/60">조건에 맞는 분쟁이 없습니다.</p>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-hesya-peach-100 text-left">
              <th className="py-2">유형</th>
              <th>상태</th>
              <th>접수일</th>
              <th>SLA</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((d) => {
              const slaMs = d.slaDueAt.getTime() - nowMs;
              const slaDays = Math.ceil(slaMs / (1000 * 60 * 60 * 24));
              const slaUrgent = slaMs < 0;
              const slaWarn = !slaUrgent && slaDays <= 1;
              return (
                <tr
                  key={d.id}
                  className="border-b border-hesya-peach-100 transition-colors hover:bg-hesya-peach-50/40"
                >
                  <td className="py-2">
                    {CATEGORY_LABELS[d.category] ?? d.category}
                  </td>
                  <td>{STATUS_LABELS[d.status] ?? d.status}</td>
                  <td>{d.createdAt.toISOString().slice(0, 10)}</td>
                  <td>
                    {slaUrgent ? (
                      <span className="inline-flex rounded-md bg-hesya-peach-100 px-2 py-0.5 font-medium text-red-500">
                        초과 {Math.abs(slaDays)}일
                      </span>
                    ) : slaWarn ? (
                      <span className="font-medium text-hesya-amber-500">
                        D-{slaDays}
                      </span>
                    ) : (
                      <span>D-{slaDays}</span>
                    )}
                  </td>
                  <td>
                    <Link
                      href={`/admin/disputes/${d.id}`}
                      className="text-hesya-amber-500 hover:underline"
                    >
                      상세
                    </Link>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}
