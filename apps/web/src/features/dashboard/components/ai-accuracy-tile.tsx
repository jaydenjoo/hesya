import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 5a — W5 AI 응답 정확도 타일.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:329-372` `TileAI`.
 * 원형 progress (160×160, r=60) + 중앙 % + "처리 메시지 N건" 캡션.
 *
 * **mock-first**: page에서 pct + processedCount 주입. 실 데이터 wire는
 * AI 처리 통계 집계 (Phase ζ 또는 messages.aiHandled flag 추가) — 별도 task.
 */

interface Props {
  /** AI 응답 정확도 (0~100, 정수) */
  readonly pct: number;
  /** 이번 주 AI가 처리한 메시지 수 */
  readonly processedCount: number;
}

const RADIUS = 60;
const CIRC = 2 * Math.PI * RADIUS;

export function AiAccuracyTile({ pct, processedCount }: Props) {
  const t = useTranslations("Dashboard.aiAccuracy");
  const dashLength = (pct / 100) * CIRC;

  return (
    <section
      data-testid="dashboard-ai-accuracy"
      aria-label={t("title")}
      className="tile-reveal flex flex-col rounded-lg border border-hesya-peach-200 bg-white p-5"
      style={{ animationDelay: "160ms" }}
    >
      <header className="mb-3">
        <h3 className="kr text-[14px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h3>
      </header>

      <div className="flex flex-1 flex-col items-center justify-center">
        <svg
          width="140"
          height="140"
          viewBox="0 0 160 160"
          role="img"
          aria-label={t("svgAria", { pct })}
        >
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke="var(--color-hesya-peach-100)"
            strokeWidth="10"
          />
          <circle
            cx="80"
            cy="80"
            r={RADIUS}
            fill="none"
            stroke="var(--color-hesya-amber-500)"
            strokeWidth="10"
            strokeLinecap="round"
            strokeDasharray={`${dashLength} ${CIRC}`}
            transform="rotate(-90 80 80)"
          />
          <text
            x="80"
            y="80"
            textAnchor="middle"
            className="font-mono fill-hesya-navy-900"
            fontSize="36"
            fontWeight="700"
          >
            {pct}
          </text>
          <text
            x="80"
            y="100"
            textAnchor="middle"
            className="font-mono fill-gray-500"
            fontSize="14"
          >
            %
          </text>
        </svg>
      </div>

      <p className="kr mt-3 text-center text-[12px] text-gray-700">
        {t.rich("caption", {
          count: processedCount,
          strong: (chunks) => (
            <strong className="font-semibold text-hesya-navy-900">
              {chunks}
            </strong>
          ),
        })}
      </p>
    </section>
  );
}
