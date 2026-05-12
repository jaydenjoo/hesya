import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/conversations", () => ({
  getConversationById: vi.fn(),
}));

vi.mock("@/shared/lib/dal/customers", () => ({
  updateCustomerNotes: vi.fn(),
}));

vi.mock("@/instrumentation", () => ({
  captureServerActionError: vi.fn(),
}));

import { updateCustomerNotes } from "./update-customer-notes";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { getConversationById } from "@/shared/lib/dal/conversations";
import { updateCustomerNotes as dalUpdateCustomerNotes } from "@/shared/lib/dal/customers";
import { ForbiddenError, ValidationError } from "@/shared/lib/errors";

const VALID_CONV = "11111111-1111-4111-8111-111111111111";
const VALID_CUST = "22222222-2222-4222-8222-222222222222";

function setSession(storeId = "s1") {
  vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
    userId: "u1",
    storeId,
    role: "owner",
  });
}

describe("updateCustomerNotes action (CC-6)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("conversationId 형식 오류 → ValidationError", async () => {
    setSession();
    await expect(
      updateCustomerNotes({
        conversationId: "not-a-uuid",
        customerId: VALID_CUST,
        allergyNote: "x",
      }),
    ).rejects.toThrow(ValidationError);
    expect(dalUpdateCustomerNotes).not.toHaveBeenCalled();
  });

  it("allergyNote 500자 초과 → ValidationError", async () => {
    setSession();
    await expect(
      updateCustomerNotes({
        conversationId: VALID_CONV,
        customerId: VALID_CUST,
        allergyNote: "가".repeat(501),
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("conversation 미존재 → ValidationError (enumeration 방어)", async () => {
    setSession();
    vi.mocked(getConversationById).mockResolvedValue(null);
    await expect(
      updateCustomerNotes({
        conversationId: VALID_CONV,
        customerId: VALID_CUST,
        allergyNote: "x",
      }),
    ).rejects.toThrow(ValidationError);
  });

  it("다른 매장 conversation → ForbiddenError", async () => {
    setSession("s1");
    vi.mocked(getConversationById).mockResolvedValue({
      id: VALID_CONV,
      storeId: "s_other",
      customerId: VALID_CUST,
    } as unknown as Awaited<ReturnType<typeof getConversationById>>);
    await expect(
      updateCustomerNotes({
        conversationId: VALID_CONV,
        customerId: VALID_CUST,
        allergyNote: "x",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("customerId mismatch (conv.customerId ≠ input) → ForbiddenError", async () => {
    setSession("s1");
    vi.mocked(getConversationById).mockResolvedValue({
      id: VALID_CONV,
      storeId: "s1",
      customerId: "33333333-3333-4333-8333-333333333333",
    } as unknown as Awaited<ReturnType<typeof getConversationById>>);
    await expect(
      updateCustomerNotes({
        conversationId: VALID_CONV,
        customerId: VALID_CUST,
        allergyNote: "x",
      }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("정상: dalUpdateCustomerNotes 호출 + ok 반환", async () => {
    setSession("s1");
    vi.mocked(getConversationById).mockResolvedValue({
      id: VALID_CONV,
      storeId: "s1",
      customerId: VALID_CUST,
    } as unknown as Awaited<ReturnType<typeof getConversationById>>);
    vi.mocked(dalUpdateCustomerNotes).mockResolvedValue({
      id: VALID_CUST,
      externalId: "ig_1",
      channel: "instagram",
      name: "Alice",
      nationality: null,
      preferredLanguage: "en",
      paymentMethodPreferred: null,
      totalVisits: 0,
      ltvKrw: 0,
      allergyNote: "땅콩",
      preferredDesigner: "민지",
      igProfileFetched: true,
      email: null,
      lastSeenAt: null,
    });

    const r = await updateCustomerNotes({
      conversationId: VALID_CONV,
      customerId: VALID_CUST,
      allergyNote: "땅콩",
      preferredDesigner: "민지",
    });
    expect(r).toEqual({ ok: true });
    expect(dalUpdateCustomerNotes).toHaveBeenCalledWith(
      expect.anything(),
      VALID_CUST,
      { allergyNote: "땅콩", preferredDesigner: "민지" },
    );
  });
});
