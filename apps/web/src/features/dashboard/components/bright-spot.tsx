/**
 * Plan v3 M6.2b — Dashboard 상단 bright spot strip.
 *
 * Reference dashboard.css `.sd-bright-spot`:
 * - peach-100 bg + amber-500 border + 135deg diagonal gradient overlay
 * - eyebrow (amber-600 11px + Fraunces italic en) + body (15px navy 500 line-height 1.45)
 * - 우측 dots indicator + "더보기" link slot
 *
 * 가장 시급한 상태 1개를 "오늘의 한 줄"로 강조. KpiGrid 위에 full-width 표시.
 */

type Props = {
  eyebrow: string;
  eyebrowEn: string;
  body: React.ReactNode;
};

export function BrightSpot({ eyebrow, eyebrowEn, body }: Props) {
  return (
    <div className="relative mb-4 grid grid-cols-1 items-center gap-4 overflow-hidden rounded-lg border border-hesya-amber-500 bg-hesya-peach-100 px-5 py-3.5 sm:grid-cols-[auto_1fr_auto]">
      <span
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 bg-gradient-to-br from-transparent from-50% to-white/35"
      />
      <div className="relative flex items-baseline gap-1.5 whitespace-nowrap font-mono text-[11px] font-semibold uppercase tracking-[0.04em] text-hesya-amber-600">
        {eyebrow}
        <span className="font-heading text-[11px] font-medium italic not-italic text-gray-500">
          <span className="italic">{eyebrowEn}</span>
        </span>
      </div>
      <p className="relative min-w-0 text-[15px] font-medium leading-[1.45] text-hesya-navy-900">
        {body}
      </p>
      <div className="relative flex items-center gap-1" aria-hidden="true">
        <span className="h-[5px] w-[5px] rounded-full bg-hesya-amber-500" />
        <span className="h-[5px] w-[5px] rounded-full bg-hesya-peach-200" />
        <span className="h-[5px] w-[5px] rounded-full bg-hesya-peach-200" />
      </div>
    </div>
  );
}
