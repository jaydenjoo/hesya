"use client";

/**
 * Plan v3 M6 — Monthly bar chart (신규 매장 12개월 추이).
 *
 * 디자인 ref: admin-dashboard.css `Bar chart` (line 352~).
 * 실 데이터 wire: `admin-dashboard.ts:getMonthlyNewStoresCounts`.
 */

import {
  Bar,
  BarChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Datum {
  readonly month: string;
  readonly value: number;
}

interface Props {
  readonly data: ReadonlyArray<Datum>;
}

export function DashboardBarChart({ data }: Props) {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data as Datum[]}
          margin={{ top: 12, right: 8, left: -16, bottom: 0 }}
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
            tick={{
              fontFamily: "var(--font-mono)",
              fontSize: 10,
              fill: "#94a3b8",
            }}
            axisLine={false}
            tickLine={false}
            width={36}
          />
          <Tooltip
            cursor={{ fill: "rgba(220, 168, 90, 0.08)" }}
            contentStyle={{
              border: "1px solid #eef0f3",
              borderRadius: 6,
              fontSize: 12,
              fontFamily: "var(--font-body-kr)",
            }}
            formatter={(v) => [`${v}건`, "신규 매장"]}
          />
          <Bar
            dataKey="value"
            fill="var(--hesya-amber-500)"
            radius={[4, 4, 0, 0]}
          />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
