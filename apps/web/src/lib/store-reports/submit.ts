/**
 * E9-11 외부 신고 접수 helper.
 *
 * PRD § 7 + § 1062. 외부인이 매장의 의료법 위반·위생·사기 등 제보 → store_reports
 * INSERT. 신고 처리(차단)는 E12-3 (Epic 12 admin panel)에서.
 *
 * 입력 검증:
 *   - storeId UUID + DB에 존재 검증 (잘못된 ID로 spam INSERT 방지)
 *   - reporter_type / report_reason은 enum 강제 (Zod)
 *   - description 최소 10자 (의미 있는 신고 내용 강제)
 *   - evidenceUrls 최대 5개 + https URL 검증
 *
 * Repository pattern: StoreReportRepo 인터페이스로 DB 의존 분리 → 단위 테스트는
 * mock으로 호출/결과 검증. production은 createDrizzleStoreReportRepo()로 주입.
 */
import "server-only";
import { storeReports, stores, eq, type DbClient } from "@hesya/database";
import {
  submitStoreReportInputSchema,
  type SubmitStoreReportInput,
} from "@hesya/shared-types";

export interface StoreReportRepo {
  storeExists: (storeId: string) => Promise<boolean>;
  insertReport: (input: SubmitStoreReportInput) => Promise<{ id: string }>;
}

export type SubmitStoreReportResult =
  | {
      ok: true;
      reportId: string;
      storeId: string;
    }
  | {
      ok: false;
      error: "invalid_input" | "store_not_found";
      message: string;
    };

interface HelperInput extends SubmitStoreReportInput {
  repo: StoreReportRepo;
}

export async function submitStoreReport(
  input: HelperInput,
): Promise<SubmitStoreReportResult> {
  const { repo, ...rest } = input;
  const parsed = submitStoreReportInputSchema.safeParse(rest);
  if (!parsed.success) {
    return {
      ok: false,
      error: "invalid_input",
      message: parsed.error.issues
        .map((i) => `${i.path.join(".")}: ${i.message}`)
        .join("; "),
    };
  }

  const exists = await repo.storeExists(parsed.data.storeId);
  if (!exists) {
    return {
      ok: false,
      error: "store_not_found",
      message: `storeId ${parsed.data.storeId} 없음`,
    };
  }

  const inserted = await repo.insertReport(parsed.data);
  return { ok: true, reportId: inserted.id, storeId: parsed.data.storeId };
}

/**
 * Drizzle 기반 production repo. 호출처에서 1회 생성 후 submitStoreReport에 주입.
 */
export function createDrizzleStoreReportRepo(db: DbClient): StoreReportRepo {
  return {
    storeExists: async (storeId) => {
      const [row] = await db
        .select({ id: stores.id })
        .from(stores)
        .where(eq(stores.id, storeId))
        .limit(1);
      return Boolean(row);
    },
    insertReport: async (input) => {
      const [row] = await db
        .insert(storeReports)
        .values({
          storeId: input.storeId,
          reporterType: input.reporterType,
          reportReason: input.reportReason,
          description: input.description,
          evidenceUrls:
            input.evidenceUrls && input.evidenceUrls.length > 0
              ? input.evidenceUrls
              : null,
          // status default 'pending' (schema)
        })
        .returning({ id: storeReports.id });
      if (!row) throw new Error("store_reports INSERT 실패");
      return { id: row.id };
    },
  };
}
