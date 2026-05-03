import { sql } from "drizzle-orm";
import {
  check,
  index,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import { storeVerifications } from "./store-verifications";
import { users } from "./auth/users";

/**
 * E9-12 KYC 검증 로그·감사 추적 (immutable).
 *
 * 마이그레이션 v0006. 의사결정(auto_approved/manual_review/rejected) 경위를
 * 영구 기록 → 법적 책임 분쟁 시 증거.
 *
 * IMMUTABLE 보장 (DB 레벨):
 *   - RLS ENABLE + 정책 0개 = default deny (anon/authenticated 차단)
 *   - service_role은 BYPASSRLS=true로 INSERT 가능
 *   - BEFORE UPDATE/DELETE trigger → RAISE EXCEPTION (service_role도 차단,
 *     superuser 외 모든 role 차단). 임시 테이블 검증 완료.
 *   - 코드에서 UPDATE/DELETE 호출하면 P0001 ERROR로 즉시 throw됨 (의도).
 *
 * event_type 5종 (현재 KYC 흐름 cover):
 *   nts_check / localdata_match / status_change / cron_revalidate / notification_sent
 * 미구현 5종은 E9-4·5·6·7·11 진입 시 ALTER로 enum 확장.
 */
export const kycVerificationLogs = pgTable(
  "kyc_verification_logs",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    verificationId: uuid("verification_id")
      .notNull()
      .references(() => storeVerifications.id),
    eventType: text("event_type").notNull(),
    eventData: jsonb("event_data"),
    actorUserId: uuid("actor_user_id").references(() => users.id),
    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (table) => [
    check(
      "kyc_verification_logs_event_type_check",
      sql`${table.eventType} IN ('nts_check','localdata_match','status_change','cron_revalidate','notification_sent')`,
    ),
    index("kyc_verification_logs_verification_id_idx").on(table.verificationId),
    index("kyc_verification_logs_event_type_idx").on(table.eventType),
    index("kyc_verification_logs_created_at_idx").on(table.createdAt.desc()),
  ],
);
