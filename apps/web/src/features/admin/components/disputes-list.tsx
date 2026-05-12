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

const STATUS_TONE: Record<string, string> = {
  open: "bg-[#fbeae5] text-[#c9483a]",
  sla_exceeded: "bg-[#fbeae5] text-[#c9483a]",
  in_review: "bg-hesya-peach-100 text-hesya-amber-600",
  resolved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-gray-100 text-gray-600",
};

export function DisputesList({ rows, activeFilter, nowMs }: Props) {
  return (
    <div className="space-y-5">
      <nav className="flex flex-wrap gap-2">
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
              className={
                "kr rounded-md border px-3 py-1.5 text-[12px] font-medium transition-colors " +
                (active
                  ? "border-hesya-amber-500 bg-white text-hesya-navy-900"
                  : "border-hesya-peach-200 bg-white/50 text-gray-700 hover:bg-white")
              }
            >
              {f.label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 rounded-md bg-hesya-peach-50 px-8 py-12 text-center">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-100 text-lg"
          >
            ✨
          </div>
          <p className="kr text-[13px] text-gray-500">
            조건에 맞는 분쟁이 없습니다.
          </p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-md border border-hesya-peach-100 bg-white">
          <table className="w-full text-[13px]">
            <thead className="bg-hesya-peach-50">
              <tr className="text-left">
                <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                  유형
                </th>
                <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                  상태
                </th>
                <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                  접수일
                </th>
                <th className="kr px-4 py-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
                  SLA
                </th>
                <th className="px-4 py-3"></th>
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
                    className="border-t border-hesya-peach-100 transition-colors hover:bg-hesya-peach-50"
                  >
                    <td className="kr px-4 py-3 font-medium text-hesya-navy-900">
                      {CATEGORY_LABELS[d.category] ?? d.category}
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className={
                          "kr inline-flex items-center rounded-full px-2.5 py-0.5 text-[11px] font-semibold " +
                          (STATUS_TONE[d.status] ?? "bg-gray-100 text-gray-600")
                        }
                      >
                        {STATUS_LABELS[d.status] ?? d.status}
                      </span>
                    </td>
                    <td className="mono px-4 py-3 text-gray-700">
                      {d.createdAt.toISOString().slice(0, 10)}
                    </td>
                    <td className="px-4 py-3">
                      {slaUrgent ? (
                        <span className="mono inline-flex rounded bg-[#fbeae5] px-2 py-0.5 font-bold text-[#c9483a]">
                          초과 {Math.abs(slaDays)}일
                        </span>
                      ) : slaWarn ? (
                        <span className="mono font-bold text-hesya-amber-600">
                          D-{slaDays}
                        </span>
                      ) : (
                        <span className="mono text-gray-700">D-{slaDays}</span>
                      )}
                    </td>
                    <td className="px-4 py-3 text-right">
                      <Link
                        href={`/admin/disputes/${d.id}`}
                        className="kr text-[12px] font-semibold text-hesya-amber-600 hover:underline"
                      >
                        상세 →
                      </Link>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
