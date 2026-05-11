"use client";

import { useMemo, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import {
  buildDateOptions,
  buildTimeSlots,
  type DateOption,
} from "./time-slots";

export interface ScheduleFormService {
  readonly id: string;
  readonly label: string;
  readonly priceKrw: number;
  readonly durationMinutes: number | null;
}

export interface ScheduleFormStaff {
  readonly id: string;
  readonly name: string;
  readonly languages: ReadonlyArray<string>;
}

export interface ScheduleFormLabels {
  readonly step1: string;
  readonly step2: string;
  readonly step3: string;
  readonly step4: string;
  readonly next: string;
  readonly incomplete: string;
  readonly durationMinutes: (minutes: number) => string;
  readonly priceKrw: (price: string) => string;
  readonly today: string;
  readonly tomorrow: string;
  readonly businessHoursNote: string;
}

interface Props {
  readonly storeId: string;
  readonly locale: string;
  readonly services: ReadonlyArray<ScheduleFormService>;
  readonly staffList: ReadonlyArray<ScheduleFormStaff>;
  readonly labels: ScheduleFormLabels;
}

const RANGE_DAYS = 30;

export function BookScheduleForm({
  storeId,
  locale,
  services,
  staffList,
  labels,
}: Props) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const dateOptions = useMemo<DateOption[]>(
    () => buildDateOptions(RANGE_DAYS, locale),
    [locale],
  );
  const timeSlots = useMemo(() => buildTimeSlots(), []);

  const allSelected = Boolean(serviceId && staffId && date && time);

  const handleNext = () => {
    if (!allSelected) return;
    const params = new URLSearchParams({
      service: serviceId!,
      staff: staffId!,
      date: date!,
      time: time!,
    });
    router.push(`/c/store/${storeId}/book/confirm?${params.toString()}`);
  };

  return (
    <div className="space-y-10">
      <section>
        <h2 className="mb-3 text-sm font-semibold text-hesya-navy-900">
          {labels.step1}
        </h2>
        <div className="flex flex-wrap gap-2">
          {services.map((s) => (
            <button
              key={s.id}
              type="button"
              onClick={() => setServiceId(s.id)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                serviceId === s.id
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                  : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500"
              }`}
            >
              <span className="font-medium">{s.label}</span>
              <span className="ml-2 text-xs opacity-70">
                {labels.priceKrw(s.priceKrw.toLocaleString("ko-KR"))}
                {s.durationMinutes &&
                  ` · ${labels.durationMinutes(s.durationMinutes)}`}
              </span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-hesya-navy-900">
          {labels.step2}
        </h2>
        <div className="flex flex-wrap gap-2">
          {staffList.map((p) => (
            <button
              key={p.id}
              type="button"
              onClick={() => setStaffId(p.id)}
              className={`rounded-full border px-4 py-2 text-sm transition ${
                staffId === p.id
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                  : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500"
              }`}
            >
              {p.name}
              {p.languages.length > 0 && (
                <span className="ml-2 text-xs opacity-70">
                  {p.languages.map((l) => l.toUpperCase()).join(" · ")}
                </span>
              )}
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-hesya-navy-900">
          {labels.step3}
        </h2>
        <div className="grid grid-cols-3 gap-2 sm:grid-cols-5 md:grid-cols-7">
          {dateOptions.map((opt) => (
            <button
              key={opt.value}
              type="button"
              onClick={() => setDate(opt.value)}
              className={`rounded-xl border px-3 py-2 text-xs transition ${
                date === opt.value
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                  : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500"
              }`}
            >
              <span className="block font-medium">
                {opt.isToday
                  ? labels.today
                  : opt.isTomorrow
                    ? labels.tomorrow
                    : opt.displayLabel}
              </span>
              <span className="block text-[10px] opacity-70">{opt.value}</span>
            </button>
          ))}
        </div>
      </section>

      <section>
        <h2 className="mb-3 text-sm font-semibold text-hesya-navy-900">
          {labels.step4}
        </h2>
        <p className="mb-2 text-xs text-hesya-navy-900/50">
          {labels.businessHoursNote}
        </p>
        <div className="grid grid-cols-4 gap-2 sm:grid-cols-6 md:grid-cols-10">
          {timeSlots.map((slot) => (
            <button
              key={slot.value}
              type="button"
              onClick={() => setTime(slot.value)}
              className={`rounded-lg border px-3 py-2 text-xs transition ${
                time === slot.value
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                  : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500"
              }`}
            >
              {slot.value}
            </button>
          ))}
        </div>
      </section>

      <div className="flex items-center justify-between rounded-2xl bg-hesya-peach-50 px-6 py-5">
        <p className="text-xs text-hesya-navy-900/70">
          {allSelected ? "" : labels.incomplete}
        </p>
        <button
          type="button"
          onClick={handleNext}
          disabled={!allSelected}
          className={`rounded-full px-6 py-2.5 text-sm font-semibold transition ${
            allSelected
              ? "bg-hesya-navy-900 text-hesya-peach-50 hover:bg-hesya-navy-800"
              : "cursor-not-allowed bg-hesya-peach-200/60 text-hesya-navy-900/40"
          }`}
        >
          {labels.next}
        </button>
      </div>
    </div>
  );
}
