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
  findMessageById: vi.fn(),
  claimAiDraftForSend: vi.fn(),
  markMessageSent: vi.fn(async () => undefined),
  revertAiDraftClaim: vi.fn(async () => undefined),
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

import { acceptAiDraft } from "./accept-ai-draft";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import {
  findMessageById,
  claimAiDraftForSend,
  markMessageSent,
  revertAiDraftClaim,
} from "@/shared/lib/dal/messages";
import { getConversationById } from "@/shared/lib/dal/conversations";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { getExternalIdByCustomerId } from "@/shared/lib/dal/customers";
import { ValidationError, WindowClosedError } from "@/shared/lib/errors";
import { captureServerActionError } from "@/instrumentation";

const VALID_MSG_UUID = "11111111-1111-4111-8111-111111111111";
const VALID_CONV_UUID = "22222222-2222-4222-8222-222222222222";

function setSession(storeId = "s1") {
  vi.mocked(requireStoreOwnerAuth).mockResolvedValue({
    userId: "u1",
    storeId,
    role: "owner",
  });
}

function mockMessage(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_MSG_UUID,
    conversationId: VALID_CONV_UUID,
    channel: "instagram",
    direction: "outbound",
    status: "ai_draft",
    originalText: "안녕하세요!",
    externalMessageId: null,
    ...overrides,
  };
}

function mockConv(overrides: Record<string, unknown> = {}) {
  return {
    id: VALID_CONV_UUID,
    storeId: "s1",
    customerId: "cust_1",
    channel: "instagram",
    messagingWindowExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    ...overrides,
  };
}

function mockIntegration() {
  return {
    externalAccountId: "ig_acc_1",
    externalPageId: "page_1",
    externalAccountName: "demo",
    accessToken: "tok",
    tokenExpiresAt: null,
    scopes: ["instagram_business_basic"],
    webhookSubscribedAt: null,
  };
}

describe("acceptAiDraft action (B-3c)", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    sendOutboundMock.mockClear();
  });

  it("messageId 형식 오류 → ValidationError", async () => {
    setSession();
    await expect(acceptAiDraft({ messageId: "not-a-uuid" })).rejects.toThrow(
      ValidationError,
    );
  });

  it("메시지 없음 → ValidationError", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(null);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      ValidationError,
    );
  });

  it("conversation 없음 → ValidationError", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(null);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      ValidationError,
    );
  });

  it("매장 소유 아니면 ValidationError(통합 메시지) (claim 안 함, Sec-H-1 enumeration 차단)", async () => {
    setSession("s_other");
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      /요청한 메시지를 처리할 수 없습니다/,
    );
    expect(claimAiDraftForSend).not.toHaveBeenCalled();
  });

  it("메시지 미존재 / 대화 미존재 / ownership 불일치 모두 동일 메시지 (Sec-H-1)", async () => {
    setSession();

    vi.mocked(findMessageById).mockResolvedValueOnce(null);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      /요청한 메시지를 처리할 수 없습니다/,
    );

    vi.mocked(findMessageById).mockResolvedValueOnce(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValueOnce(null);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      /요청한 메시지를 처리할 수 없습니다/,
    );
  });

  it("conversationId null → ValidationError(통합 메시지) (Code-M-1 가드)", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(
      mockMessage({ conversationId: null }) as never,
    );
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      /요청한 메시지를 처리할 수 없습니다/,
    );
    expect(getConversationById).not.toHaveBeenCalled();
  });

  it("originalText null → revert 후 ValidationError (Code-M-2 가드)", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(
      mockMessage({ originalText: null }) as never,
    );
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      /초안에 원문이 없습니다/,
    );
    expect(revertAiDraftClaim).toHaveBeenCalledWith(
      expect.anything(),
      VALID_MSG_UUID,
    );
    expect(sendOutboundMock).not.toHaveBeenCalled();
  });

  it("status가 ai_draft 아니면 (claim null 반환) → ValidationError + IG send 호출 안 함 (race-safe)", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(null);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      ValidationError,
    );
    expect(sendOutboundMock).not.toHaveBeenCalled();
  });

  it("24h 윈도우 만료 → WindowClosedError + revertAiDraftClaim 호출", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(
      mockConv({
        messagingWindowExpiresAt: new Date(Date.now() - 1000),
      }) as never,
    );
    vi.mocked(claimAiDraftForSend).mockResolvedValue(mockMessage() as never);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      WindowClosedError,
    );
    expect(revertAiDraftClaim).toHaveBeenCalledWith(
      expect.anything(),
      VALID_MSG_UUID,
    );
    expect(sendOutboundMock).not.toHaveBeenCalled();
  });

  it("integration 없음 → ValidationError + revert", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(mockMessage() as never);
    vi.mocked(getIntegration).mockResolvedValue(null);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      ValidationError,
    );
    expect(revertAiDraftClaim).toHaveBeenCalled();
  });

  it("recipient externalId 없음 → ValidationError + revert", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(mockMessage() as never);
    vi.mocked(getIntegration).mockResolvedValue(mockIntegration());
    vi.mocked(getExternalIdByCustomerId).mockResolvedValue(null);
    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      ValidationError,
    );
    expect(revertAiDraftClaim).toHaveBeenCalled();
  });

  it("IG send 실패 → revert + Sentry + re-throw (사장 재시도 가능)", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(mockMessage() as never);
    vi.mocked(getIntegration).mockResolvedValue(mockIntegration());
    vi.mocked(getExternalIdByCustomerId).mockResolvedValue("igsid_recipient");
    sendOutboundMock.mockRejectedValueOnce(new Error("Meta 5xx"));

    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      /Meta 5xx/,
    );
    expect(revertAiDraftClaim).toHaveBeenCalledWith(
      expect.anything(),
      VALID_MSG_UUID,
    );
    expect(markMessageSent).not.toHaveBeenCalled();
    expect(captureServerActionError).toHaveBeenCalled();
  });

  it("revert 자체 실패 → 원본 에러 re-throw + Sentry 별도 캡처 (Sec 운영 안전)", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(mockMessage() as never);
    vi.mocked(getIntegration).mockResolvedValue(mockIntegration());
    vi.mocked(getExternalIdByCustomerId).mockResolvedValue("igsid_recipient");
    sendOutboundMock.mockRejectedValueOnce(new Error("Meta 5xx"));
    vi.mocked(revertAiDraftClaim).mockRejectedValueOnce(
      new Error("DB connection lost"),
    );

    await expect(acceptAiDraft({ messageId: VALID_MSG_UUID })).rejects.toThrow(
      /Meta 5xx/,
    );
    expect(captureServerActionError).toHaveBeenCalled();
  });

  it("정상: claim → IG send → markMessageSent + ok 반환 (originalText 발송)", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(mockMessage() as never);
    vi.mocked(getIntegration).mockResolvedValue(mockIntegration());
    vi.mocked(getExternalIdByCustomerId).mockResolvedValue("igsid_recipient");

    const result = await acceptAiDraft({ messageId: VALID_MSG_UUID });

    expect(result).toEqual({ ok: true, externalMessageId: "out_1" });
    expect(sendOutboundMock).toHaveBeenCalledWith(
      { externalRecipientId: "igsid_recipient", text: "안녕하세요!" },
      expect.objectContaining({
        accessToken: "tok",
        externalAccountId: "ig_acc_1",
      }),
    );
    expect(markMessageSent).toHaveBeenCalledWith(
      expect.anything(),
      VALID_MSG_UUID,
      "out_1",
    );
    expect(revertAiDraftClaim).not.toHaveBeenCalled();
  });

  it("Epic 1B-Tone-4: tone 지정 + metadata.tones 있으면 해당 tone 발송", async () => {
    setSession();
    const tones = {
      warm: "warm-text",
      formal: "안녕하십니까. 가능합니다.",
      short: "네 가능.",
      friendly: "OK 가능해요!",
    };
    vi.mocked(findMessageById).mockResolvedValue(
      mockMessage({ metadata: { tones } }) as never,
    );
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(
      mockMessage({ metadata: { tones } }) as never,
    );
    vi.mocked(getIntegration).mockResolvedValue(mockIntegration());
    vi.mocked(getExternalIdByCustomerId).mockResolvedValue("igsid_recipient");

    await acceptAiDraft({ messageId: VALID_MSG_UUID, tone: "formal" });

    expect(sendOutboundMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: tones.formal }),
      expect.anything(),
    );
  });

  it("Epic 1B-Tone-4: tone 지정했으나 metadata.tones 없음 → originalText fallback (1A/1B 호환)", async () => {
    setSession();
    vi.mocked(findMessageById).mockResolvedValue(mockMessage() as never);
    vi.mocked(getConversationById).mockResolvedValue(mockConv() as never);
    vi.mocked(claimAiDraftForSend).mockResolvedValue(mockMessage() as never);
    vi.mocked(getIntegration).mockResolvedValue(mockIntegration());
    vi.mocked(getExternalIdByCustomerId).mockResolvedValue("igsid_recipient");

    await acceptAiDraft({ messageId: VALID_MSG_UUID, tone: "formal" });

    expect(sendOutboundMock).toHaveBeenCalledWith(
      expect.objectContaining({ text: "안녕하세요!" }),
      expect.anything(),
    );
  });

  it("Epic 1B-Tone-4: tone 잘못된 값 → ValidationError (스키마 거절)", async () => {
    setSession();
    await expect(
      acceptAiDraft({
        messageId: VALID_MSG_UUID,
        tone: "casual",
      } as never),
    ).rejects.toThrow(ValidationError);
  });
});
