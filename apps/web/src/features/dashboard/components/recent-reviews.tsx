import { useTranslations } from "next-intl";

/**
 * O1 Dashboard fast track 단계 4 — W9 최근 후기 3 cards.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx:698-761` `Reviews`.
 * 3 review cards: flag + lang + stars + (optional photo pip) + 원문 quote +
 * 한국어 trans + name/time + AI 답변 초안 링크.
 *
 * **mock-first**: 3 mock reviews (jp/en/zh-CN) hardcoded. 실 reviews 테이블은
 * Phase ζ (베타 매장 매칭 후) 도입. AI 답변 초안 링크는 Stage 1/3 패턴 disabled.
 */

interface MockReview {
  readonly flag: string;
  readonly lang: string;
  readonly stars: number;
  readonly quote: string;
  readonly trans: string;
  readonly timeKey: "twoHoursAgo" | "sixHoursAgo" | "yesterday";
  readonly name: string;
  readonly photo?: boolean;
}

const MOCK_REVIEWS: ReadonlyArray<MockReview> = [
  {
    flag: "🇯🇵",
    lang: "日本語",
    stars: 5,
    quote: "今までで一番のヘアスタイル！スタイリストさん、本当に親切でした。",
    trans: "지금까지 최고의 헤어스타일! 스타일리스트분 정말 친절했어요.",
    timeKey: "twoHoursAgo",
    name: "Sakura T.",
    photo: true,
  },
  {
    flag: "🇺🇸",
    lang: "English",
    stars: 5,
    quote: "Worth flying to Seoul for. The K-glow makeup is unreal.",
    trans:
      "서울까지 비행할 가치가 있어요. K-글로우 메이크업은 정말 대단했어요.",
    timeKey: "sixHoursAgo",
    name: "Emma K.",
  },
  {
    flag: "🇨🇳",
    lang: "简体中文",
    stars: 4,
    quote: "非常专业，发型师懂我想要的感觉，下次还会再来。",
    trans: "매우 전문적이고, 디자이너가 제가 원하는 느낌을 잘 이해했어요.",
    timeKey: "yesterday",
    name: "Wei L.",
  },
];

interface Props {
  readonly comingSoonLabel: string;
}

export function RecentReviews({ comingSoonLabel }: Props) {
  const t = useTranslations("Dashboard.recentReviews");

  return (
    <section
      data-testid="dashboard-recent-reviews"
      aria-label={t("title")}
      className="mb-4"
    >
      <header className="mb-3 flex items-center justify-between">
        <h2 className="kr text-[16px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h2>
        <span
          className="kr cursor-not-allowed text-[12px] text-hesya-amber-600"
          title={comingSoonLabel}
          aria-disabled="true"
        >
          {t("viewAllLink")} →
        </span>
      </header>

      {/* Reference dashboard.css sd-reviews-grid (1373) + sd-review-card
          (1378~1392) — gap 16, peach-100 border, hover amber-500 border +
          shadow-2. stars letter-spacing 0.5px. */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-3">
        {MOCK_REVIEWS.map((r, i) => (
          <article
            key={`${r.name}-${i}`}
            data-testid={`review-card-${i}`}
            className="flex flex-col rounded-lg border border-hesya-peach-100 bg-white p-4 transition-all hover:border-hesya-amber-500 hover:shadow-md"
          >
            <header className="mb-2 flex items-center gap-2 text-[12px]">
              <span aria-hidden="true">{r.flag}</span>
              <span className="text-gray-600">{r.lang}</span>
              <span
                className="ml-auto tabular-nums tracking-[0.5px] text-hesya-amber-500"
                aria-label={t("starsAria", { count: r.stars })}
              >
                {"★".repeat(r.stars)}
                <span className="text-gray-300">{"★".repeat(5 - r.stars)}</span>
              </span>
              {r.photo ? (
                <span aria-hidden="true" title={t("photoLabel")}>
                  📷
                </span>
              ) : null}
            </header>

            <p className="mb-2 text-[13px] italic text-hesya-navy-900">
              &ldquo;{r.quote}&rdquo;
            </p>
            <p className="kr mb-3 text-[12px] text-gray-600">
              &ldquo;{r.trans}&rdquo;
            </p>

            <footer className="mt-auto">
              <div className="kr mb-2 flex items-center justify-between text-[11px] text-gray-500">
                <span>— {r.name}</span>
                <span>{t(`time.${r.timeKey}`)}</span>
              </div>
              <span
                className="kr block w-full cursor-not-allowed rounded border border-hesya-peach-200 px-2 py-1.5 text-center text-[11px] text-hesya-amber-600"
                title={comingSoonLabel}
                aria-disabled="true"
              >
                {t("aiDraftLink")} →
              </span>
            </footer>
          </article>
        ))}
      </div>
    </section>
  );
}
