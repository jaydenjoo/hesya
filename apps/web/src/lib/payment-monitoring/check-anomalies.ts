import "server-only";

import * as Sentry from "@sentry/nextjs";
import type { DbClient } from "@hesya/database";

import { getPaymentMetrics } from "@/shared/lib/dal/payments";

import {
  REFUND_RATE_MIN_SAMPLE_SIZE,
  REFUND_RATE_THRESHOLD,
} from "./thresholds";

/**
 * E12-6 결제이상 모니터링 — 임계치 초과 감지 + Sentry warning 발송.
 *
 * Phase 1-γ.1.2 인프라 단계 — 본 함수는 호출 자체는 가능하나 Epic 2 도입 전엔
 * payments 0건 → 항상 "정상" 반환. cron 등록은 Epic 2 시점에 추가 (지금 등록하면
 * 무한 0건 alert 노이즈).
 *
 * SLA: PRD §1063 매일. 1일 1회 호출 가정. 호출 측이 (Epic 2 시점) 24h 윈도우 지정.
 *
 * 현재 호출처 0건 — Epic 2 도입 시 `app/api/cron/payment-anomalies/route.ts`
 * 또는 QStash schedule에서 매일 1회 호출 예정. admin 페이지(monitoring/page.tsx)는
 * threshold 시각화만 담당, 실제 alert 발송은 본 함수가 cron route에서.
 *
 * @returns 검사 결과. anomalies 배열 비어 있으면 정상.
 */
export interface PaymentAnomaly {
  metric: "refund_rate";
  value: number;
  threshold: number;
  sampleSize: number;
}

export interface AnomalyCheckResult {
  checkedAt: Date;
  totalCount: number;
  anomalies: PaymentAnomaly[];
}

export async function checkPaymentAnomalies(
  db: DbClient,
  options: { fromDate?: Date; toDate?: Date } = {},
): Promise<AnomalyCheckResult> {
  const checkedAt = new Date();
  const metrics = await getPaymentMetrics(db, options);
  const anomalies: PaymentAnomaly[] = [];

  // 환불 비율 임계치 — 표본 부족하면 noise라 skip
  if (
    metrics.totalCount >= REFUND_RATE_MIN_SAMPLE_SIZE &&
    metrics.refundRate > REFUND_RATE_THRESHOLD
  ) {
    anomalies.push({
      metric: "refund_rate",
      value: metrics.refundRate,
      threshold: REFUND_RATE_THRESHOLD,
      sampleSize: metrics.totalCount,
    });
  }

  // 정산 불일치 (provider 합계 vs payments 합계 비교)는 Epic 2에서 provider
  // adapter 도입 후 활성화. 본 단계는 refund_rate 단일 지표.

  for (const a of anomalies) {
    Sentry.captureMessage("payment-anomaly", {
      level: "warning",
      tags: {
        feature: "payment-monitoring",
        metric: a.metric,
      },
      extra: {
        value: a.value,
        threshold: a.threshold,
        sampleSize: a.sampleSize,
        windowFrom: options.fromDate?.toISOString(),
        windowTo: options.toDate?.toISOString(),
      },
    });
  }

  return { checkedAt, totalCount: metrics.totalCount, anomalies };
}
