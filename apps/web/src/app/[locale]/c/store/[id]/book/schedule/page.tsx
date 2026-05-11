import { notFound } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import {
  BookScheduleForm,
  type ScheduleFormService,
  type ScheduleFormStaff,
} from "@/features/booking-customer/book-schedule-form";
import { formatPriceForLocale } from "@/features/booking-customer/currency";
import { BookingProgressStrip } from "@/features/customer-frame/booking-progress-strip";
import { CustomerFrame } from "@/features/customer-frame/customer-frame";
import { Link } from "@/i18n/navigation";
import { env } from "@/shared/config/env";
import { listServicesByStore } from "@/shared/lib/dal/services";
import { listStaffByStore } from "@/shared/lib/dal/staff";
import { getStorePublicById } from "@/shared/lib/dal/stores";

const UUID_RE =
  /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;

type ServiceNameKey =
  | "nameKo"
  | "nameEn"
  | "nameJa"
  | "nameZhCn"
  | "nameZhTw"
  | "nameVi";

function pickServiceName(
  service: { nameKo: string } & Partial<Record<ServiceNameKey, string | null>>,
  locale: string,
): string {
  const map: Record<string, ServiceNameKey> = {
    ko: "nameKo",
    en: "nameEn",
    ja: "nameJa",
    "zh-CN": "nameZhCn",
    "zh-TW": "nameZhTw",
    vi: "nameVi",
  };
  return service[map[locale] ?? "nameKo"] ?? service.nameKo;
}

/**
 * Plan v3 M2.3 — customer-side 예약 일정 선택.
 *
 * Server Component는 매장 정보 + services + staff 조회만 담당. 실제 선택 UI는
 * BookScheduleForm("use client")이 처리. 모두 선택 완료 시 confirm 페이지로
 * URL search params와 함께 navigation (`?service=&staff=&date=&time=`).
 *
 * Conflict 체크는 M2.6 server action에서 atomic. 본 페이지는 UI만.
 */
export default async function StoreBookSchedulePage({
  params,
}: {
  params: Promise<{ locale: string; id: string }>;
}) {
  const { locale, id } = await params;

  if (!UUID_RE.test(id)) {
    notFound();
  }

  const db = createDbClient(env.DATABASE_URL);
  const store = await getStorePublicById(db, id);
  if (!store) {
    notFound();
  }

  const [services, staffList] = await Promise.all([
    listServicesByStore(db, store.id),
    listStaffByStore(db, store.id),
  ]);

  const t = await getTranslations({ locale, namespace: "BookSchedule" });
  const tStoreDetail = await getTranslations({
    locale,
    namespace: "StoreDetail",
  });
  const tProgress = await getTranslations({
    locale,
    namespace: "BookingProgress",
  });

  const serviceProps: ScheduleFormService[] = services.map((s) => ({
    id: s.id,
    label: pickServiceName(s, locale),
    priceKrw: s.priceKrw,
    durationMinutes: s.durationMinutes,
  }));

  const staffProps: ScheduleFormStaff[] = staffList.map((p) => ({
    id: p.id,
    name: p.name,
    languages: p.languages ?? [],
  }));

  return (
    <CustomerFrame>
      <BookingProgressStrip
        current="schedule"
        labels={{
          schedule: tProgress("schedule"),
          confirm: tProgress("confirm"),
          pay: tProgress("pay"),
          done: tProgress("done"),
        }}
      />
      <div className="px-6 pb-8 pt-4">
        <header className="mb-8 space-y-2">
          <p className="text-[11px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
            {t("eyebrow")}
          </p>
          <h1 className="font-heading text-[26px] font-semibold italic leading-tight tracking-[-0.02em] text-hesya-navy-900">
            {store.name} · {t("heading")}
          </h1>
          <Link
            href={`/c/store/${store.id}`}
            className="inline-block text-xs text-hesya-amber-600 hover:underline"
          >
            ← {tStoreDetail("title", { name: store.name })}
          </Link>
        </header>

        <BookScheduleForm
          storeId={store.id}
          locale={locale}
          services={serviceProps}
          staffList={staffProps}
          labels={{
            step1: t("step1"),
            step2: t("step2"),
            step3: t("step3"),
            step4: t("step4"),
            next: t("next"),
            incomplete: t("incomplete"),
            durationMinutes: (m) => t("durationMinutes", { minutes: m }),
            formatPrice: (priceKrw) => formatPriceForLocale(priceKrw, locale),
            today: t("today"),
            tomorrow: t("tomorrow"),
            businessHoursNote: t("businessHoursNote"),
            depositTitle: t("depositTitle"),
            depositBody: t("depositBody"),
            totalLabel: t("totalLabel"),
            slotFew: t("slotFew"),
          }}
        />
      </div>
    </CustomerFrame>
  );
}
