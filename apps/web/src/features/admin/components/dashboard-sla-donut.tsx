"use client";

/**
 * Plan v3 M6 — Dispute SLA donut (24h 처리율).
 *
 * 디자인 ref: admin-dashboard.css `SLA circular meter` (line 496~).
 */

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

import type { DisputeSlaResolution } from "@/shared/lib/dal/admin-dashboard";

const COLORS = ["var(--hesya-amber-500)", "#eef0f3"];

interface Props {
  readonly data: DisputeSlaResolution;
}

export function DashboardSlaDonut({ data }: Props) {
  if (data.empty) {
    return (
      <div className="flex h-[160px] w-full flex-col items-center justify-center gap-1.5">
        <span className="font-heading text-[26px] font-medium italic leading-none tracking-[-0.025em] text-gray-300">
          —
        </span>
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-400">
          최근 30일 자료 없음
        </span>
      </div>
    );
  }

  const chartData = [
    { name: "withinSla", value: data.pct },
    { name: "breach", value: 100 - data.pct },
  ];

  return (
    <div className="relative flex h-[160px] w-full items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={chartData}
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={68}
            startAngle={90}
            endAngle={-270}
            paddingAngle={0}
            strokeWidth={0}
            dataKey="value"
            isAnimationActive={false}
          >
            {chartData.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-[28px] font-medium italic leading-none tracking-[-0.025em] text-hesya-navy-900">
          {data.pct}
          <span className="ml-0.5 align-top text-[14px] not-italic">%</span>
        </span>
        <span className="mt-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-500">
          30일 SLA · {data.withinSla}/{data.totalResolved}
        </span>
      </div>
    </div>
  );
}
