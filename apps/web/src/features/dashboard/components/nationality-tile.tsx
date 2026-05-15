import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 4 — W4 주간 외국인 손님 국적 대형 타일.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:253-327` `TileDonut`.
 * 220×220 SVG donut + 중앙 숫자/캡션 + flag/swatch/label/pct legend.
 *
 * `DistributionPie`는 KPI 카드 안 작은 시각화 — 본 컴포넌트는 reference의
 * 대형 타일 격상 버전. 같은 데이터(nationality breakdown)를 더 명시적으로 표현.
 *
 * **mock-first**: page.tsx에서 mock segments 주입. 실 데이터 wire는
 * `getNationalityMix(db, storeId, monthRange)` 결과를 props로 매핑하면 됨
 * (현재 KPI 카드도 같은 DAL 사용 중이라 prerequisite 충족).
 */

interface NationalitySegment {
  readonly flag: string;
  readonly label: string;
  readonly pct: number;
  /** SVG stroke 색 (hex) */
  readonly color: string;
}

interface Props {
  readonly segments: ReadonlyArray<NationalitySegment>;
  readonly totalCount: number;
}

const RADIUS = 78;
const CIRC = 2 * Math.PI * RADIUS;

export function NationalityTile({ segments, totalCount }: Props) {
  const t = useTranslations("Dashboard.nationalityTile");

  // 누적 stroke length precompute (immutability rule — render 중 let 재할당 금지).
  const segmentArcs = segments.reduce<
    ReadonlyArray<{ readonly len: number; readonly offset: number }>
  >((acc, s) => {
    const len = (s.pct / 100) * CIRC;
    const cumPrev = acc.reduce((sum, a) => sum + a.len, 0);
    const offset = CIRC - cumPrev;
    return [...acc, { len, offset }];
  }, []);

  return (
    <section
      data-testid="dashboard-nationality-tile"
      aria-label={t("title")}
      className="rounded-lg border border-hesya-peach-200 bg-white p-5"
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="kr text-[14px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h3>
        <span className="kr text-[11px] text-gray-500">
          {t("subtotal", { count: totalCount })}
        </span>
      </header>

      <div className="flex flex-col items-center gap-4 md:flex-row md:items-start">
        <svg
          width="180"
          height="180"
          viewBox="0 0 220 220"
          className="shrink-0"
          role="img"
          aria-label={t("donutAria", { count: totalCount })}
        >
          <circle
            cx="110"
            cy="110"
            r={RADIUS}
            fill="none"
            stroke="var(--color-hesya-peach-100)"
            strokeWidth="20"
          />
          {segments.map((s, i) => {
            const arc = segmentArcs[i];
            if (!arc) return null;
            return (
              <circle
                key={`${s.label}-${i}`}
                cx="110"
                cy="110"
                r={RADIUS}
                fill="none"
                stroke={s.color}
                strokeWidth="20"
                strokeDasharray={`${arc.len} ${CIRC - arc.len}`}
                strokeDashoffset={arc.offset}
                transform="rotate(-90 110 110)"
              />
            );
          })}
          <text
            x="110"
            y="106"
            textAnchor="middle"
            className="font-mono fill-hesya-navy-900"
            fontSize="42"
            fontWeight="700"
          >
            {totalCount}
          </text>
          <text
            x="110"
            y="132"
            textAnchor="middle"
            className="kr fill-gray-500"
            fontSize="13"
          >
            {t("centerCaption")}
          </text>
        </svg>

        <ul className="flex w-full flex-col gap-1.5 text-[12px]">
          {segments.map((s, i) => (
            <li
              key={`${s.label}-${i}`}
              data-testid={`nationality-legend-${s.label}`}
              className="flex items-center gap-2"
            >
              <span
                aria-hidden="true"
                className="h-2.5 w-2.5 shrink-0 rounded-sm"
                style={{ background: s.color }}
              />
              <span aria-hidden="true">{s.flag}</span>
              <span className="kr flex-1 truncate text-gray-700">
                {s.label}
              </span>
              <span className="mono shrink-0 tabular-nums text-hesya-navy-900">
                {s.pct}%
              </span>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}
