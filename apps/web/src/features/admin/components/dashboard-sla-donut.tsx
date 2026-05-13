"use client";

/**
 * Plan v3 M6 — Dispute SLA donut (24h 처리율).
 *
 * 디자인 ref: admin-dashboard.css `SLA circular meter` (line 496~).
 * Mock data — `disputes` DAL에 SLA aggregate 추가 후 wire.
 */

import { Cell, Pie, PieChart, ResponsiveContainer } from "recharts";

const SLA_PCT = 92;
const DATA = [
  { name: "withinSla", value: SLA_PCT },
  { name: "breach", value: 100 - SLA_PCT },
];
const COLORS = ["var(--hesya-amber-500)", "#eef0f3"];

export function DashboardSlaDonut() {
  return (
    <div className="relative flex h-[160px] w-full items-center justify-center">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={DATA}
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
            {DATA.map((_, i) => (
              <Cell key={i} fill={COLORS[i]} />
            ))}
          </Pie>
        </PieChart>
      </ResponsiveContainer>
      <div className="pointer-events-none absolute inset-0 flex flex-col items-center justify-center">
        <span className="font-heading text-[28px] font-medium italic leading-none tracking-[-0.025em] text-hesya-navy-900">
          {SLA_PCT}
          <span className="ml-0.5 align-top text-[14px] not-italic">%</span>
        </span>
        <span className="mt-1 font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-500">
          24H SLA
        </span>
      </div>
    </div>
  );
}
