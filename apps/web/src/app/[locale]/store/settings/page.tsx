import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import { getOwnerShellData } from "@/features/shell/get-owner-shell-data";
import {
  BookingPolicyMockSection,
  ChannelsMockSection,
  MultilingualMockSection,
  NotificationsMockSection,
  PaymentsMockSection,
} from "@/features/store-settings/mock-sections";
import {
  SettingsForm,
  type BusinessHoursValue,
  type SettingsFormValue,
} from "@/features/store-settings/settings-form";
import {
  mockBookingPolicy,
  mockChannels,
  mockMultilingualNames,
  mockNotificationChannels,
  mockPaymentMethods,
} from "@/lib/mock-fixtures/settings";
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
  const [settings, shell] = await Promise.all([
    getStoreSettings(db, session.storeId),
    getOwnerShellData(),
  ]);

  if (!settings || !shell) {
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
    <div className="bg-hesya-peach-50">
      <PageHeader
        eyebrow="Operator · Store Settings"
        title={t("title")}
        right={
          <span className="inline-flex items-center gap-1.5 text-[12px] text-gray-600">
            <span
              aria-hidden="true"
              className="h-1.5 w-1.5 rounded-full bg-emerald-500"
            />
            {t("savedIndicator")}
          </span>
        }
      />

      <SettingsForm
        initial={initial}
        mockSections={
          env.MOCK_FIXTURES
            ? {
                multilingual: (
                  <MultilingualMockSection
                    names={mockMultilingualNames}
                    labels={{
                      multilingualHint: t("mock.multilingualHint"),
                      multilingualAutoBadge: t("mock.multilingualAutoBadge"),
                      multilingualSourceBadge: t(
                        "mock.multilingualSourceBadge",
                      ),
                      channelStatusConnected: t("mock.channelConnected"),
                      channelStatusPending: t("mock.channelPending"),
                      channelStatusNeedsBusiness: t(
                        "mock.channelNeedsBusiness",
                      ),
                      bookingDepositLabel: t("mock.bookingDepositLabel"),
                      bookingCancelLabel: t("mock.bookingCancelLabel"),
                      bookingNoshowLabel: t("mock.bookingNoshowLabel"),
                      bookingDepositValue: t("mock.bookingDepositValue", {
                        percent: mockBookingPolicy.depositPercent,
                      }),
                      bookingCancelValue: t("mock.bookingCancelValue", {
                        full: mockBookingPolicy.refundFullPercent,
                        fullHours: mockBookingPolicy.cancelHoursThreshold,
                        half: mockBookingPolicy.refundHalfPercent,
                        halfHours: mockBookingPolicy.refundHalfHoursThreshold,
                      }),
                      bookingNoshowValue: t("mock.bookingNoshowValue"),
                      paymentsHint: t("mock.paymentsHint"),
                      paymentsEnabled: t("mock.paymentsEnabled"),
                      paymentsDisabled: t("mock.paymentsDisabled"),
                      notificationsEnabled: t("mock.notificationsEnabled"),
                      notificationsDisabled: t("mock.notificationsDisabled"),
                    }}
                  />
                ),
                channels: (
                  <ChannelsMockSection
                    channels={mockChannels}
                    labels={{
                      multilingualHint: "",
                      multilingualAutoBadge: "",
                      multilingualSourceBadge: "",
                      channelStatusConnected: t("mock.channelConnected"),
                      channelStatusPending: t("mock.channelPending"),
                      channelStatusNeedsBusiness: t(
                        "mock.channelNeedsBusiness",
                      ),
                      bookingDepositLabel: "",
                      bookingCancelLabel: "",
                      bookingNoshowLabel: "",
                      bookingDepositValue: "",
                      bookingCancelValue: "",
                      bookingNoshowValue: "",
                      paymentsHint: "",
                      paymentsEnabled: "",
                      paymentsDisabled: "",
                      notificationsEnabled: "",
                      notificationsDisabled: "",
                    }}
                  />
                ),
                bookingPolicy: (
                  <BookingPolicyMockSection
                    policy={mockBookingPolicy}
                    labels={{
                      multilingualHint: "",
                      multilingualAutoBadge: "",
                      multilingualSourceBadge: "",
                      channelStatusConnected: "",
                      channelStatusPending: "",
                      channelStatusNeedsBusiness: "",
                      bookingDepositLabel: t("mock.bookingDepositLabel"),
                      bookingCancelLabel: t("mock.bookingCancelLabel"),
                      bookingNoshowLabel: t("mock.bookingNoshowLabel"),
                      bookingDepositValue: t("mock.bookingDepositValue", {
                        percent: mockBookingPolicy.depositPercent,
                      }),
                      bookingCancelValue: t("mock.bookingCancelValue", {
                        full: mockBookingPolicy.refundFullPercent,
                        fullHours: mockBookingPolicy.cancelHoursThreshold,
                        half: mockBookingPolicy.refundHalfPercent,
                        halfHours: mockBookingPolicy.refundHalfHoursThreshold,
                      }),
                      bookingNoshowValue: t("mock.bookingNoshowValue"),
                      paymentsHint: "",
                      paymentsEnabled: "",
                      paymentsDisabled: "",
                      notificationsEnabled: "",
                      notificationsDisabled: "",
                    }}
                  />
                ),
                payments: (
                  <PaymentsMockSection
                    methods={mockPaymentMethods}
                    labels={{
                      multilingualHint: "",
                      multilingualAutoBadge: "",
                      multilingualSourceBadge: "",
                      channelStatusConnected: "",
                      channelStatusPending: "",
                      channelStatusNeedsBusiness: "",
                      bookingDepositLabel: "",
                      bookingCancelLabel: "",
                      bookingNoshowLabel: "",
                      bookingDepositValue: "",
                      bookingCancelValue: "",
                      bookingNoshowValue: "",
                      paymentsHint: t("mock.paymentsHint"),
                      paymentsEnabled: t("mock.paymentsEnabled"),
                      paymentsDisabled: t("mock.paymentsDisabled"),
                      notificationsEnabled: "",
                      notificationsDisabled: "",
                    }}
                  />
                ),
                notifications: (
                  <NotificationsMockSection
                    channels={mockNotificationChannels}
                    labels={{
                      multilingualHint: "",
                      multilingualAutoBadge: "",
                      multilingualSourceBadge: "",
                      channelStatusConnected: "",
                      channelStatusPending: "",
                      channelStatusNeedsBusiness: "",
                      bookingDepositLabel: "",
                      bookingCancelLabel: "",
                      bookingNoshowLabel: "",
                      bookingDepositValue: "",
                      bookingCancelValue: "",
                      bookingNoshowValue: "",
                      paymentsHint: "",
                      paymentsEnabled: "",
                      paymentsDisabled: "",
                      notificationsEnabled: t("mock.notificationsEnabled"),
                      notificationsDisabled: t("mock.notificationsDisabled"),
                    }}
                  />
                ),
              }
            : undefined
        }
        labels={{
          navBasic: t("navBasic"),
          navAddress: t("navAddress"),
          navHours: t("navHours"),
          navMultilingual: t("navMultilingual"),
          navChannels: t("navChannels"),
          navBookingPolicy: t("navBookingPolicy"),
          navPayments: t("navPayments"),
          navNotifications: t("navNotifications"),
          navRisk: t("navRisk"),
          sectionBasic: t("sectionBasic"),
          sectionAddress: t("sectionAddress"),
          sectionHours: t("sectionHours"),
          sectionMultilingual: t("sectionMultilingual"),
          sectionChannels: t("sectionChannels"),
          sectionBookingPolicy: t("sectionBookingPolicy"),
          sectionPayments: t("sectionPayments"),
          sectionNotifications: t("sectionNotifications"),
          sectionRisk: t("sectionRisk"),
          nameLabel: t("nameLabel"),
          phoneLabel: t("phoneLabel"),
          addressLine1Label: t("addressLine1Label"),
          addressCityLabel: t("addressCityLabel"),
          addressCountryLabel: t("addressCountryLabel"),
          hoursOpen: t("hoursOpen"),
          hoursClose: t("hoursClose"),
          hoursClosed: t("hoursClosed"),
          hoursFallback: t("hoursFallback"),
          hoursTableHeaderDay: t("hoursTableHeaderDay"),
          hoursTableHeaderOpen: t("hoursTableHeaderOpen"),
          hoursTableHeaderClose: t("hoursTableHeaderClose"),
          hoursTableHeaderNote: t("hoursTableHeaderNote"),
          hoursNoteRegular: t("hoursNoteRegular"),
          hoursNoteEvening: t("hoursNoteEvening"),
          hoursNoteWeekend: t("hoursNoteWeekend"),
          hoursNoteHoliday: t("hoursNoteHoliday"),
          saveButton: t("saveButton"),
          savedMessage: t("savedMessage"),
          placeholderText: t("placeholderText"),
          riskBody: t("riskBody"),
          riskBadge: t("riskBadge"),
          days: {
            mon: t("dayMon"),
            tue: t("dayTue"),
            wed: t("dayWed"),
            thu: t("dayThu"),
            fri: t("dayFri"),
            sat: t("daySat"),
            sun: t("daySun"),
          },
          navEyebrow: t("navEyebrow"),
          navTitle: t("navTitle"),
          navFooterStore: t("navFooterStore"),
          navFooterSavedLabel: t("navFooterSavedLabel"),
          navFooterEditor: t("navFooterEditor"),
          sectionEn: {
            basic: t("sectionEnBasic"),
            address: t("sectionEnAddress"),
            hours: t("sectionEnHours"),
            multilingual: t("sectionEnMultilingual"),
            channels: t("sectionEnChannels"),
            bookingPolicy: t("sectionEnBookingPolicy"),
            payments: t("sectionEnPayments"),
            notifications: t("sectionEnNotifications"),
            risk: t("sectionEnRisk"),
          },
        }}
        shellMeta={{
          storeName: shell.storeName,
          userName: shell.userName,
        }}
      />
    </div>
  );
}
