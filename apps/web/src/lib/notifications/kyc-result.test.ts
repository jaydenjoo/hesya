/**
 * E9-9 + E9-13 KYC 결과 알림 메시지 builder 단위 테스트.
 *
 * 6 locale × 3 kind = 18 cases (E9-9 base) + 6 locale × actionable URL 6 cases (E9-13).
 * 모든 메시지가 비어있지 않고 storeName이 본문에 정확히 포함되는지 검증.
 *
 * E9-13: rejection kind(`auto_rejected_nts`)에 retryUrl/faqUrl 전달 시 본문에
 * 정확한 URL이 포함되어 외국인 사장님이 즉시 재신청할 수 있게 함.
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

describe("buildKycNotification — E9-9 base", () => {
  const storeName = "청담미용실";
  const reason = { summary: "재검증 매칭 점수 0.421 < 0.85" };

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

  it("reason.summary가 있으면 manual_review_queued body에 포함", () => {
    const result = buildKycNotification({
      kind: "manual_review_queued",
      locale: "ko",
      storeName,
      reason: { summary: "재검증 매칭 점수 0.421 < 0.85" },
    });
    expect(result.body).toContain("재검증 매칭 점수 0.421 < 0.85");
  });
});

describe("buildKycNotification — E9-13 actionable rejection (auto_rejected_nts)", () => {
  // 외국인 사장님이 거절 받았을 때 "그래서 뭘 어떻게 다시 해야 하지?"를 즉시
  // 해결할 수 있도록 본문에 재신청 URL + FAQ URL 직접 포함.
  const storeName = "Cheongdam Salon";
  const retryUrl = "https://hesya-web.vercel.app/admin/kyc-test#nts";
  const faqUrl = "https://hesya-web.vercel.app/en#faq-kyc";

  for (const locale of LOCALES) {
    it(`[${locale}/auto_rejected_nts] body에 retryUrl·faqUrl·summary 모두 포함`, () => {
      const result = buildKycNotification({
        kind: "auto_rejected_nts",
        locale: locale as Locale,
        storeName,
        reason: {
          summary: "NTS valid 코드 03 (사업자번호·대표자명 불일치)",
          retryUrl,
          faqUrl,
        },
      });
      expect(result.body).toContain(retryUrl);
      expect(result.body).toContain(faqUrl);
      expect(result.body).toContain(
        "NTS valid 코드 03 (사업자번호·대표자명 불일치)",
      );
    });
  }

  it("retryUrl 없으면 본문에 URL 라인 안 들어감 (graceful)", () => {
    const result = buildKycNotification({
      kind: "auto_rejected_nts",
      locale: "ko",
      storeName: "테스트",
      reason: { summary: "사유 only" },
    });
    expect(result.body).not.toContain("hesya-web.vercel.app");
    expect(result.body).toContain("사유 only");
  });

  it("auto_approved는 retryUrl 전달돼도 본문에 안 나옴 (성공 케이스 라인 없음)", () => {
    // 4원칙 3번: 의미 없는 곳에 라인 추가 X. auto_approved는 reason 자체가 무관.
    const result = buildKycNotification({
      kind: "auto_approved",
      locale: "ko",
      storeName: "테스트",
      reason: { summary: "shouldnotappear", retryUrl, faqUrl },
    });
    expect(result.body).not.toContain(retryUrl);
    expect(result.body).not.toContain(faqUrl);
  });
});
