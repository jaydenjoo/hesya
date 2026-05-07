import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("next/cache", () => ({ revalidatePath: vi.fn() }));

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));

vi.mock("@/shared/lib/dal/conversations", () => ({
  getConversationById: vi.fn(),
  updateLastMessage: vi.fn(async () => undefined),
}));

vi.mock("@/shared/lib/dal/messages", () => ({
  findMessageById: vi.fn(),
  claimAiDraftForSend: vi.fn(),
  markMessageSent: vi.fn(async () => undefined),
  revertAiDraftClaim: vi.fn(async () => undefined),
  updateDraftStatus: vi.fn(async () => undefined),
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

vi.mock("@hesya/database", () => ({
  createDbClient: vi.fn(() => ({})),
}));

vi.mock("@/instrumentation", () => ({
  captureServerActionError: vi.fn(),
}));

import { approveDraft } from "./approve-draft";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import {
  findMessageById,
  claimAiDraftForSend,
  markMessageSent,
  updateDraftStatus,
} from "@/shared/lib/dal/messages";
import { getConversationById } from "@/shared/lib/dal/conversations";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { getExternalIdByCustomerId } from "@/shared/lib/dal/customers";

const STORE_ID = "11111111-1111-4111-8111-111111111111";
const OTHER_STORE = "22222222-2222-4222-8222-222222222222";
const MSG_ID = "33333333-3333-4333-8333-333333333333";
const CONV_ID = "44444444-4444-4444-8444-444444444444";

function setSession() {
  vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
    userId: "u1",
    storeId: STORE_ID,
    role: "owner",
  });
}

function mockMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: MSG_ID,
    storeId: STORE_ID,
    conversationId: CONV_ID,
    channel: "instagram",
    direction: "outbound",
    status: "ai_draft",
    draftStatus: "pending_review",
    originalText: "안녕하세요",
    ...overrides,
  };
}

function mockConv(overrides: Record<string, unknown> = {}) {
  return {
    id: CONV_ID,
    storeId: STORE_ID,
    customerId: "cust1",
    channel: "instagram",
    messagingWindowExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    ...overrides,
  };
}

function mockIntegration() {
  return {
    externalAccountId: "ig1",
    externalPageId: "p1",
    externalAccountName: "x",
    accessToken: "tok",
    tokenExpiresAt: null,
    scopes: [],
    webhookSubscribedAt: null,
  };
}

describe("approveDraft", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendOutboundMock.mockClear();
    sendOutboundMock.mockResolvedValue({ externalMessageId: "out_1" });
    setSession();
  });

  it("다른 매장 메시지 → forbidden, claim 호출 안 함", async () => {
    vi.mocked(findMessageById).mockResolvedValue(
      mockMessage({ storeId: OTHER_STORE }) as never,
    );
    const r = await approveDraft({ messageId: MSG_ID });
    expect(r).toEqual({ ok: false, error: "forbidden" });
    expect(claimAiDraftForSend).not.toHaveBeenCalled();
  });

  it("draftStatus !== 'pending_review' → invalid_state", async () => {
    vi.mocked(findMessageById).mockResolvedValue(
      mockMessage({ draftStatus: "sent" }) as never,
    );
    const r = await approveDraft({ messageId: MSG_ID });
    expect(r).toEqual({ ok: false, error: "invalid_state" });
    expect(claimAiDraftForSend).not.toHaveBeenCalled();
  });

  it("happy path → updateDraftStatus(approved) → IG send → markMessageSent → updateDraftStatus(sent) → ok", async () => {
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(mockMessage() as never);
    vi.mocked(getIntegration).mockResolvedValue(mockIntegration());
    vi.mocked(getExternalIdByCustomerId).mockResolvedValue("igsid_recipient");

    const r = await approveDraft({ messageId: MSG_ID });
    expect(r).toEqual({ ok: true });
    expect(sendOutboundMock).toHaveBeenCalledWith(
      { externalRecipientId: "igsid_recipient", text: "안녕하세요" },
      expect.objectContaining({ accessToken: "tok" }),
    );
    expect(markMessageSent).toHaveBeenCalledWith(
      expect.anything(),
      MSG_ID,
      "out_1",
    );
    // approved + sent 2회 호출
    const calls = vi.mocked(updateDraftStatus).mock.calls.map((c) => c[1]);
    expect(calls.map((c) => c.nextStatus)).toEqual(["approved", "sent"]);
  });
});
