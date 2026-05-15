/**
 * Plan v3 Phase D2-B1 — "What happens next" 5단계 타임라인.
 * Reference: booking-app.jsx `.timeline` — emoji icons + Fraunces title + dashed dividers.
 */

const STEP_EMOJI = ["📩", "🚇", "🌐", "💌", "🎁"] as const;

interface Props {
  readonly title: string;
  readonly steps: readonly string[];
}

export function NextStepsTimeline({ title, steps }: Props) {
  return (
    <section className="rounded-2xl bg-white px-5 py-5 shadow-[0_4px_16px_rgba(26,34,56,0.06)]">
      <h3 className="mb-4 font-heading text-[18px] font-medium italic text-hesya-navy-900">
        {title}
      </h3>
      <ol>
        {steps.map((s, i) => (
          <li
            key={i}
            className={`flex items-start gap-3 py-2.5 ${
              i < steps.length - 1
                ? "border-b border-dashed border-hesya-peach-100"
                : ""
            }`}
          >
            <span aria-hidden="true" className="text-[22px] leading-none">
              {STEP_EMOJI[i] ?? "•"}
            </span>
            <span className="text-sm leading-relaxed text-hesya-navy-900">
              {s}
            </span>
          </li>
        ))}
      </ol>
    </section>
  );
}
