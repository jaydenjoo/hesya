/**
 * C3 PR 15 — Safety tips 섹션. Reference: booking-app.jsx `.safety-bc`.
 *
 * 첫 방문 손님 안내 3 bullet + trust-rose border. 외국인 손님 안전망 (한국 112,
 * 매장 직통 번호, 통역 QR).
 */

interface Props {
  readonly title: string;
  readonly tip1: string;
  readonly tip2: string;
  readonly tip3: string;
  readonly firstOnly: string;
}

export function SafetyTips({ title, tip1, tip2, tip3, firstOnly }: Props) {
  return (
    <section className="rounded-2xl border border-[var(--trust-rose,#e8c4d6)] bg-hesya-peach-100 px-5 py-5">
      <h4 className="mb-3 text-[12px] font-bold uppercase tracking-[0.04em] text-hesya-navy-900 [word-break:keep-all]">
        {title}
      </h4>
      <ul className="space-y-2 text-[12px] leading-relaxed text-hesya-navy-900/80 [word-break:keep-all]">
        <li className="flex gap-2">
          <span aria-hidden="true" className="text-hesya-amber-600">
            •
          </span>
          <span>{tip1}</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="text-hesya-amber-600">
            •
          </span>
          <span>{tip2}</span>
        </li>
        <li className="flex gap-2">
          <span aria-hidden="true" className="text-hesya-amber-600">
            •
          </span>
          <span>{tip3}</span>
        </li>
      </ul>
      <p className="mt-3 text-[10.5px] text-hesya-navy-900/50 [word-break:keep-all]">
        {firstOnly}
      </p>
    </section>
  );
}
