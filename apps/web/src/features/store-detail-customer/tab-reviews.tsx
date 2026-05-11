/**
 * Plan v3 Phase D2-B2-b — Tab: 후기 panel (mock placeholder).
 *
 * 실제 reviews 테이블/시스템은 phase ζ에서 도입. 본 panel은 3개 mock 카드 +
 * "준비 중" 안내. 외국인 손님이 후기 탭이 비어 보이지 않게 시각 정합 유지.
 */

interface Props {
  readonly comingSoonLabel: string;
  readonly sampleAuthor1: string;
  readonly sampleAuthor2: string;
  readonly sampleAuthor3: string;
  readonly sampleQuote1: string;
  readonly sampleQuote2: string;
  readonly sampleQuote3: string;
}

const STARS = "★★★★★";

export function TabReviews({
  comingSoonLabel,
  sampleAuthor1,
  sampleAuthor2,
  sampleAuthor3,
  sampleQuote1,
  sampleQuote2,
  sampleQuote3,
}: Props) {
  const items = [
    { author: sampleAuthor1, quote: sampleQuote1, flag: "🇯🇵" },
    { author: sampleAuthor2, quote: sampleQuote2, flag: "🇺🇸" },
    { author: sampleAuthor3, quote: sampleQuote3, flag: "🇨🇳" },
  ];
  return (
    <div className="px-5 py-4">
      <p className="mb-3 text-[10px] font-semibold uppercase tracking-[0.18em] text-hesya-navy-900/55">
        {comingSoonLabel}
      </p>
      <ul className="space-y-2">
        {items.map((r, i) => (
          <li
            key={i}
            className="rounded-2xl border border-hesya-peach-200 bg-white px-4 py-3"
          >
            <div className="mb-1 flex items-center justify-between">
              <p className="text-[13px] font-medium text-hesya-navy-900">
                <span aria-hidden="true" className="mr-1.5">
                  {r.flag}
                </span>
                {r.author}
              </p>
              <span className="font-mono text-[11px] text-hesya-amber-500">
                {STARS}
              </span>
            </div>
            <p className="text-[12px] leading-relaxed text-hesya-navy-900/75">
              “{r.quote}”
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
