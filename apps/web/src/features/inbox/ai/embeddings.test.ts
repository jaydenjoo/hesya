import { describe, it, expect, beforeEach, vi } from "vitest";

const { embeddingsCreateMock } = vi.hoisted(() => ({
  embeddingsCreateMock: vi.fn(),
}));

vi.mock("openai", () => {
  class MockOpenAI {
    embeddings = { create: embeddingsCreateMock };
    constructor() {}
  }
  return { default: MockOpenAI };
});

import { generateEmbedding, EMBEDDING_DIMENSIONS } from "./embeddings";

describe("embeddings.generateEmbedding (B-4a)", () => {
  beforeEach(() => {
    embeddingsCreateMock.mockReset();
  });

  it("OpenAI text-embedding-3-small 호출 + 1536d 벡터 반환", async () => {
    const fakeVec = Array.from({ length: 1536 }, (_, i) => i / 1536);
    embeddingsCreateMock.mockResolvedValue({
      data: [{ embedding: fakeVec }],
      usage: { prompt_tokens: 5 },
    });

    const result = await generateEmbedding({ text: "안녕하세요" });

    expect(result.embedding).toHaveLength(1536);
    expect(result.embedding).toEqual(fakeVec);
    expect(result.tokensUsed).toBe(5);
    expect(embeddingsCreateMock).toHaveBeenCalledWith({
      model: "text-embedding-3-small",
      input: "안녕하세요",
    });
  });

  it("EMBEDDING_DIMENSIONS 상수는 1536 (text-embedding-3-small)", () => {
    expect(EMBEDDING_DIMENSIONS).toBe(1536);
  });

  it("빈 문자열 입력 → ValidationError (사전 가드)", async () => {
    await expect(generateEmbedding({ text: "" })).rejects.toThrow(
      /text is required/,
    );
    expect(embeddingsCreateMock).not.toHaveBeenCalled();
  });

  it("8192 chars 초과 입력 → ValidationError (OpenAI 토큰 한도 보호)", async () => {
    const tooLong = "가".repeat(8193);
    await expect(generateEmbedding({ text: tooLong })).rejects.toThrow(
      /too long/,
    );
    expect(embeddingsCreateMock).not.toHaveBeenCalled();
  });

  it("OpenAI 응답에 data 없음 → 명시적 에러", async () => {
    embeddingsCreateMock.mockResolvedValue({ data: [], usage: {} });
    await expect(generateEmbedding({ text: "x" })).rejects.toThrow(
      /no embedding returned/,
    );
  });

  it("OpenAI 응답 dim ≠ 1536 → 에러 (모델 변경 시 fail-fast)", async () => {
    embeddingsCreateMock.mockResolvedValue({
      data: [{ embedding: [0.1, 0.2, 0.3] }],
      usage: { prompt_tokens: 1 },
    });
    await expect(generateEmbedding({ text: "x" })).rejects.toThrow(
      /unexpected embedding dim/,
    );
  });
});
