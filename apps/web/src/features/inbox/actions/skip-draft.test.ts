import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/messages", () => ({
  findMessageById: vi.fn(),
  updateDraftStatus: vi.fn(async () => undefined),
}));

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn(() => ({})),
}));

vi.mock("@/instrumentation", () => ({
  captureServerActionError: vi.fn(),
}));

import { skipDraft } from "./skip-draft";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { findMessageById, updateDraftStatus } from "@/shared/lib/dal/messages";

const STORE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_STORE = "22222222-2222-4222-8222-222222222222";
const MSG_ID = "33333333-3333-4333-8333-333333333333";

function setSession() {
  vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
    userId: "u1",
    storeId: STORE_ID,
    role: "owner",
  });
}

describe("skipDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    setSession();
  });

  it("다른 매장 메시지 → forbidden, updateDraftStatus 호출 안 함", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      id: MSG_ID,
      storeId: OTHER_STORE,
      draftStatus: "pending_review",
    } as never);

    const r = await skipDraft({ messageId: MSG_ID });
    expect(r).toEqual({ ok: false, error: "forbidden" });
    expect(updateDraftStatus).not.toHaveBeenCalled();
  });

  it("draftStatus가 'pending_review'가 아니면 invalid_state", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      id: MSG_ID,
      storeId: STORE_ID,
      draftStatus: "sent",
    } as never);

    const r = await skipDraft({ messageId: MSG_ID });
    expect(r).toEqual({ ok: false, error: "invalid_state" });
    expect(updateDraftStatus).not.toHaveBeenCalled();
  });

  it("happy path → updateDraftStatus skipped + ok", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      id: MSG_ID,
      storeId: STORE_ID,
      draftStatus: "pending_review",
    } as never);

    const r = await skipDraft({ messageId: MSG_ID });
    expect(r).toEqual({ ok: true });
    expect(updateDraftStatus).toHaveBeenCalledWith(expect.anything(), {
      messageId: MSG_ID,
      nextStatus: "skipped",
      reviewerId: "u1",
    });
  });
});
