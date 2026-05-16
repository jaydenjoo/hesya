import { redirect } from "next/navigation";
import { getTranslations } from "next-intl/server";
import { createDbClient } from "@hesya/database";

import { PageHeader } from "@/components/ui/page-header";
import {
  ChannelMix,
  ChannelStatTiles,
  PaymentAnomalyBand,
  PaymentFunnel,
  SettlementReconciliation,
  TransactionTable,
  type PaymentExtraLabels,
} from "@/features/admin-payments/mock-extras";
import {
  mockPaymentAnomalies,
  mockPaymentFunnel,
  mockPaymentStats,
  mockSettlementReconciliation,
  mockTransactions,
} from "@/lib/mock-fixtures/admin-payments";
import { env } from "@/shared/config/env";
import {
  REFUND_RATE_MIN_SAMPLE_SIZE,
  REFUND_RATE_THRESHOLD,
  SETTLEMENT_MISMATCH_THRESHOLD_KRW,
} from "@/lib/payment-monitoring/thresholds";
import { getPaymentMetrics } from "@/shared/lib/dal/payments";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";

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
  const guard = await requireAdminRole();
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
  const samplePct = Math.min(
    100,
    (metrics.totalCount / REFUND_RATE_MIN_SAMPLE_SIZE) * 100,
  );
  const refundRatePct = metrics.refundRate * 100;
  const totalDecisions =
    metrics.totalCount > 0 ? metrics.totalCount : metrics.refundCount;
  const refundSharePct =
    totalDecisions > 0 ? (metrics.refundCount / totalDecisions) * 100 : 0;

  const t = await getTranslations({ locale, namespace: "AdminPayments" });
  const extraLabels: PaymentExtraLabels = {
    anomalyTitle: t("anomalyTitle"),
    txTitle: t("txTitle"),
    txSubtitle: t("txSubtitle"),
    txCols: {
      providerId: t("txCols.providerId"),
      channel: t("txCols.channel"),
      store: t("txCols.store"),
      customer: t("txCols.customer"),
      amount: t("txCols.amount"),
      status: t("txCols.status"),
      capturedAt: t("txCols.capturedAt"),
    },
    statusLabel: {
      captured: t("status.captured"),
      refunded: t("status.refunded"),
      partial_refund: t("status.partial_refund"),
      disputed: t("status.disputed"),
      failed: t("status.failed"),
    },
    mixTitle: t("mixTitle"),
    mixGmv: t("mixGmv"),
    channelStatsTitle: t("channelStatsTitle"),
    channelStatsSubtitle: t("channelStatsSubtitle"),
    channelStatTxLabel: t("channelStatTxLabel"),
    channelStatNetLabel: t("channelStatNetLabel"),
    settlementTitle: t("settlementTitle"),
    settlementSubtitle: t("settlementSubtitle"),
    settlementCols: {
      channel: t("settlementCols.channel"),
      providerReported: t("settlementCols.providerReported"),
      capturedTotal: t("settlementCols.capturedTotal"),
      mismatch: t("settlementCols.mismatch"),
      note: t("settlementCols.note"),
    },
    settlementMatch: t("settlementMatch"),
    funnelTitle: t("funnelTitle"),
    funnelSubtitle: t("funnelSubtitle"),
    funnelSteps: {
      captured: t("funnelSteps.captured"),
      refunded: t("funnelSteps.refunded"),
      disputed: t("funnelSteps.disputed"),
      failed: t("funnelSteps.failed"),
    },
  };

  return (
    <div className="min-h-full bg-hesya-peach-50/30">
      <PageHeader
        eyebrow="Admin · Payment Monitoring"
        title="결제이상 모니터링"
        subtitle={`24시간 윈도우. 환불 비율 ${(REFUND_RATE_THRESHOLD * 100).toFixed(0)}% 초과 시 Sentry warning. 정산 불일치 ₩${SETTLEMENT_MISMATCH_THRESHOLD_KRW.toLocaleString()} 초과 시 알림.`}
        right={
          <p className="font-mono text-[11px] text-hesya-navy-900/55">
            최근 검사: {now.toISOString()}
          </p>
        }
      />
      <div className="container py-8">
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
            subtext={`최소 표본 ${REFUND_RATE_MIN_SAMPLE_SIZE}건 필요`}
            progressPct={samplePct}
            tone={hasData ? "ok" : "muted"}
          />
          <MetricCard
            label="환불 건수 (24h)"
            value={metrics.refundCount.toString()}
            unit="건"
            subtext={
              totalDecisions > 0
                ? `share ${refundSharePct.toFixed(0)}%`
                : "결제 0건"
            }
            progressPct={totalDecisions > 0 ? refundSharePct : undefined}
            tone={metrics.refundCount > 0 ? "warn" : "muted"}
          />
          <MetricCard
            label="환불 비율 (24h)"
            value={(metrics.refundRate * 100).toFixed(1)}
            unit="%"
            alert={refundRateExceeded}
            alertReason={`임계치 ${(REFUND_RATE_THRESHOLD * 100).toFixed(0)}% 초과`}
            progressPct={hasData ? refundRatePct : undefined}
            thresholdPct={REFUND_RATE_THRESHOLD * 100}
            tone={refundRateExceeded ? "danger" : hasData ? "ok" : "muted"}
          />
          <MetricCard
            label="총 결제액 (24h)"
            value={`₩${metrics.totalAmountKrw.toLocaleString()}`}
            subtext={`환불액 ₩${metrics.refundedAmountKrw.toLocaleString()}`}
            tone={hasData ? "ok" : "muted"}
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

        {env.MOCK_FIXTURES && (
          <>
            <div className="mt-10 mb-4 flex items-baseline gap-2">
              <span className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.18em] text-hesya-amber-600">
                {t("richSection")}
              </span>
              <span className="h-px flex-1 bg-hesya-navy-900/8" />
            </div>

            <PaymentAnomalyBand
              anomalies={mockPaymentAnomalies}
              title={extraLabels.anomalyTitle}
            />

            <ChannelStatTiles rows={mockTransactions} labels={extraLabels} />

            <div className="mb-6 grid grid-cols-1 gap-4 lg:grid-cols-5">
              <div className="lg:col-span-3">
                <SettlementReconciliation
                  rows={mockSettlementReconciliation}
                  labels={extraLabels}
                />
              </div>
              <div className="lg:col-span-2">
                <PaymentFunnel steps={mockPaymentFunnel} labels={extraLabels} />
              </div>
            </div>

            <ChannelMix
              data={mockPaymentStats.channelMix}
              title={extraLabels.mixTitle}
              gmvLabel={extraLabels.mixGmv}
            />

            <TransactionTable rows={mockTransactions} labels={extraLabels} />
          </>
        )}
      </div>
    </div>
  );
}

function MetricCard({
  label,
  value,
  unit,
  subtext,
  alert,
  alertReason,
  progressPct,
  thresholdPct,
  tone = "muted",
}: {
  label: string;
  value: string;
  unit?: string;
  subtext?: string;
  alert?: boolean;
  alertReason?: string;
  /** 0~100. 미전달 시 progress bar 미렌더. */
  progressPct?: number;
  /** 0~100. progress 위에 vertical marker 표시 (임계치). */
  thresholdPct?: number;
  /** progress bar 색조. */
  tone?: "ok" | "warn" | "danger" | "muted";
}) {
  const barTone = alert
    ? "bg-[#c9483a]"
    : tone === "ok"
      ? "bg-emerald-500"
      : tone === "warn"
        ? "bg-hesya-amber-500"
        : tone === "danger"
          ? "bg-[#c9483a]"
          : "bg-hesya-navy-900/30";
  return (
    <div
      className={`rounded-md border p-5 shadow-[0_1px_2px_rgba(26,34,56,0.04)] transition ${
        alert
          ? "border-[#e5c0ba] bg-[#faefec]"
          : "border-gray-200 bg-white hover:border-hesya-amber-500/40"
      }`}
    >
      <div className="font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-gray-700">
        {label}
      </div>
      <div className="mt-2 flex items-baseline gap-1.5">
        <span
          className={`font-heading text-[28px] font-medium italic leading-none tracking-[-0.02em] ${
            alert ? "text-[#c9483a]" : "text-hesya-navy-900"
          }`}
        >
          {value}
        </span>
        {unit && (
          <span className="text-[12px] font-medium text-gray-500">{unit}</span>
        )}
      </div>
      {subtext && (
        <div className="mt-1.5 text-[11px] text-gray-500">{subtext}</div>
      )}
      {progressPct !== undefined && (
        <div className="relative mt-2.5 h-1.5 overflow-hidden rounded-full bg-hesya-peach-50">
          <div
            className={`h-full ${barTone}`}
            style={{ width: `${Math.min(100, Math.max(0, progressPct))}%` }}
          />
          {thresholdPct !== undefined && (
            <span
              aria-hidden="true"
              className="absolute top-[-2px] h-[10px] w-px bg-hesya-navy-900/55"
              style={{ left: `${Math.min(100, Math.max(0, thresholdPct))}%` }}
            />
          )}
        </div>
      )}
      {alert && alertReason && (
        <div className="mt-2 font-mono text-[10.5px] font-semibold uppercase tracking-[0.16em] text-[#c9483a]">
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
