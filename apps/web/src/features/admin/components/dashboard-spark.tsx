"use client";

/**
 * Plan v3 M6 — AI cost daily sparkline (30일).
 *
 * 디자인 ref: admin-dashboard.css `Sparkline` (line 441~).
 * 실 데이터 wire: `admin-dashboard.ts:getDailyAiCostSpark`.
 */

import { Area, AreaChart, ResponsiveContainer } from "recharts";

interface Datum {
  readonly d: number;
  readonly v: number;
}

interface Props {
  readonly data: ReadonlyArray<Datum>;
}

export function DashboardSpark({ data }: Props) {
  return (
    <div className="h-[60px] w-full">
      <ResponsiveContainer width="100%" height="100%">
        <AreaChart
          data={data as Datum[]}
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
