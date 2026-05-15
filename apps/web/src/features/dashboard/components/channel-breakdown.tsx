/**
 * O1 Dashboard fast track 단계 1 — W3 채널별 인박스 분해.
 *
 * Reference: `docs/design/reference/dashboard-app.jsx` `TileInbox`.
 * 4 채널 (Instagram / WhatsApp / Kakao / LINE) 각각의 미답 메시지 수.
 *
 * **mock-first**: 실 DAL은 conversations group by channel 필요 — `getInboxLoad`
 * 확장 별도 task. 현재는 page.tsx에서 분배 휴리스틱.
 */

interface ChannelEntry {
  readonly key: string;
  readonly label: string;
  readonly icon: string;
  readonly count: number;
}

interface Props {
  readonly title: string;
  readonly entries: ReadonlyArray<ChannelEntry>;
}

export function ChannelBreakdown({ title, entries }: Props) {
  return (
    <section
      data-testid="dashboard-channel-breakdown"
      aria-label={title}
      className="mb-4 rounded-lg border border-hesya-peach-200 bg-white p-4"
    >
      <h3 className="kr mb-3 text-[12px] font-semibold uppercase tracking-[0.12em] text-hesya-navy-900/70">
        {title}
      </h3>
      <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
        {entries.map((e) => (
          <div
            key={e.key}
            data-testid={`channel-breakdown-${e.key}`}
            className="flex items-center justify-between rounded-md bg-hesya-peach-50 px-3 py-2.5"
          >
            <span className="flex items-center gap-2">
              <span aria-hidden="true" className="text-[16px]">
                {e.icon}
              </span>
              <span className="kr text-[12px] text-gray-700">{e.label}</span>
            </span>
            <span
              className={
                "mono text-[14px] font-semibold tabular-nums " +
                (e.count > 0 ? "text-hesya-amber-600" : "text-gray-400")
              }
            >
              {e.count}
            </span>
          </div>
        ))}
      </div>
    </section>
  );
}
