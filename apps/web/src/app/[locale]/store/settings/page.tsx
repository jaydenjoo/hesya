import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import {
  SettingsForm,
  type BusinessHoursValue,
  type SettingsFormValue,
} from "@/features/store-settings/settings-form";
import { env } from "@/shared/config/env";
import { getStoreSettings } from "@/shared/lib/dal/stores";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

type AddressShape = {
  line1?: string;
  city?: string;
  country?: string;
};

/**
 * Plan v3 M3.3 — 매장 owner settings 페이지. 매장 이름/전화/주소/영업시간을
 * 직접 편집. 영업시간 NULL = 기본 10:00~20:00 fallback (M3.3b time-slots에서 사용).
 */
export default async function StoreSettingsPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;

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
  const settings = await getStoreSettings(db, session.storeId);

  if (!settings) {
    redirect(`/${locale}/sign-in`);
  }

  const address = (settings.address ?? null) as AddressShape | null;

  const initial: SettingsFormValue = {
    name: settings.name,
    phone: settings.phone,
    addressLine1: address?.line1 ?? "",
    addressCity: address?.city ?? "",
    addressCountry: address?.country ?? "",
    businessHours: (settings.businessHours ??
      null) as BusinessHoursValue | null,
  };

  const t = await getTranslations({ locale, namespace: "StoreSettings" });

  return (
    <main className="container max-w-3xl py-12">
      <header className="mb-8 space-y-1">
        <h1 className="text-2xl font-bold tracking-[-0.01em] text-hesya-navy-900">
          {t("title")}
        </h1>
        <p className="text-sm text-hesya-navy-900/65">{t("subtitle")}</p>
      </header>

      <SettingsForm
        initial={initial}
        labels={{
          sectionBasic: t("sectionBasic"),
          sectionHours: t("sectionHours"),
          nameLabel: t("nameLabel"),
          phoneLabel: t("phoneLabel"),
          addressLine1Label: t("addressLine1Label"),
          addressCityLabel: t("addressCityLabel"),
          addressCountryLabel: t("addressCountryLabel"),
          hoursOpen: t("hoursOpen"),
          hoursClose: t("hoursClose"),
          hoursClosed: t("hoursClosed"),
          hoursFallback: t("hoursFallback"),
          saveButton: t("saveButton"),
          savedMessage: t("savedMessage"),
          days: {
            mon: t("dayMon"),
            tue: t("dayTue"),
            wed: t("dayWed"),
            thu: t("dayThu"),
            fri: t("dayFri"),
            sat: t("daySat"),
            sun: t("daySun"),
          },
        }}
      />
    </main>
  );
}
