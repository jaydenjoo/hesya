/**
 * Plan v3 Phase D1-A2 — 예약 진행 단계 표시 (4단계).
 *
 * 손님이 현재 어느 단계인지 시각 표시. M2.3(Schedule) → M2.4(Confirm) →
 * M2.5(Pay) → success. 4단계 dot + 연결선 + done 체크.
 *
 * 사용: `<BookingProgressStrip current="schedule" labels={...} />`.
 */

export type BookingStep = "schedule" | "confirm" | "pay" | "done";

const STEPS: readonly BookingStep[] = ["schedule", "confirm", "pay", "done"];

export interface BookingProgressLabels {
  readonly schedule: string;
  readonly confirm: string;
  readonly pay: string;
  readonly done: string;
}

interface Props {
  readonly current: BookingStep;
  readonly labels: BookingProgressLabels;
}

export function BookingProgressStrip({ current, labels }: Props) {
  const currentIdx = STEPS.indexOf(current);

  return (
    <ol
      aria-label="Booking progress"
      className="flex items-center gap-2 px-6 pt-6 pb-2 text-[10px] font-semibold uppercase tracking-[0.14em]"
    >
      {STEPS.map((step, i) => {
        const done = i < currentIdx;
        const active = i === currentIdx;
        return (
          <li key={step} className="flex flex-1 items-center gap-2">
            <span
              className={[
                "flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-full border text-[10px] font-bold",
                done
                  ? "border-hesya-navy-900 bg-hesya-navy-900 text-hesya-peach-50"
                  : active
                    ? "border-hesya-amber-500 bg-hesya-amber-500 text-hesya-navy-900"
                    : "border-hesya-peach-200 bg-white text-hesya-navy-900/40",
              ].join(" ")}
            >
              {done ? "✓" : i + 1}
            </span>
            <span
              className={[
                "truncate",
                active
                  ? "text-hesya-navy-900"
                  : done
                    ? "text-hesya-navy-900/70"
                    : "text-hesya-navy-900/35",
              ].join(" ")}
            >
              {labels[step]}
            </span>
            {i < STEPS.length - 1 ? (
              <span
                aria-hidden="true"
                className={[
                  "ml-1 h-px flex-1",
                  done ? "bg-hesya-navy-900" : "bg-hesya-peach-200",
                ].join(" ")}
              />
            ) : null}
          </li>
        );
      })}
    </ol>
  );
}
