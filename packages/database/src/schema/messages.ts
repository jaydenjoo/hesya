import { sql } from "drizzle-orm";
import {
  boolean,
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uniqueIndex,
  uuid,
} from "drizzle-orm/pg-core";
import { conversations } from "./conversations";
import { customers } from "./customers";
import { stores } from "./stores";

/**
 * Epic 1B-Tone-1 — messages.metadata 형태.
 *
 * tones: AIAssist 4탭(warm/formal/short/friendly) 4 variations 동시 저장.
 * `originalText`는 default tone(warm) 한 개만, 나머지 3개는 metadata.tones에.
 * metadata=NULL → 1A/1B 레거시 메시지 (UI는 originalText fallback).
 *
 * Epic 1B-Tone Phase 2-A — verifications: tone별 self-check 결과.
 * state 'ok'면 톤 일관성 OK, 'warn'면 reason에 사유. reason=null이면 UI에서
 * "이유 보기" 버튼 미표시. verifications=undefined도 UI는 정상 동작 (pill 미표시).
 */
export type ToneVerification = {
  state: "ok" | "warn";
  label: string;
  reason: string | null;
};

export type MessageMetadata = {
  tones?: {
    warm: string;
    formal: string;
    short: string;
    friendly: string;
  };
  verifications?: {
    warm: ToneVerification;
    formal: ToneVerification;
    short: ToneVerification;
    friendly: ToneVerification;
  };
};

export const messages = pgTable(
  "messages",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id").references(() => stores.id),
    customerId: uuid("customer_id").references(() => customers.id),
    conversationId: uuid("conversation_id").references(() => conversations.id, {
      onDelete: "cascade",
    }),
    channel: text("channel"),
    direction: text("direction"),
    externalMessageId: text("external_message_id"),
    status: text("status"),
    originalText: text("original_text"),
    translatedText: text("translated_text"),
    languageFrom: text("language_from"),
    languageTo: text("language_to"),
    aiResponded: boolean("ai_responded").default(false),
    aiModel: text("ai_model"),
    metadata: jsonb("metadata").$type<MessageMetadata>(),
    createdAt: timestamp("created_at", { withTimezone: true }).defaultNow(),
  },
  (table) => [
    check(
      "messages_direction_check",
      sql`${table.direction} IN ('inbound','outbound')`,
    ),
    index("idx_messages_conv_created").on(
      table.conversationId,
      table.createdAt.desc(),
    ),
    uniqueIndex("idx_messages_external_unique")
      .on(table.channel, table.externalMessageId)
      .where(sql`${table.externalMessageId} IS NOT NULL`),
  ],
);
