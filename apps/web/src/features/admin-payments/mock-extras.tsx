/**
 * Sprint 2C PR-D3 — Admin payment monitoring rich mock UI.
 *
 * Server components. env.MOCK_FIXTURES=true 일 때만 노출.
 */

import type {
  MockTransaction,
  PaymentAnomaly,
  PaymentChannel,
} from "@/lib/mock-fixtures/admin-payments";

const CHANNEL_COLORS: Record<PaymentChannel, string> = {
  stripe: "#635BFF",
  alipay: "#1677FF",
  wechat: "#07C160",
  linepay: "#00B900",
};

const CHANNEL_LABEL: Record<PaymentChannel, string> = {
  stripe: "Stripe",
  alipay: "Alipay",
  wechat: "WeChat Pay",
  linepay: "LINE Pay",
};

export interface PaymentExtraLabels {
  readonly anomalyTitle: string;
  readonly txTitle: string;
  readonly txSubtitle: string;
  readonly txCols: {
    readonly providerId: string;
    readonly channel: string;
    readonly store: string;
    readonly customer: string;
    readonly amount: string;
    readonly status: string;
    readonly capturedAt: string;
  };
  readonly statusLabel: {
    readonly captured: string;
    readonly refunded: string;
    readonly partial_refund: string;
    readonly disputed: string;
    readonly failed: string;
  };
  readonly mixTitle: string;
  readonly mixGmv: string;
  readonly channelStatsTitle: string;
  readonly channelStatsSubtitle: string;
  readonly channelStatTxLabel: string;
  readonly channelStatNetLabel: string;
}

export function PaymentAnomalyBand({
  anomalies,
  title,
}: {
  anomalies: ReadonlyArray<PaymentAnomaly>;
  title: string;
}) {
  const tone = {
    danger: "border-rose-200 bg-rose-50/60",
    warn: "border-amber-200 bg-amber-50/60",
    info: "border-emerald-200 bg-emerald-50/60",
  };
  return (
    <section data-testid="admin-payment-anomaly" className="mb-6">
      <h2 className="mb-3 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
        {title}
      </h2>
      <div className="grid gap-3 sm:grid-cols-3">
        {anomalies.map((a, i) => (
          <article key={i} className={`rounded-md border p-4 ${tone[a.tone]}`}>
            <div className="mb-2 flex items-baseline justify-between">
              <span aria-hidden="true" className="text-[20px]">
                {a.icon}
              </span>
              {a.amountKrw != null && (
                <span className="font-mono text-[11px] font-semibold text-hesya-navy-900">
                  ₩{a.amountKrw.toLocaleString("ko")}
                </span>
              )}
            </div>
            <p className="font-display text-[13px] font-semibold italic text-hesya-navy-900">
              {a.title}
            </p>
            <p className="mt-1 text-[11.5px] leading-relaxed text-hesya-navy-900/65 [word-break:keep-all]">
              {a.body}
            </p>
          </article>
        ))}
      </div>
    </section>
  );
}

export function ChannelMix({
  data,
  title,
  gmvLabel,
}: {
  data: ReadonlyArray<{
    channel: PaymentChannel;
    count: number;
    gmvKrw: number;
  }>;
  title: string;
  gmvLabel: string;
}) {
  const totalGmv = data.reduce((sum, d) => sum + d.gmvKrw, 0);
  return (
    <section
      data-testid="admin-payment-mix"
      className="mb-6 rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)]"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
          {title}
        </h3>
        <span className="font-mono text-[11px] text-hesya-navy-900/70">
          {gmvLabel}{" "}
          <strong className="text-hesya-navy-900">
            ₩{totalGmv.toLocaleString("ko")}
          </strong>
        </span>
      </header>
      <div className="space-y-2.5">
        {data.map((row) => {
          const pct = totalGmv === 0 ? 0 : (row.gmvKrw / totalGmv) * 100;
          return (
            <div key={row.channel}>
              <div className="mb-1 flex items-baseline justify-between text-[11.5px]">
                <span className="flex items-center gap-2 text-hesya-navy-900">
                  <span
                    aria-hidden="true"
                    className="inline-block h-2.5 w-2.5 rounded-sm"
                    style={{ background: CHANNEL_COLORS[row.channel] }}
                  />
                  {CHANNEL_LABEL[row.channel]}
                </span>
                <span className="font-mono text-hesya-navy-900/70">
                  ₩{row.gmvKrw.toLocaleString("ko")} · {row.count} ·{" "}
                  {pct.toFixed(0)}%
                </span>
              </div>
              <div className="relative h-1.5 overflow-hidden rounded-full bg-hesya-peach-50">
                <div
                  className="absolute inset-y-0 left-0 rounded-full"
                  style={{
                    width: `${pct}%`,
                    background: CHANNEL_COLORS[row.channel],
                  }}
                />
              </div>
            </div>
          );
        })}
      </div>
    </section>
  );
}

export function TransactionTable({
  rows,
  labels,
}: {
  rows: ReadonlyArray<MockTransaction>;
  labels: PaymentExtraLabels;
}) {
  const c = labels.txCols;
  return (
    <section
      data-testid="admin-payment-tx-table"
      className="rounded-md border border-gray-200 bg-white shadow-[0_1px_2px_rgba(26,34,56,0.04)]"
    >
      <header className="border-b border-hesya-peach-100 px-5 py-3">
        <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
          {labels.txTitle}
        </h3>
        <p className="mt-0.5 text-[11.5px] text-hesya-navy-900/55">
          {labels.txSubtitle}
        </p>
      </header>
      <div className="overflow-x-auto">
        <table className="w-full text-[11.5px]">
          <thead>
            <tr className="border-b border-hesya-peach-100 text-left">
              <th className="px-5 py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.providerId}
              </th>
              <th className="py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.channel}
              </th>
              <th className="py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.store}
              </th>
              <th className="py-2.5 font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.customer}
              </th>
              <th className="py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.amount}
              </th>
              <th className="py-2.5 text-center font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.status}
              </th>
              <th className="px-5 py-2.5 text-right font-mono text-[10px] uppercase tracking-[0.1em] text-hesya-navy-900/50">
                {c.capturedAt}
              </th>
            </tr>
          </thead>
          <tbody>
            {rows.map((tx) => {
              const statusColor = {
                captured: "bg-emerald-50 text-emerald-700",
                refunded: "bg-rose-50 text-rose-700",
                partial_refund: "bg-amber-50 text-amber-700",
                disputed: "bg-rose-100 text-rose-800 font-semibold",
                failed: "bg-gray-100 text-gray-700",
              };
              return (
                <tr
                  key={tx.id}
                  className="border-b border-hesya-peach-50 last:border-b-0"
                >
                  <td className="px-5 py-2.5">
                    <p className="font-mono text-[10.5px] text-hesya-navy-900/85">
                      {tx.providerId}
                    </p>
                    {tx.anomalyHint && (
                      <p className="mt-0.5 text-[10px] text-amber-700">
                        ⚠ {tx.anomalyHint}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5">
                    <span className="inline-flex items-center gap-1.5 text-[11px] text-hesya-navy-900">
                      <span
                        aria-hidden="true"
                        className="inline-block h-2 w-2 rounded-sm"
                        style={{ background: CHANNEL_COLORS[tx.channel] }}
                      />
                      {CHANNEL_LABEL[tx.channel]}
                    </span>
                  </td>
                  <td className="py-2.5 text-[11px] text-hesya-navy-900">
                    {tx.storeName}
                  </td>
                  <td className="py-2.5 text-[11px] text-hesya-navy-900/75">
                    <span aria-hidden="true">{tx.flag}</span> {tx.customer}
                  </td>
                  <td className="py-2.5 text-right">
                    <p className="font-mono text-[11.5px] font-semibold text-hesya-navy-900">
                      ₩{tx.amountKrw.toLocaleString("ko")}
                    </p>
                    {tx.refundedKrw > 0 && (
                      <p className="text-[10px] text-rose-600">
                        −₩{tx.refundedKrw.toLocaleString("ko")}
                      </p>
                    )}
                  </td>
                  <td className="py-2.5 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-[10.5px] ${statusColor[tx.status]}`}
                    >
                      {labels.statusLabel[tx.status]}
                    </span>
                  </td>
                  <td className="px-5 py-2.5 text-right font-mono text-[10.5px] text-hesya-navy-900/55">
                    {tx.capturedAt.slice(5, 16).replace("T", " ")}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}

const CHANNEL_DELTA: Record<PaymentChannel, number> = {
  stripe: 12,
  alipay: 5,
  wechat: -3,
  linepay: 18,
};

const CHANNEL_SPARK: Record<PaymentChannel, ReadonlyArray<number>> = {
  stripe: [0.4, 0.55, 0.5, 0.7, 0.85, 0.78, 0.92],
  alipay: [0.5, 0.45, 0.6, 0.55, 0.68, 0.62, 0.7],
  wechat: [0.6, 0.55, 0.45, 0.5, 0.4, 0.42, 0.38],
  linepay: [0.3, 0.4, 0.5, 0.6, 0.72, 0.85, 0.95],
};

export function ChannelStatTiles({
  rows,
  labels,
}: {
  rows: ReadonlyArray<MockTransaction>;
  labels: PaymentExtraLabels;
}) {
  const channels: PaymentChannel[] = ["stripe", "alipay", "wechat", "linepay"];
  const stats = channels.map((c) => {
    const channelRows = rows.filter((r) => r.channel === c);
    const count = channelRows.length;
    const net = channelRows.reduce((sum, r) => sum + r.netKrw, 0);
    return { channel: c, count, net };
  });

  return (
    <section
      data-testid="admin-payment-channel-stats"
      className="mb-6 rounded-md border border-gray-200 bg-white p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)]"
    >
      <header className="mb-3 flex items-baseline justify-between">
        <h3 className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
          {labels.channelStatsTitle}
        </h3>
        <span className="font-mono text-[10.5px] text-hesya-navy-900/55">
          {labels.channelStatsSubtitle}
        </span>
      </header>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {stats.map((s) => {
          const delta = CHANNEL_DELTA[s.channel];
          const up = delta >= 0;
          const spark = CHANNEL_SPARK[s.channel];
          const max = Math.max(...spark);
          return (
            <div
              key={s.channel}
              className="relative overflow-hidden rounded-md border border-gray-100 bg-white px-4 py-3"
              style={{
                borderLeft: `3px solid ${CHANNEL_COLORS[s.channel]}`,
              }}
            >
              <div className="flex items-center justify-between">
                <span className="text-[12px] font-semibold text-hesya-navy-900">
                  {CHANNEL_LABEL[s.channel]}
                </span>
                <span
                  className={[
                    "font-mono text-[10.5px] font-semibold",
                    up ? "text-emerald-600" : "text-rose-600",
                  ].join(" ")}
                >
                  {up ? "↑" : "↓"} {Math.abs(delta)}%
                </span>
              </div>
              <div className="mt-2 flex items-baseline gap-1.5">
                <span className="font-mono text-[20px] font-semibold tabular-nums leading-none text-hesya-navy-900">
                  {s.count}
                </span>
                <span className="text-[10.5px] text-hesya-navy-900/55">
                  {labels.channelStatTxLabel}
                </span>
              </div>
              <p className="mt-1 font-mono text-[11px] text-hesya-navy-900/70">
                {labels.channelStatNetLabel} ₩{s.net.toLocaleString("ko-KR")}
              </p>
              <svg
                aria-hidden="true"
                viewBox="0 0 70 22"
                className="mt-2 block h-[22px] w-full"
              >
                {spark.map((v, i) => {
                  const x = (i / (spark.length - 1)) * 70;
                  const h = (v / max) * 18 + 2;
                  return (
                    <rect
                      key={i}
                      x={x - 3}
                      y={22 - h}
                      width="5"
                      height={h}
                      rx="1"
                      fill={CHANNEL_COLORS[s.channel]}
                      opacity={0.85}
                    />
                  );
                })}
              </svg>
            </div>
          );
        })}
      </div>
    </section>
  );
}
