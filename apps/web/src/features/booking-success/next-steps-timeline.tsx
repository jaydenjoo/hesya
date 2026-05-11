/**
 * Plan v3 Phase D2-B1 — "What happens next" 5단계 타임라인.
 * 손님이 예약 후 흐름을 한눈에 파악 (이메일 확인 → 도착 → QR 제시 → 시술 →
 * 잔액 결제).
 */

interface Props {
  readonly title: string;
  readonly steps: readonly string[];
}

export function NextStepsTimeline({ title, steps }: Props) {
  return (
    <section className="rounded-2xl border border-hesya-peach-200 bg-white px-5 py-5">
      <p className="mb-4 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/60">
        {title}
      </p>
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={i} className="flex items-start gap-3">
            <span className="mt-0.5 grid h-5 w-5 flex-shrink-0 place-items-center rounded-full bg-hesya-navy-900 font-mono text-[10px] font-bold text-hesya-peach-50">
              {i + 1}
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
