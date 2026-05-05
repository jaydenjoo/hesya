import { describe, it, expect, vi, beforeEach } from "vitest";

vi.mock("@/shared/lib/dal/messages", () => ({
  findMessageById: vi.fn(),
  insertMessage: vi.fn(),
  listRecentByConversation: vi.fn(),
  markAIResponded: vi.fn(),
  markTranslated: vi.fn(),
}));
vi.mock("@/shared/lib/dal/stores", () => ({
  findStoreNameByConversationId: vi.fn(),
}));
vi.mock("@/shared/lib/dal/customers", () => ({
  getCustomerPreferredLanguage: vi.fn(),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@hesya/database", async () => {
  const actual =
    await vi.importActual<typeof import("@hesya/database")>("@hesya/database");
  return {
    ...actual,
    createDbClient: vi.fn(() => ({}) as never),
  };
});

import { generateAndStoreReply } from "./generate-and-store-reply";
import {
  findMessageById,
  insertMessage,
  listRecentByConversation,
  markAIResponded,
  markTranslated,
} from "@/shared/lib/dal/messages";
import { findStoreNameByConversationId } from "@/shared/lib/dal/stores";
import { getCustomerPreferredLanguage } from "@/shared/lib/dal/customers";

type Message = NonNullable<Awaited<ReturnType<typeof findMessageById>>>;

const VALID_UUID = "11111111-1111-4111-8111-111111111111";
const CONV_UUID = "22222222-2222-4222-8222-222222222222";
const CUST_UUID = "33333333-3333-4333-8333-333333333333";

const baseInbound: Message = {
  id: VALID_UUID,
  storeId: null,
  customerId: CUST_UUID,
  conversationId: CONV_UUID,
  channel: "instagram",
  direction: "inbound",
  externalMessageId: "mid-1",
  status: null,
  originalText: "안녕하세요",
  translatedText: null,
  languageFrom: null,
  languageTo: null,
  aiResponded: false,
  aiModel: null,
  createdAt: new Date(),
};

type Deps = NonNullable<Parameters<typeof generateAndStoreReply>[1]>;
type GenFn = NonNullable<Deps["generateReply"]>;
type TransFn = NonNullable<Deps["translateReply"]>;

const fakeDb = {} as unknown as NonNullable<Deps["db"]>;
const generateReplyMock = vi.fn<GenFn>();
const translateReplyMock = vi.fn<TransFn>();
const deps: Deps = {
  db: fakeDb,
  generateReply: generateReplyMock,
  translateReply: translateReplyMock,
};

beforeEach(() => {
  vi.resetAllMocks();
});

describe("generateAndStoreReply (B-2)", () => {
  it("invalid uuid → invalid_message_id", async () => {
    const r = await generateAndStoreReply("not-a-uuid", deps);
    expect(r).toEqual({ stored: false, reason: "invalid_message_id" });
  });

  it("message not found → message_not_found", async () => {
    vi.mocked(findMessageById).mockResolvedValue(null);
    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "message_not_found" });
  });

  it("outbound 메시지 → not_inbound (응답 생성 안 함)", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      direction: "outbound",
    });
    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "not_inbound" });
  });

  it("aiResponded=true → already_responded (중복 트리거 방어)", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      aiResponded: true,
    });
    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "already_responded" });
  });

  it("conversationId null → no_conversation_id", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      conversationId: null,
    });
    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "no_conversation_id" });
  });

  it("recent 메시지 비어 있음 → no_recent_messages", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([]);
    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "no_recent_messages" });
  });

  it("storeName null → no_store_name", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue(null);
    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "no_store_name" });
  });

  it("storeName 공백만 → invalid_store_name", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("   ");
    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "invalid_store_name" });
  });

  it("storeName 101자 → invalid_store_name", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("a".repeat(101));
    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "invalid_store_name" });
  });

  it("happy path: generateReply 호출 + outbound 저장 + markAI 호출", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([
      { ...baseInbound, originalText: "안녕", direction: "inbound" },
      {
        ...baseInbound,
        id: "prev-out",
        originalText: "반가워요",
        direction: "outbound",
      },
    ]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue(
      "  맛있는 빵집  ",
    );
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("en");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "Hello there",
      tokensUsed: { input: 12, output: 7 },
    });
    vi.mocked(insertMessage).mockResolvedValue({
      ...baseInbound,
      id: "ai-out-id",
      direction: "outbound",
      originalText: "Hello there",
    });

    const r = await generateAndStoreReply(VALID_UUID, deps);

    expect(r).toEqual({
      stored: true,
      aiMessageId: "ai-out-id",
      tokensUsed: { input: 12, output: 7 },
    });
    expect(generateReplyMock).toHaveBeenCalledWith({
      storeName: "맛있는 빵집",
      customerLanguage: "en",
      recentMessages: [
        { direction: "inbound", text: "안녕" },
        { direction: "outbound", text: "반가워요" },
      ],
    });
    expect(insertMessage).toHaveBeenCalledWith(
      fakeDb,
      expect.objectContaining({
        conversationId: CONV_UUID,
        channel: "instagram",
        direction: "outbound",
        originalText: "Hello there",
        status: "ai_draft",
      }),
    );
    expect(markAIResponded).toHaveBeenCalledWith(fakeDb, VALID_UUID);
  });

  it("preferredLanguage null → 'ko' fallback", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue(null);
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "안녕!",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({ customerLanguage: "ko" }),
    );
  });

  it("미지원 언어 ('fr') → 'ko' fallback (LLM01 표면 축소)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("fr");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "안녕!",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({ customerLanguage: "ko" }),
    );
  });

  it("LLM 응답이 5000자 초과 → reply_too_long (B-2 review HIGH H-2)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue(null);
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "x".repeat(5001),
      tokensUsed: { input: 1, output: 1 },
    });

    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "reply_too_long" });
    expect(insertMessage).not.toHaveBeenCalled();
  });

  it("channel이 null → no_channel (B-2 review HIGH code[2])", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      channel: null,
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue(null);
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "응답",
      tokensUsed: { input: 1, output: 1 },
    });

    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "no_channel" });
    expect(insertMessage).not.toHaveBeenCalled();
  });

  it("markAIResponded가 false 반환 (동시 호출 race) → already_responded (B-2 review HIGH)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue(null);
    vi.mocked(markAIResponded).mockResolvedValue(false);

    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "already_responded" });
    expect(generateReplyMock).not.toHaveBeenCalled();
    expect(insertMessage).not.toHaveBeenCalled();
  });

  it("insertMessage가 null 반환 → insert_failed (markAIResponded는 이미 claim됨)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue(null);
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue(null);

    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({ stored: false, reason: "insert_failed" });
    // markAI는 generateReply 전에 호출됨 (race-safe claim) → 1번 호출
    expect(markAIResponded).toHaveBeenCalledTimes(1);
  });

  it("originalText 비어있는 메시지는 recentMessages에서 제외", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([
      { ...baseInbound, originalText: null, direction: "inbound" },
      { ...baseInbound, originalText: "유효", direction: "inbound" },
    ]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue(null);
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "응답",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        recentMessages: [{ direction: "inbound", text: "유효" }],
      }),
    );
  });

  it("customerLanguage='ko' → translateReply/markTranslated 미호출 (B-3a no-op)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue(null); // null → ko
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "안녕!",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);
    expect(translateReplyMock).not.toHaveBeenCalled();
    expect(markTranslated).not.toHaveBeenCalled();
  });

  it("customerLanguage='en' → translateReply 호출 + markTranslated 호출 (B-3a happy)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("en");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "안녕!",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({
      ...baseInbound,
      id: "ai-out-id",
    });
    translateReplyMock.mockResolvedValue({
      translatedText: "Hello!",
      tokensUsed: { input: 5, output: 3 },
    });

    await generateAndStoreReply(VALID_UUID, deps);
    expect(translateReplyMock).toHaveBeenCalledWith({
      koreanText: "안녕!",
      targetLanguage: "en",
    });
    expect(markTranslated).toHaveBeenCalledWith(fakeDb, "ai-out-id", {
      translatedText: "Hello!",
      languageTo: "en",
    });
  });

  it("translateReply 실패 → silent skip, 결과는 stored: true (B-3a Q1=A)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("en");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "안녕",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({
      ...baseInbound,
      id: "ai-out-2",
    });
    translateReplyMock.mockRejectedValue(new Error("AI 번역 실패"));

    const r = await generateAndStoreReply(VALID_UUID, deps);
    expect(r).toEqual({
      stored: true,
      aiMessageId: "ai-out-2",
      tokensUsed: { input: 1, output: 1 },
    });
    expect(markTranslated).not.toHaveBeenCalled();
  });

  it("customerId가 UUID 형식 아니면 getCustomerPreferredLanguage 미호출 + 'ko' fallback (B-2 review M-3)", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      customerId: "not-a-uuid",
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "안녕!",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);
    expect(getCustomerPreferredLanguage).not.toHaveBeenCalled();
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({ customerLanguage: "ko" }),
    );
  });

  it("module exports generateAndStoreReply (pure)", async () => {
    const mod = await import("./generate-and-store-reply");
    expect(typeof mod.generateAndStoreReply).toBe("function");
  });

  it("default db는 모듈 캐시된 lazy singleton (B-2 review HIGH code[1])", async () => {
    const { readFile } = await import("node:fs/promises");
    const src = await readFile(
      "src/features/inbox/ai/generate-and-store-reply.ts",
      "utf-8",
    );
    // 매 호출마다 createDbClient 직접 호출하지 않고 helper 경유
    expect(src).not.toMatch(/deps\.db\s*\?\?\s*createDbClient/);
    expect(src).toMatch(/cachedDb|getDefaultDb/);
  });
});
