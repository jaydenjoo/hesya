/**
 * Plan v3 Phase D2-B1 — 예약 완료 hero. 캘리그래피 "환대"(hospitality) + 손
 * 모음 SVG. 외국인 손님 첫 인상 (한국 미용실의 따뜻한 환대 felt).
 */

interface Props {
  readonly subtitle: string;
}

export function HospitalityHero({ subtitle }: Props) {
  return (
    <div className="flex flex-col items-center px-6 pt-2 pb-6 text-center">
      <svg aria-hidden="true" viewBox="0 0 80 64" className="mb-3 h-16 w-20">
        <defs>
          <linearGradient id="hb-amber" x1="0" x2="1" y1="0" y2="1">
            <stop offset="0%" stopColor="var(--hesya-amber-500)" />
            <stop offset="100%" stopColor="var(--hesya-amber-600)" />
          </linearGradient>
        </defs>
        <path
          d="M40 6 C26 6 18 18 18 30 L18 42 C18 50 24 56 32 56 L48 56 C56 56 62 50 62 42 L62 30 C62 18 54 6 40 6 Z"
          fill="url(#hb-amber)"
          opacity="0.18"
        />
        <path
          d="M22 36 C22 30 28 24 34 24 L34 30 C34 30 30 32 30 36 L30 44 L22 44 Z"
          fill="var(--hesya-navy-900)"
        />
        <path
          d="M58 36 C58 30 52 24 46 24 L46 30 C46 30 50 32 50 36 L50 44 L58 44 Z"
          fill="var(--hesya-navy-900)"
        />
        <path d="M30 44 L50 44 L46 52 L34 52 Z" fill="var(--hesya-amber-500)" />
      </svg>
      <p
        lang="ko"
        className="font-heading text-[44px] font-semibold italic leading-none tracking-[-0.03em] text-hesya-navy-900"
      >
        환대
      </p>
      <p className="mt-1 text-[11px] font-semibold uppercase tracking-[0.22em] text-hesya-amber-600">
        {subtitle}
      </p>
    </div>
  );
}
