import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/admin-role-guard", () => ({
  requireAdminRole: vi.fn(),
}));

vi.mock("@/shared/lib/dal/stores", () => ({
  rejectStore: vi.fn(async () => undefined),
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

import { rejectStoreKyc } from "./reject-store-kyc";
import { requireAdminRole } from "@/shared/lib/admin-role-guard";
import { rejectStore } from "@/shared/lib/dal/stores";
import { findOwnerNotifyTargetByStoreId } from "@/shared/lib/dal/store-owners";
import { sendKycNotification } from "@/lib/notifications/kyc-result";
import { revalidatePath } from "next/cache";

describe("rejectStoreKyc", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("admin guard 실패 → ok=false, DAL 호출 0회", async () => {
    vi.mocked(requireAdminRole).mockResolvedValue({
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
    expect(sendKycNotification).not.toHaveBeenCalled();
  });

  it("reason 3자 미만 (trim 후) → reason_too_short, DAL 호출 0회", async () => {
    vi.mocked(requireAdminRole).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
      role: "admin",
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
    expect(sendKycNotification).not.toHaveBeenCalled();
  });

  it("happy path → rejectStore 호출 (trim 적용) + revalidatePath + ok=true", async () => {
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

  it("happy path → owner email 조회 후 manual_rejected 알림 발송 (Phase 1-γ.1, 사유+재신청 URL)", async () => {
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

    await rejectStoreKyc({
      storeId: "store-uuid",
      verificationId: "verif-uuid",
      reason: "영업신고증 사진 흐림",
    });

    expect(findOwnerNotifyTargetByStoreId).toHaveBeenCalledWith(
      expect.anything(),
      "store-uuid",
    );
    expect(sendKycNotification).toHaveBeenCalledTimes(1);
    const call = vi.mocked(sendKycNotification).mock.calls[0]![0];
    expect(call.kind).toBe("manual_rejected");
    expect(call.to).toBe("owner@example.com");
    expect(call.storeName).toBe("청담미용실");
    expect(call.locale).toBe("ko");
    expect(call.reason?.summary).toBe("영업신고증 사진 흐림");
    expect(call.reason?.retryUrl).toContain("/onboarding/kyc");
  });

  it("owner 없는 매장 → 알림 skip + 거절은 ok=true (graceful)", async () => {
    vi.mocked(requireAdminRole).mockResolvedValue({
      ok: true,
      userId: "admin-1",
      email: "admin@example.com",
      role: "admin",
    });
    vi.mocked(findOwnerNotifyTargetByStoreId).mockResolvedValue(null);

    const result = await rejectStoreKyc({
      storeId: "no-owner-store",
      verificationId: "verif-uuid",
      reason: "영업신고증 미제출",
    });

    expect(result.ok).toBe(true);
    expect(sendKycNotification).not.toHaveBeenCalled();
  });

  it("알림 발송 실패 → 거절은 ok=true (silent error)", async () => {
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

    const result = await rejectStoreKyc({
      storeId: "store-uuid",
      verificationId: "verif-uuid",
      reason: "영업신고증 미제출",
    });

    expect(result.ok).toBe(true);
    expect(errSpy).toHaveBeenCalledWith(
      expect.stringContaining("owner notify failed"),
      expect.any(Error),
    );
    errSpy.mockRestore();
  });
});
