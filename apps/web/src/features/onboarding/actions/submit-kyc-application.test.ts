import { describe, it, expect, beforeAll, beforeEach, vi } from "vitest";

// Better Auth + headers mock (모든 describe 공유) — store-owner-guard.test.ts 패턴.
vi.mock("@/lib/auth", () => ({
  auth: { api: { getSession: vi.fn() } },
}));
vi.mock("next/headers", () => ({
  headers: vi.fn(async () => new Headers()),
}));

import {
  createDbClient,
  eq,
  storeOwners,
  storeVerifications,
  stores,
  type DbClient,
} from "@hesya/database";
import { auth } from "@/lib/auth";
import { resetDb, seedUser } from "@/test-helpers/db";
import { submitKycApplication } from "./submit-kyc-application";

const url = process.env.HESYA_TEST_DATABASE_URL;
const hasDb = Boolean(url);

const getSessionMock = vi.mocked(auth.api.getSession);

function setSession(userId: string) {
  getSessionMock.mockResolvedValue({
    user: { id: userId },
  } as Awaited<ReturnType<typeof auth.api.getSession>>);
}

describe.skipIf(!hasDb)("submitKycApplication (integration)", () => {
  let db: DbClient;

  beforeAll(() => {
    db = createDbClient(url!);
  });

  beforeEach(async () => {
    await resetDb(db);
    vi.clearAllMocks();
  });

  const validInput = {
    storeName: "X",
    representativeName: "홍길동",
    businessNumber: "1234567890",
    phone: "01012345678",
    address: "서울시 마포구 와우산로 100",
    businessLicenseImageUrl: "https://example.com/x.jpg",
    declarationNoMassage: true as const,
    declarationNoMedicalDevice: true as const,
    declarationNoOrientalMedicine: true as const,
  };

  it("happy path: stores + store_verifications + store_owners atomic insert with status='manual_review'", async () => {
    const userId = await seedUser(db);
    setSession(userId);

    const result = await submitKycApplication(validInput);

    expect(result.ok).toBe(true);
    if (!result.ok) throw new Error("unreachable");

    const [s] = await db
      .select()
      .from(stores)
      .where(eq(stores.id, result.storeId));
    expect(s?.verificationStatus).toBe("manual_review");
    expect(s?.name).toBe("X");

    const [v] = await db
      .select()
      .from(storeVerifications)
      .where(eq(storeVerifications.storeId, result.storeId));
    expect(v?.businessNumber).toBe("1234567890");
    expect(v?.verificationStatus).toBe("manual_review");
    expect(v?.declarationNoMassage).toBe(true);

    const owners = await db
      .select()
      .from(storeOwners)
      .where(eq(storeOwners.userId, userId));
    expect(owners).toHaveLength(1);
    expect(owners[0]?.role).toBe("owner");
    expect(owners[0]?.storeId).toBe(result.storeId);
  });

  it("session 없음 → ok=false, error='unauthorized'", async () => {
    getSessionMock.mockResolvedValue(null);
    const result = await submitKycApplication(validInput);
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("unauthorized");
  });

  it("invalid input (zod fail) → ok=false, no rows inserted", async () => {
    const userId = await seedUser(db);
    setSession(userId);
    const before = await db.select().from(stores);

    const result = await submitKycApplication({
      ...validInput,
      businessNumber: "abc",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("validation");

    const after = await db.select().from(stores);
    expect(after.length).toBe(before.length);
  });

  it("declaration false → ok=false (자기신고 모두 true 강제)", async () => {
    const userId = await seedUser(db);
    setSession(userId);
    const result = await submitKycApplication({
      ...validInput,
      declarationNoMassage: false,
    });
    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("validation");
  });

  it("mid-transaction rollback: store_owners FK 위반 → stores/store_verifications 신규 row 0건", async () => {
    // 존재하지 않는 userId로 세션 위장 → store_owners.user_id FK(users.id)
    // 위반으로 트랜잭션 마지막 INSERT 실패. INSERT 순서는
    // stores → store_verifications → store_owners이므로 store_owners 실패 시
    // 앞서 INSERT된 stores/store_verifications도 함께 롤백돼야 함.
    const ghostUserId = "00000000-0000-0000-0000-000000000099";
    setSession(ghostUserId);

    const before = await db.select().from(stores);
    const verBefore = await db.select().from(storeVerifications);

    const result = await submitKycApplication(validInput);

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("internal");

    // 롤백 검증: stores / store_verifications 신규 row 0건.
    const after = await db.select().from(stores);
    expect(after.length).toBe(before.length);
    const verAfter = await db.select().from(storeVerifications);
    expect(verAfter.length).toBe(verBefore.length);
  });
});

describe("submitKycApplication (pure)", () => {
  it("module exports submitKycApplication", async () => {
    const mod = await import("./submit-kyc-application");
    expect(typeof mod.submitKycApplication).toBe("function");
  });
});
