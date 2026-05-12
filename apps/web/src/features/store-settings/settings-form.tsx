"use client";

/**
 * Plan v3 M3.3 / Phase D3-C3 — Store Settings form (디자인 정합 재구성).
 *
 * 2-pane layout: 좌측 SectionNav (220px sticky) + 우측 9 section scroll
 * container. Active 3 sections (Basic / Address / Hours) + Placeholder 5
 * (Multilingual / Channels / Booking policy / Payments / Notifications) +
 * Risk §09 (info-only).
 *
 * Save button은 footer sticky. Atomic save (basic/address/hours).
 */

import { useState, useTransition } from "react";

import { updateStoreSettingsAction } from "@/lib/store-settings/actions";

import { SectionNav, type SectionItem } from "./section-nav";

const DAYS = ["mon", "tue", "wed", "thu", "fri", "sat", "sun"] as const;
type Day = (typeof DAYS)[number];

export interface BusinessHoursValue {
  readonly mon?: { open: string; close: string } | null;
  readonly tue?: { open: string; close: string } | null;
  readonly wed?: { open: string; close: string } | null;
  readonly thu?: { open: string; close: string } | null;
  readonly fri?: { open: string; close: string } | null;
  readonly sat?: { open: string; close: string } | null;
  readonly sun?: { open: string; close: string } | null;
}

export interface SettingsFormValue {
  readonly name: string;
  readonly phone: string | null;
  readonly addressLine1: string;
  readonly addressCity: string;
  readonly addressCountry: string;
  readonly businessHours: BusinessHoursValue | null;
}

export interface SettingsFormLabels {
  readonly navBasic: string;
  readonly navAddress: string;
  readonly navHours: string;
  readonly navMultilingual: string;
  readonly navChannels: string;
  readonly navBookingPolicy: string;
  readonly navPayments: string;
  readonly navNotifications: string;
  readonly navRisk: string;
  readonly sectionBasic: string;
  readonly sectionAddress: string;
  readonly sectionHours: string;
  readonly sectionMultilingual: string;
  readonly sectionChannels: string;
  readonly sectionBookingPolicy: string;
  readonly sectionPayments: string;
  readonly sectionNotifications: string;
  readonly sectionRisk: string;
  readonly nameLabel: string;
  readonly phoneLabel: string;
  readonly addressLine1Label: string;
  readonly addressCityLabel: string;
  readonly addressCountryLabel: string;
  readonly hoursOpen: string;
  readonly hoursClose: string;
  readonly hoursClosed: string;
  readonly hoursFallback: string;
  readonly saveButton: string;
  readonly savedMessage: string;
  readonly placeholderText: string;
  readonly riskBody: string;
  readonly riskBadge: string;
  readonly days: Readonly<Record<Day, string>>;
  readonly navEyebrow: string;
  readonly navTitle: string;
  readonly navFooterStore: string;
  readonly navFooterSavedLabel: string;
  readonly navFooterEditor: string;
  readonly sectionEn: {
    readonly basic: string;
    readonly address: string;
    readonly hours: string;
    readonly multilingual: string;
    readonly channels: string;
    readonly bookingPolicy: string;
    readonly payments: string;
    readonly notifications: string;
    readonly risk: string;
  };
}

interface ShellMeta {
  readonly storeName: string;
  readonly userName: string;
}

interface Props {
  readonly initial: SettingsFormValue;
  readonly labels: SettingsFormLabels;
  readonly shellMeta: ShellMeta;
}

type DayState = {
  closed: boolean;
  open: string;
  close: string;
};

function initDayState(hours: BusinessHoursValue | null, day: Day): DayState {
  const v = hours?.[day];
  if (v === null) return { closed: true, open: "10:00", close: "20:00" };
  if (v === undefined) return { closed: false, open: "10:00", close: "20:00" };
  return { closed: false, open: v.open, close: v.close };
}

const SECTION_IDS = [
  "basic",
  "address",
  "hours",
  "multilingual",
  "channels",
  "booking-policy",
  "payments",
  "notifications",
  "risk",
] as const;

const SECTION_NUMS: Readonly<Record<(typeof SECTION_IDS)[number], string>> = {
  basic: "01",
  address: "02",
  hours: "03",
  multilingual: "04",
  channels: "05",
  "booking-policy": "06",
  payments: "07",
  notifications: "08",
  risk: "09",
};

export function SettingsForm({ initial, labels, shellMeta }: Props) {
  const [name, setName] = useState(initial.name);
  const [phone, setPhone] = useState(initial.phone ?? "");
  const [line1, setLine1] = useState(initial.addressLine1);
  const [city, setCity] = useState(initial.addressCity);
  const [country, setCountry] = useState(initial.addressCountry);
  const [days, setDays] = useState<Record<Day, DayState>>(() =>
    DAYS.reduce(
      (acc, d) => ({ ...acc, [d]: initDayState(initial.businessHours, d) }),
      {} as Record<Day, DayState>,
    ),
  );

  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [savedAt, setSavedAt] = useState<number | null>(null);

  const navItems: ReadonlyArray<SectionItem> = [
    {
      id: "basic",
      num: "01",
      label: labels.navBasic,
      status: "active",
    },
    {
      id: "address",
      num: "02",
      label: labels.navAddress,
      status: "active",
    },
    {
      id: "hours",
      num: "03",
      label: labels.navHours,
      status: "active",
    },
    {
      id: "multilingual",
      num: "04",
      label: labels.navMultilingual,
      status: "placeholder",
    },
    {
      id: "channels",
      num: "05",
      label: labels.navChannels,
      status: "placeholder",
    },
    {
      id: "booking-policy",
      num: "06",
      label: labels.navBookingPolicy,
      status: "placeholder",
    },
    {
      id: "payments",
      num: "07",
      label: labels.navPayments,
      status: "placeholder",
    },
    {
      id: "notifications",
      num: "08",
      label: labels.navNotifications,
      status: "placeholder",
    },
    {
      id: "risk",
      num: "09",
      label: labels.navRisk,
      status: "info",
      danger: true,
    },
  ];

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    const businessHours: BusinessHoursValue = {};
    for (const d of DAYS) {
      const s = days[d];
      if (s.closed) {
        (businessHours as Record<Day, { open: string; close: string } | null>)[
          d
        ] = null;
      } else {
        (businessHours as Record<Day, { open: string; close: string } | null>)[
          d
        ] = { open: s.open, close: s.close };
      }
    }

    startTransition(async () => {
      const result = await updateStoreSettingsAction({
        name: name.trim(),
        phone: phone.trim() || null,
        address: {
          line1: line1.trim() || undefined,
          city: city.trim() || undefined,
          country: country.trim() || undefined,
        },
        businessHours,
      });
      if (!result.ok) {
        setError(result.message);
        return;
      }
      setSavedAt(Date.now());
    });
  };

  const updateDay = (day: Day, patch: Partial<DayState>) => {
    setDays((prev) => ({ ...prev, [day]: { ...prev[day], ...patch } }));
  };

  return (
    <form onSubmit={handleSubmit} className="flex flex-col md:flex-row">
      <SectionNav
        items={navItems}
        sectionIds={SECTION_IDS}
        head={{ eyebrow: labels.navEyebrow, title: labels.navTitle }}
        foot={{
          storeName: shellMeta.storeName,
          savedLabel: labels.navFooterSavedLabel,
          editorLabel: labels.navFooterEditor,
          editorName: shellMeta.userName,
        }}
      />

      <div className="min-w-0 flex-1 space-y-0 pb-32">
        <SectionShell
          id="basic"
          num={SECTION_NUMS["basic"]}
          title={labels.sectionBasic}
          en={labels.sectionEn.basic}
        >
          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel label={labels.nameLabel}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className={INPUT_CLASS}
              />
            </FieldLabel>
            <FieldLabel label={labels.phoneLabel}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                className={INPUT_CLASS}
              />
            </FieldLabel>
          </div>
        </SectionShell>

        <SectionShell
          id="address"
          num={SECTION_NUMS["address"]}
          title={labels.sectionAddress}
          en={labels.sectionEn.address}
        >
          <div className="grid gap-4">
            <FieldLabel label={labels.addressLine1Label}>
              <input
                type="text"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                maxLength={200}
                className={INPUT_CLASS}
              />
            </FieldLabel>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label={labels.addressCityLabel}>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={80}
                  className={INPUT_CLASS}
                />
              </FieldLabel>
              <FieldLabel label={labels.addressCountryLabel}>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  maxLength={80}
                  className={INPUT_CLASS}
                />
              </FieldLabel>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="hours"
          num={SECTION_NUMS["hours"]}
          title={labels.sectionHours}
          en={labels.sectionEn.hours}
          hint={labels.hoursFallback}
        >
          <div className="space-y-2">
            {DAYS.map((d) => {
              const s = days[d];
              return (
                <div
                  key={d}
                  className="flex flex-wrap items-center gap-3 rounded-md border border-hesya-peach-100 bg-white px-3 py-2"
                >
                  <span className="w-16 text-[13px] font-medium text-hesya-navy-900">
                    {labels.days[d]}
                  </span>
                  <label className="flex items-center gap-1.5 text-[12px] text-hesya-navy-900/75">
                    <input
                      type="checkbox"
                      checked={s.closed}
                      onChange={(e) =>
                        updateDay(d, { closed: e.target.checked })
                      }
                      className="accent-hesya-amber-500"
                    />
                    {labels.hoursClosed}
                  </label>
                  <div className="flex items-center gap-2">
                    <span className="text-[11px] text-hesya-navy-900/55">
                      {labels.hoursOpen}
                    </span>
                    <input
                      type="time"
                      value={s.open}
                      disabled={s.closed}
                      onChange={(e) => updateDay(d, { open: e.target.value })}
                      className="rounded-md border border-hesya-peach-200 bg-white px-2 py-1 text-[12px] transition focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20 disabled:bg-hesya-peach-50"
                    />
                    <span className="text-[11px] text-hesya-navy-900/55">
                      {labels.hoursClose}
                    </span>
                    <input
                      type="time"
                      value={s.close}
                      disabled={s.closed}
                      onChange={(e) => updateDay(d, { close: e.target.value })}
                      className="rounded-md border border-hesya-peach-200 bg-white px-2 py-1 text-[12px] transition focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20 disabled:bg-hesya-peach-50"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionShell>

        <SectionShell
          id="multilingual"
          num={SECTION_NUMS["multilingual"]}
          title={labels.sectionMultilingual}
          en={labels.sectionEn.multilingual}
          placeholder={labels.placeholderText}
        />
        <SectionShell
          id="channels"
          num={SECTION_NUMS["channels"]}
          title={labels.sectionChannels}
          en={labels.sectionEn.channels}
          placeholder={labels.placeholderText}
        />
        <SectionShell
          id="booking-policy"
          num={SECTION_NUMS["booking-policy"]}
          title={labels.sectionBookingPolicy}
          en={labels.sectionEn.bookingPolicy}
          placeholder={labels.placeholderText}
        />
        <SectionShell
          id="payments"
          num={SECTION_NUMS["payments"]}
          title={labels.sectionPayments}
          en={labels.sectionEn.payments}
          placeholder={labels.placeholderText}
        />
        <SectionShell
          id="notifications"
          num={SECTION_NUMS["notifications"]}
          title={labels.sectionNotifications}
          en={labels.sectionEn.notifications}
          placeholder={labels.placeholderText}
        />

        <section
          id="section-risk"
          aria-labelledby="risk-heading"
          className="border-b border-hesya-peach-100 px-8 py-8 scroll-mt-20"
        >
          <header className="mb-5 flex flex-wrap items-baseline gap-3.5">
            <span
              aria-hidden="true"
              className="font-heading text-[28px] font-medium italic leading-none text-hesya-amber-600"
            >
              {SECTION_NUMS["risk"]}
            </span>
            <h2
              id="risk-heading"
              className="text-[20px] font-bold tracking-[-0.01em] text-hesya-navy-900"
            >
              {labels.sectionRisk}
            </h2>
            <span className="font-heading text-[14px] font-normal italic text-gray-500">
              — {labels.sectionEn.risk}
            </span>
            <span
              aria-hidden="true"
              className="ml-auto rounded-full bg-[#c9483a]/12 px-2 py-0.5 font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-[#c9483a]"
            >
              {labels.riskBadge}
            </span>
          </header>
          <div className="rounded-md border border-[#c9483a]/30 bg-[#c9483a]/5 px-5 py-4">
            <p className="text-[12.5px] leading-relaxed text-hesya-navy-900/85">
              {labels.riskBody}
            </p>
          </div>
        </section>

        {error || (savedAt && !error) ? (
          <div className="px-8 pt-4">
            {error ? (
              <p
                role="alert"
                className="rounded-md border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
              >
                {error}
              </p>
            ) : null}
            {savedAt && !error ? (
              <p className="rounded-md border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
                {labels.savedMessage}
              </p>
            ) : null}
          </div>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-hesya-peach-200 bg-white/95 backdrop-blur md:left-[240px]">
        <div className="mx-auto flex max-w-5xl items-center justify-end px-6 py-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-md bg-hesya-navy-900 px-6 py-2.5 text-[13px] font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90 disabled:opacity-60"
          >
            {pending ? "…" : labels.saveButton}
          </button>
        </div>
      </div>
    </form>
  );
}

const INPUT_CLASS =
  "w-full rounded-md border border-hesya-peach-200 bg-white px-3 py-2.5 text-[13.5px] text-hesya-navy-900 transition focus:border-hesya-amber-500 focus:outline-none focus:ring-2 focus:ring-hesya-amber-500/20";

function SectionShell({
  id,
  num,
  title,
  en,
  hint,
  placeholder,
  children,
}: {
  id: string;
  num: string;
  title: string;
  en: string;
  hint?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      id={`section-${id}`}
      aria-labelledby={`${id}-heading`}
      className="border-b border-hesya-peach-100 px-8 py-8 scroll-mt-20 last:border-b-0"
    >
      <header className="mb-5 flex flex-wrap items-baseline gap-3.5">
        <span
          aria-hidden="true"
          className="font-heading text-[28px] font-medium italic leading-none text-hesya-amber-600"
        >
          {num}
        </span>
        <h2
          id={`${id}-heading`}
          className="text-[20px] font-bold tracking-[-0.01em] text-hesya-navy-900"
        >
          {title}
        </h2>
        <span className="font-heading text-[14px] font-normal italic text-gray-500">
          — {en}
        </span>
        {hint ? (
          <p className="ml-auto text-[12px] text-gray-500">{hint}</p>
        ) : null}
      </header>
      {children ? (
        <div className="rounded-md border border-hesya-peach-100 bg-white p-6">
          {children}
        </div>
      ) : null}
      {placeholder ? (
        <div className="rounded-md border border-dashed border-hesya-peach-200 bg-white/60 px-4 py-8 text-center text-[12px] text-hesya-navy-900/55">
          {placeholder}
        </div>
      ) : null}
    </section>
  );
}

function FieldLabel({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block space-y-1.5">
      <span className="block font-mono text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/60">
        {label}
      </span>
      {children}
    </label>
  );
}
