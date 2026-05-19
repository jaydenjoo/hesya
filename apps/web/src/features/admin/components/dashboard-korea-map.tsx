"use client";

/**
 * Plan v3 M6 — 지역별 활성 매장 분포 (admin dashboard tile).
 *
 * 디자인 ref: `docs/design/reference/Hesya Admin Dashboard.html` § REGIONAL DISTRIBUTION
 * (line 380-476) + `admin-dashboard.css .ad-map / .ad-region-row / .ad-map-legend`
 * (line 569-638).
 *
 * 시각 모델 (이전 dot-map과 다름):
 *   - **6 grouped region** filled polygon (서울·경기 / 강원 / 충청 / 경상 / 전라 / 제주)
 *     — KOSIS 17 시도 코드를 6개로 집계.
 *   - 색상 강도 5단계 (#FBF1E6 → #D88B5B) — 매장 수가 많을수록 진해짐.
 *   - 2-col 레이아웃: 좌측 지도 + 우측 막대 list + LOW/HIGH legend.
 *   - 합계 \"전체 N개\"는 page.tsx tile-head에서 표시.
 *
 * 2026-05-19 — 이전 17개 dot-map은 ref와 시각 모델 불일치였음. ref HTML의 path 좌표
 * 와 색상 스케일을 그대로 사용해 정합. DAL `getStoreRegionDistribution`은 17 시도
 * shape 유지 (다른 사용처 영향 0) — 본 컴포넌트 내부에서 6개로 집계.
 */

import type {
  StoreRegionDistribution,
  StoreRegionRow,
} from "@/shared/lib/dal/admin-dashboard";

interface Props {
  readonly data: StoreRegionDistribution;
}

/**
 * 17 KOSIS 시도 → 6 region group 집계.
 *
 * code 매핑은 KOSIS 행정구역분류와 디자인 ref `서울·경기 / 강원 / 충청 / 경상 / 전라
 * / 제주` 그룹핑 기준.
 */
const REGION_GROUPS: ReadonlyArray<{
  readonly key: string;
  readonly label: string;
  readonly memberCodes: ReadonlyArray<string>;
  /** ref svg path d 속성 (viewBox 240×300) */
  readonly path: string;
  /** 라벨 텍스트 좌표 */
  readonly labelX: number;
  readonly labelY: number;
  /** count 텍스트 y offset (labelY + 12) */
  readonly countYOffset: number;
  /** 라벨 폰트 크기 */
  readonly labelSize: number;
  /** 라벨 색상 (어두운 배경이면 흰색) */
  readonly labelDark: boolean;
}> = [
  {
    key: "gangwon",
    label: "강원",
    memberCodes: ["42"],
    path: "M150,30 L210,40 L215,90 L165,110 L130,80 Z",
    labelX: 172,
    labelY: 70,
    countYOffset: 12,
    labelSize: 9,
    labelDark: false,
  },
  {
    key: "seoul-gyeonggi",
    label: "서울·경기",
    memberCodes: ["11", "28", "41"], // 서울 + 인천 + 경기
    path: "M70,50 L150,30 L130,80 L100,110 L60,100 L50,75 Z",
    labelX: 100,
    labelY: 72,
    countYOffset: 14,
    labelSize: 11,
    labelDark: true,
  },
  {
    key: "chungcheong",
    label: "충청",
    memberCodes: ["30", "36", "43", "44"], // 대전 + 세종 + 충북 + 충남
    path: "M60,100 L100,110 L130,80 L165,110 L160,160 L90,165 L70,140 Z",
    labelX: 115,
    labelY: 135,
    countYOffset: 12,
    labelSize: 9,
    labelDark: false,
  },
  {
    key: "gyeongsang",
    label: "경상",
    memberCodes: ["26", "27", "31", "47", "48"], // 부산 + 대구 + 울산 + 경북 + 경남
    path: "M165,110 L215,90 L220,180 L185,235 L160,225 L160,160 Z",
    labelX: 190,
    labelY: 160,
    countYOffset: 12,
    labelSize: 10,
    labelDark: true,
  },
  {
    key: "jeolla",
    label: "전라",
    memberCodes: ["29", "45", "46"], // 광주 + 전북 + 전남
    path: "M70,140 L90,165 L160,160 L160,225 L130,250 L90,240 L60,200 Z",
    labelX: 115,
    labelY: 200,
    countYOffset: 12,
    labelSize: 9,
    labelDark: false,
  },
] as const;

/** ref `.ad-map-legend .scale` — LOW → HIGH 5단계 amber. */
const HEAT_COLORS = [
  "#FBF1E6",
  "#F8E9D9",
  "#F5DDC8",
  "#E8A97A",
  "#D88B5B",
] as const;

/** 값을 0~4 bucket으로 매핑 (max 기준 분위). 0건은 가장 옅은 색. */
function colorBucket(count: number, max: number): string {
  if (max === 0 || count === 0) return HEAT_COLORS[0]!;
  const ratio = count / max;
  if (ratio <= 0.2) return HEAT_COLORS[0]!;
  if (ratio <= 0.4) return HEAT_COLORS[1]!;
  if (ratio <= 0.6) return HEAT_COLORS[2]!;
  if (ratio <= 0.8) return HEAT_COLORS[3]!;
  return HEAT_COLORS[4]!;
}

interface GroupedRow {
  readonly key: string;
  readonly label: string;
  readonly count: number;
}

function aggregateToGroups(
  regions: readonly StoreRegionRow[],
): readonly GroupedRow[] {
  const byCode = new Map(regions.map((r) => [r.code, r.stores]));
  const mainland = REGION_GROUPS.map((g) => ({
    key: g.key,
    label: g.label,
    count: g.memberCodes.reduce((s, c) => s + (byCode.get(c) ?? 0), 0),
  }));
  // 제주는 main map polygon 대신 별도 ellipse — 그룹 row만 추가.
  mainland.push({
    key: "jeju",
    label: "제주",
    count: byCode.get("50") ?? 0,
  });
  return mainland;
}

export function DashboardKoreaMap({ data }: Props) {
  if (data.empty) {
    return (
      <div
        className="flex w-full flex-col items-center justify-center gap-2"
        style={{ aspectRatio: "4 / 3", maxHeight: 320 }}
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

  const groups = aggregateToGroups(data.regions);
  const jejuCount = groups.find((g) => g.key === "jeju")?.count ?? 0;
  const max = Math.max(...groups.map((g) => g.count), 1);
  // 막대 list — 큰 값 순.
  const sorted = [...groups].sort((a, b) => b.count - a.count);

  return (
    <div className="mt-3 grid grid-cols-[1.4fr_1fr] items-start gap-4">
      {/* 좌측 지도 */}
      <svg
        viewBox="0 0 240 300"
        preserveAspectRatio="xMidYMid meet"
        className="block w-full"
        aria-label="한국 지역별 매장 분포 지도"
      >
        {REGION_GROUPS.map((g) => {
          const groupRow = groups.find((r) => r.key === g.key);
          const count = groupRow?.count ?? 0;
          const fill = colorBucket(count, max);
          return (
            <g key={g.key}>
              <path d={g.path} fill={fill} stroke="#FFFFFF" strokeWidth="1.5" />
              <text
                x={g.labelX}
                y={g.labelY}
                fontFamily="var(--font-body-kr)"
                fontSize={g.labelSize}
                fontWeight={g.labelDark ? 600 : 500}
                fill={g.labelDark ? "#FDF8F1" : "#1A2238"}
                textAnchor="middle"
              >
                {g.label}
              </text>
              <text
                x={g.labelX}
                y={g.labelY + g.countYOffset}
                fontFamily="var(--font-mono)"
                fontSize={g.labelDark ? 9 : 8}
                fill={g.labelDark ? "#FDF8F1" : "#7C7E83"}
                textAnchor="middle"
              >
                {count}
              </text>
            </g>
          );
        })}
        {/* 제주 — ref 425~427 ellipse */}
        <ellipse
          cx="90"
          cy="285"
          rx="22"
          ry="9"
          fill={colorBucket(jejuCount, max)}
          stroke="#FFFFFF"
          strokeWidth="1.5"
        />
        <text
          x="90"
          y="288"
          fontFamily="var(--font-body-kr)"
          fontSize="8"
          fill="#1A2238"
          textAnchor="middle"
        >
          제주 {jejuCount}
        </text>
      </svg>

      {/* 우측 막대 list + legend */}
      <div>
        <ul className="flex flex-col gap-1.5">
          {sorted.map((row) => {
            const pct = max > 0 ? (row.count / max) * 100 : 0;
            return (
              <li
                key={row.key}
                className="grid grid-cols-[60px_1fr_38px] items-center gap-2.5 text-[11.5px] tracking-[-0.005em] text-hesya-navy-900"
              >
                <span className="font-medium">{row.label}</span>
                <div className="h-1.5 overflow-hidden rounded-[3px] bg-gray-100">
                  <span
                    aria-hidden="true"
                    className="block h-full rounded-[3px] bg-hesya-navy-900"
                    style={{ width: `${pct}%` }}
                  />
                </div>
                <span className="text-right font-mono text-[11px] text-gray-500">
                  {row.count}
                </span>
              </li>
            );
          })}
        </ul>
        <div className="mt-3 flex items-center gap-2 font-body-en text-[9.5px] font-bold uppercase tracking-[0.18em] text-gray-500">
          <span>LOW</span>
          <div className="flex h-1.5 w-20 overflow-hidden rounded-[3px]">
            {HEAT_COLORS.map((c) => (
              <span
                key={c}
                aria-hidden="true"
                className="flex-1"
                style={{ background: c }}
              />
            ))}
          </div>
          <span>HIGH</span>
        </div>
        {data.unknown > 0 ? (
          <p className="mt-2 font-mono text-[9.5px] text-gray-400">
            미분류 {data.unknown}건
          </p>
        ) : null}
      </div>
    </div>
  );
}
