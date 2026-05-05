import "server-only";
import {
  and,
  customers,
  eq,
  type Channel,
  type DbClient,
} from "@hesya/database";

type Customer = typeof customers.$inferSelect;

export async function upsertCustomer(
  db: DbClient,
  input: {
    channel: Channel;
    externalId: string;
    preferredLanguage?: string;
  },
): Promise<Customer | null> {
  const inserted = await db
    .insert(customers)
    .values({
      channel: input.channel,
      externalId: input.externalId,
      preferredLanguage: input.preferredLanguage,
    })
    .onConflictDoNothing()
    .returning();

  if (inserted[0]) return inserted[0];

  const existing = await db
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.channel, input.channel),
        eq(customers.externalId, input.externalId),
      ),
    )
    .limit(1);

  // race condition: insert와 select 사이에 row 삭제 → null 반환 (caller 결정)
  return existing[0] ?? null;
}

export async function getExternalIdByCustomerId(
  db: DbClient,
  customerId: string,
): Promise<string | null> {
  const rows = await db
    .select({ externalId: customers.externalId })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  return rows[0]?.externalId ?? null;
}

/**
 * Customer 확장 (CC-5) — customerId 단건 조회.
 *
 * **명시 필드만 select** (Sec MED-2 사후 리뷰): 향후 customers 테이블에
 * 민감 필드(외부 연동 ID·내부 메타) 추가 시 자동 노출 방지. ContextPanel UI
 * 표시 + Notes 편집에 필요한 필드만 반환.
 */
export async function getCustomerById(
  db: DbClient,
  customerId: string,
): Promise<Customer | null> {
  const rows = await db
    .select({
      id: customers.id,
      externalId: customers.externalId,
      channel: customers.channel,
      nationality: customers.nationality,
      preferredLanguage: customers.preferredLanguage,
      paymentMethodPreferred: customers.paymentMethodPreferred,
      totalVisits: customers.totalVisits,
      ltvKrw: customers.ltvKrw,
      name: customers.name,
      allergyNote: customers.allergyNote,
      preferredDesigner: customers.preferredDesigner,
    })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  return rows[0] ?? null;
}

/**
 * customerId로 `preferred_language` 단건 조회. Phase B-2 AI 응답 언어 결정에 사용.
 * - 미설정(null)이면 caller가 fallback 언어 결정 (보통 "ko").
 * - DB 컬럼은 임의 text — 5개 enum 매핑은 caller 책임.
 */
export async function getCustomerPreferredLanguage(
  db: DbClient,
  customerId: string,
): Promise<string | null> {
  const rows = await db
    .select({ preferredLanguage: customers.preferredLanguage })
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  return rows[0]?.preferredLanguage ?? null;
}

/**
 * Epic Customer 확장 (CC-2) — IG profile fetch 결과를 customer row에 저장.
 *
 * **사용 시점**: process-inbound가 새 customer 생성 후 IG `/me?fields=name,locale`
 * fetch 성공 시 1회 호출. 기존 customer는 backfill 보류 (별 follow-up).
 *
 * **patch 비어있으면 no-op**: DB 호출 자체 회피 (caller가 부분 데이터 보낼
 * 때 무의미한 UPDATE 방어).
 *
 * **ownership 검증 X**: 본 함수는 webhook 시스템 trigger 전용. 사장 명시
 * 메모는 `updateCustomerNotes` 별도 함수 + action 레벨 ownership 검증.
 */
export async function updateCustomerProfile(
  db: DbClient,
  customerId: string,
  patch: { name?: string | null; preferredLanguage?: string | null },
): Promise<Customer | null> {
  if (Object.keys(patch).length === 0) return null;
  const updated = await db
    .update(customers)
    .set(patch)
    .where(eq(customers.id, customerId))
    .returning();
  return updated[0] ?? null;
}

/**
 * Epic Customer 확장 (CC-2) — 사장이 ContextPanel에서 customer 메모 편집.
 *
 * **사용 시점**: `updateCustomerNotes` Server Action에서 호출. ownership
 * 검증 (사장이 customer와 conversation으로 연결된 store 소유)은 action
 * 레벨 책임 — DAL은 단순 update.
 *
 * **patch 비어있으면 no-op**: 동일 방어.
 */
export async function updateCustomerNotes(
  db: DbClient,
  customerId: string,
  patch: { allergyNote?: string | null; preferredDesigner?: string | null },
): Promise<Customer | null> {
  if (Object.keys(patch).length === 0) return null;
  const updated = await db
    .update(customers)
    .set(patch)
    .where(eq(customers.id, customerId))
    .returning();
  return updated[0] ?? null;
}
