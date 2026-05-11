"use client";

import { useState, useTransition } from "react";

import { updateStoreSettingsAction } from "@/lib/store-settings/actions";

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
  readonly sectionBasic: string;
  readonly sectionHours: string;
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
    <form onSubmit={handleSubmit} className="space-y-10">
      <section className="space-y-4">
        <h2 className="text-lg font-semibold text-hesya-navy-900">
          {labels.sectionBasic}
        </h2>
        <div className="grid gap-4 md:grid-cols-2">
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-hesya-navy-900/80">
              {labels.nameLabel}
            </span>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              maxLength={80}
              className="w-full rounded-md border border-hesya-navy-900/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-hesya-navy-900/80">
              {labels.phoneLabel}
            </span>
            <input
              type="tel"
              value={phone}
              onChange={(e) => setPhone(e.target.value)}
              maxLength={40}
              className="w-full rounded-md border border-hesya-navy-900/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1.5 md:col-span-2">
            <span className="text-sm font-medium text-hesya-navy-900/80">
              {labels.addressLine1Label}
            </span>
            <input
              type="text"
              value={line1}
              onChange={(e) => setLine1(e.target.value)}
              maxLength={200}
              className="w-full rounded-md border border-hesya-navy-900/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-hesya-navy-900/80">
              {labels.addressCityLabel}
            </span>
            <input
              type="text"
              value={city}
              onChange={(e) => setCity(e.target.value)}
              maxLength={80}
              className="w-full rounded-md border border-hesya-navy-900/15 bg-white px-3 py-2 text-sm"
            />
          </label>
          <label className="space-y-1.5">
            <span className="text-sm font-medium text-hesya-navy-900/80">
              {labels.addressCountryLabel}
            </span>
            <input
              type="text"
              value={country}
              onChange={(e) => setCountry(e.target.value)}
              maxLength={80}
              className="w-full rounded-md border border-hesya-navy-900/15 bg-white px-3 py-2 text-sm"
            />
          </label>
        </div>
      </section>

      <section className="space-y-4">
        <div className="space-y-1">
          <h2 className="text-lg font-semibold text-hesya-navy-900">
            {labels.sectionHours}
          </h2>
          <p className="text-xs text-hesya-navy-900/55">
            {labels.hoursFallback}
          </p>
        </div>
        <div className="space-y-2">
          {DAYS.map((d) => {
            const s = days[d];
            return (
              <div
                key={d}
                className="flex flex-wrap items-center gap-3 rounded-md border border-hesya-navy-900/10 bg-white px-3 py-2"
              >
                <span className="w-16 text-sm font-medium text-hesya-navy-900">
                  {labels.days[d]}
                </span>
                <label className="flex items-center gap-1.5 text-sm text-hesya-navy-900/75">
                  <input
                    type="checkbox"
                    checked={s.closed}
                    onChange={(e) => updateDay(d, { closed: e.target.checked })}
                  />
                  {labels.hoursClosed}
                </label>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-hesya-navy-900/55">
                    {labels.hoursOpen}
                  </span>
                  <input
                    type="time"
                    value={s.open}
                    disabled={s.closed}
                    onChange={(e) => updateDay(d, { open: e.target.value })}
                    className="rounded-md border border-hesya-navy-900/15 bg-white px-2 py-1 text-sm disabled:bg-hesya-navy-900/5"
                  />
                  <span className="text-xs text-hesya-navy-900/55">
                    {labels.hoursClose}
                  </span>
                  <input
                    type="time"
                    value={s.close}
                    disabled={s.closed}
                    onChange={(e) => updateDay(d, { close: e.target.value })}
                    className="rounded-md border border-hesya-navy-900/15 bg-white px-2 py-1 text-sm disabled:bg-hesya-navy-900/5"
                  />
                </div>
              </div>
            );
          })}
        </div>
      </section>

      {error ? (
        <p className="rounded-md bg-red-50 px-3 py-2 text-sm text-red-700">
          {error}
        </p>
      ) : null}
      {savedAt && !error ? (
        <p className="rounded-md bg-emerald-50 px-3 py-2 text-sm text-emerald-700">
          {labels.savedMessage}
        </p>
      ) : null}

      <button
        type="submit"
        disabled={pending}
        className="inline-flex items-center justify-center rounded-md bg-hesya-navy-900 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-hesya-navy-900/90 disabled:opacity-60"
      >
        {labels.saveButton}
      </button>
    </form>
  );
}
