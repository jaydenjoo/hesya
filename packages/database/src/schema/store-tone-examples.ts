import { index, pgTable, text, timestamp, uuid } from "drizzle-orm/pg-core";
import { stores } from "./stores";

/**
 * Epic 1 1B Phase 2-B — 매장 톤 학습 (사장님 말투 reference).
 *
 * 사장이 Composer에서 답변을 작성한 뒤 "🎙️ 내 매장 톤 학습 →" 버튼을
 * 명시적으로 클릭하면 한 row가 추가된다. AI 답변 생성 시 최근 N개를
 * `generate-reply.ts`의 system prompt에 few-shot으로 주입해 그 매장
 * 고유 어휘/말투를 4 tone variation의 reference로 사용한다.
 *
 * **명시 학습만**: outbound 자동 저장은 별 Task로 분리 (privacy + 사장 통제권).
 * **content 길이**: Server Action에서 1~500자 zod 검증 (B-3 학습 효과 vs 비용 balance).
 * **인덱스**: (store_id, created_at DESC) — listRecentToneExamples 최신 N개 조회 지원.
 */
export const storeToneExamples = pgTable(
  "store_tone_examples",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    content: text("content").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    index("idx_store_tone_examples_store_id_created_at").on(
      table.storeId,
      table.createdAt.desc(),
    ),
  ],
);
