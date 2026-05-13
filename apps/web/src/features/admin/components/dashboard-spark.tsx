"use client";

/**
 * Plan v3 M6 — AI cost daily sparkline (30일).
 *
 * 디자인 ref: admin-dashboard.css `Sparkline` (line 441~).
 * Mock data — 실 데이터는 `/admin/ai-cost` DAL과 통합 시 wire.
 */

import { Area, AreaChart, ResponsiveContainer } from "recharts";

const MOCK_DATA = Array.from({ length: 30 }, (_, i) => ({
  d: i,
  // 12,000 ~ 38,000 사이 잔잔한 변동
  v: 18000 + Math.round(Math.sin(i / 3) * 6000 + Math.random() * 4000),
}));

export function DashboardSpark() {
  return (
    <div className="h-[60px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={MOCK_DATA}
          margin={{ top: 4, right: 0, left: 0, bottom: 0 }}
        >
          <defs>
            <linearGradient id="adSparkFill" x1="0" y1="0" x2="0" y2="1">
              <stop
                offset="0%"
                stopColor="var(--hesya-amber-500)"
                stopOpacity={0.32}
              />
              <stop
                offset="100%"
                stopColor="var(--hesya-amber-500)"
                stopOpacity={0}
              />
            </linearGradient>
          </defs>
          <Area
            type="monotone"
            dataKey="v"
            stroke="var(--hesya-amber-500)"
            strokeWidth={1.6}
            fill="url(#adSparkFill)"
          />
        </AreaChart>
      </ResponsiveContainer>
    </div>
  );
}
