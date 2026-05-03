/**
 * E9-5 약관 자기신고 helper.
 *
 * PRD § 5.4 Step 4 + § 7. 매장 사장이 가입 시 "마사지·의료기기·한방 시술 안 함"
 * 3개에 모두 동의해야 진행. 의료법 위반 가맹 차단의 법적 분리 근거.
 *
 * 자기신고 자체는 immutable. 한 번 서명되면 same verification에 재서명 X
 * (already_signed). 변경하려면 verification row reset 필요 (admin 작업).
 *
 * Repository pattern: SelfDeclarationRepo 인터페이스로 DB 의존 분리 → 단위
 * 테스트는 mock으로 입력/호출 검증. production은 createDrizzleSelfDeclarationRepo()로 주입.
 */
import "server-only";
import { storeVerifications, eq, type DbClient } from "@hesya/database";
import { z } from "zod";

export interface DeclarationFlags {
  noMassage: boolean;
  noMedicalDevice: boolean;
  noOrientalMedicine: boolean;
}

export interface SelfDeclarationRepo {
  /** 이미 서명된 verification이면 signedAt timestamp 반환, 아니면 null */
  findSignature: (verificationId: string) => Promise<Date | null>;
  markSigned: (input: {
    verificationId: string;
    declarations: DeclarationFlags;
    signedAt: Date;
  }) => Promise<void>;
}

export const signSelfDeclarationInputSchema = z.object({
  verificationId: z.string().uuid("verificationId는 UUID"),
  declarations: z.object({
    noMassage: z.boolean(),
    noMedicalDevice: z.boolean(),
    noOrientalMedicine: z.boolean(),
  }),
});

export type SignSelfDeclarationInput = z.infer<
  typeof signSelfDeclarationInputSchema
> & {
  repo: SelfDeclarationRepo;
};

export type SignSelfDeclarationResult =
  | {
      ok: true;
      verificationId: string;
      signedAt: Date;
    }
  | {
      ok: false;
      error: "invalid_input" | "declaration_incomplete" | "already_signed";
      message: string;
    };

export async function signSelfDeclaration(
  input: SignSelfDeclarationInput,
): Promise<SignSelfDeclarationResult> {
  const { repo, ...rest } = input;
  const parsed = signSelfDeclarationInputSchema.safeParse(rest);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const { declarations, verificationId } = parsed.data;
  const allTrue =
    declarations.noMassage &&
    declarations.noMedicalDevice &&
    declarations.noOrientalMedicine;
  if (!allTrue) {
    return {
      ok: false,
      error: "declaration_incomplete",
      message:
        "마사지·의료기기·한방 시술 3가지 모두 '안 함'에 동의해야 가입 가능",
    };
  }

  const existing = await repo.findSignature(verificationId);
  if (existing !== null) {
    return {
      ok: false,
      error: "already_signed",
      message: `이미 ${existing.toISOString()}에 서명됨 — 재서명 불가`,
    };
  }

  const signedAt = new Date();
  await repo.markSigned({ verificationId, declarations, signedAt });
  return { ok: true, verificationId, signedAt };
}

/**
 * Drizzle 기반 production repo. 호출처에서 1회 생성 후 signSelfDeclaration에 주입.
 */
export function createDrizzleSelfDeclarationRepo(
  db: DbClient,
): SelfDeclarationRepo {
  return {
    findSignature: async (verificationId) => {
      const [row] = await db
        .select({
          signedAt: storeVerifications.selfDeclarationSignedAt,
        })
        .from(storeVerifications)
        .where(eq(storeVerifications.id, verificationId))
        .limit(1);
      return row?.signedAt ?? null;
    },
    markSigned: async ({ verificationId, declarations, signedAt }) => {
      await db
        .update(storeVerifications)
        .set({
          declarationNoMassage: declarations.noMassage,
          declarationNoMedicalDevice: declarations.noMedicalDevice,
          declarationNoOrientalMedicine: declarations.noOrientalMedicine,
          selfDeclarationSignedAt: signedAt,
          updatedAt: signedAt,
        })
        .where(eq(storeVerifications.id, verificationId));
    },
  };
}
