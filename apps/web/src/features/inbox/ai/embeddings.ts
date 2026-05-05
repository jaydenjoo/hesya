/**
 * Phase B-4a — OpenAI text-embedding-3-small 임베딩 생성.
 *
 * **사용처**:
 *   - FAQ 등록·수정 시 question 임베딩 (DAL `upsertStoreKnowledge`)
 *   - inbound 메시지 도착 시 메시지 임베딩 (B-4b RAG 검색)
 *
 * **모델 선택**: text-embedding-3-small (1536차원, $0.02/M tokens). 한국어
 * 양호. 더 큰 차원(`-3-large`, 3072d)은 검색 품질 ↑이지만 5배 비쌈 +
 * pgvector 인덱스 크기 ↑. MVP는 small.
 *
 * **L-059 chained LLM framing 무관**: 임베딩 모델은 instruction 따르지
 * 않는 단방향 함수 (텍스트 → 벡터). prompt injection 위험 없음. 그러나
 * 임베딩 결과를 검색→LLM context 주입하는 B-4b에서는 framing 필수.
 *
 * **에러 처리**: 빈/과도한 입력은 사전 가드, OpenAI 실패는 throw — caller가
 * silent skip 또는 재시도 결정 (generate-and-store-reply.ts 패턴).
 */
import OpenAI from "openai";
import { env } from "@/shared/config/env";

export const EMBEDDING_DIMENSIONS = 1536;
export const EMBEDDING_MODEL = "text-embedding-3-small";

const MAX_INPUT_CHARS = 8192;

let client: OpenAI | null = null;
function getClient(): OpenAI {
  if (!client) {
    client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  }
  return client;
}

export type EmbeddingResult = {
  embedding: number[];
  tokensUsed: number;
};

export type EmbeddingDeps = {
  client?: Pick<OpenAI, "embeddings">;
};

export async function generateEmbedding(
  input: { text: string },
  deps: EmbeddingDeps = {},
): Promise<EmbeddingResult> {
  if (!input.text || input.text.trim().length === 0) {
    throw new Error("generateEmbedding: text is required");
  }
  if (input.text.length > MAX_INPUT_CHARS) {
    throw new Error(
      `generateEmbedding: text too long (${input.text.length} > ${MAX_INPUT_CHARS})`,
    );
  }

  const c = deps.client ?? getClient();
  const response = await c.embeddings.create({
    model: EMBEDDING_MODEL,
    input: input.text,
  });

  const first = response.data[0];
  if (!first) {
    throw new Error("generateEmbedding: no embedding returned");
  }
  if (first.embedding.length !== EMBEDDING_DIMENSIONS) {
    throw new Error(
      `generateEmbedding: unexpected embedding dim (${first.embedding.length} ≠ ${EMBEDDING_DIMENSIONS})`,
    );
  }

  return {
    embedding: first.embedding,
    tokensUsed: response.usage?.prompt_tokens ?? 0,
  };
}
