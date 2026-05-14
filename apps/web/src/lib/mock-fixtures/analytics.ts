/**
 * Sprint 2C PR-C3 — Owner Analytics rich mock charts data.
 *
 * Reference: `docs/design/reference/analytics-charts1.jsx` + `analytics-charts2.jsx`.
 * 4 추가 차트 (Heatmap / Funnel / CohortTable / StackedBar) + InsightBand.
 * 베타 데이터 적재 전 시연용. analytics DAL이 데이터 충분히 쌓이면 자동 swap.
 */

/** 시술 시간대 히트맵 — 요일×시간 (월~일 × 09~22, 14 cells). */
export interface HeatmapCell {
  readonly day: number; // 0=Mon
  readonly hour: number; // 9~22
  readonly value: number; // 0~100 (예약 강도)
}

export const mockHeatmapDays: ReadonlyArray<string> = [
  "월",
  "화",
  "수",
  "목",
  "금",
  "토",
  "일",
];

export const mockHeatmapHours: ReadonlyArray<number> = Array.from(
  { length: 14 },
  (_, i) => 9 + i,
);

/** 7 × 14 = 98 cells. realistic 분포: 평일 14-19 피크, 주말 11-15. */
export const mockHeatmapData: ReadonlyArray<HeatmapCell> = (() => {
  const cells: HeatmapCell[] = [];
  for (let d = 0; d < 7; d++) {
    for (let h = 9; h <= 22; h++) {
      let v = 0;
      if (d < 5) {
        // 평일: 14-19 피크
        if (h >= 14 && h <= 19) v = 70 + Math.floor(Math.random() * 30);
        else if (h >= 11 && h <= 13) v = 40 + Math.floor(Math.random() * 30);
        else if (h >= 20 && h <= 21) v = 30 + Math.floor(Math.random() * 20);
        else v = 5 + Math.floor(Math.random() * 25);
      } else {
        // 주말: 11-15 피크
        if (h >= 11 && h <= 15) v = 75 + Math.floor(Math.random() * 25);
        else if (h >= 16 && h <= 19) v = 50 + Math.floor(Math.random() * 25);
        else if (h >= 9 && h <= 10) v = 25 + Math.floor(Math.random() * 25);
        else v = 5 + Math.floor(Math.random() * 20);
      }
      cells.push({ day: d, hour: h, value: v });
    }
  }
  return cells;
})();

/** 구매 깔때기 6 stage. */
export interface FunnelStage {
  readonly label: string;
  readonly value: number;
  readonly hint?: string;
}

export const mockFunnelStages: ReadonlyArray<FunnelStage> = [
  {
    label: "Customer Landing 진입",
    value: 12480,
    hint: "지난 30일 unique 방문",
  },
  { label: "매장 상세 진입", value: 6230, hint: "매장 카드 클릭" },
  { label: "AI 사진 분석 사용", value: 2890, hint: "Vision API hit" },
  { label: "예약 시작", value: 1820 },
  { label: "예약금 결제", value: 1245 },
  { label: "방문 완료", value: 1158, hint: "노쇼 87건 제외" },
];

/** 신규 손님 코호트 6개월 × 6 슬롯 retention. */
export interface CohortRow {
  readonly cohort: string; // YYYY-MM
  readonly size: number;
  readonly retention: ReadonlyArray<number | null>; // 6 slots, null = future
}

export const mockCohortRows: ReadonlyArray<CohortRow> = [
  { cohort: "2025-11", size: 248, retention: [100, 32, 18, 12, 9, 7] },
  { cohort: "2025-12", size: 312, retention: [100, 28, 19, 13, 8, null] },
  { cohort: "2026-01", size: 285, retention: [100, 35, 22, 15, null, null] },
  { cohort: "2026-02", size: 401, retention: [100, 38, 24, null, null, null] },
  {
    cohort: "2026-03",
    size: 478,
    retention: [100, 41, null, null, null, null],
  },
  {
    cohort: "2026-04",
    size: 312,
    retention: [100, null, null, null, null, null],
  },
];

export const mockCohortSlots: ReadonlyArray<string> = [
  "M+0",
  "M+1",
  "M+2",
  "M+3",
  "M+4",
  "M+5",
];

/** Stacked bar: 6 개월 매출을 결제 수단별 분해. */
export interface StackedBarMonth {
  readonly month: string;
  readonly stripe: number;
  readonly alipay: number;
  readonly wechat: number;
  readonly linepay: number;
}

export const mockStackedBarData: ReadonlyArray<StackedBarMonth> = [
  {
    month: "Nov",
    stripe: 8200000,
    alipay: 3100000,
    wechat: 1900000,
    linepay: 800000,
  },
  {
    month: "Dec",
    stripe: 9800000,
    alipay: 4200000,
    wechat: 2400000,
    linepay: 950000,
  },
  {
    month: "Jan",
    stripe: 11200000,
    alipay: 5100000,
    wechat: 3100000,
    linepay: 1100000,
  },
  {
    month: "Feb",
    stripe: 12500000,
    alipay: 5800000,
    wechat: 3600000,
    linepay: 1300000,
  },
  {
    month: "Mar",
    stripe: 14800000,
    alipay: 6700000,
    wechat: 4200000,
    linepay: 1500000,
  },
  {
    month: "Apr",
    stripe: 16200000,
    alipay: 7400000,
    wechat: 4900000,
    linepay: 1750000,
  },
];

/** AI 분석 인사이트 밴드 — 데이터 기반 자동 추출 메시지 3건. */
export interface MockInsight {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly tone: "positive" | "warning" | "info";
}

export const mockInsights: ReadonlyArray<MockInsight> = [
  {
    icon: "📈",
    title: "외국인 손님 매출 +47%",
    body: "최근 3개월 대비 일본·중국 손님 매출이 47% 상승. K-드라마 헤어 컷 시술 비중이 가장 큼.",
    tone: "positive",
  },
  {
    icon: "⚠️",
    title: "토요일 14-15시 슬롯 부족",
    body: "토요일 14-15시 예약 거절 12건 발생. 이 시간대 디자이너 추가 배치 검토 권장.",
    tone: "warning",
  },
  {
    icon: "💡",
    title: "재방문률 35% (Cohort 2026-01)",
    body: "1월 신규 손님 285명 중 35%가 다음 달 재방문. 평균 대비 +7%p.",
    tone: "info",
  },
];
