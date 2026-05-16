import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/admin-role-guard", () => ({
  requireAdminRole: vi.fn(),
}));

vi.mock("@/shared/lib/dal/stores", () => ({
  approveStore: vi.fn(async () => undefined),
}));

vi.mock("@/shared/lib/dal/store-owners", () => ({
  findOwnerNotifyTargetByStoreId: vi.fn(),
}));

vi.mock("@/lib/notifications/kyc-result", () => ({
  sendKycNotification: vi.fn(async () => undefined),
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn(() => ({})),
}));

import { approveStoreKyc } from "./approve-store-kyc";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";
import { approveStore } from "@/shared/lib/dal/stores";
import { findOwnerNotifyTargetByStoreId } from "@/shared/lib/dal/store-owners";
import { sendKycNotification } from "@/lib/notifications/kyc-result";
import { revalidatePath } from "next/cache";

describe("approveStoreKyc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin guard 실패 → ok=false, DAL 호출 0회", async () => {
    vi.mocked(requireAdminRole).mockResolvedValue({
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
    expect(sendKycNotification).not.toHaveBeenCalled();
  });

  it("happy path → approveStore 호출 + revalidatePath 호출 + ok=true", async () => {
    vi.mocked(requireAdminRole).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
      role: "admin",
    });
    vi.mocked(findOwnerNotifyTargetByStoreId).mockResolvedValue({
      userId: "owner-1",
      email: "owner@example.com",
      storeName: "청담미용실",
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

  it("happy path → owner email 조회 후 manual_approved 알림 발송 (Phase 1-γ.1)", async () => {
    vi.mocked(requireAdminRole).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
      role: "admin",
    });
    vi.mocked(findOwnerNotifyTargetByStoreId).mockResolvedValue({
      userId: "owner-1",
      email: "owner@example.com",
      storeName: "청담미용실",
    });

    await approveStoreKyc({
      storeId: "store-uuid",
      verificationId: "verif-uuid",
    });

    expect(findOwnerNotifyTargetByStoreId).toHaveBeenCalledWith(
      expect.anything(),
      "store-uuid",
    );
    expect(sendKycNotification).toHaveBeenCalledTimes(1);
    expect(sendKycNotification).toHaveBeenCalledWith({
      kind: "manual_approved",
      to: "owner@example.com",
      storeName: "청담미용실",
      locale: "ko",
    });
  });

  it("owner 없는 매장 → 알림 skip + 승인은 ok=true (graceful)", async () => {
    vi.mocked(requireAdminRole).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
      role: "admin",
    });
    vi.mocked(findOwnerNotifyTargetByStoreId).mockResolvedValue(null);

    const result = await approveStoreKyc({
      storeId: "no-owner-store",
      verificationId: "verif-uuid",
    });

    expect(result.ok).toBe(true);
    expect(sendKycNotification).not.toHaveBeenCalled();
  });

  it("알림 발송 실패 → 승인은 ok=true (silent error, KYC 결과 우선)", async () => {
    vi.mocked(requireAdminRole).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
      role: "admin",
    });
    vi.mocked(findOwnerNotifyTargetByStoreId).mockResolvedValue({
      userId: "owner-1",
      email: "owner@example.com",
      storeName: "청담미용실",
    });
    vi.mocked(sendKycNotification).mockRejectedValueOnce(
      new Error("Resend down"),
    );
    const errSpy = vi.spyOn(console, "error").mockImplementation(() => {});

    const result = await approveStoreKyc({
      storeId: "store-uuid",
      verificationId: "verif-uuid",
    });

    expect(result.ok).toBe(true);
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("owner notify failed"),
      expect.any(Error),
    );
    errSpy.mockRestore();
  });
});
