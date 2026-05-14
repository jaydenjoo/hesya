import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import {
  BookingsList,
  BookingsViewSwitcher,
  buildServiceLabels,
  buildStaffLabels,
} from "@/features/booking";
import {
  mockBookingCounts,
  mockBookings,
  mockHours,
  mockStylists,
  mockWeekDays,
  mockWeekLabel,
} from "@/lib/mock-fixtures/bookings";
import { env } from "@/shared/config/env";
import {
  BOOKING_STATUSES,
  listBookingsByStore,
  type BookingFilter,
  type BookingStatus,
} from "@/shared/lib/dal/bookings";
import { listServicesByStore } from "@/shared/lib/dal/services";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 3 (δ) / Phase D4-D3 — 매장 예약 목록 (owner-side).
 * ?status=<scheduled|completed|cancelled|no_show> 쿼리로 필터.
 */
export default async function StoreBookingsPage({
  params,
  searchParams,
}: {
  params: Promise<{ locale: string }>;
  searchParams: Promise<{ status?: string }>;
}) {
  const { locale } = await params;
  const { status } = await searchParams;

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const filter: BookingFilter =
    status && BOOKING_STATUSES.includes(status as BookingStatus)
      ? (status as BookingStatus)
      : "all";

  const db = createDbClient(env.DATABASE_URL);
  const [rows, servicesList, staffList] = await Promise.all([
    listBookingsByStore(db, session.storeId, { filter }),
    listServicesByStore(db, session.storeId),
    listStaffByStore(db, session.storeId),
  ]);

  const t = await getTranslations({ locale, namespace: "Bookings" });

  const labels = {
    title: t("title"),
    filterAll: t("filterAll"),
    filtersByStatus: {
      scheduled: t("filtersByStatus.scheduled"),
      completed: t("filtersByStatus.completed"),
      cancelled: t("filtersByStatus.cancelled"),
      no_show: t("filtersByStatus.no_show"),
    } as Record<BookingStatus, string>,
    columnService: t("columnService"),
    columnStaff: t("columnStaff"),
    columnScheduled: t("columnScheduled"),
    columnPrice: t("columnPrice"),
    columnStatus: t("columnStatus"),
    empty: t("empty"),
    detail: t("detail"),
    statuses: {
      scheduled: t("statuses.scheduled"),
      completed: t("statuses.completed"),
      cancelled: t("statuses.cancelled"),
      no_show: t("statuses.no_show"),
    },
  };

  const useFixtures = env.MOCK_FIXTURES;
  const list = (
    <BookingsList
      locale={locale}
      rows={rows}
      filter={filter}
      serviceLabels={buildServiceLabels(servicesList, locale)}
      staffLabels={buildStaffLabels(staffList)}
      labels={labels}
    />
  );

  return (
    <div className="bg-hesya-peach-50">
      <PageHeader
        eyebrow="Operator · Bookings"
        title={t("title")}
        subtitle={t("subtitle")}
      />
      <div className="px-8 pb-10">
        {useFixtures ? (
          <BookingsViewSwitcher
            weekLabel={mockWeekLabel}
            days={mockWeekDays}
            hours={mockHours}
            mockBookings={mockBookings}
            stylists={mockStylists}
            counts={mockBookingCounts}
            switcherLabels={{
              tabCalendar: t("view.calendar"),
              tabList: t("view.list"),
              newBooking: t("view.newBooking"),
            }}
            weekLabels={{
              title: t("title"),
              today: t("view.today"),
              prev: t("view.prevWeek"),
              next: t("view.nextWeek"),
              statusConfirmed: t("statuses.scheduled"),
              statusPending: t("calendar.statusPending"),
              statusCompleted: t("statuses.completed"),
              statusNoshow: t("statuses.no_show"),
              filterAll: t("filterAll"),
              filterForeign: t("calendar.filterForeign"),
              filterConfirmed: t("filtersByStatus.scheduled"),
              filterPending: t("calendar.filterPending"),
              filterNoshow: t("filtersByStatus.no_show"),
              minSuffix: t("calendar.minSuffix"),
            }}
            detailLabels={{
              close: t("detail.close"),
              minSuffix: t("calendar.minSuffix"),
              vipBadge: t("detail.vipBadge"),
              confirm: t("detail.confirm"),
              notify: t("detail.notify"),
              reschedule: t("detail.reschedule"),
              cancel: t("detail.cancel"),
              markNoshow: t("detail.markNoshow"),
              tag: t("detail.tag"),
              exportIcs: t("detail.exportIcs"),
              statusLabel: t("detail.statusLabel"),
              statusConfirmed: t("statuses.scheduled"),
              statusPending: t("calendar.statusPending"),
              statusCompleted: t("statuses.completed"),
              statusNoshow: t("statuses.no_show"),
              customerLabel: t("detail.customerLabel"),
              serviceLabel: t("detail.serviceLabel"),
              stylistLabel: t("detail.stylistLabel"),
              paidLabel: t("detail.paidLabel"),
              refundLabel: t("detail.refundLabel"),
              refundHint: t("detail.refundHint"),
            }}
            listChildren={list}
          />
        ) : (
          list
        )}
      </div>
    </div>
  );
}
