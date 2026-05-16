import Link from "next/link";
import type { Dispute } from "@hesya/database";

/**
 * Epic 12.4 + M6.7b — 사장 측 분쟁 목록 (reference list 패턴 정합).
 *
 * 라벨 Record는 `Record<string, string>` — schema의 status/category가 plain
 * `text` 컬럼이라 `Dispute["status"]`가 `string`으로 추론되기 때문.
 *
 * STATUS_TONE — 상태별 시각 강도:
 *   - open / sla_exceeded: crit (#c9483a accent)
 *   - in_review: warn (amber)
 *   - resolved: ok (emerald)
 *   - rejected: neutral
 */
const STATUS_LABELS: Record<string, string> = {
  open: "접수",
  in_review: "검토 중",
  resolved: "해결됨",
  rejected: "거절됨",
  sla_exceeded: "SLA 초과",
};

const STATUS_TONE: Record<string, string> = {
  open: "bg-[#fbeae5] text-[#c9483a]",
  sla_exceeded: "bg-[#fbeae5] text-[#c9483a]",
  in_review: "bg-hesya-peach-100 text-hesya-amber-600",
  resolved: "bg-emerald-50 text-emerald-700",
  rejected: "bg-gray-100 text-gray-600",
};

const CATEGORY_LABELS: Record<string, string> = {
  no_show: "노쇼",
  refund: "환불",
  complaint: "컴플레인",
};

type Props = { rows: Dispute[] };

function countByStatus(rows: Dispute[], status: string): number {
  return rows.reduce((s, r) => s + (r.status === status ? 1 : 0), 0);
}

export function OwnerDisputesList({ rows }: Props) {
  const openCount = countByStatus(rows, "open");
  const inReviewCount = countByStatus(rows, "in_review");
  const slaCount = countByStatus(rows, "sla_exceeded");
  const resolvedCount = countByStatus(rows, "resolved");
  return (
    <div className="space-y-5">
      <div className="flex items-end justify-between">
        <div>
          <p className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            §01 · Disputes
          </p>
          <h2 className="mt-1.5 font-display text-[20px] italic text-hesya-navy-900">
            분쟁 내역
          </h2>
        </div>
        <Link
          href="/store/disputes/new"
          className="kr inline-flex items-center gap-1.5 rounded-md bg-hesya-amber-500 px-4 py-2 text-[13px] font-semibold text-white transition-colors hover:bg-hesya-amber-600"
        >
          신규 분쟁 신고
          <span aria-hidden="true">→</span>
        </Link>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        <DisputeKpiTile label="전체" value={rows.length} tone="default" />
        <DisputeKpiTile
          label="접수"
          value={openCount}
          tone={openCount > 0 ? "danger" : "default"}
        />
        <DisputeKpiTile
          label="검토 중"
          value={inReviewCount}
          tone={inReviewCount > 0 ? "warn" : "default"}
        />
        <DisputeKpiTile
          label="SLA 초과"
          value={slaCount}
          tone={slaCount > 0 ? "danger" : "ok"}
          alertNote={
            slaCount > 0 ? "24h 내 응답 필요" : `해결 ${resolvedCount}건`
          }
        />
      </div>

      {rows.length === 0 ? (
        <div className="flex flex-col items-center gap-2.5 rounded-md bg-hesya-peach-50 px-8 py-12 text-center">
          <div
            aria-hidden="true"
            className="flex h-10 w-10 items-center justify-center rounded-full bg-hesya-peach-100 text-lg"
          >
            ✨
          </div>
          <p className="kr text-[13px] text-gray-500">
            접수된 분쟁이 없습니다.
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
                  SLA 마감
                </th>
              </tr>
            </thead>
            <tbody>
              {rows.map((d) => (
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
                  <td className="mono px-4 py-3 text-gray-700">
                    {d.slaDueAt.toISOString().slice(0, 10)}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

function DisputeKpiTile({
  label,
  value,
  tone,
  alertNote,
}: {
  label: string;
  value: number;
  tone: "default" | "danger" | "warn" | "ok";
  alertNote?: string;
}) {
  const styles = {
    default: {
      border: "border-gray-200",
      bg: "bg-white",
      text: "text-hesya-navy-900",
      note: "text-hesya-navy-900/55",
    },
    danger: {
      border: "border-[#e5c0ba]",
      bg: "bg-[#faefec]",
      text: "text-[#c9483a]",
      note: "text-[#c9483a]",
    },
    warn: {
      border: "border-hesya-peach-200",
      bg: "bg-hesya-peach-50",
      text: "text-hesya-amber-600",
      note: "text-hesya-amber-600",
    },
    ok: {
      border: "border-emerald-200",
      bg: "bg-emerald-50/60",
      text: "text-emerald-700",
      note: "text-emerald-700/85",
    },
  }[tone];
  return (
    <div className={`rounded-md border p-4 ${styles.border} ${styles.bg}`}>
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`font-heading text-[28px] font-medium italic leading-none tracking-[-0.02em] ${styles.text}`}
        >
          {value}
        </span>
        <span className="text-[11px] font-medium text-gray-500">건</span>
      </div>
      {alertNote && (
        <div
          className={`mt-1.5 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] ${styles.note}`}
        >
          {tone === "danger" ? "⚠ " : ""}
          {alertNote}
        </div>
      )}
    </div>
  );
}
