import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/admin-guard", () => ({
  requireAdminEmail: vi.fn(),
}));

vi.mock("@/shared/lib/dal/stores", () => ({
  approveStore: vi.fn(async () => undefined),
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn(() => ({})),
}));

import { approveStoreKyc } from "./approve-store-kyc";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { approveStore } from "@/shared/lib/dal/stores";
import { revalidatePath } from "next/cache";

describe("approveStoreKyc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin guard 실패 → ok=false, DAL 호출 0회", async () => {
    vi.mocked(requireAdminEmail).mockResolvedValue({
      ok: false,
      error: "forbidden",
      message: "관리자 권한이 필요합니다",
    });

    const result = await approveStoreKyc({
      storeId: "s1",
      verificationId: "v1",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("forbidden");
    expect(approveStore).not.toHaveBeenCalled();
    expect(revalidatePath).not.toHaveBeenCalled();
  });

  it("happy path → approveStore 호출 + revalidatePath 호출 + ok=true", async () => {
    vi.mocked(requireAdminEmail).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
    });

    const result = await approveStoreKyc({
      storeId: "store-uuid",
      verificationId: "verif-uuid",
    });

    expect(result.ok).toBe(true);
    expect(approveStore).toHaveBeenCalledTimes(1);
    expect(approveStore).toHaveBeenCalledWith(expect.anything(), {
      storeId: "store-uuid",
      verificationId: "verif-uuid",
      reviewerId: "admin-1",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/store-verifications");
  });
});
