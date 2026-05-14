import {
  integer,
  jsonb,
  numeric,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { customers } from "./customers";
import { stores } from "./stores";

/**
 * Plan v4 Epic B — AI Photo Analysis.
 *
 * 외국인 손님이 원하는 헤어/메이크업 스타일 사진을 업로드하면 Claude Opus 4.7
 * Vision API가 시술 가능성을 판정한 결과를 저장. result_jsonb은 Vision 원본
 * response, 다른 컬럼은 UI 표시 편의용 정규화.
 */
export const photoAnalyses = pgTable("photo_analyses", {
  id: uuid("id").primaryKey().defaultRandom(),
  customerId: uuid("customer_id").references(() => customers.id, {
    onDelete: "set null",
  }),
  storeId: uuid("store_id").references(() => stores.id, {
    onDelete: "set null",
  }),
  imageUrl: text("image_url").notNull(),
  status: text("status").notNull().default("pending"),
  resultJsonb: jsonb("result_jsonb"),
  styleName: text("style_name"),
  difficulty: text("difficulty"),
  estimatedMinutes: integer("estimated_minutes"),
  compatibilityNote: text("compatibility_note"),
  confidence: numeric("confidence", { precision: 3, scale: 2 }),
  errorMessage: text("error_message"),
  createdAt: timestamp("created_at", { withTimezone: true })
    .notNull()
    .default(sql`now()`),
});

export type PhotoAnalysisStatus =
  | "pending"
  | "analyzing"
  | "completed"
  | "failed";

export type PhotoAnalysisDifficulty = "easy" | "medium" | "hard";
