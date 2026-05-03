/**
 * E9-12 KYC 검증 로그 helper.
 *
 * v0006 마이그레이션의 `kyc_verification_logs` 테이블에 INSERT.
 * INSERT 실패는 throw X — KYC 결과(승인/거절)에 영향 없음.
 *
 * Repository pattern: `KycLogRepo` 인터페이스로 DB 의존 분리 → 단위 테스트는
 * mock repo로 row shape만 검증, production은 createDrizzleAuditRepo()로 주입.
 */
import "server-only";
import { kycVerificationLogs, type DbClient } from "@hesya/database";
import type { KycLogEventType } from "@hesya/shared-types";

export interface KycEventInsert {
  verificationId: string;
  eventType: KycLogEventType;
  eventData?: unknown;
  actorUserId?: string;
}

export interface KycLogRepo {
  insert: (row: KycEventInsert) => Promise<void>;
}

interface LogInput extends KycEventInsert {
  repo: KycLogRepo;
}

/**
 * INSERT 실패 시 console.error만. 호출자는 await하되 결과 무시 권장.
 */
export async function logKycEvent(input: LogInput): Promise<void> {
  const { repo, ...row } = input;
  try {
    await repo.insert(row);
  } catch (err) {
    console.error(
      `[audit-log] kyc_verification_logs INSERT failed (${row.eventType} / ${row.verificationId}):`,
      err,
    );
  }
}

/**
 * Drizzle 기반 production repo. 호출처에서 1회 생성 후 logKycEvent에 주입.
 *
 * 예시: `await logKycEvent({ repo: createDrizzleAuditRepo(db), verificationId, eventType, eventData });`
 */
export function createDrizzleAuditRepo(db: DbClient): KycLogRepo {
  return {
    insert: async (row) => {
      await db.insert(kycVerificationLogs).values({
        verificationId: row.verificationId,
        eventType: row.eventType,
        eventData: row.eventData ?? null,
        actorUserId: row.actorUserId ?? null,
      });
    },
  };
}
