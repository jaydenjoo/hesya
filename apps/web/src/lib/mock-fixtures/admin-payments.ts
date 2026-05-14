/**
 * Sprint 2C PR-D3 — Admin payment monitoring rich mock additions.
 *
 * env.MOCK_FIXTURES=true 일 때 /admin/payment-monitoring에 노출되는
 * 12건 거래 + 3 이상 알림 + 정산 mismatch.
 */

export type PaymentChannel = "stripe" | "alipay" | "wechat" | "linepay";
export type PaymentStatus =
  | "captured"
  | "refunded"
  | "partial_refund"
  | "disputed"
  | "failed";

export interface MockTransaction {
  readonly id: string;
  readonly providerId: string;
  readonly channel: PaymentChannel;
  readonly status: PaymentStatus;
  readonly amountKrw: number;
  readonly refundedKrw: number;
  readonly netKrw: number;
  readonly storeName: string;
  readonly customer: string;
  readonly nationality: string;
  readonly flag: string;
  readonly capturedAt: string;
  readonly anomalyHint?: string;
}

export const mockTransactions: ReadonlyArray<MockTransaction> = [
  {
    id: "tx-001",
    providerId: "pi_3OdRz3K8Q4t8XwQa1QGqL2Fz",
    channel: "stripe",
    status: "captured",
    amountKrw: 145_000,
    refundedKrw: 0,
    netKrw: 145_000,
    storeName: "Stylista 홍대점",
    customer: "Yuki T.",
    nationality: "JP",
    flag: "🇯🇵",
    capturedAt: "2026-05-14T08:32:00Z",
  },
  {
    id: "tx-002",
    providerId: "2025051422001432819900123",
    channel: "alipay",
    status: "captured",
    amountKrw: 89_000,
    refundedKrw: 0,
    netKrw: 89_000,
    storeName: "美的空間",
    customer: "Wei C.",
    nationality: "CN",
    flag: "🇨🇳",
    capturedAt: "2026-05-14T07:48:00Z",
  },
  {
    id: "tx-003",
    providerId: "pi_3OdRzKK8Q4t8XwQa2HMxR9Gh",
    channel: "stripe",
    status: "refunded",
    amountKrw: 220_000,
    refundedKrw: 220_000,
    netKrw: 0,
    storeName: "Beauty Haus 강남",
    customer: "Emma P.",
    nationality: "US",
    flag: "🇺🇸",
    capturedAt: "2026-05-14T06:15:00Z",
    anomalyHint: "고객 cancel 24h 전 — 정책상 환불",
  },
  {
    id: "tx-004",
    providerId: "wx_25_05_14_8721",
    channel: "wechat",
    status: "captured",
    amountKrw: 65_000,
    refundedKrw: 0,
    netKrw: 65_000,
    storeName: "Salon de Lumière",
    customer: "Mei Z.",
    nationality: "CN",
    flag: "🇨🇳",
    capturedAt: "2026-05-14T05:50:00Z",
  },
  {
    id: "tx-005",
    providerId: "LP-25051409012",
    channel: "linepay",
    status: "captured",
    amountKrw: 120_000,
    refundedKrw: 0,
    netKrw: 120_000,
    storeName: "Tokyo Hair Lab",
    customer: "Aiko N.",
    nationality: "JP",
    flag: "🇯🇵",
    capturedAt: "2026-05-14T04:22:00Z",
  },
  {
    id: "tx-006",
    providerId: "pi_3OdRzVK8Q4t8XwQa3JFkL7Th",
    channel: "stripe",
    status: "disputed",
    amountKrw: 350_000,
    refundedKrw: 0,
    netKrw: 350_000,
    storeName: "Hera Beauty 신촌",
    customer: "Sophia L.",
    nationality: "SG",
    flag: "🇸🇬",
    capturedAt: "2026-05-13T22:08:00Z",
    anomalyHint: "Stripe dispute open — chargeback 위험",
  },
  {
    id: "tx-007",
    providerId: "2025051419002113882201458",
    channel: "alipay",
    status: "partial_refund",
    amountKrw: 180_000,
    refundedKrw: 60_000,
    netKrw: 120_000,
    storeName: "Glow Studio 이태원",
    customer: "Linh P.",
    nationality: "VN",
    flag: "🇻🇳",
    capturedAt: "2026-05-13T19:00:00Z",
    anomalyHint: "추가 시술 1건 누락 — 부분 환불",
  },
  {
    id: "tx-008",
    providerId: "pi_3OdRzdK8Q4t8XwQa4KGmN8Ui",
    channel: "stripe",
    status: "captured",
    amountKrw: 92_000,
    refundedKrw: 0,
    netKrw: 92_000,
    storeName: "Stylista 홍대점",
    customer: "Olivia W.",
    nationality: "UK",
    flag: "🇬🇧",
    capturedAt: "2026-05-13T16:45:00Z",
  },
  {
    id: "tx-009",
    providerId: "wx_25_05_13_5210",
    channel: "wechat",
    status: "failed",
    amountKrw: 110_000,
    refundedKrw: 0,
    netKrw: 0,
    storeName: "쁘띠살롱 명동",
    customer: "Maya R.",
    nationality: "TH",
    flag: "🇹🇭",
    capturedAt: "2026-05-13T14:30:00Z",
    anomalyHint: "잔액 부족 — capture 실패",
  },
  {
    id: "tx-010",
    providerId: "pi_3OdRzlK8Q4t8XwQa5LHpO9Vj",
    channel: "stripe",
    status: "captured",
    amountKrw: 175_000,
    refundedKrw: 0,
    netKrw: 175_000,
    storeName: "Beauty Haus 강남",
    customer: "Hana K.",
    nationality: "US",
    flag: "🇺🇸",
    capturedAt: "2026-05-13T12:10:00Z",
  },
  {
    id: "tx-011",
    providerId: "LP-25051208017",
    channel: "linepay",
    status: "captured",
    amountKrw: 88_000,
    refundedKrw: 0,
    netKrw: 88_000,
    storeName: "Tokyo Hair Lab",
    customer: "Yui M.",
    nationality: "JP",
    flag: "🇯🇵",
    capturedAt: "2026-05-13T08:55:00Z",
  },
  {
    id: "tx-012",
    providerId: "2025051221008832701991",
    channel: "alipay",
    status: "captured",
    amountKrw: 230_000,
    refundedKrw: 0,
    netKrw: 230_000,
    storeName: "美的空間",
    customer: "Ana S.",
    nationality: "BR",
    flag: "🇧🇷",
    capturedAt: "2026-05-12T21:40:00Z",
  },
];

export const mockPaymentStats = {
  totalGmvKrw: 2_064_000,
  totalNetKrw: 1_604_000,
  totalCount: 12,
  refundCount: 1,
  partialRefundCount: 1,
  disputeCount: 1,
  failedCount: 1,
  refundRate: 0.083,
  channelMix: [
    { channel: "stripe" as PaymentChannel, count: 5, gmvKrw: 982_000 },
    { channel: "alipay" as PaymentChannel, count: 3, gmvKrw: 499_000 },
    { channel: "wechat" as PaymentChannel, count: 2, gmvKrw: 175_000 },
    { channel: "linepay" as PaymentChannel, count: 2, gmvKrw: 208_000 },
  ],
};

export interface PaymentAnomaly {
  readonly icon: string;
  readonly title: string;
  readonly body: string;
  readonly tone: "danger" | "warn" | "info";
  readonly amountKrw?: number;
}

export const mockPaymentAnomalies: ReadonlyArray<PaymentAnomaly> = [
  {
    icon: "🚨",
    title: "Stripe dispute open — Hera Beauty 신촌",
    body: "tx-006 chargeback 위험. 24h 내 evidence 업로드 필요. SGD → KRW 환산 350,000원.",
    tone: "danger",
    amountKrw: 350_000,
  },
  {
    icon: "⚠️",
    title: "WeChat capture fail rate 8.3%",
    body: "tx-009 잔액 부족. WeChat capture 실패율이 어제 대비 +5%p. retry queue 점검 권장.",
    tone: "warn",
  },
  {
    icon: "💡",
    title: "정산 mismatch ₩18,500 (Alipay)",
    body: "Alipay 일일 정산 보고서가 실 capture 합계와 ₩18,500 차이. fee 차감 누락 추정 — provider 확인.",
    tone: "info",
    amountKrw: 18_500,
  },
];
