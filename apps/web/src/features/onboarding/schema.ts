import { z } from "zod";

/**
 * Phase 1-β Task B — owner self-serve KYC 신청 입력 검증.
 *
 * spec: docs/superpowers/specs/2026-05-07-phase-1-beta-design.md §3.1
 *
 * 자기신고 3건 (massage / medical_device / oriental_medicine)은 모두
 * `true` 강제. 한 건이라도 false면 신청 자체가 zod에서 reject —
 * UI 측 disable과 별개로 server에서도 차단.
 *
 * 자동 검증(OCR / NTS / LOCALDATA)은 Phase 1-β scope OUT — 폼은 수집만 하고
 * Task C admin 큐에서 운영자가 manual_review.
 */
export const KycApplicationSchema = z.object({
  storeName: z.string().min(1).max(100),
  representativeName: z.string().min(1).max(100),
  businessNumber: z.string().regex(/^\d{10}$/, "사업자번호는 숫자 10자리"),
  phone: z.string().regex(/^\d{9,11}$/),
  address: z.string().min(5).max(500),
  businessLicenseImageUrl: z.url(),
  declarationNoMassage: z.literal(true),
  declarationNoMedicalDevice: z.literal(true),
  declarationNoOrientalMedicine: z.literal(true),
});

export type KycApplication = z.infer<typeof KycApplicationSchema>;
