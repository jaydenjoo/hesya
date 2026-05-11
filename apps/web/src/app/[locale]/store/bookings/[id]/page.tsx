import { notFound, redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { BookingDetail } from "@/features/booking";
import { buildServiceLabels, buildStaffLabels } from "@/features/booking";
import { env } from "@/shared/config/env";
import { getBooking } from "@/shared/lib/dal/bookings";
import { listServicesByIds } from "@/shared/lib/dal/services";
import { listStaffByIds } from "@/shared/lib/dal/staff";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

/**
 * Epic 3 (δ phase) — 매장 예약 상세 (owner-side).
 *
 * 가드 + storeId match 확인. 다른 매장 booking은 404로 위장 (정보 노출 차단).
 */
export default async function StoreBookingDetailPage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      redirect(`/${locale}/sign-in`);
    }
    throw err;
  }

  const db = createDbClient(env.DATABASE_URL);
  const booking = await getBooking(db, id);
  if (!booking || booking.storeId !== session.storeId) {
    notFound();
  }

  const [servicesList, staffList] = await Promise.all([
    booking.serviceId
      ? listServicesByIds(db, [booking.serviceId])
      : Promise.resolve([]),
    booking.staffId
      ? listStaffByIds(db, [booking.staffId])
      : Promise.resolve([]),
  ]);

  const t = await getTranslations({ locale, namespace: "Bookings" });

  const serviceLabel = booking.serviceId
    ? (buildServiceLabels(servicesList, locale).get(booking.serviceId) ?? "—")
    : "—";
  const staffLabel = booking.staffId
    ? (buildStaffLabels(staffList).get(booking.staffId) ?? "—")
    : "—";

  return (
    <main className="container py-12">
      <header className="mb-6 space-y-1">
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-hesya-navy-900">
          {t("title")}
        </h1>
      </header>
      <BookingDetail
        locale={locale}
        booking={booking}
        serviceLabel={serviceLabel}
        staffLabel={staffLabel}
        labels={{
          headers: {
            info: t("detailPage.headers.info"),
            actions: t("detailPage.headers.actions"),
          },
          fields: {
            scheduled: t("detailPage.fields.scheduled"),
            service: t("detailPage.fields.service"),
            staff: t("detailPage.fields.staff"),
            price: t("detailPage.fields.price"),
            deposit: t("detailPage.fields.deposit"),
            paymentMethod: t("detailPage.fields.paymentMethod"),
            status: t("detailPage.fields.status"),
          },
          statuses: {
            scheduled: t("statuses.scheduled"),
            completed: t("statuses.completed"),
            cancelled: t("statuses.cancelled"),
            no_show: t("statuses.no_show"),
          },
          actions: {
            markCompleted: t("detailPage.actions.markCompleted"),
            markNoShow: t("detailPage.actions.markNoShow"),
            markCancelled: t("detailPage.actions.markCancelled"),
            processing: t("detailPage.actions.processing"),
            terminalNote: t("detailPage.actions.terminalNote"),
          },
        }}
      />
    </main>
  );
}
