"use client";

/**
 * Plan v3 M2.3 / Phase D2-B3 — customer-side 예약 일정 선택.
 *
 * 디자인 정합 재구성: 가로 스크롤 서비스/스타일리스트 chip + week-strip 날짜
 * picker (가용성 mock dot) + time slot grid + Deposit/cancellation 카드 +
 * sticky bottom bar (가격 합계 + Continue).
 *
 * 가용성 dot은 (date, time) 해시 기반 deterministic mock. 실 가용성 conflict
 * 체크는 M2.6 server action에서 atomic.
 */

import { useMemo, useState } from "react";

import { useRouter } from "@/i18n/navigation";
import {
  buildDateOptions,
  buildTimeSlots,
  type BusinessHoursInput,
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
  readonly formatPrice: (priceKrw: number) => string;
  readonly today: string;
  readonly tomorrow: string;
  readonly businessHoursNote: string;
  readonly depositTitle: string;
  readonly depositBody: string;
  readonly totalLabel: string;
  readonly slotFew: string;
  readonly closedLabel: string;
  readonly closedDayNote: string;
}

interface Props {
  readonly storeId: string;
  readonly locale: string;
  readonly services: ReadonlyArray<ScheduleFormService>;
  readonly staffList: ReadonlyArray<ScheduleFormStaff>;
  readonly businessHours: BusinessHoursInput;
  readonly labels: ScheduleFormLabels;
}

const RANGE_DAYS = 14;

type Avail = "open" | "few" | "full";

function availabilityFor(date: string, time: string): Avail {
  // deterministic hash → 0..2 (full / few / open mock).
  let h = 0;
  const src = `${date}|${time}`;
  for (let i = 0; i < src.length; i++)
    h = ((h << 5) - h + src.charCodeAt(i)) | 0;
  const mod = Math.abs(h) % 10;
  if (mod < 1) return "full";
  if (mod < 4) return "few";
  return "open";
}

export function BookScheduleForm({
  storeId,
  locale,
  services,
  staffList,
  businessHours,
  labels,
}: Props) {
  const router = useRouter();
  const [serviceId, setServiceId] = useState<string | null>(null);
  const [staffId, setStaffId] = useState<string | null>(null);
  const [date, setDate] = useState<string | null>(null);
  const [time, setTime] = useState<string | null>(null);

  const dateOptions = useMemo<DateOption[]>(
    () => buildDateOptions(RANGE_DAYS, locale, undefined, businessHours),
    [locale, businessHours],
  );
  const timeSlots = useMemo(
    () => (date ? buildTimeSlots(date, businessHours) : buildTimeSlots()),
    [date, businessHours],
  );
  const selectedDateClosed = date
    ? (dateOptions.find((o) => o.value === date)?.isClosed ?? false)
    : false;

  const selectedService = services.find((s) => s.id === serviceId) ?? null;
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
    <>
      <div className="space-y-6 pb-24">
        <section>
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
            {labels.step1}
          </h2>
          <div
            className="-mx-5 flex gap-2 overflow-x-auto px-5"
            style={{ scrollbarWidth: "none" }}
          >
            {services.map((s) => {
              const active = serviceId === s.id;
              return (
                <button
                  key={s.id}
                  type="button"
                  onClick={() => setServiceId(s.id)}
                  className={[
                    "flex-shrink-0 rounded-xl border px-3 py-2 text-left transition",
                    active
                      ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                      : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500",
                  ].join(" ")}
                >
                  <span className="block text-[13px] font-medium">
                    {s.label}
                  </span>
                  <span
                    className={[
                      "block text-[11px]",
                      active
                        ? "text-hesya-peach-50/75"
                        : "text-hesya-navy-900/55",
                    ].join(" ")}
                  >
                    {labels.formatPrice(s.priceKrw)}
                    {s.durationMinutes
                      ? ` · ${labels.durationMinutes(s.durationMinutes)}`
                      : ""}
                  </span>
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
            {labels.step2}
          </h2>
          <div
            className="-mx-5 flex gap-2 overflow-x-auto px-5"
            style={{ scrollbarWidth: "none" }}
          >
            {staffList.map((p) => {
              const active = staffId === p.id;
              return (
                <button
                  key={p.id}
                  type="button"
                  onClick={() => setStaffId(p.id)}
                  className={[
                    "flex flex-shrink-0 items-center gap-2 rounded-full border px-3 py-1.5 transition",
                    active
                      ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                      : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500",
                  ].join(" ")}
                >
                  <span className="text-[12px] font-medium">{p.name}</span>
                  {p.languages.length > 0 ? (
                    <span
                      className={[
                        "text-[9.5px] font-semibold uppercase tracking-wide",
                        active
                          ? "text-hesya-peach-50/65"
                          : "text-hesya-navy-900/55",
                      ].join(" ")}
                    >
                      {p.languages.map((l) => l.toUpperCase()).join("·")}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
            {labels.step3}
          </h2>
          <div
            className="-mx-5 flex gap-2 overflow-x-auto px-5 pb-1"
            style={{ scrollbarWidth: "none" }}
          >
            {dateOptions.map((opt) => {
              const active = date === opt.value;
              const dayPart = opt.displayLabel.replace(/[0-9]/g, "").trim();
              const numPart = opt.value.slice(-2);
              const label = opt.isToday
                ? labels.today
                : opt.isTomorrow
                  ? labels.tomorrow
                  : dayPart || opt.displayLabel.slice(0, 3);
              const dayAvail = availabilityFor(opt.value, "day");
              const closed = opt.isClosed;
              return (
                <button
                  key={opt.value}
                  type="button"
                  onClick={() => {
                    if (closed) return;
                    setDate(opt.value);
                    setTime(null);
                  }}
                  disabled={closed}
                  className={[
                    "flex w-[56px] flex-shrink-0 flex-col items-center gap-1 rounded-2xl border py-2.5 transition",
                    closed
                      ? "cursor-not-allowed border-hesya-peach-200 bg-hesya-peach-50/40 text-hesya-navy-900/35"
                      : active
                        ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                        : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500",
                  ].join(" ")}
                >
                  <span
                    className={[
                      "text-[10px] font-semibold uppercase tracking-wide",
                      closed
                        ? "text-hesya-navy-900/40"
                        : active
                          ? "text-hesya-peach-50/75"
                          : "text-hesya-navy-900/55",
                    ].join(" ")}
                  >
                    {closed ? labels.closedLabel : label}
                  </span>
                  <span className="font-mono text-[16px] font-semibold leading-none">
                    {numPart}
                  </span>
                  <span
                    aria-hidden="true"
                    className={[
                      "h-1.5 w-1.5 rounded-full",
                      closed
                        ? "bg-hesya-navy-900/15"
                        : dayAvail === "open"
                          ? "bg-emerald-500"
                          : dayAvail === "few"
                            ? "bg-hesya-amber-500"
                            : "bg-hesya-navy-900/25",
                    ].join(" ")}
                  />
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h2 className="mb-2 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
            {labels.step4}
          </h2>
          <p className="mb-2 text-[11px] text-hesya-navy-900/55">
            {labels.businessHoursNote}
          </p>
          {selectedDateClosed ? (
            <p className="rounded-lg border border-dashed border-hesya-peach-200 bg-hesya-peach-50/40 px-3 py-4 text-center text-[11px] text-hesya-navy-900/55">
              {labels.closedDayNote}
            </p>
          ) : null}
          <div className="grid grid-cols-4 gap-1.5">
            {timeSlots.map((slot) => {
              const active = time === slot.value;
              const avail = date ? availabilityFor(date, slot.value) : "open";
              const disabled = avail === "full";
              return (
                <button
                  key={slot.value}
                  type="button"
                  onClick={() => !disabled && setTime(slot.value)}
                  disabled={disabled}
                  className={[
                    "relative rounded-lg border px-2 py-2 text-[12px] font-medium transition",
                    active
                      ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                      : disabled
                        ? "cursor-not-allowed border-hesya-peach-100 bg-hesya-peach-50/40 text-hesya-navy-900/30 line-through"
                        : "border-hesya-peach-200 bg-white text-hesya-navy-900 hover:border-hesya-amber-500",
                  ].join(" ")}
                >
                  {slot.value}
                  {avail === "few" && !active ? (
                    <span className="absolute -right-0.5 -top-0.5 rounded-full bg-hesya-amber-500 px-1 py-px text-[8px] font-bold uppercase text-hesya-navy-900">
                      {labels.slotFew}
                    </span>
                  ) : null}
                </button>
              );
            })}
          </div>
        </section>

        <section className="rounded-2xl border border-hesya-peach-200 bg-white px-4 py-3">
          <p className="text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
            {labels.depositTitle}
          </p>
          <p className="mt-1 text-[12px] leading-relaxed text-hesya-navy-900/75">
            {labels.depositBody}
          </p>
        </section>
      </div>

      <div className="sticky bottom-0 z-20 -mx-5 flex items-center gap-3 border-t border-hesya-peach-200 bg-hesya-peach-50/95 px-5 py-3 backdrop-blur">
        <div className="min-w-0 flex-1">
          <p className="text-[10px] font-semibold uppercase tracking-[0.16em] text-hesya-navy-900/55">
            {labels.totalLabel}
          </p>
          <p className="truncate font-mono text-[15px] font-semibold text-hesya-navy-900">
            {selectedService
              ? labels.formatPrice(selectedService.priceKrw)
              : "—"}
          </p>
        </div>
        <button
          type="button"
          onClick={handleNext}
          disabled={!allSelected}
          className={[
            "flex-shrink-0 rounded-full px-5 py-2.5 text-[13px] font-semibold transition",
            allSelected
              ? "bg-hesya-navy-900 text-hesya-peach-50 hover:bg-hesya-navy-900/90"
              : "cursor-not-allowed bg-hesya-peach-200/60 text-hesya-navy-900/40",
          ].join(" ")}
        >
          {allSelected ? `${labels.next} →` : labels.incomplete}
        </button>
      </div>
    </>
  );
}
