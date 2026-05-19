"use client";

/**
 * Plan v3 M6 — 한국 지역 분포 heatmap.
 *
 * 디자인 ref: admin-dashboard.css `Korea heatmap` (line 569~).
 * 17개 시도 dot grid + dot 크기/투명도로 매장 수 가중치 표현.
 */

import type { StoreRegionDistribution } from "@/shared/lib/dal/admin-dashboard";

interface Props {
  readonly data: StoreRegionDistribution;
}

export function DashboardKoreaMap({ data }: Props) {
  if (data.empty) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-2"
        style={{ aspectRatio: "4 / 5", maxHeight: 340 }}
      >
        <span className="font-heading text-[24px] font-medium italic leading-none tracking-[-0.025em] text-gray-300">
          —
        </span>
        <span className="font-mono text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-400">
          승인된 매장 없음
        </span>
      </div>
    );
  }

  const maxStores = Math.max(...data.regions.map((r) => r.stores), 1);

  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: "4 / 5", maxHeight: 340 }}
    >
      {/* viewBox는 KOREA_REGIONS 좌표(x 18~70, y 22~88) + 라벨 여유에 맞춰 crop.
          aspect 72:90 = 0.8 이 container aspect 4:5 (0.8)와 일치 → letterbox 0,
          tile 전체를 한국 지도가 채움. 2026-05-19 이전: viewBox="0 0 100 100"
          + 좌표가 우측 1/3에 집중 → tile 좌측 절반이 비어있었음. */}
      <svg
        viewBox="14 12 72 90"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-label="한국 시도별 매장 분포 heatmap"
      >
        <rect x="14" y="12" width="72" height="90" fill="transparent" />
        {data.regions.map((r) => {
          const intensity = r.stores / maxStores;
          const radius = 2.5 + intensity * 5.5;
          const opacity = r.stores === 0 ? 0.15 : 0.25 + intensity * 0.65;
          return (
            <g key={r.code}>
              <circle
                cx={r.x}
                cy={r.y}
                r={radius}
                fill="var(--hesya-amber-500)"
                opacity={opacity}
              />
              <text
                x={r.x}
                y={r.y + radius + 3}
                textAnchor="middle"
                fontFamily="var(--font-body-kr)"
                fontSize="2.4"
                fill="#1a2238"
                fontWeight="600"
              >
                {r.name}
              </text>
              <text
                x={r.x}
                y={r.y + radius + 6}
                textAnchor="middle"
                fontFamily="var(--font-mono)"
                fontSize="2"
                fill="#94a3b8"
              >
                {r.stores}
              </text>
            </g>
          );
        })}
      </svg>
      {data.unknown > 0 ? (
        <p className="absolute bottom-0 right-0 font-mono text-[9.5px] text-gray-400">
          미분류 {data.unknown}건
        </p>
      ) : null}
    </div>
  );
}
