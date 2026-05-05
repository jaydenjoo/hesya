import {
  index,
  pgTable,
  text,
  timestamp,
  uuid,
  vector,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";

/**
 * Epic 1 1B Phase B-4a — 매장 FAQ + 임베딩 (RAG).
 *
 * 사장이 등록한 질문/답변에 OpenAI text-embedding-3-small (1536d) 임베딩.
 * inbound 메시지 도착 시 메시지 임베딩과 cosine similarity top-k 검색.
 *
 * `embedding`은 nullable — FAQ 작성 후 임베딩 생성 실패 시 null. 검색 시
 * IS NOT NULL 가드로 제외.
 */
export const storeKnowledge = pgTable(
  "store_knowledge",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    question: text("question").notNull(),
    answer: text("answer").notNull(),
    embedding: vector("embedding", { dimensions: 1536 }),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_store_knowledge_store_id").on(table.storeId),
    // ivfflat 인덱스는 prod migration에서만 생성 (Drizzle 0.45 ivfflat 표현 미흡)
  ],
);
