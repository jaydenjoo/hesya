import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/stores", () => ({
  setStoreBotMode: vi.fn(async () => undefined),
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn(() => ({})),
}));

vi.mock("@/instrumentation", () => ({
  captureServerActionError: vi.fn(),
}));

import { toggleBotMode } from "./toggle-bot-mode";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { setStoreBotMode } from "@/shared/lib/dal/stores";
import { ForbiddenError } from "@/shared/lib/errors";

const STORE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_STORE = "22222222-2222-4222-8222-222222222222";

describe("toggleBotMode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
      userId: "u1",
      storeId: STORE_ID,
      role: "owner",
    });
  });

  it("다른 매장 storeId 전달 → forbidden, setStoreBotMode 호출 안 함", async () => {
    const r = await toggleBotMode({ storeId: OTHER_STORE, nextValue: true });
    expect(r).toEqual({ ok: false, error: "forbidden" });
    expect(setStoreBotMode).not.toHaveBeenCalled();
  });

  it("매장 owner가 아님 → forbidden", async () => {
    vi.mocked(requireStoreOwnerAuth).mockRejectedValueOnce(
      new ForbiddenError(),
    );
    const r = await toggleBotMode({ storeId: STORE_ID, nextValue: true });
    expect(r).toEqual({ ok: false, error: "forbidden" });
    expect(setStoreBotMode).not.toHaveBeenCalled();
  });

  it("happy path → setStoreBotMode 호출 + ok=true", async () => {
    const r = await toggleBotMode({ storeId: STORE_ID, nextValue: true });
    expect(r).toEqual({ ok: true });
    expect(setStoreBotMode).toHaveBeenCalledWith(
      expect.anything(),
      STORE_ID,
      true,
    );
  });
});
