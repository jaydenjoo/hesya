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
vi.mock("@/shared/lib/dal/store-tone-examples", () => ({
  // default: 빈 배열 반환 (storeId 있는 회귀 테스트가 mock 누락에도 안전).
  listRecentToneExamples: vi.fn(async () => []),
}));
vi.mock("next/cache", () => ({
  revalidatePath: vi.fn(),
}));
vi.mock("@sentry/nextjs", () => ({
  captureException: vi.fn(),
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
import * as Sentry from "@sentry/nextjs";

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
  metadata: null,
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

  it("translateReply 실패 → Sentry tag 'translateReply' + extra inputLength (B-3a review code MED)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("en");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "안녕".repeat(10),
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({
      ...baseInbound,
      id: "ai-out-3",
    });
    translateReplyMock.mockRejectedValue(new Error("AI 번역 실패"));

    await generateAndStoreReply(VALID_UUID, deps);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { phase: "translateReply" },
        extra: expect.objectContaining({
          aiMessageId: "ai-out-3",
          targetLanguage: "en",
          inputLength: 20,
        }),
      }),
    );
  });

  it("markTranslated 실패 → Sentry tag 'markTranslated' (try-catch 분리, B-3a review code MED)", async () => {
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
      id: "ai-out-4",
    });
    translateReplyMock.mockResolvedValue({
      translatedText: "Hi",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(markTranslated).mockRejectedValue(new Error("DB write 실패"));

    await generateAndStoreReply(VALID_UUID, deps);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { phase: "markTranslated" },
      }),
    );
  });

  it("translatedText > 7500자 → silent skip, markTranslated 미호출 (출력 길이 가드, security MED)", async () => {
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
      id: "ai-out-5",
    });
    translateReplyMock.mockResolvedValue({
      translatedText: "x".repeat(7501),
      tokensUsed: { input: 1, output: 1 },
    });

    await generateAndStoreReply(VALID_UUID, deps);
    expect(markTranslated).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { phase: "translateReply" },
        extra: expect.objectContaining({
          translatedLength: 7501,
        }),
      }),
    );
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

  // ─── B-4b RAG 통합 ───

  it("RAG: storeId + 임베딩 + 검색 → relatedFAQs를 generateReply에 전달", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: "44444444-4444-4444-8444-444444444444",
      originalText: "단발 가능?",
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([
      { ...baseInbound, originalText: "단발 가능?" },
    ]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("미용실");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const generateEmbedding = vi.fn().mockResolvedValue({
      embedding: Array(1536).fill(0.1),
      tokensUsed: 5,
    });
    const searchSimilarKnowledge = vi.fn().mockResolvedValue([
      { question: "단발 가능?", answer: "네 5만원입니다" },
      { question: "예약?", answer: "DM" },
    ]);
    generateReplyMock.mockResolvedValue({
      reply: "네 가능합니다",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({
      ...baseInbound,
      id: "ai-rag",
    });

    await generateAndStoreReply(VALID_UUID, {
      ...deps,
      generateEmbedding,
      searchSimilarKnowledge,
    });

    expect(generateEmbedding).toHaveBeenCalledWith({ text: "단발 가능?" });
    expect(searchSimilarKnowledge).toHaveBeenCalledWith(
      fakeDb,
      "44444444-4444-4444-8444-444444444444",
      expect.any(Array),
      expect.objectContaining({ k: 3 }),
    );
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        relatedFAQs: [
          { question: "단발 가능?", answer: "네 5만원입니다" },
          { question: "예약?", answer: "DM" },
        ],
      }),
    );
  });

  it("RAG: storeId null → 검색 skip + relatedFAQs 미전달 (기존 흐름 유지)", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: null,
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("X");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const generateEmbedding = vi.fn();
    const searchSimilarKnowledge = vi.fn();
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, {
      ...deps,
      generateEmbedding,
      searchSimilarKnowledge,
    });

    expect(generateEmbedding).not.toHaveBeenCalled();
    expect(searchSimilarKnowledge).not.toHaveBeenCalled();
    const call = generateReplyMock.mock.calls[0]?.[0];
    expect(call?.relatedFAQs).toBeUndefined();
  });

  it("RAG: 임베딩 실패 → silent skip + Sentry tag 'embedding' (FAQ 없이 진행)", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: "44444444-4444-4444-8444-444444444444",
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("X");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const generateEmbedding = vi
      .fn()
      .mockRejectedValue(new Error("OpenAI down"));
    const searchSimilarKnowledge = vi.fn();
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    const r = await generateAndStoreReply(VALID_UUID, {
      ...deps,
      generateEmbedding,
      searchSimilarKnowledge,
    });

    expect(r.stored).toBe(true);
    expect(searchSimilarKnowledge).not.toHaveBeenCalled();
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({ tags: { phase: "embedding" } }),
    );
    const call = generateReplyMock.mock.calls[0]?.[0];
    expect(call?.relatedFAQs).toBeUndefined();
  });

  it("RAG: 검색 실패 → silent skip + Sentry tag 'searchSimilarKnowledge'", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: "44444444-4444-4444-8444-444444444444",
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("X");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const generateEmbedding = vi
      .fn()
      .mockResolvedValue({ embedding: Array(1536).fill(0.1), tokensUsed: 5 });
    const searchSimilarKnowledge = vi
      .fn()
      .mockRejectedValue(new Error("DB error"));
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    const r = await generateAndStoreReply(VALID_UUID, {
      ...deps,
      generateEmbedding,
      searchSimilarKnowledge,
    });

    expect(r.stored).toBe(true);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { phase: "searchSimilarKnowledge" },
      }),
    );
    const call = generateReplyMock.mock.calls[0]?.[0];
    expect(call?.relatedFAQs).toBeUndefined();
  });

  it("RAG: 3000자 초과 inbound → embed 호출 안 함 + Sentry 미발생 (Sec DoS 방어)", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: "44444444-4444-4444-8444-444444444444",
      originalText: "가".repeat(3001),
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("X");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const generateEmbedding = vi.fn();
    const searchSimilarKnowledge = vi.fn();
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, {
      ...deps,
      generateEmbedding,
      searchSimilarKnowledge,
    });

    expect(generateEmbedding).not.toHaveBeenCalled();
    expect(Sentry.captureException).not.toHaveBeenCalled();
  });

  it("RAG: 검색 결과 빈 배열 → relatedFAQs=[] 전달 (정상)", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: "44444444-4444-4444-8444-444444444444",
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("X");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const generateEmbedding = vi
      .fn()
      .mockResolvedValue({ embedding: Array(1536).fill(0.1), tokensUsed: 5 });
    const searchSimilarKnowledge = vi.fn().mockResolvedValue([]);
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, {
      ...deps,
      generateEmbedding,
      searchSimilarKnowledge,
    });

    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({ relatedFAQs: [] }),
    );
  });

  it("Epic 1B-Tone-3: tones 있으면 metadata.tones로 insertMessage 호출", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("ko");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const tones = {
      warm: "사쿠라님~ 가능합니다 :)",
      formal: "안녕하십니까. 가능합니다.",
      short: "네, 가능.",
      friendly: "네! 가능해요!",
    };
    generateReplyMock.mockResolvedValue({
      reply: tones.warm,
      tones,
      tokensUsed: { input: 10, output: 40 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);

    expect(insertMessage).toHaveBeenCalledWith(
      fakeDb,
      expect.objectContaining({
        originalText: tones.warm,
        metadata: { tones },
      }),
    );
  });

  it("Phase 2-A: verifications 있으면 metadata.verifications도 저장", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("ko");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const tones = {
      warm: "w",
      formal: "f",
      short: "s",
      friendly: "fr",
    };
    const verifications = {
      warm: { state: "ok" as const, label: "OK", reason: null },
      formal: {
        state: "warn" as const,
        label: "사무적",
        reason: "환영 인사 누락",
      },
      short: { state: "ok" as const, label: "OK", reason: null },
      friendly: { state: "ok" as const, label: "OK", reason: null },
    };
    generateReplyMock.mockResolvedValue({
      reply: tones.warm,
      tones,
      verifications,
      tokensUsed: { input: 10, output: 40 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);

    expect(insertMessage).toHaveBeenCalledWith(
      fakeDb,
      expect.objectContaining({
        metadata: { tones, verifications },
      }),
    );
  });

  it("Phase 2-A: tones 있고 verifications 없으면 verifications 키 생략", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("ko");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const tones = { warm: "w", formal: "f", short: "s", friendly: "fr" };
    generateReplyMock.mockResolvedValue({
      reply: tones.warm,
      tones,
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);

    const call = vi.mocked(insertMessage).mock.calls.at(-1);
    const args = call?.[1] as { metadata?: Record<string, unknown> };
    expect(args.metadata).toEqual({ tones });
    expect(args.metadata).not.toHaveProperty("verifications");
  });

  it("Epic 1B-Tone-3: tones 없으면 metadata 생략 (1A/1B 호환)", async () => {
    vi.mocked(findMessageById).mockResolvedValue(baseInbound);
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("가게");
    vi.mocked(getCustomerPreferredLanguage).mockResolvedValue("ko");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    generateReplyMock.mockResolvedValue({
      reply: "안녕!",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, deps);

    const call = vi.mocked(insertMessage).mock.calls.at(-1);
    const args = call?.[1] as Record<string, unknown> | undefined;
    expect(args?.metadata).toBeUndefined();
  });

  // ─── Phase 2-B: 매장 톤 학습 examples 주입 ───

  it("Phase 2-B: storeId 있음 → listRecentToneExamples(10) → storeToneExamples로 generateReply 전달", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: "55555555-5555-4555-8555-555555555555",
      originalText: "단발 가능?",
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("미용실");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const listRecentToneExamples = vi.fn().mockResolvedValue([
      {
        id: "t1",
        storeId: "55555555-5555-4555-8555-555555555555",
        content: "안녕하세요 손님~ 오늘도 좋은 하루 보내세요!",
        createdAt: new Date(),
      },
      {
        id: "t2",
        storeId: "55555555-5555-4555-8555-555555555555",
        content: "예약은 DM으로 받고 있어요",
        createdAt: new Date(),
      },
    ]);
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, {
      ...deps,
      listRecentToneExamples,
    });

    expect(listRecentToneExamples).toHaveBeenCalledWith(
      fakeDb,
      "55555555-5555-4555-8555-555555555555",
      10,
    );
    expect(generateReplyMock).toHaveBeenCalledWith(
      expect.objectContaining({
        storeToneExamples: [
          "안녕하세요 손님~ 오늘도 좋은 하루 보내세요!",
          "예약은 DM으로 받고 있어요",
        ],
      }),
    );
  });

  it("Phase 2-B: storeId null → listRecentToneExamples 호출 안 함 + storeToneExamples 미전달", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: null,
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("X");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const listRecentToneExamples = vi.fn();
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    await generateAndStoreReply(VALID_UUID, {
      ...deps,
      listRecentToneExamples,
    });

    expect(listRecentToneExamples).not.toHaveBeenCalled();
    const call = generateReplyMock.mock.calls[0]?.[0];
    expect(call?.storeToneExamples).toBeUndefined();
  });

  it("Phase 2-B: listRecentToneExamples 실패 → silent skip + Sentry tag 'listRecentToneExamples'", async () => {
    vi.mocked(findMessageById).mockResolvedValue({
      ...baseInbound,
      storeId: "55555555-5555-4555-8555-555555555555",
    });
    vi.mocked(listRecentByConversation).mockResolvedValue([baseInbound]);
    vi.mocked(findStoreNameByConversationId).mockResolvedValue("X");
    vi.mocked(markAIResponded).mockResolvedValue(true);
    const listRecentToneExamples = vi
      .fn()
      .mockRejectedValue(new Error("DB error"));
    generateReplyMock.mockResolvedValue({
      reply: "x",
      tokensUsed: { input: 1, output: 1 },
    });
    vi.mocked(insertMessage).mockResolvedValue({ ...baseInbound, id: "x" });

    const r = await generateAndStoreReply(VALID_UUID, {
      ...deps,
      listRecentToneExamples,
    });

    expect(r.stored).toBe(true);
    expect(Sentry.captureException).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { phase: "listRecentToneExamples" },
      }),
    );
    const call = generateReplyMock.mock.calls[0]?.[0];
    expect(call?.storeToneExamples).toBeUndefined();
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
