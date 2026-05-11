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
  };
};

const STATUS_FILTERS_ORDER: ReadonlyArray<BookingFilter> = [
  "all",
  "scheduled",
  "completed",
  "no_show",
  "cancelled",
];

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
  return (
    <div className="space-y-4">
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
          return (
            <Link
              key={f}
              href={href}
              className={`rounded-md border px-3 py-1 text-sm transition-colors ${
                active
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                  : "border-gray-200 bg-white text-hesya-navy-900 hover:border-hesya-navy-900"
              }`}
            >
              {label}
            </Link>
          );
        })}
      </nav>

      {rows.length === 0 ? (
        <p className="text-hesya-navy-900/60">{labels.empty}</p>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-hesya-peach-100 text-left">
                <th className="py-2">{labels.columnScheduled}</th>
                <th>{labels.columnService}</th>
                <th>{labels.columnStaff}</th>
                <th>{labels.columnPrice}</th>
                <th>{labels.columnStatus}</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {rows.map((b) => {
                const statusKey = b.status ?? "scheduled";
                const statusLabel = labels.statuses[statusKey] ?? statusKey;
                return (
                  <tr
                    key={b.id}
                    className="border-b border-hesya-peach-100 transition-colors hover:bg-hesya-peach-50/40"
                  >
                    <td className="py-2">
                      {b.scheduledAt
                        .toISOString()
                        .slice(0, 16)
                        .replace("T", " ")}
                    </td>
                    <td>
                      {b.serviceId
                        ? (serviceLabels.get(b.serviceId) ?? "—")
                        : "—"}
                    </td>
                    <td>
                      {b.staffId ? (staffLabels.get(b.staffId) ?? "—") : "—"}
                    </td>
                    <td>
                      {b.totalPriceKrw
                        ? `₩${b.totalPriceKrw.toLocaleString()}`
                        : "—"}
                    </td>
                    <td>
                      <StatusBadge status={statusKey} label={statusLabel} />
                    </td>
                    <td>
                      <Link
                        href={`/${locale}/store/bookings/${b.id}`}
                        className="text-hesya-amber-500 hover:underline"
                      >
                        {labels.detail}
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

function StatusBadge({ status, label }: { status: string; label: string }) {
  const tone =
    status === "scheduled"
      ? "bg-hesya-peach-50 text-hesya-navy-900 border-hesya-peach-200"
      : status === "completed"
        ? "bg-emerald-50 text-emerald-800 border-emerald-200"
        : status === "no_show"
          ? "bg-hesya-peach-100 text-red-500 border-hesya-peach-200"
          : "bg-gray-50 text-hesya-navy-900/60 border-gray-200";
  return (
    <span
      className={`inline-block rounded-md border px-2 py-0.5 text-xs font-medium ${tone}`}
    >
      {label}
    </span>
  );
}
