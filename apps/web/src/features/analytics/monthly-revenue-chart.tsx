"use client";

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

/**
 * Plan v4 Sprint 1 Epic E — 매장 월별 매출 bar chart.
 *
 * 6개월 매출(KRW) bar. 디자인 토큰: hesya-amber-500 채움. Tooltip은
 * 월 + 매출 + booking 수 모두 표시.
 */

interface Datum {
  readonly month: string;
  readonly revenueKrw: number;
  readonly bookingCount: number;
}

interface Props {
  readonly data: ReadonlyArray<Datum>;
}

const formatKrw = (v: number) => `₩${(v / 10000).toFixed(0)}만`;

export function MonthlyRevenueChart({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-[220px] items-center justify-center text-[12px] text-hesya-navy-900/40">
        데이터 없음
      </div>
    );
  }
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data as Datum[]}
          margin={{ top: 12, right: 8, left: -8, bottom: 0 }}
        >
          <CartesianGrid stroke="#eef0f3" vertical={false} />
          <XAxis
            dataKey="month"
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fill: "#94a3b8",
            }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tickFormatter={formatKrw}
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fill: "#94a3b8",
            }}
            axisLine={false}
            tickLine={false}
            width={48}
          />
          <Tooltip
            cursor={{ fill: "rgba(220, 168, 90, 0.08)" }}
            contentStyle={{
              border: "1px solid #eef0f3",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "var(--font-body-kr)",
            }}
            formatter={(value, name, item) => {
              if (name === "revenueKrw") {
                const krw = Number(value);
                const count = (item?.payload as Datum)?.bookingCount ?? 0;
                return [`₩${krw.toLocaleString("ko-KR")} · ${count}건`, "매출"];
              }
              return [String(value), String(name)];
            }}
          />
          <Bar
            dataKey="revenueKrw"
            fill="var(--hesya-amber-500)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
