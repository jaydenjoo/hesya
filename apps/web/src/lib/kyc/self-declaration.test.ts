/**
 * E9-5 약관 자기신고 단위 테스트.
 *
 * 매장 사장이 가입 시 "마사지·의료기기·한방 시술 안 함" 3개 모두 동의해야
 * Step 4 통과. 하나라도 false면 가입 자격 없음 → declaration_incomplete.
 *
 * helper는 DB 의존 (UPDATE store_verifications + findSignature). 단위 테스트는
 * SelfDeclarationRepo mock으로 호출 인자 + 결과 union 검증만.
 */
import { describe, expect, it } from "vitest";
import {
  signSelfDeclaration,
  type SelfDeclarationRepo,
} from "./self-declaration";

function makeRepo(opts?: { existingSignedAt?: Date | null }) {
  const updateCalls: Array<{
    verificationId: string;
    declarations: {
      noMassage: boolean;
      noMedicalDevice: boolean;
      noOrientalMedicine: boolean;
    };
    signedAt: Date;
  }> = [];
  const repo: SelfDeclarationRepo = {
    findSignature: async () => opts?.existingSignedAt ?? null,
    markSigned: async (input) => {
      updateCalls.push(input);
    },
  };
  return { repo, updateCalls };
}

// Zod 4 .uuid()는 RFC 4122 strict — 버전 자릿수(3번째 그룹 1자리) 1~8,
// variant(4번째 그룹 1자리) 8/9/a/b 강제. v4 UUID 사용.
const VALID_UUID = "11111111-1111-4111-8111-111111111111";

describe("signSelfDeclaration", () => {
  it("3개 모두 true + 신규 서명 → ok + repo.markSigned 호출", async () => {
    const { repo, updateCalls } = makeRepo();
    const result = await signSelfDeclaration({
      repo,
      verificationId: VALID_UUID,
      declarations: {
        noMassage: true,
        noMedicalDevice: true,
        noOrientalMedicine: true,
      },
    });
    expect(result.ok).toBe(true);
    if (result.ok) {
      expect(result.verificationId).toBe(VALID_UUID);
      expect(result.signedAt).toBeInstanceOf(Date);
    }
    expect(updateCalls).toHaveLength(1);
    expect(updateCalls[0].declarations).toEqual({
      noMassage: true,
      noMedicalDevice: true,
      noOrientalMedicine: true,
    });
  });

  it("하나라도 false → declaration_incomplete + repo.markSigned 미호출", async () => {
    const { repo, updateCalls } = makeRepo();
    const result = await signSelfDeclaration({
      repo,
      verificationId: VALID_UUID,
      declarations: {
        noMassage: true,
        noMedicalDevice: false,
        noOrientalMedicine: true,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("declaration_incomplete");
    }
    expect(updateCalls).toHaveLength(0);
  });

  it("verificationId가 UUID 아니면 invalid_input", async () => {
    const { repo, updateCalls } = makeRepo();
    const result = await signSelfDeclaration({
      repo,
      verificationId: "not-a-uuid",
      declarations: {
        noMassage: true,
        noMedicalDevice: true,
        noOrientalMedicine: true,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("invalid_input");
    }
    expect(updateCalls).toHaveLength(0);
  });

  it("이미 서명된 verification → already_signed (immutable 동의)", async () => {
    const previousSignature = new Date("2026-04-30T00:00:00.000Z");
    const { repo, updateCalls } = makeRepo({
      existingSignedAt: previousSignature,
    });
    const result = await signSelfDeclaration({
      repo,
      verificationId: VALID_UUID,
      declarations: {
        noMassage: true,
        noMedicalDevice: true,
        noOrientalMedicine: true,
      },
    });
    expect(result.ok).toBe(false);
    if (!result.ok) {
      expect(result.error).toBe("already_signed");
    }
    expect(updateCalls).toHaveLength(0);
  });
});
