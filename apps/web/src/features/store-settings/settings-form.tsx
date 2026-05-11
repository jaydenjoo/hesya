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
}

interface Props {
  readonly initial: SettingsFormValue;
  readonly labels: SettingsFormLabels;
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

export function SettingsForm({ initial, labels }: Props) {
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
    { id: "basic", label: labels.navBasic, icon: "◉", status: "active" },
    { id: "address", label: labels.navAddress, icon: "▢", status: "active" },
    { id: "hours", label: labels.navHours, icon: "◷", status: "active" },
    {
      id: "multilingual",
      label: labels.navMultilingual,
      icon: "✦",
      status: "placeholder",
    },
    {
      id: "channels",
      label: labels.navChannels,
      icon: "⌬",
      status: "placeholder",
    },
    {
      id: "booking-policy",
      label: labels.navBookingPolicy,
      icon: "◇",
      status: "placeholder",
    },
    {
      id: "payments",
      label: labels.navPayments,
      icon: "₩",
      status: "placeholder",
    },
    {
      id: "notifications",
      label: labels.navNotifications,
      icon: "◔",
      status: "placeholder",
    },
    { id: "risk", label: labels.navRisk, icon: "⚠", status: "info" },
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
    <form onSubmit={handleSubmit} className="flex flex-col gap-6 md:flex-row">
      <SectionNav items={navItems} sectionIds={SECTION_IDS} />

      <div className="min-w-0 flex-1 space-y-8 pb-32">
        <SectionShell id="basic" title={labels.sectionBasic}>
          <div className="grid gap-4 md:grid-cols-2">
            <FieldLabel label={labels.nameLabel}>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                maxLength={80}
                className="w-full rounded-lg border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </FieldLabel>
            <FieldLabel label={labels.phoneLabel}>
              <input
                type="tel"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                maxLength={40}
                className="w-full rounded-lg border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </FieldLabel>
          </div>
        </SectionShell>

        <SectionShell id="address" title={labels.sectionAddress}>
          <div className="grid gap-4">
            <FieldLabel label={labels.addressLine1Label}>
              <input
                type="text"
                value={line1}
                onChange={(e) => setLine1(e.target.value)}
                maxLength={200}
                className="w-full rounded-lg border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
              />
            </FieldLabel>
            <div className="grid gap-4 md:grid-cols-2">
              <FieldLabel label={labels.addressCityLabel}>
                <input
                  type="text"
                  value={city}
                  onChange={(e) => setCity(e.target.value)}
                  maxLength={80}
                  className="w-full rounded-lg border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
                />
              </FieldLabel>
              <FieldLabel label={labels.addressCountryLabel}>
                <input
                  type="text"
                  value={country}
                  onChange={(e) => setCountry(e.target.value)}
                  maxLength={80}
                  className="w-full rounded-lg border border-hesya-peach-200 bg-white px-3 py-2 text-[13px] focus:border-hesya-navy-900 focus:outline-none"
                />
              </FieldLabel>
            </div>
          </div>
        </SectionShell>

        <SectionShell
          id="hours"
          title={labels.sectionHours}
          hint={labels.hoursFallback}
        >
          <div className="space-y-2">
            {DAYS.map((d) => {
              const s = days[d];
              return (
                <div
                  key={d}
                  className="flex flex-wrap items-center gap-3 rounded-lg border border-hesya-peach-200 bg-white px-3 py-2"
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
                      className="rounded-md border border-hesya-peach-200 bg-white px-2 py-1 text-[12px] disabled:bg-hesya-peach-50"
                    />
                    <span className="text-[11px] text-hesya-navy-900/55">
                      {labels.hoursClose}
                    </span>
                    <input
                      type="time"
                      value={s.close}
                      disabled={s.closed}
                      onChange={(e) => updateDay(d, { close: e.target.value })}
                      className="rounded-md border border-hesya-peach-200 bg-white px-2 py-1 text-[12px] disabled:bg-hesya-peach-50"
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </SectionShell>

        <SectionShell
          id="multilingual"
          title={labels.sectionMultilingual}
          placeholder={labels.placeholderText}
        />
        <SectionShell
          id="channels"
          title={labels.sectionChannels}
          placeholder={labels.placeholderText}
        />
        <SectionShell
          id="booking-policy"
          title={labels.sectionBookingPolicy}
          placeholder={labels.placeholderText}
        />
        <SectionShell
          id="payments"
          title={labels.sectionPayments}
          placeholder={labels.placeholderText}
        />
        <SectionShell
          id="notifications"
          title={labels.sectionNotifications}
          placeholder={labels.placeholderText}
        />

        <section
          id="section-risk"
          aria-labelledby="risk-heading"
          className="rounded-2xl border border-hesya-amber-500/30 bg-hesya-amber-50/40 px-5 py-4"
        >
          <div className="mb-2 flex items-center gap-2">
            <span
              aria-hidden="true"
              className="rounded-full bg-hesya-amber-500/20 px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900"
            >
              {labels.riskBadge}
            </span>
            <h2
              id="risk-heading"
              className="font-heading text-lg font-semibold italic tracking-tight text-hesya-navy-900"
            >
              {labels.sectionRisk}
            </h2>
          </div>
          <p className="text-[12px] leading-relaxed text-hesya-navy-900/75">
            {labels.riskBody}
          </p>
        </section>

        {error ? (
          <p
            role="alert"
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-[12px] text-red-700"
          >
            {error}
          </p>
        ) : null}
        {savedAt && !error ? (
          <p className="rounded-lg border border-emerald-200 bg-emerald-50 px-3 py-2 text-[12px] text-emerald-700">
            {labels.savedMessage}
          </p>
        ) : null}
      </div>

      <div className="fixed inset-x-0 bottom-0 z-10 border-t border-hesya-peach-200 bg-white/95 backdrop-blur md:left-[240px]">
        <div className="mx-auto flex max-w-5xl items-center justify-end px-6 py-3">
          <button
            type="submit"
            disabled={pending}
            className="rounded-full bg-hesya-navy-900 px-6 py-2.5 text-[13px] font-semibold text-hesya-peach-50 transition hover:bg-hesya-navy-900/90 disabled:opacity-60"
          >
            {pending ? "…" : labels.saveButton}
          </button>
        </div>
      </div>
    </form>
  );
}

function SectionShell({
  id,
  title,
  hint,
  placeholder,
  children,
}: {
  id: string;
  title: string;
  hint?: string;
  placeholder?: string;
  children?: React.ReactNode;
}) {
  return (
    <section
      id={`section-${id}`}
      aria-labelledby={`${id}-heading`}
      className="rounded-2xl border border-hesya-peach-200 bg-white px-5 py-5"
    >
      <header className="mb-4 flex items-baseline justify-between gap-3">
        <h2
          id={`${id}-heading`}
          className="font-heading text-lg font-semibold italic tracking-tight text-hesya-navy-900"
        >
          {title}
        </h2>
        {hint ? (
          <p className="text-[11px] text-hesya-navy-900/55">{hint}</p>
        ) : null}
      </header>
      {children}
      {placeholder ? (
        <p className="rounded-xl border border-dashed border-hesya-peach-200 bg-hesya-peach-50/40 px-4 py-6 text-center text-[12px] text-hesya-navy-900/55">
          {placeholder}
        </p>
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
      <span className="block text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/60">
        {label}
      </span>
      {children}
    </label>
  );
}
