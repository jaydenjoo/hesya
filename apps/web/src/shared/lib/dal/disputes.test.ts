import { beforeAll, beforeEach, describe, expect, it } from "vitest";
import { createDbClient, type DbClient } from "@hesya/database";

import { resetDb, seedStore } from "@/test-helpers/db";
import {
  computeSlaDueAt,
  createDispute,
  getDispute,
  listDisputesByStore,
  listDisputesForAdmin,
  updateDisputeStatus,
} from "./disputes";

describe("computeSlaDueAt (unit, no DB)", () => {
  it("월요일 09:00 + 5 영업일 = 다음 주 월요일", () => {
    // 2026-05-04 (월)
    const start = new Date(Date.UTC(2026, 4, 4, 9, 0, 0));
    const due = computeSlaDueAt(start);
    // 다음 주 월요일 (2026-05-11)
    expect(due.getUTCFullYear()).toBe(2026);
    expect(due.getUTCMonth()).toBe(4);
    expect(due.getUTCDate()).toBe(11);
    expect(due.getUTCDay()).toBe(1); // Mon
  });

  it("금요일 시작 + 5 영업일 = 다음 주 금요일", () => {
    // 2026-05-08 (금)
    const start = new Date(Date.UTC(2026, 4, 8, 9, 0, 0));
    const due = computeSlaDueAt(start);
    // 다음 주 금요일 (2026-05-15)
    expect(due.getUTCDate()).toBe(15);
    expect(due.getUTCDay()).toBe(5);
  });

  it("주말은 영업일 카운트 안 함", () => {
    // 2026-05-09 (토)
    const start = new Date(Date.UTC(2026, 4, 9, 9, 0, 0));
    const due = computeSlaDueAt(start);
    // 토→월 시작 → +5 영업일 = 다음 주 금요일 (2026-05-15)
    expect(due.getUTCDate()).toBe(15);
    expect(due.getUTCDay()).toBe(5);
  });
});

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.disputes (integration)", () => {
  let db: DbClient;
  let storeId: string;

  const filedByUserId = "00000000-0000-4000-8000-000000000001";
  const adminUserId = "00000000-0000-4000-8000-0000000000aa";

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    storeId = await seedStore(db);
  });

  it("createDispute: 신규 분쟁 생성 + slaDueAt 자동 계산", async () => {
    const dispute = await createDispute(db, {
      storeId,
      filedByUserId,
      category: "no_show",
      description: "고객 노쇼, 환불 요청",
    });

    expect(dispute.id).toBeDefined();
    expect(dispute.storeId).toBe(storeId);
    expect(dispute.category).toBe("no_show");
    expect(dispute.status).toBe("open");
    expect(dispute.slaDueAt.getTime()).toBeGreaterThan(
      dispute.createdAt.getTime(),
    );
  });

  it("getDispute: 단건 조회", async () => {
    const created = await createDispute(db, {
      storeId,
      filedByUserId,
      category: "refund",
      description: "환불 요청",
    });
    const got = await getDispute(db, created.id);
    expect(got).not.toBeNull();
    expect(got!.id).toBe(created.id);
  });

  it("listDisputesForAdmin: status 필터", async () => {
    await createDispute(db, {
      storeId,
      filedByUserId,
      category: "no_show",
      description: "1",
    });
    await createDispute(db, {
      storeId,
      filedByUserId,
      category: "complaint",
      description: "2",
    });

    const open = await listDisputesForAdmin(db, { status: "open" });
    expect(open).toHaveLength(2);

    const resolved = await listDisputesForAdmin(db, { status: "resolved" });
    expect(resolved).toHaveLength(0);
  });

  it("listDisputesByStore: 매장별 list", async () => {
    await createDispute(db, {
      storeId,
      filedByUserId,
      category: "no_show",
      description: "x",
    });
    const list = await listDisputesByStore(db, storeId);
    expect(list).toHaveLength(1);
  });

  it("updateDisputeStatus: open → resolved 전이 + resolvedAt 채움", async () => {
    const created = await createDispute(db, {
      storeId,
      filedByUserId,
      category: "no_show",
      description: "x",
    });

    const updated = await updateDisputeStatus(db, created.id, {
      status: "resolved",
      resolution: "환불 처리 완료",
      resolvedByUserId: adminUserId,
    });

    expect(updated).not.toBeNull();
    expect(updated!.status).toBe("resolved");
    expect(updated!.resolution).toBe("환불 처리 완료");
    expect(updated!.resolvedByUserId).toBe(adminUserId);
    expect(updated!.resolvedAt).not.toBeNull();
  });

  it("updateDisputeStatus: open → in_review (resolvedAt null 유지)", async () => {
    const created = await createDispute(db, {
      storeId,
      filedByUserId,
      category: "complaint",
      description: "x",
    });

    const updated = await updateDisputeStatus(db, created.id, {
      status: "in_review",
      resolvedByUserId: adminUserId,
    });

    expect(updated!.status).toBe("in_review");
    expect(updated!.resolvedAt).toBeNull();
  });

  it("updateDisputeStatus: in_review → rejected 전이 가능", async () => {
    const created = await createDispute(db, {
      storeId,
      filedByUserId,
      category: "refund",
      description: "x",
    });
    await updateDisputeStatus(db, created.id, {
      status: "in_review",
      resolvedByUserId: adminUserId,
    });
    const final = await updateDisputeStatus(db, created.id, {
      status: "rejected",
      resolution: "유효하지 않은 신고",
      resolvedByUserId: adminUserId,
    });

    expect(final!.status).toBe("rejected");
    expect(final!.resolvedAt).not.toBeNull();
  });

  it("updateDisputeStatus: 이미 resolved된 row 재갱신 안 됨 (null 반환)", async () => {
    const created = await createDispute(db, {
      storeId,
      filedByUserId,
      category: "no_show",
      description: "x",
    });
    await updateDisputeStatus(db, created.id, {
      status: "resolved",
      resolvedByUserId: adminUserId,
    });
    const second = await updateDisputeStatus(db, created.id, {
      status: "rejected",
      resolvedByUserId: adminUserId,
    });
    expect(second).toBeNull();
  });
});
