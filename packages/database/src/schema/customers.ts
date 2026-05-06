import { sql } from "drizzle-orm";
import { integer, pgTable, text, uniqueIndex, uuid } from "drizzle-orm/pg-core";

export const customers = pgTable(
  "customers",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    externalId: text("external_id"),
    channel: text("channel"),
    nationality: text("nationality"),
    preferredLanguage: text("preferred_language"),
    paymentMethodPreferred: text("payment_method_preferred"),
    totalVisits: integer("total_visits").default(0),
    ltvKrw: integer("ltv_krw").default(0),
    /**
     * Epic Customer 확장 (CC-1) — IG profile API에서 1회 fetch 결과.
     * 새 customer 생성 시 process-inbound가 자동 채움. nullable (fetch 실패
     * 또는 기존 customer로 backfill 보류 가능).
     */
    name: text("name"),
    /** Epic Customer 확장 (CC-1) — 사장 메모: 알러지 등 주의사항. */
    allergyNote: text("allergy_note"),
    /** Epic Customer 확장 (CC-1) — 사장 메모: 선호 디자이너/스태프 이름. */
    preferredDesigner: text("preferred_designer"),
  },
  (table) => [
    uniqueIndex("idx_customers_channel_external")
      .on(table.channel, table.externalId)
      .where(sql`${table.externalId} IS NOT NULL`),
  ],
);
