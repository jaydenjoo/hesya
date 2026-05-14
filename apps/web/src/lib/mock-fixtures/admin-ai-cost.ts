/**
 * Sprint 2C PR-D1 — Admin AI Cost rich mock additions.
 *
 * env.MOCK_FIXTURES=true 일 때만 노출되는 보조 차트용 데이터.
 * Reference: docs/design/reference/admin-ai-cost.html (시간대 히트맵 + endpoint table).
 */

export interface HourlyHeatCell {
  readonly day: number; // 0=Mon
  readonly hour: number; // 0-23
  readonly costKrw: number;
}

/** 7 × 24 = 168 cells. 평일 9-18 비즈니스 시간 피크, 일요일 낮음. */
export const mockHourlyHeatmap: ReadonlyArray<HourlyHeatCell> = (() => {
  const cells: HourlyHeatCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 0; h < 24; h++) {
      let base = 0;
      if (d < 5) {
        // 평일
        if (h >= 9 && h <= 12) base = 3500 + Math.floor(Math.random() * 1500);
        else if (h >= 13 && h <= 18)
          base = 4200 + Math.floor(Math.random() * 1800);
        else if (h >= 19 && h <= 22)
          base = 2100 + Math.floor(Math.random() * 900);
        else base = 400 + Math.floor(Math.random() * 600);
      } else if (d === 5) {
        // 토
        if (h >= 10 && h <= 20) base = 1800 + Math.floor(Math.random() * 1200);
        else base = 200 + Math.floor(Math.random() * 400);
      } else {
        // 일
        if (h >= 11 && h <= 18) base = 900 + Math.floor(Math.random() * 600);
        else base = 100 + Math.floor(Math.random() * 300);
      }
      cells.push({ day: d, hour: h, costKrw: base });
    }
  }
  return cells;
})();

export interface EndpointCostRow {
  readonly endpoint: string;
  readonly description: string;
  readonly messageCount: number;
  readonly costKrw: number;
  readonly sharePct: number;
  readonly p95LatencyMs: number;
  readonly errorRate: number;
}

export const mockEndpointCosts: ReadonlyArray<EndpointCostRow> = [
  {
    endpoint: "POST /api/inbox/reply",
    description: "Owner inbox AI reply suggestion",
    messageCount: 8420,
    costKrw: 312_400,
    sharePct: 38,
    p95LatencyMs: 1280,
    errorRate: 0.4,
  },
  {
    endpoint: "POST /api/photo/analyze",
    description: "Customer reference photo audit",
    messageCount: 1840,
    costKrw: 218_600,
    sharePct: 27,
    p95LatencyMs: 3400,
    errorRate: 1.2,
  },
  {
    endpoint: "POST /api/llm/translate",
    description: "Live message translate 6 langs",
    messageCount: 14280,
    costKrw: 132_900,
    sharePct: 16,
    p95LatencyMs: 580,
    errorRate: 0.1,
  },
  {
    endpoint: "POST /api/llm/audit",
    description: "Tone-of-voice audit per reply",
    messageCount: 6210,
    costKrw: 78_400,
    sharePct: 10,
    p95LatencyMs: 940,
    errorRate: 0.3,
  },
  {
    endpoint: "POST /api/llm/tone-learn",
    description: "Owner store tone fine-learning",
    messageCount: 312,
    costKrw: 41_200,
    sharePct: 5,
    p95LatencyMs: 2100,
    errorRate: 0.0,
  },
  {
    endpoint: "POST /api/llm/anomaly",
    description: "Booking anomaly detection",
    messageCount: 720,
    costKrw: 18_500,
    sharePct: 2,
    p95LatencyMs: 1450,
    errorRate: 0.2,
  },
  {
    endpoint: "POST /api/llm/insights",
    description: "Owner analytics insight band",
    messageCount: 240,
    costKrw: 11_400,
    sharePct: 1,
    p95LatencyMs: 4200,
    errorRate: 0.8,
  },
  {
    endpoint: "POST /api/llm/seo",
    description: "Store SEO meta auto-gen",
    messageCount: 96,
    costKrw: 6_200,
    sharePct: 1,
    p95LatencyMs: 1850,
    errorRate: 0.0,
  },
];

export interface AnomalyAlert {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly tone: "danger" | "warn" | "info";
  readonly delta: string;
}

export const mockAnomalyAlerts: ReadonlyArray<AnomalyAlert> = [
  {
    icon: "🔥",
    title: "claude-opus-4-7 spike",
    body: "Photo analyze 호출이 어제 대비 +127% 증가. 베타 매장 5곳 prefetch 캐시 미스 가능성.",
    tone: "danger",
    delta: "+127%",
  },
  {
    icon: "⚠️",
    title: "p95 latency 4.2s on /llm/insights",
    body: "Owner analytics insight band 호출이 평소(1.8s) 대비 2.3배 느림. 모델 router fallback 발생.",
    tone: "warn",
    delta: "p95 +133%",
  },
  {
    icon: "💡",
    title: "Translate 비용 -18% (Haiku 4.5 switch)",
    body: "이번 주 Translate 모델을 Sonnet → Haiku 4.5로 옮긴 후 비용 18% 감소. 품질 회귀 0건.",
    tone: "info",
    delta: "-18%",
  },
];

export const mockBudgetForecast = {
  monthToDateKrw: 4_820_000,
  monthBudgetKrw: 8_000_000,
  forecastEomKrw: 7_240_000,
  daysRemaining: 12,
  pacingPct: 60,
};
