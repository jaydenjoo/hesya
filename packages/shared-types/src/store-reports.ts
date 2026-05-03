/**
 * E9-11 외부 신고 채널.
 *
 * PRD § 7 line 781~792 + § 1062 (Epic 12 SLA: 6h 긴급 / 72h 일반).
 * E9-11 = 신고 접수 + DB INSERT만. 신고 처리(차단)는 E12-3 (Epic 12).
 *
 * reporter_type / report_reason은 admin queue 필터링·집계 정형성을 위해 enum 강제.
 * Phase 1 admin 검증용. 공개 폼 (외부인 신고)은 Phase 1.5 reCAPTCHA 도입 후.
 */
import { storeReports } from "@hesya/database/schema";
import { z } from "zod";

export const REPORTER_TYPES = [
  "customer",
  "competitor",
  "staff",
  "anonymous",
] as const;
export type ReporterType = (typeof REPORTER_TYPES)[number];

export const REPORT_REASONS = [
  "illegal_service",
  "safety_issue",
  "fraud",
  "other",
] as const;
export type ReportReason = (typeof REPORT_REASONS)[number];

/** Server Action 입력 schema. evidenceUrls는 https URL만 (신뢰 가능) + 최대 5개. */
export const submitStoreReportInputSchema = z.object({
  storeId: z.string().uuid("storeId는 UUID"),
  reporterType: z.enum(REPORTER_TYPES),
  reportReason: z.enum(REPORT_REASONS),
  description: z.string().trim().min(10, "신고 내용은 최소 10자").max(2000),
  evidenceUrls: z
    .array(z.string().url("evidence URL 형식 오류"))
    .max(5, "evidence URL은 최대 5개")
    .optional(),
});

export type SubmitStoreReportInput = z.infer<
  typeof submitStoreReportInputSchema
>;

export const storeReportInsertSchema = z.object({
  id: z.string().uuid().optional(),
  storeId: z.string().uuid().nullish(),
  reporterType: z.string().nullish(),
  reportReason: z.string().nullish(),
  description: z.string().nullish(),
  evidenceUrls: z.string().array().nullish(),
  status: z.string().nullish(),
  resolution: z.string().nullish(),
  createdAt: z.date().nullish(),
});

export const storeReportSelectSchema = z.object({
  id: z.string().uuid(),
  storeId: z.string().uuid().nullable(),
  reporterType: z.string().nullable(),
  reportReason: z.string().nullable(),
  description: z.string().nullable(),
  evidenceUrls: z.string().array().nullable(),
  status: z.string().nullable(),
  resolution: z.string().nullable(),
  createdAt: z.date().nullable(),
});

export type StoreReport = typeof storeReports.$inferSelect;
export type NewStoreReport = typeof storeReports.$inferInsert;
