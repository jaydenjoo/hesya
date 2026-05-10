import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import {
  createDbClient,
  customers,
  messages,
  type DbClient,
} from "@hesya/database";

import { resetDb, seedConversation, seedStore } from "@/test-helpers/db";

import { aggregateAccuracy, getAccuracyMetrics } from "./ai-accuracy";

type DraftSignalRow = {
  draftStatus: string | null;
  editedFromAi: boolean | null;
};

describe("aggregateAccuracy (unit, no DB)", () => {
  it("0건: accuracy=0, 모든 카운트 0 (NaN 차단)", () => {
    const m = aggregateAccuracy([]);
    expect(m.sampleSize).toBe(0);
    expect(m.acceptedCount).toBe(0);
    expect(m.editedCount).toBe(0);
    expect(m.skippedCount).toBe(0);
    expect(m.accuracy).toBe(0);
    expect(Number.isFinite(m.accuracy)).toBe(true);
  });

  it("정상: sent 8 (no edit) + edited 1 + skipped 1 → accuracy 0.8", () => {
    const rows: DraftSignalRow[] = [
      ...mockRows(8, "sent", false),
      ...mockRows(1, "sent", true),
      ...mockRows(1, "skipped", null),
    ];
    const m = aggregateAccuracy(rows);
    expect(m.sampleSize).toBe(10);
    expect(m.acceptedCount).toBe(8);
    expect(m.editedCount).toBe(1);
    expect(m.skippedCount).toBe(1);
    expect(m.accuracy).toBeCloseTo(0.8, 5);
  });

  it("threshold 미달: sent 7 (no edit) + edited 2 + skipped 1 → accuracy 0.7", () => {
    const rows: DraftSignalRow[] = [
      ...mockRows(7, "sent", false),
      ...mockRows(2, "sent", true),
      ...mockRows(1, "skipped", null),
    ];
    const m = aggregateAccuracy(rows);
    expect(m.accuracy).toBeCloseTo(0.7, 5);
    expect(m.accuracy).toBeLessThan(0.9);
  });

  it("editedFromAi null vs false 모두 '수정 없음'으로 처리되지 않음 (true만 edited 카운트)", () => {
    // null → 사장이 review 거치지 않은 sent (legacy 흐름) — 정확/수정 구분 모호.
    // 1차 정의: editedFromAi=true만 edited, 그 외(false/null)는 accepted.
    const rows: DraftSignalRow[] = [
      ...mockRows(2, "sent", null),
      ...mockRows(1, "sent", true),
    ];
    const m = aggregateAccuracy(rows);
    expect(m.acceptedCount).toBe(2);
    expect(m.editedCount).toBe(1);
    expect(m.accuracy).toBeCloseTo(2 / 3, 5);
  });

  it("필터링: pending_review/approved/direct/null은 분모 무시", () => {
    const rows: DraftSignalRow[] = [
      ...mockRows(3, "sent", false),
      // 아래는 모두 무시되어야 함
      ...mockRows(5, "pending_review", null),
      ...mockRows(2, "approved", null),
      ...mockRows(4, "direct", null),
      ...mockRows(1, null, null),
    ];
    const m = aggregateAccuracy(rows);
    expect(m.sampleSize).toBe(3);
    expect(m.accuracy).toBe(1);
  });
});

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.ai-accuracy (integration)", () => {
  let db: DbClient;
  let storeId: string;
  let conversationId: string;
  let customerId: string;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    storeId = await seedStore(db, { name: "AI Accuracy Test Store" });
    const [c] = await db
      .insert(customers)
      .values({ channel: "instagram", externalId: "test_cust" })
      .returning({ id: customers.id });
    if (!c) throw new Error("seed customer failed");
    customerId = c.id;

    conversationId = await seedConversation(db, {
      storeId,
      customerId,
      channel: "instagram",
    });
  });

  it("getAccuracyMetrics: 빈 messages → sampleSize 0, accuracy 0", async () => {
    const m = await getAccuracyMetrics(db);
    expect(m.sampleSize).toBe(0);
    expect(m.accuracy).toBe(0);
  });

  it("getAccuracyMetrics: outbound sent 2 (1 edited) + skipped 1 + pending_review 5 → 표본 3, accuracy 1/3", async () => {
    await db.insert(messages).values([
      // 분모 포함 (sent + skipped 3건)
      {
        conversationId,
        direction: "outbound",
        draftStatus: "sent",
        editedFromAi: false,
        originalText: "hi",
      },
      {
        conversationId,
        direction: "outbound",
        draftStatus: "sent",
        editedFromAi: true,
        originalText: "hello",
      },
      {
        conversationId,
        direction: "outbound",
        draftStatus: "skipped",
        editedFromAi: null,
        originalText: "skipped draft",
      },
      // 분모 무시 (pending_review 5건 + direct 2건 + inbound 1건)
      {
        conversationId,
        direction: "outbound",
        draftStatus: "pending_review",
        originalText: "wip 1",
      },
      {
        conversationId,
        direction: "outbound",
        draftStatus: "pending_review",
        originalText: "wip 2",
      },
      {
        conversationId,
        direction: "outbound",
        draftStatus: "direct",
        originalText: "manual",
      },
      {
        conversationId,
        direction: "inbound",
        draftStatus: "sent",
        editedFromAi: false,
        originalText: "incoming",
      },
    ]);

    const m = await getAccuracyMetrics(db);
    expect(m.sampleSize).toBe(3);
    expect(m.acceptedCount).toBe(1);
    expect(m.editedCount).toBe(1);
    expect(m.skippedCount).toBe(1);
    expect(m.accuracy).toBeCloseTo(1 / 3, 5);
  });

  it("getAccuracyMetrics: 날짜 범위 필터 — fromDate 이후만", async () => {
    const old = new Date("2026-01-01T00:00:00Z");
    const recent = new Date("2026-05-01T00:00:00Z");
    await db.insert(messages).values([
      {
        conversationId,
        direction: "outbound",
        draftStatus: "sent",
        editedFromAi: false,
        originalText: "old",
        createdAt: old,
      },
      {
        conversationId,
        direction: "outbound",
        draftStatus: "sent",
        editedFromAi: true,
        originalText: "recent",
        createdAt: recent,
      },
    ]);

    const cutoff = new Date("2026-03-01T00:00:00Z");
    const m = await getAccuracyMetrics(db, { fromDate: cutoff });
    expect(m.sampleSize).toBe(1);
    expect(m.acceptedCount).toBe(0);
    expect(m.editedCount).toBe(1);
  });
});

function mockRows(
  count: number,
  draftStatus: string | null,
  editedFromAi: boolean | null,
): DraftSignalRow[] {
  return Array.from({ length: count }, () => ({ draftStatus, editedFromAi }));
}
