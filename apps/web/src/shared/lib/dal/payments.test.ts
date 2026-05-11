import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  bookings,
  createDbClient,
  payments,
  type DbClient,
  type NewPayment,
  type Payment,
} from "@hesya/database";

import { resetDb, seedStore } from "@/test-helpers/db";

import * as dalPayments from "./payments";
import { aggregateMetrics, getPaymentMetrics } from "./payments";

describe("aggregateMetrics (unit, no DB)", () => {
  it("0건: refundRate=0, 모든 금액 0 (NaN 차단)", () => {
    const m = aggregateMetrics([]);
    expect(m.totalCount).toBe(0);
    expect(m.refundCount).toBe(0);
    expect(m.refundRate).toBe(0);
    expect(Number.isFinite(m.refundRate)).toBe(true);
    expect(m.totalAmountKrw).toBe(0);
    expect(m.refundedAmountKrw).toBe(0);
  });

  it("정상: succeeded 8 + refunded 2 → refundRate 0.2", () => {
    const rows = [
      ...mockRows(8, "succeeded", 10_000),
      ...mockRows(2, "refunded", 10_000),
    ];
    const m = aggregateMetrics(rows);
    expect(m.totalCount).toBe(10);
    expect(m.refundCount).toBe(2);
    expect(m.refundRate).toBeCloseTo(0.2, 5);
    expect(m.totalAmountKrw).toBe(100_000);
    expect(m.refundedAmountKrw).toBe(20_000);
  });

  it("threshold 초과: refunded 4 / total 10 → refundRate 0.4 (30% 초과)", () => {
    const rows = [
      ...mockRows(6, "succeeded", 10_000),
      ...mockRows(4, "refunded", 10_000),
    ];
    const m = aggregateMetrics(rows);
    expect(m.refundRate).toBeCloseTo(0.4, 5);
    expect(m.refundRate).toBeGreaterThan(0.3);
  });

  it("amountKrw null 안전: null 결제는 0원으로 합계", () => {
    const rows = [
      ...mockRows(3, "succeeded", 10_000),
      ...mockRows(2, "succeeded", null),
    ];
    const m = aggregateMetrics(rows);
    expect(m.totalCount).toBe(5);
    expect(m.totalAmountKrw).toBe(30_000);
  });

  it("module exports M2.6 insertPayment", () => {
    expect(typeof dalPayments.insertPayment).toBe("function");
  });
});

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.payments (integration)", () => {
  let db: DbClient;
  let storeId: string;
  let bookingId: string;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    storeId = await seedStore(db, { name: "Payment Test Store" });
    const [b] = await db
      .insert(bookings)
      .values({
        storeId,
        scheduledAt: new Date(),
        status: "confirmed",
      })
      .returning({ id: bookings.id });
    if (!b) throw new Error("seed booking failed");
    bookingId = b.id;
  });

  it("getPaymentMetrics: 빈 테이블 → 0건 정상 반환", async () => {
    const m = await getPaymentMetrics(db);
    expect(m.totalCount).toBe(0);
    expect(m.refundRate).toBe(0);
  });

  it("getPaymentMetrics: succeeded 2 + refunded 1 → refundRate 1/3", async () => {
    await db.insert(payments).values([
      { bookingId, status: "succeeded", amountKrw: 50_000 },
      { bookingId, status: "succeeded", amountKrw: 30_000 },
      { bookingId, status: "refunded", amountKrw: 20_000 },
    ] satisfies NewPayment[]);

    const m = await getPaymentMetrics(db);
    expect(m.totalCount).toBe(3);
    expect(m.refundCount).toBe(1);
    expect(m.refundRate).toBeCloseTo(1 / 3, 5);
    expect(m.totalAmountKrw).toBe(100_000);
    expect(m.refundedAmountKrw).toBe(20_000);
  });

  it("getPaymentMetrics: 날짜 범위 필터 — fromDate 이후만", async () => {
    const old = new Date("2026-01-01T00:00:00Z");
    const recent = new Date("2026-05-01T00:00:00Z");
    await db.insert(payments).values([
      { bookingId, status: "succeeded", amountKrw: 1_000, createdAt: old },
      {
        bookingId,
        status: "succeeded",
        amountKrw: 9_000,
        createdAt: recent,
      },
    ] satisfies NewPayment[]);

    const cutoff = new Date("2026-03-01T00:00:00Z");
    const m = await getPaymentMetrics(db, { fromDate: cutoff });
    expect(m.totalCount).toBe(1);
    expect(m.totalAmountKrw).toBe(9_000);
  });
});

function mockRows(
  count: number,
  status: string,
  amountKrw: number | null,
): Payment[] {
  return Array.from({ length: count }, (_, i) => ({
    id: `00000000-0000-4000-8000-${String(i).padStart(12, "0")}`,
    bookingId: null,
    amountKrw,
    amountForeign: null,
    currencyForeign: null,
    exchangeRate: null,
    provider: null,
    providerTransactionId: null,
    status,
    feeSaasKrw: null,
    createdAt: new Date(),
  }));
}
