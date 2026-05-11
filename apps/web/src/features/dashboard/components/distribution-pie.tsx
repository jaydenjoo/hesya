"use client";

import { Cell, Pie, PieChart, ResponsiveContainer, Tooltip } from "recharts";

const PALETTE = [
  "#e8a97a", // hesya-amber-500
  "#f5ddc8", // hesya-peach-200
  "#1a2238", // hesya-navy-900
  "#d88b5b", // hesya-amber-600
  "#fdf8f1", // hesya-peach-50
  "#f8e9d9", // hesya-peach-100
];

export interface DistributionSlice {
  label: string;
  value: number;
}

type Props = {
  data: ReadonlyArray<DistributionSlice>;
};

/**
 * Epic 4 (ε) — KPI 카드 chart slot용 작은 도넛 차트.
 *
 * 디자이너/시술 분포 KPI 시각화. 차트 wire 첫 사례.
 * tooltip: label + value. legend는 카드 외부 공간 부족으로 생략 (라벨은 마우스 hover).
 */
export function DistributionPie({ data }: Props) {
  if (data.length === 0) {
    return (
      <div className="flex h-24 items-center justify-center text-xs text-hesya-navy-900/40">
        —
      </div>
    );
  }
  return (
    <div className="h-24 w-full" data-testid="distribution-pie">
      <ResponsiveContainer width="100%" height="100%">
        <PieChart>
          <Pie
            data={data.slice()}
            dataKey="value"
            nameKey="label"
            cx="50%"
            cy="50%"
            innerRadius={20}
            outerRadius={40}
            paddingAngle={2}
            stroke="none"
            isAnimationActive={false}
          >
            {data.map((_, i) => (
              <Cell key={i} fill={PALETTE[i % PALETTE.length]} />
            ))}
          </Pie>
          <Tooltip
            contentStyle={{
              backgroundColor: "white",
              border: "1px solid #f8e9d9",
              borderRadius: "0.375rem",
              fontSize: "12px",
              color: "#1a2238",
            }}
            formatter={(value, label) => [`${String(value)}`, String(label)]}
          />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
}
