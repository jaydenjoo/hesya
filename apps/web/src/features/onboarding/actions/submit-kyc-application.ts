"use server";

import * as Sentry from "@sentry/nextjs";
import { headers } from "next/headers";
import {
  createDbClient,
  storeOwners,
  storeVerifications,
  stores,
} from "@hesya/database";
import { auth } from "@/lib/auth";
import { env } from "@/shared/config/env";
import { KycApplicationSchema } from "../schema";

/**
 * Phase 1-β Task B — owner self-serve KYC 신청 atomic insert.
 *
 * stores + store_verifications + store_owners 3 테이블을 단일 트랜잭션으로
 * INSERT. 한 쪽만 들어가면 admin 큐에서 owner 매핑이 깨져 검수 불가 →
 * 트랜잭션 필수.
 *
 * verification_status는 양 테이블 모두 'manual_review'로 고정. 자동 검증
 * (OCR / NTS / LOCALDATA)은 Phase 1-β scope OUT — Task C admin 큐에서 수동.
 *
 * userId는 caller 신뢰 금지 — Better Auth 세션에서 직접 조회.
 *
 * 결과 envelope:
 *   - { ok: true } — store/verification id 반환
 *   - { ok: false, error: "unauthorized" } — 세션 없음
 *   - { ok: false, error: "validation" } — zod safeParse 실패. UI 표시
 *   - { ok: false, error: "internal" } — DB 트랜잭션 실패. Sentry 캡처
 */
export type SubmitKycApplicationResult =
  | { ok: true; storeId: string; verificationId: string }
  | {
      ok: false;
      error: "unauthorized" | "validation" | "internal";
      message: string;
    };

export async function submitKycApplication(
  input: unknown,
): Promise<SubmitKycApplicationResult> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) {
    return {
      ok: false,
      error: "unauthorized",
      message: "로그인이 필요합니다",
    };
  }
  const userId = session.user.id;
  const parsed = KycApplicationSchema.safeParse(input);
  if (!parsed.success) {
    return { ok: false, error: "validation", message: parsed.error.message };
  }
  const data = parsed.data;
  try {
    const db = createDbClient(env.DATABASE_URL);
    return await db.transaction(async (tx) => {
      const [store] = await tx
        .insert(stores)
        .values({
          name: data.storeName,
          phone: data.phone,
          address: { full: data.address },
          businessLicenseNumber: data.businessNumber,
          businessLicenseImageUrl: data.businessLicenseImageUrl,
          verificationStatus: "manual_review",
        })
        .returning({ id: stores.id });
      if (!store) throw new Error("stores insert returned no row");
      const [verification] = await tx
        .insert(storeVerifications)
        .values({
          storeId: store.id,
          businessNumber: data.businessNumber,
          representativeName: data.representativeName,
          declarationNoMassage: data.declarationNoMassage,
          declarationNoMedicalDevice: data.declarationNoMedicalDevice,
          declarationNoOrientalMedicine: data.declarationNoOrientalMedicine,
          selfDeclarationSignedAt: new Date(),
          verificationStatus: "manual_review",
        })
        .returning({ id: storeVerifications.id });
      if (!verification) {
        throw new Error("store_verifications insert returned no row");
      }
      await tx.insert(storeOwners).values({
        userId,
        storeId: store.id,
        role: "owner",
      });
      return {
        ok: true as const,
        storeId: store.id,
        verificationId: verification.id,
      };
    });
  } catch (err) {
    // PII 최소화 — userId 풀 UUID 대신 8자 short만 (S3 정책 일관).
    Sentry.captureException(err, {
      tags: { phase: "onboarding:submit-kyc" },
      user: { id: userId.slice(0, 8) },
    });
    return { ok: false, error: "internal", message: "신청 저장 실패" };
  }
}
