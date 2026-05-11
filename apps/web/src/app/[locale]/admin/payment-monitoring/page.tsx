import { redirect } from "next/navigation";
import { createDbClient } from "@hesya/database";

import { env } from "@/shared/config/env";
import {
  REFUND_RATE_MIN_SAMPLE_SIZE,
  REFUND_RATE_THRESHOLD,
  SETTLEMENT_MISMATCH_THRESHOLD_KRW,
} from "@/lib/payment-monitoring/thresholds";
import { getPaymentMetrics } from "@/shared/lib/dal/payments";
import { requireAdminEmail } from "@/shared/lib/admin-guard";

/**
 * E12-6 결제이상 모니터링 — admin 대시보드 (Phase 1-γ.1.2 인프라 단계).
 *
 * Epic 2(결제) 17%(스키마만, 데이터 0건) → 항상 "결제 데이터 없음" 표시.
 * Epic 2 도입 후 자동으로 metrics + 위험 카드 활성화.
 *
 * 24h 윈도우 — 어제 자정~지금. PRD §1063 "매일" SLA에 맞춰.
 */
export default async function AdminPaymentMonitoringPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  const guard = await requireAdminEmail();
  if (!guard.ok) {
    redirect(`/${locale}/sign-in`);
  }

  const now = new Date();
  const twentyFourHoursAgo = new Date(now.getTime() - 24 * 60 * 60 * 1000);
  const db = createDbClient(env.DATABASE_URL);
  const metrics = await getPaymentMetrics(db, {
    fromDate: twentyFourHoursAgo,
    toDate: now,
  });

  const refundRateExceeded =
    metrics.totalCount >= REFUND_RATE_MIN_SAMPLE_SIZE &&
    metrics.refundRate > REFUND_RATE_THRESHOLD;
  const hasData = metrics.totalCount > 0;

  return (
    <main className="container py-12">
      <header className="mb-8 space-y-2">
        <h1 className="text-2xl font-bold tracking-[-0.02em] text-hesya-navy-900">
          결제이상 모니터링
        </h1>
        <p className="text-sm text-hesya-navy-900/70">
          24시간 윈도우. 환불 비율 {(REFUND_RATE_THRESHOLD * 100).toFixed(0)}%
          초과 시 Sentry warning. 정산 불일치 ₩
          {SETTLEMENT_MISMATCH_THRESHOLD_KRW.toLocaleString()} 초과 시 알림.
        </p>
        <p className="text-xs text-hesya-navy-900/60">
          최근 검사: {now.toISOString()}
        </p>
      </header>

      {!hasData && (
        <section className="mb-8 rounded-md border border-hesya-peach-200 bg-hesya-peach-50/60 p-4">
          <h2 className="font-semibold text-hesya-navy-900">
            결제 데이터 없음
          </h2>
          <p className="mt-1 text-sm text-hesya-navy-900/80">
            Epic 2 (결제 위젯, Stripe/Alipay/WeChat) 도입 전 단계. payments
            테이블 0건 — 모니터링 인프라만 활성화. Epic 2 도입 후 24h 윈도우
            결제 데이터로 자동 활성화됩니다.
          </p>
        </section>
      )}

      <section className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          label="총 결제 건수 (24h)"
          value={metrics.totalCount.toString()}
          unit="건"
        />
        <MetricCard
          label="환불 건수 (24h)"
          value={metrics.refundCount.toString()}
          unit="건"
        />
        <MetricCard
          label="환불 비율 (24h)"
          value={(metrics.refundRate * 100).toFixed(1)}
          unit="%"
          alert={refundRateExceeded}
          alertReason={`임계치 ${(REFUND_RATE_THRESHOLD * 100).toFixed(0)}% 초과`}
        />
        <MetricCard
          label="총 결제액 (24h)"
          value={`₩${metrics.totalAmountKrw.toLocaleString()}`}
          subtext={`환불액 ₩${metrics.refundedAmountKrw.toLocaleString()}`}
        />
      </section>

      <section className="mt-10 space-y-4">
        <h2 className="text-xl font-semibold text-hesya-navy-900">
          임계치 정의
        </h2>
        <ul className="space-y-2 text-sm">
          <ThresholdItem
            label="환불 비율"
            value={`${(REFUND_RATE_THRESHOLD * 100).toFixed(0)}% 초과`}
            note={`최소 표본 ${REFUND_RATE_MIN_SAMPLE_SIZE}건 이상일 때만 평가`}
          />
          <ThresholdItem
            label="정산 불일치 (KRW)"
            value={`₩${SETTLEMENT_MISMATCH_THRESHOLD_KRW.toLocaleString()} 초과`}
            note="Epic 2 provider adapter 도입 후 활성화"
          />
        </ul>
        <p className="text-xs text-hesya-navy-900/60">
          임계치는 코드 상수 (
          <code className="font-mono">
            apps/web/src/lib/payment-monitoring/thresholds.ts
          </code>
          ). 베타 운영 데이터 누적 후 admin UI 설정으로 전환 예정.
        </p>
      </section>
    </main>
  );
}

function MetricCard({
  label,
  value,
  unit,
  subtext,
  alert,
  alertReason,
}: {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  alert?: boolean;
  alertReason?: string;
}) {
  return (
    <div
      className={`rounded-md border p-4 ${
        alert ? "border-red-300 bg-red-50" : "border-hesya-peach-100 bg-white"
      }`}
    >
      <div className="text-xs font-medium text-hesya-navy-900/70">{label}</div>
      <div className="mt-2 flex items-baseline gap-1">
        <span
          className={`text-2xl font-bold tracking-[-0.01em] ${
            alert ? "text-red-900" : "text-hesya-navy-900"
          }`}
        >
          {value}
        </span>
        {unit && <span className="text-sm text-hesya-navy-900/70">{unit}</span>}
      </div>
      {subtext && (
        <div className="mt-1 text-xs text-hesya-navy-900/60">{subtext}</div>
      )}
      {alert && alertReason && (
        <div className="mt-2 text-xs font-medium text-red-700">
          ⚠ {alertReason}
        </div>
      )}
    </div>
  );
}

function ThresholdItem({
  label,
  value,
  note,
}: {
  label: string;
  value: string;
  note: string;
}) {
  return (
    <li className="flex flex-wrap items-baseline gap-x-3 gap-y-1">
      <span className="font-medium text-hesya-navy-900">{label}:</span>
      <span className="font-mono">{value}</span>
      <span className="text-xs text-hesya-navy-900/60">— {note}</span>
    </li>
  );
}
