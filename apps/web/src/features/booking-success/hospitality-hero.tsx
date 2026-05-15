/**
 * Plan v3 Phase D2-B1 — 예약 완료 hero. Reference: booking-app.jsx HandBow.
 * 인물 허리 숙임 SVG (head + body arc + arm crossing + sparkles) — 한국식
 * 환대 felt.
 *
 * `customerName`: 개인화 헤드라인 ("You're booked, Sakura.") — optional.
 * subtitle: legacy prop (calligraphy 라인은 page.tsx의 i18n key로 별도 처리).
 */

interface Props {
  readonly subtitle?: string;
  readonly headingTemplate: string;
  readonly customerName?: string;
}

export function HospitalityHero({ headingTemplate, customerName }: Props) {
  const heading =
    customerName && headingTemplate.includes("{name}")
      ? headingTemplate.replace("{name}", customerName)
      : headingTemplate.replace(/[,\s]*\{name\}[.,!]?/, "").trim();
  return (
    <div className="flex flex-col items-center px-6 pt-2 pb-6 text-center">
      <svg
        aria-hidden="true"
        viewBox="0 0 200 110"
        className="mb-2 h-[88px] w-[160px] text-hesya-amber-600"
        fill="none"
      >
        <g
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          fill="none"
        >
          <circle cx="100" cy="35" r="14" />
          <path d="M86 28 Q88 18 100 18 Q112 18 114 28" />
          <path d="M70 80 Q76 60 90 50 L110 50 Q124 60 130 80" />
          <path d="M82 70 Q100 76 118 70" />
          <path d="M40 30 v8 M36 34 h8" />
          <path d="M160 50 v6 M157 53 h6" />
          <path d="M50 80 v4 M48 82 h4" />
        </g>
      </svg>
      <h1 className="font-heading text-[28px] font-semibold italic leading-tight tracking-[-0.02em] text-hesya-navy-900 [word-break:keep-all]">
        {heading}
      </h1>
    </div>
  );
}
