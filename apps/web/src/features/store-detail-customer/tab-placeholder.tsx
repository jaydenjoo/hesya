/**
 * Plan v3 Phase D2-B2-b — Tab: 준비 중 placeholder panel.
 *
 * Compare / Live UGC 등 베타 후 도입 기능 영역. 시각 정합을 위해 빈 칸 X,
 * 의미 있는 안내 카드.
 */

interface Props {
  readonly icon: string;
  readonly heading: string;
  readonly body: string;
}

export function TabPlaceholder({ icon, heading, body }: Props) {
  return (
    <div className="px-5 py-8">
      <div className="flex flex-col items-center rounded-2xl border border-dashed border-hesya-peach-200 bg-white px-6 py-10 text-center">
        <span
          aria-hidden="true"
          className="mb-3 text-[28px] text-hesya-navy-900/30"
        >
          {icon}
        </span>
        <p className="font-heading text-[15px] font-semibold italic text-hesya-navy-900">
          {heading}
        </p>
        <p className="mt-1.5 text-[12px] leading-relaxed text-hesya-navy-900/60">
          {body}
        </p>
      </div>
    </div>
  );
}
