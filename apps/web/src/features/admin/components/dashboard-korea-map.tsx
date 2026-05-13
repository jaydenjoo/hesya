"use client";

/**
 * Plan v3 M6 — 한국 지역 분포 heatmap.
 *
 * 디자인 ref: admin-dashboard.css `Korea heatmap` (line 569~).
 * 실제 SVG 지도 path 대신 17개 시도 dot grid로 시각 정합성 우선 (Mock 단계).
 * Phase 2 — `stores.region` aggregate + 정식 SVG path로 교체 예정.
 */

interface RegionData {
  readonly code: string;
  readonly name: string;
  readonly stores: number;
  // 정규화된 (x%, y%) 좌표. 한국 본토 + 제주 대략 배치.
  readonly x: number;
  readonly y: number;
}

const REGIONS: readonly RegionData[] = [
  { code: "11", name: "서울", stores: 187, x: 38, y: 32 },
  { code: "41", name: "경기", stores: 142, x: 42, y: 35 },
  { code: "28", name: "인천", stores: 38, x: 30, y: 33 },
  { code: "42", name: "강원", stores: 22, x: 56, y: 26 },
  { code: "43", name: "충북", stores: 27, x: 48, y: 44 },
  { code: "44", name: "충남", stores: 31, x: 36, y: 47 },
  { code: "30", name: "대전", stores: 24, x: 44, y: 50 },
  { code: "36", name: "세종", stores: 9, x: 42, y: 46 },
  { code: "45", name: "전북", stores: 26, x: 38, y: 60 },
  { code: "46", name: "전남", stores: 28, x: 36, y: 72 },
  { code: "29", name: "광주", stores: 21, x: 40, y: 70 },
  { code: "47", name: "경북", stores: 33, x: 58, y: 50 },
  { code: "27", name: "대구", stores: 35, x: 56, y: 58 },
  { code: "26", name: "부산", stores: 64, x: 64, y: 70 },
  { code: "31", name: "울산", stores: 18, x: 66, y: 62 },
  { code: "48", name: "경남", stores: 41, x: 54, y: 68 },
  { code: "50", name: "제주", stores: 17, x: 32, y: 88 },
];

const MAX_STORES = Math.max(...REGIONS.map((r) => r.stores));

export function DashboardKoreaMap() {
  return (
    <div
      className="relative w-full"
      style={{ aspectRatio: "4 / 5", maxHeight: 340 }}
    >
      <svg
        viewBox="0 0 100 100"
        preserveAspectRatio="xMidYMid meet"
        className="absolute inset-0 h-full w-full"
        aria-label="한국 시도별 매장 분포 heatmap"
      >
        <rect width="100" height="100" fill="transparent" />
        {REGIONS.map((r) => {
          const intensity = r.stores / MAX_STORES;
          const radius = 2.5 + intensity * 5.5;
          const opacity = 0.25 + intensity * 0.65;
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
    </div>
  );
}
