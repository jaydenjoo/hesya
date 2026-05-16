import { useTranslations } from "next-intl";

/**
 * O1 Dashboard PR 2 — W3 통합 인박스 타일.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx` `TileInbox`.
 * 큰 미답 숫자 + 채널별 미답 행 + "전체 보기 →" 링크.
 *
 * 이전 ChannelBreakdown (별도 section) 흡수. Bento Row 1 3-col 안의 3번째 tile.
 *
 * **mock-first**: 채널 분배는 page.tsx의 fixed ratio 휴리스틱 (40/30/20/10).
 * 실 DAL은 conversations group by channel 별도 task.
 */

interface ChannelEntry {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly count: number;
  /**
   * Urgent 채널 (sd-ch-count.urgent — amber pill 배지). count 임의 threshold
   * 또는 SLA 기반으로 page에서 결정. 미지정 시 일반 pill.
   */
  readonly urgent?: boolean;
}

interface Props {
  readonly unreadTotal: number;
  readonly channels: ReadonlyArray<ChannelEntry>;
}

export function InboxTile({ unreadTotal, channels }: Props) {
  const t = useTranslations("Dashboard.inboxTile");

  return (
    <section
      data-testid="dashboard-inbox-tile"
      aria-label={t("title")}
      className="tile-reveal flex flex-col rounded-lg border border-hesya-peach-200 bg-white p-5"
      style={{ animationDelay: "80ms" }}
    >
      <header className="mb-4 flex items-center justify-between">
        <h3 className="kr text-[14px] font-semibold text-hesya-navy-900">
          {t("title")}
        </h3>
        <span
          className="kr cursor-not-allowed text-[12px] text-hesya-amber-600"
          title={t("viewAllComingSoon")}
          aria-disabled="true"
        >
          {t("viewAllLink")} →
        </span>
      </header>

      <div className="mb-4 flex items-baseline gap-2">
        <span className="mono text-[40px] font-bold leading-none tabular-nums text-hesya-navy-900">
          {unreadTotal}
        </span>
        <span className="kr text-[13px] text-gray-500">
          {t("unreadSuffix")}
        </span>
      </div>

      <ul className="flex flex-col gap-2">
        {channels.map((c) => (
          <li
            key={c.key}
            data-testid={`inbox-tile-channel-${c.key}`}
            className="flex items-center justify-between rounded-md bg-hesya-peach-50 px-3 py-2.5"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="text-[16px]">
                {c.icon}
              </span>
              <span className="kr text-[12px] text-gray-700">{c.label}</span>
            </span>
            {/* Reference dashboard.css sd-ch-count (855~870) — pill 배지
                (border peach-200 + bg white + mono 10.5/700) + urgent 변형
                (amber-500 bg + white text). 이전 text-only 색상 변경만 사용. */}
            <span
              className={
                "inline-flex shrink-0 items-center rounded-full border font-mono text-[10.5px] font-bold tabular-nums px-1.5 py-0.5 " +
                (c.urgent
                  ? "border-hesya-amber-500 bg-hesya-amber-500 text-white"
                  : "border-hesya-peach-200 bg-white text-gray-700")
              }
            >
              {c.count}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
