/**
 * E9-12 KYC 검증 로그 (immutable audit trail).
 *
 * v0006 마이그레이션. event_type 5종 enum + actor_user_id nullable (cron이면 NULL).
 */
import { kycVerificationLogs } from "@hesya/database/schema";
import { z } from "zod";

export const KYC_LOG_EVENT_TYPES = [
  "nts_check",
  "localdata_match",
  "status_change",
  "cron_revalidate",
  "notification_sent",
] as const;
export type KycLogEventType = (typeof KYC_LOG_EVENT_TYPES)[number];

export const kycVerificationLogInsertSchema = z.object({
  id: z.string().uuid().optional(),
  verificationId: z.string().uuid(),
  eventType: z.enum(KYC_LOG_EVENT_TYPES),
  eventData: z.unknown().nullish(),
  actorUserId: z.string().uuid().nullish(),
  createdAt: z.date().optional(),
});

export const kycVerificationLogSelectSchema = z.object({
  id: z.string().uuid(),
  verificationId: z.string().uuid(),
  eventType: z.enum(KYC_LOG_EVENT_TYPES),
  eventData: z.unknown().nullable(),
  actorUserId: z.string().uuid().nullable(),
  createdAt: z.date(),
});

export type KycVerificationLog = typeof kycVerificationLogs.$inferSelect;
export type NewKycVerificationLog = typeof kycVerificationLogs.$inferInsert;
