import { describe, it, expect, beforeEach, vi } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/conversations", () => ({
  getConversationById: vi.fn(),
  updateLastMessage: vi.fn(async () => undefined),
}));

vi.mock("@/shared/lib/dal/messages", () => ({
  insertMessage: vi.fn(async () => ({ id: "msg_1" })),
}));

vi.mock("@/shared/lib/dal/customers", () => ({
  getExternalIdByCustomerId: vi.fn(),
}));

vi.mock("@/shared/lib/dal/store-integrations", () => ({
  getIntegration: vi.fn(),
}));

const { sendOutboundMock } = vi.hoisted(() => ({
  sendOutboundMock: vi.fn(async () => ({ externalMessageId: "out_1" })),
}));

vi.mock("@/lib/inbox/instagram-adapter", () => ({
  createInstagramAdapter: vi.fn(() => ({ sendOutbound: sendOutboundMock })),
}));

vi.mock("@/lib/inbox/instagram-api-client", () => ({
  fetchInstagramApiClient: {},
}));

vi.mock("@/instrumentation", () => ({
  captureServerActionError: vi.fn(),
}));

import { sendOutbound } from "./send-outbound";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { getConversationById } from "@/shared/lib/dal/conversations";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { getExternalIdByCustomerId } from "@/shared/lib/dal/customers";
import {
  ForbiddenError,
  ValidationError,
  WindowClosedError,
} from "@/shared/lib/errors";

const VALID_UUID = "550e8400-e29b-41d4-a716-446655440000";

function setSession(storeId = "s1") {
  vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
    userId: "u1",
    storeId,
    role: "owner",
  });
}

describe("sendOutbound action", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendOutboundMock.mockClear();
  });

  it("conversationId 형식 오류 → ValidationError", async () => {
    setSession();
    await expect(
      sendOutbound({ conversationId: "not-a-uuid", text: "hi" }),
    ).rejects.toThrow(ValidationError);
  });

  it("conversation 없음 → ValidationError", async () => {
    setSession();
    vi.mocked(getConversationById).mockResolvedValue(null);
    await expect(
      sendOutbound({ conversationId: VALID_UUID, text: "hi" }),
    ).rejects.toThrow(ValidationError);
  });

  it("매장 소유 아니면 ForbiddenError", async () => {
    setSession("s1");
    vi.mocked(getConversationById).mockResolvedValue({
      id: VALID_UUID,
      storeId: "s_other",
      customerId: "cust_1",
      channel: "instagram",
      messagingWindowExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    } as never);
    await expect(
      sendOutbound({ conversationId: VALID_UUID, text: "hi" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("24h 윈도우 만료 → WindowClosedError", async () => {
    setSession("s1");
    vi.mocked(getConversationById).mockResolvedValue({
      id: VALID_UUID,
      storeId: "s1",
      customerId: "cust_1",
      channel: "instagram",
      messagingWindowExpiresAt: new Date(Date.now() - 1000),
    } as never);
    await expect(
      sendOutbound({ conversationId: VALID_UUID, text: "hi" }),
    ).rejects.toThrow(WindowClosedError);
  });

  it("정상: adapter.sendOutbound 호출 + insertMessage outbound + ok 반환", async () => {
    setSession("s1");
    vi.mocked(getConversationById).mockResolvedValue({
      id: VALID_UUID,
      storeId: "s1",
      customerId: "cust_1",
      channel: "instagram",
      messagingWindowExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    } as never);
    vi.mocked(getIntegration).mockResolvedValue({
      externalAccountId: "ig_acc_1",
      externalPageId: "page_1",
      externalAccountName: "demo",
      accessToken: "tok",
      tokenExpiresAt: null,
      scopes: ["instagram_business_basic"],
      webhookSubscribedAt: null,
    });
    vi.mocked(getExternalIdByCustomerId).mockResolvedValue("igsid_recipient");

    const result = await sendOutbound({
      conversationId: VALID_UUID,
      text: "안녕하세요",
    });

    expect(result).toEqual({ ok: true, messageId: "out_1" });
    expect(sendOutboundMock).toHaveBeenCalledWith(
      { externalRecipientId: "igsid_recipient", text: "안녕하세요" },
      expect.objectContaining({
        accessToken: "tok",
        externalAccountId: "ig_acc_1",
        externalPageId: "page_1",
      }),
    );
  });
});
