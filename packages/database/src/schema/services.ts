import { integer, pgTable, text, uuid } from "drizzle-orm/pg-core";
import { stores } from "./stores";

export const services = pgTable("services", {
  id: uuid("id").primaryKey().defaultRandom(),
  storeId: uuid("store_id").references(() => stores.id),
  nameKo: text("name_ko").notNull(),
  nameEn: text("name_en"),
  nameJa: text("name_ja"),
  nameZhCn: text("name_zh_cn"),
  nameZhTw: text("name_zh_tw"),
  nameVi: text("name_vi"),
  priceKrw: integer("price_krw").notNull(),
  durationMinutes: integer("duration_minutes"),
  category: text("category"),
});
