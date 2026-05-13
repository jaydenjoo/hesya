"use client";

/**
 * Plan v3 M6 — Monthly bar chart (신규 매장 12개월 추이).
 *
 * 디자인 ref: admin-dashboard.css `Bar chart` (line 352~).
 * Mock data — Phase 2 진입 시 `admin-dashboard.ts` DAL에 monthly aggregate 추가 후 실 데이터 wire.
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

const MOCK_DATA = [
  { month: "5월", value: 28 },
  { month: "6월", value: 42 },
  { month: "7월", value: 51 },
  { month: "8월", value: 63 },
  { month: "9월", value: 72 },
  { month: "10월", value: 88 },
  { month: "11월", value: 94 },
  { month: "12월", value: 107 },
  { month: "1월", value: 121 },
  { month: "2월", value: 138 },
  { month: "3월", value: 152 },
  { month: "4월", value: 187 },
];

export function DashboardBarChart() {
  return (
    <div className="h-[220px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={MOCK_DATA}
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
