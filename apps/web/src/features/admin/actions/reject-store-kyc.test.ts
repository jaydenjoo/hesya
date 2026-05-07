import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/admin-guard", () => ({
  requireAdminEmail: vi.fn(),
}));

vi.mock("@/shared/lib/dal/stores", () => ({
  rejectStore: vi.fn(async () => undefined),
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn(() => ({})),
}));

import { rejectStoreKyc } from "./reject-store-kyc";
import { requireAdminEmail } from "@/shared/lib/admin-guard";
import { rejectStore } from "@/shared/lib/dal/stores";
import { revalidatePath } from "next/cache";

describe("rejectStoreKyc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin guard 실패 → ok=false, DAL 호출 0회", async () => {
    vi.mocked(requireAdminEmail).mockResolvedValue({
      ok: false,
      error: "unauthorized",
      message: "로그인이 필요합니다",
    });

    const result = await rejectStoreKyc({
      storeId: "s1",
      verificationId: "v1",
      reason: "사유",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("unauthorized");
    expect(rejectStore).not.toHaveBeenCalled();
  });

  it("reason 3자 미만 (trim 후) → reason_too_short, DAL 호출 0회", async () => {
    vi.mocked(requireAdminEmail).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
    });

    const result = await rejectStoreKyc({
      storeId: "s1",
      verificationId: "v1",
      reason: "  X  ",
    });

    expect(result.ok).toBe(false);
    if (result.ok) throw new Error("unreachable");
    expect(result.error).toBe("reason_too_short");
    expect(rejectStore).not.toHaveBeenCalled();
  });

  it("happy path → rejectStore 호출 (trim 적용) + revalidatePath + ok=true", async () => {
    vi.mocked(requireAdminEmail).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
    });

    const result = await rejectStoreKyc({
      storeId: "store-uuid",
      verificationId: "verif-uuid",
      reason: "  영업신고증 미제출  ",
    });

    expect(result.ok).toBe(true);
    expect(rejectStore).toHaveBeenCalledTimes(1);
    expect(rejectStore).toHaveBeenCalledWith(expect.anything(), {
      storeId: "store-uuid",
      verificationId: "verif-uuid",
      reviewerId: "admin-1",
      reason: "영업신고증 미제출",
    });
    expect(revalidatePath).toHaveBeenCalledWith("/admin/store-verifications");
  });
});
