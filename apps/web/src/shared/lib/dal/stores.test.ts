import { describe, it, expect, beforeAll, beforeEach } from "vitest";
import {
  createDbClient,
  eq,
  storeVerifications,
  stores,
  type DbClient,
} from "@hesya/database";
import * as dalStores from "./stores";
import {
  approveStore,
  findStoreByExternalAccount,
  findStoreNameByConversationId,
  getStoreBotMode,
  getStorePublicById,
  getStoreVerificationDetail,
  listStoresPendingReview,
  rejectStore,
  setStoreBotMode,
} from "./stores";
import { upsertIntegration } from "./store-integrations";
import { upsertConversation } from "./conversations";
import { resetDb, seedStore, seedCustomer, seedUser } from "@/test-helpers/db";

describe("dal.stores (pure)", () => {
  it("module exports findStoreByExternalAccount function", () => {
    expect(typeof dalStores.findStoreByExternalAccount).toBe("function");
  });

  it("module exports findStoreNameByConversationId function (B-2)", () => {
    expect(typeof dalStores.findStoreNameByConversationId).toBe("function");
  });

  it("module exports Phase 1-β review-mode functions", () => {
    expect(typeof dalStores.getStoreBotMode).toBe("function");
    expect(typeof dalStores.setStoreBotMode).toBe("function");
    expect(typeof dalStores.listStoresPendingReview).toBe("function");
    expect(typeof dalStores.approveStore).toBe("function");
    expect(typeof dalStores.rejectStore).toBe("function");
    expect(typeof dalStores.getStoreVerificationDetail).toBe("function");
  });

  it("module exports M2.1 customer-side function", () => {
    expect(typeof dalStores.getStorePublicById).toBe("function");
  });

  it("approveStore + rejectStore use db.transaction (atomicity)", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile("src/shared/lib/dal/stores.ts", "utf-8");
    expect(src).toMatch(/approveStore[\s\S]*?\.transaction\(/);
    expect(src).toMatch(/rejectStore[\s\S]*?\.transaction\(/);
  });
});

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

describe.skipIf(!hasDb)("dal.stores (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
  });

  describe("findStoreByExternalAccount", () => {
    it("연결된 (channel, externalAccountId) 일치 → 매장 반환", async () => {
      const storeId = await seedStore(db);
      await upsertIntegration(db, {
        storeId,
        channel: "instagram",
        externalAccountId: "ig_acc_001",
        accessToken: "tok_test",
        scopes: ["instagram_business_basic"],
      });

      const found = await findStoreByExternalAccount(db, {
        channel: "instagram",
        externalAccountId: "ig_acc_001",
      });

      expect(found).toEqual({ id: storeId });
    });

    it("미연결 externalAccountId → null", async () => {
      const found = await findStoreByExternalAccount(db, {
        channel: "instagram",
        externalAccountId: "ig_acc_unknown",
      });
      expect(found).toBeNull();
    });

    it("같은 externalAccountId여도 channel 다르면 null", async () => {
      const storeId = await seedStore(db);
      await upsertIntegration(db, {
        storeId,
        channel: "instagram",
        externalAccountId: "shared_id",
        accessToken: "tok_test",
        scopes: ["instagram_business_basic"],
      });

      const found = await findStoreByExternalAccount(db, {
        channel: "messenger",
        externalAccountId: "shared_id",
      });
      expect(found).toBeNull();
    });

    it("E12-9: stores.deletedAt IS NOT NULL → null (soft-deleted 매장 라우팅 차단)", async () => {
      const { stores } = await import("@hesya/database");
      const { eq } = await import("@hesya/database");
      const storeId = await seedStore(db);
      await upsertIntegration(db, {
        storeId,
        channel: "instagram",
        externalAccountId: "ig_acc_deleted",
        accessToken: "tok_test",
        scopes: ["instagram_business_basic"],
      });

      // 정상 라우팅 baseline
      expect(
        await findStoreByExternalAccount(db, {
          channel: "instagram",
          externalAccountId: "ig_acc_deleted",
        }),
      ).toEqual({ id: storeId });

      // soft-delete 표시 후 차단 확인
      await db
        .update(stores)
        .set({ deletedAt: new Date() })
        .where(eq(stores.id, storeId));

      const found = await findStoreByExternalAccount(db, {
        channel: "instagram",
        externalAccountId: "ig_acc_deleted",
      });
      expect(found).toBeNull();
    });
  });

  describe("findStoreNameByConversationId (B-2)", () => {
    it("conversation→store 조인으로 이름 반환", async () => {
      const storeId = await seedStore(db, { name: "맛있는 빵집" });
      const customerId = await seedCustomer(db, {
        channel: "instagram",
        externalId: "igsid_b2_1",
      });
      const conv = await upsertConversation(db, {
        storeId,
        customerId,
        channel: "instagram",
      });

      const name = await findStoreNameByConversationId(db, conv.id);
      expect(name).toBe("맛있는 빵집");
    });

    it("존재하지 않는 conversationId → null", async () => {
      const name = await findStoreNameByConversationId(
        db,
        "00000000-0000-0000-0000-000000000000",
      );
      expect(name).toBeNull();
    });
  });

  describe("Phase 1-β review-mode helpers", () => {
    it("getStoreBotMode: 신규 매장은 default false", async () => {
      const storeId = await seedStore(db);
      const mode = await getStoreBotMode(db, storeId);
      expect(mode).toBe(false);
    });

    it("setStoreBotMode + getStoreBotMode round-trip", async () => {
      const storeId = await seedStore(db);
      await setStoreBotMode(db, storeId, true);
      expect(await getStoreBotMode(db, storeId)).toBe(true);
      await setStoreBotMode(db, storeId, false);
      expect(await getStoreBotMode(db, storeId)).toBe(false);
    });

    it("listStoresPendingReview: verification_status='manual_review'인 매장만 반환", async () => {
      const pendingId = await seedStore(db, { name: "검수대기" });
      const approvedId = await seedStore(db, { name: "승인됨" });
      // 일반 store는 verification_status 미설정 → manual_review 아님
      await db
        .update(stores)
        .set({ verificationStatus: "manual_review" })
        .where(eq(stores.id, pendingId));
      await db
        .update(stores)
        .set({ verificationStatus: "auto_approved" })
        .where(eq(stores.id, approvedId));

      const pending = await listStoresPendingReview(db);
      const ids = pending.map((s) => s.id);
      expect(ids).toContain(pendingId);
      expect(ids).not.toContain(approvedId);
    });

    it("approveStore: stores + storeVerifications atomically auto_approved", async () => {
      const storeId = await seedStore(db);
      const reviewerId = await seedUser(db, {
        email: `rev-approve-${Date.now()}@test.local`,
      });
      await db
        .update(stores)
        .set({ verificationStatus: "manual_review" })
        .where(eq(stores.id, storeId));
      const [verRow] = await db
        .insert(storeVerifications)
        .values({
          storeId,
          businessNumber: "0000000001",
          representativeName: "Test Rep",
          verificationStatus: "manual_review",
        })
        .returning({ id: storeVerifications.id });
      if (!verRow) throw new Error("verification seed failed");

      await approveStore(db, {
        storeId,
        verificationId: verRow.id,
        reviewerId,
      });

      const [s] = await db
        .select({ status: stores.verificationStatus })
        .from(stores)
        .where(eq(stores.id, storeId));
      const [v] = await db
        .select({
          status: storeVerifications.verificationStatus,
          reviewedBy: storeVerifications.reviewedBy,
          reviewedAt: storeVerifications.reviewedAt,
        })
        .from(storeVerifications)
        .where(eq(storeVerifications.id, verRow.id));
      expect(s?.status).toBe("auto_approved");
      expect(v?.status).toBe("auto_approved");
      expect(v?.reviewedBy).toBe(reviewerId);
      expect(v?.reviewedAt).toBeInstanceOf(Date);
    });

    it("getStoreVerificationDetail: store + verification 둘 다 있을 때 join 결과 반환", async () => {
      const storeId = await seedStore(db, { name: "검수상세 매장" });
      const [verRow] = await db
        .insert(storeVerifications)
        .values({
          storeId,
          businessNumber: "0000000099",
          representativeName: "Detail Rep",
          declarationNoMassage: true,
          declarationNoMedicalDevice: true,
          declarationNoOrientalMedicine: true,
          verificationStatus: "manual_review",
        })
        .returning({ id: storeVerifications.id });
      if (!verRow) throw new Error("verification seed failed");

      const detail = await getStoreVerificationDetail(db, storeId);
      expect(detail).not.toBeNull();
      expect(detail?.store.id).toBe(storeId);
      expect(detail?.store.name).toBe("검수상세 매장");
      expect(detail?.verification.id).toBe(verRow.id);
      expect(detail?.verification.businessNumber).toBe("0000000099");
      expect(detail?.verification.representativeName).toBe("Detail Rep");
      expect(detail?.verification.declarationNoMassage).toBe(true);
      expect(detail?.verification.declarationNoMedicalDevice).toBe(true);
      expect(detail?.verification.declarationNoOrientalMedicine).toBe(true);
    });

    it("getStoreVerificationDetail: store 미존재 → null", async () => {
      const detail = await getStoreVerificationDetail(
        db,
        "00000000-0000-0000-0000-000000000000",
      );
      expect(detail).toBeNull();
    });

    it("getStoreVerificationDetail: store는 있지만 verification 없으면 → null", async () => {
      const storeId = await seedStore(db);
      const detail = await getStoreVerificationDetail(db, storeId);
      expect(detail).toBeNull();
    });

    describe("getStorePublicById (M2.1)", () => {
      it("auto_approved 매장 → 정보 반환", async () => {
        const storeId = await seedStore(db, { name: "데모 헤어샵" });
        await db
          .update(stores)
          .set({
            verificationStatus: "auto_approved",
            category: "hair_general",
            region: "서울 강남구",
          })
          .where(eq(stores.id, storeId));

        const result = await getStorePublicById(db, storeId);
        expect(result).not.toBeNull();
        expect(result?.id).toBe(storeId);
        expect(result?.name).toBe("데모 헤어샵");
        expect(result?.category).toBe("hair_general");
        expect(result?.region).toBe("서울 강남구");
      });

      it("manual_review 매장 → null (외부 노출 차단)", async () => {
        const storeId = await seedStore(db);
        await db
          .update(stores)
          .set({ verificationStatus: "manual_review" })
          .where(eq(stores.id, storeId));

        const result = await getStorePublicById(db, storeId);
        expect(result).toBeNull();
      });

      it("soft-deleted 매장 → null (30일 grace 중 차단)", async () => {
        const storeId = await seedStore(db);
        await db
          .update(stores)
          .set({
            verificationStatus: "auto_approved",
            deletedAt: new Date(),
            deletionReason: "owner_request",
          })
          .where(eq(stores.id, storeId));

        const result = await getStorePublicById(db, storeId);
        expect(result).toBeNull();
      });

      it("미존재 UUID → null", async () => {
        const result = await getStorePublicById(
          db,
          "00000000-0000-0000-0000-000000000000",
        );
        expect(result).toBeNull();
      });
    });

    it("rejectStore: stores + storeVerifications atomically rejected + reason", async () => {
      const storeId = await seedStore(db);
      const reviewerId = await seedUser(db, {
        email: `rev-reject-${Date.now()}@test.local`,
      });
      await db
        .update(stores)
        .set({ verificationStatus: "manual_review" })
        .where(eq(stores.id, storeId));
      const [verRow] = await db
        .insert(storeVerifications)
        .values({
          storeId,
          businessNumber: "0000000002",
          representativeName: "Test Rep2",
          verificationStatus: "manual_review",
        })
        .returning({ id: storeVerifications.id });
      if (!verRow) throw new Error("verification seed failed");

      await rejectStore(db, {
        storeId,
        verificationId: verRow.id,
        reviewerId,
        reason: "사업자 등록 정보 불일치",
      });

      const [s] = await db
        .select({ status: stores.verificationStatus })
        .from(stores)
        .where(eq(stores.id, storeId));
      const [v] = await db
        .select({
          status: storeVerifications.verificationStatus,
          reviewedBy: storeVerifications.reviewedBy,
          reviewedAt: storeVerifications.reviewedAt,
          rejectionReason: storeVerifications.rejectionReason,
        })
        .from(storeVerifications)
        .where(eq(storeVerifications.id, verRow.id));
      expect(s?.status).toBe("rejected");
      expect(v?.status).toBe("rejected");
      expect(v?.reviewedBy).toBe(reviewerId);
      expect(v?.reviewedAt).toBeInstanceOf(Date);
      expect(v?.rejectionReason).toBe("사업자 등록 정보 불일치");
    });
  });
});
