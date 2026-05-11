import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import {
  BookingsList,
  buildServiceLabels,
  buildStaffLabels,
} from "@/features/booking";
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
 * Epic 3 (δ phase) — 매장 예약 목록 (owner-side).
 *
 * ?status=<scheduled|completed|cancelled|no_show> 쿼리로 필터.
 * 가드 실패 → /sign-in.
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

  return (
    <main className="container py-12">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-hesya-navy-900">
          {t("title")}
        </h1>
        <p className="text-sm text-hesya-navy-900/65">{t("subtitle")}</p>
      </header>
      <BookingsList
        locale={locale}
        rows={rows}
        filter={filter}
        serviceLabels={buildServiceLabels(servicesList, locale)}
        staffLabels={buildStaffLabels(staffList)}
        labels={labels}
      />
    </main>
  );
}
