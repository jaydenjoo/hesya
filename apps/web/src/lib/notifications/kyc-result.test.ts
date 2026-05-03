/**
 * E9-9 KYC 결과 알림 메시지 builder 단위 테스트.
 *
 * 6 locale × 3 kind = 18 cases. 모든 메시지가 비어있지 않고 storeName이
 * 본문에 정확히 포함되는지 검증. 실 발송(sendKycNotification)은 Resend SDK
 * 의존이라 테스트 대상 X — 메시지 정의 정확성에만 집중.
 *
 * 4원칙 2번: 'manual_rejected'는 Epic 12 admin panel 시점에 호출됨 — 지금
 * 호출처가 없어 미정의 (dead code 회피).
 */
import { describe, expect, it } from "vitest";
import { LOCALES, type Locale } from "@hesya/translations";
import {
  buildKycNotification,
  KYC_RESULT_KINDS,
  type KycResultKind,
} from "./kyc-result";

describe("buildKycNotification", () => {
  const storeName = "청담미용실";
  const reason = "재검증 매칭 점수 0.421 < 0.85";

  for (const locale of LOCALES) {
    for (const kind of KYC_RESULT_KINDS) {
      it(`[${locale}/${kind}] subject·body 비어있지 않고 storeName 포함`, () => {
        const result = buildKycNotification({
          kind: kind as KycResultKind,
          locale: locale as Locale,
          storeName,
          reason,
        });
        expect(result.subject.length).toBeGreaterThan(0);
        expect(result.body.length).toBeGreaterThan(0);
        expect(result.body).toContain(storeName);
      });
    }
  }

  it("reason이 없어도 manual_review_queued/manual_rejected가 동작", () => {
    const result = buildKycNotification({
      kind: "manual_review_queued",
      locale: "ko",
      storeName,
      // reason omitted
    });
    expect(result.subject.length).toBeGreaterThan(0);
    expect(result.body.length).toBeGreaterThan(0);
  });

  it("reason이 있으면 manual_review_queued body에 포함", () => {
    const result = buildKycNotification({
      kind: "manual_review_queued",
      locale: "ko",
      storeName,
      reason,
    });
    expect(result.body).toContain(reason);
  });
});
