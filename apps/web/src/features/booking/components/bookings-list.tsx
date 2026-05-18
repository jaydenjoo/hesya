import Link from "next/link";
import type { Booking, Service, Staff } from "@hesya/database";
import type { BookingStatus, BookingFilter } from "@/shared/lib/dal/bookings";

type Props = {
  locale: string;
  rows: Booking[];
  filter: BookingFilter;
  /** id → service.name (locale-aware label) */
  serviceLabels: Map<string, string>;
  /** id → staff.name */
  staffLabels: Map<string, string>;
  labels: {
    title: string;
    filterAll: string;
    filtersByStatus: Record<BookingStatus, string>;
    columnService: string;
    columnStaff: string;
    columnScheduled: string;
    columnPrice: string;
    columnStatus: string;
    empty: string;
    detail: string;
    statuses: Record<string, string>;
    countLabel?: string;
    foreignCountLabel?: string;
    columnDate?: string;
    columnTime?: string;
  };
};

const STATUS_FILTERS_ORDER: ReadonlyArray<BookingFilter> = [
  "all",
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
];

const STYLIST_DOT_PALETTE = [
  "bg-hesya-amber-500",
  "bg-hesya-peach-200",
  "bg-gray-300",
  "bg-emerald-400",
  "bg-rose-300",
];

function stylistDotClass(staffId: string | null): string {
  if (!staffId) return "bg-gray-200";
  let hash = 0;
  for (let i = 0; i < staffId.length; i++)
    hash = (hash * 31 + staffId.charCodeAt(i)) | 0;
  return (
    STYLIST_DOT_PALETTE[Math.abs(hash) % STYLIST_DOT_PALETTE.length] ??
    "bg-gray-200"
  );
}

function pickServiceName(service: Service | undefined, locale: string): string {
  if (!service) return "—";
  const map: Record<string, string | null | undefined> = {
    en: service.nameEn,
    ja: service.nameJa,
    "zh-CN": service.nameZhCn,
    "zh-TW": service.nameZhTw,
    vi: service.nameVi,
  };
  return map[locale] ?? service.nameKo;
}

export function buildServiceLabels(
  services: ReadonlyArray<Service>,
  locale: string,
): Map<string, string> {
  return new Map(services.map((s) => [s.id, pickServiceName(s, locale)]));
}

export function buildStaffLabels(
  staffList: ReadonlyArray<Staff>,
): Map<string, string> {
  return new Map(staffList.map((s) => [s.id, s.name]));
}

export function BookingsList({
  locale,
  rows,
  filter,
  serviceLabels,
  staffLabels,
  labels,
}: Props) {
  const total = rows.length;
  const scheduledN = rows.filter((r) => r.status === "scheduled").length;
  const completedN = rows.filter((r) => r.status === "completed").length;
  const noShowN = rows.filter((r) => r.status === "no_show").length;
  const cancelledN = rows.filter((r) => r.status === "cancelled").length;
  const countSummary = labels.countLabel
    ? labels.countLabel.replace("{n}", String(total))
    : `${total}`;
  return (
    <div className="space-y-4">
      {total > 0 && (
        <section
          aria-label="Bookings KPI"
          className="grid grid-cols-2 gap-px overflow-hidden rounded-md border border-hesya-peach-100 bg-hesya-peach-100 sm:grid-cols-4"
        >
          <BookingsKpiCell
            label={labels.filtersByStatus["scheduled"]}
            count={scheduledN}
            tone={scheduledN > 0 ? "ok" : "muted"}
          />
          <BookingsKpiCell
            label={labels.filtersByStatus["completed"]}
            count={completedN}
            tone="muted"
          />
          <BookingsKpiCell
            label={labels.filtersByStatus["no_show"]}
            count={noShowN}
            tone={noShowN > 0 ? "warn" : "muted"}
          />
          <BookingsKpiCell
            label={labels.filtersByStatus["cancelled"]}
            count={cancelledN}
            tone={cancelledN > 0 ? "neutral" : "muted"}
          />
        </section>
      )}
      <nav className="flex flex-wrap gap-2">
        {STATUS_FILTERS_ORDER.map((f) => {
          const active = filter === f;
          const href =
            f === "all"
              ? `/${locale}/store/bookings`
              : `/${locale}/store/bookings?status=${f}`;
          const label =
            f === "all"
              ? labels.filterAll
              : labels.filtersByStatus[f as BookingStatus];
          const count =
            f === "all"
              ? total
              : f === "scheduled"
                ? scheduledN
                : f === "completed"
                  ? completedN
                  : f === "no_show"
                    ? noShowN
                    : cancelledN;
          return (
            <Link
              key={f}
              href={href}
              className={`inline-flex items-center gap-1.5 rounded-full border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-white"
                  : "border-gray-200 bg-white text-hesya-navy-900 hover:border-hesya-navy-900"
              }`}
            >
              {label}
              <span
                className={`font-mono text-[10px] font-bold tabular-nums ${active ? "text-hesya-amber-500" : "text-gray-400"}`}
              >
                {count}
              </span>
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <p className="text-hesya-navy-900/60">{labels.empty}</p>
      ) : (
        <>
          <div className="flex items-baseline justify-between">
            <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
              {countSummary}
            </span>
          </div>
          <div className="overflow-x-auto rounded-md border border-hesya-peach-100 bg-white">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-hesya-peach-100 text-left">
                  <th className="px-4 py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
                    {labels.columnDate ?? labels.columnScheduled}
                  </th>
                  <th className="py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
                    {labels.columnTime ?? ""}
                  </th>
                  <th className="py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
                    {labels.columnService}
                  </th>
                  <th className="py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
                    {labels.columnStaff}
                  </th>
                  <th className="py-2 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
                    {labels.columnPrice}
                  </th>
                  <th className="py-2 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/55">
                    {labels.columnStatus}
                  </th>
                  <th className="w-8 px-4 py-2"></th>
                </tr>
              </thead>
              <tbody>
                {rows.map((b) => {
                  const statusKey = b.status ?? "scheduled";
                  const statusLabel = labels.statuses[statusKey] ?? statusKey;
                  const iso = b.scheduledAt.toISOString();
                  const dateStr = iso.slice(5, 10).replace("-", ".");
                  const timeStr = iso.slice(11, 16);
                  return (
                    <tr
                      key={b.id}
                      className="border-b border-hesya-peach-50 transition-colors last:border-b-0 hover:bg-hesya-peach-50/60"
                    >
                      <td className="px-4 py-2.5 font-mono text-[12px] tabular-nums text-hesya-navy-900/85">
                        {dateStr}
                      </td>
                      <td className="py-2.5 font-mono text-[12px] tabular-nums text-hesya-navy-900">
                        {timeStr}
                      </td>
                      <td className="py-2.5 text-hesya-navy-900">
                        {b.serviceId
                          ? (serviceLabels.get(b.serviceId) ?? "—")
                          : "—"}
                      </td>
                      <td className="py-2.5">
                        <span className="inline-flex items-center gap-1.5">
                          <span
                            aria-hidden="true"
                            className={`inline-block h-2 w-2 rounded-full ${stylistDotClass(b.staffId)}`}
                          />
                          <span className="text-hesya-navy-900/85">
                            {b.staffId
                              ? (staffLabels.get(b.staffId) ?? "—")
                              : "—"}
                          </span>
                        </span>
                      </td>
                      <td className="py-2.5 text-right font-mono text-[12px] tabular-nums text-hesya-navy-900">
                        {b.totalPriceKrw
                          ? `₩${b.totalPriceKrw.toLocaleString()}`
                          : "—"}
                      </td>
                      <td className="py-2.5">
                        <StatusPill status={statusKey} label={statusLabel} />
                      </td>
                      <td className="px-4 py-2.5 text-right">
                        <Link
                          href={`/${locale}/store/bookings/${b.id}`}
                          aria-label={labels.detail}
                          className="inline-flex h-7 w-7 items-center justify-center rounded text-hesya-navy-900/40 transition hover:bg-hesya-peach-100 hover:text-hesya-navy-900"
                        >
                          <span aria-hidden="true">⋯</span>
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

const BOOKINGS_KPI_TONE: Record<
  "ok" | "warn" | "neutral" | "muted",
  { num: string; chip: string }
> = {
  ok: {
    num: "text-emerald-700",
    chip: "bg-emerald-50 text-emerald-700",
  },
  warn: {
    num: "text-[#c9483a]",
    chip: "bg-[#fbeae5] text-[#c9483a]",
  },
  neutral: {
    num: "text-hesya-navy-900/75",
    chip: "bg-hesya-peach-100 text-hesya-navy-900/65",
  },
  muted: {
    num: "text-hesya-navy-900/45",
    chip: "bg-hesya-peach-50 text-hesya-navy-900/55",
  },
};

function BookingsKpiCell({
  label,
  count,
  tone,
}: {
  label: string;
  count: number;
  tone: "ok" | "warn" | "neutral" | "muted";
}) {
  const t = BOOKINGS_KPI_TONE[tone];
  return (
    <div className="flex items-center justify-between gap-3 bg-white px-4 py-3">
      <span className="kr font-mono text-[10.5px] font-semibold uppercase tracking-[0.06em] text-gray-500">
        {label}
      </span>
      <span className="flex items-baseline gap-1.5">
        <span
          className={`font-heading text-[24px] font-medium italic leading-none tabular-nums ${t.num}`}
        >
          {count}
        </span>
        <span
          className={`rounded-full px-1.5 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.06em] ${t.chip}`}
        >
          {count > 0 ? "건" : "—"}
        </span>
      </span>
    </div>
  );
}

function StatusPill({ status, label }: { status: string; label: string }) {
  const tone =
    status === "scheduled"
      ? { bg: "bg-emerald-50", text: "text-emerald-700", dot: "bg-emerald-500" }
      : status === "completed"
        ? { bg: "bg-gray-100", text: "text-gray-700", dot: "bg-gray-400" }
        : status === "no_show"
          ? { bg: "bg-rose-50", text: "text-rose-700", dot: "bg-rose-500" }
          : { bg: "bg-amber-50", text: "text-amber-700", dot: "bg-amber-500" };
  return (
    <span
      className={`inline-flex items-center gap-1.5 rounded-full px-2 py-0.5 text-[11px] font-medium ${tone.bg} ${tone.text}`}
    >
      <span
        aria-hidden="true"
        className={`inline-block h-1.5 w-1.5 rounded-full ${tone.dot}`}
      />
      {label}
    </span>
  );
}
