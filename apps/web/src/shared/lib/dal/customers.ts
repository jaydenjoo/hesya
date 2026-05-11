import "server-only";
import {
  and,
  conversations,
  customers,
  desc,
  eq,
  isNotNull,
  type Channel,
  type DbClient,
} from "@hesya/database";

type Customer = typeof customers.$inferSelect;

export type CustomerListRow = Pick<
  Customer,
  | "id"
  | "name"
  | "channel"
  | "externalId"
  | "nationality"
  | "preferredLanguage"
  | "totalVisits"
  | "ltvKrw"
  | "allergyNote"
  | "preferredDesigner"
>;

/**
 * Plan v3 M3.2 — 매장에서 메시지를 받아본 외국인 손님 목록.
 *
 * `conversations.storeId`로 매장 소속 conversation을 찾고 그 conversation의
 * `customerId`로 distinct customer rows 조회. 즉 사장 inbox에 들어와본 적이
 * 있는 손님만. M2.6 customer-side 예약은 customers row 생성 안 함이라 목록
 * 미포함 — 향후 M4.x에서 booker 통합 시 합쳐질 예정.
 *
 * `lastSeenAt` (가장 최근 conversation update)으로 정렬. limit default 100.
 */
export async function listCustomersByStore(
  db: DbClient,
  storeId: string,
  limit = 100,
): Promise<CustomerListRow[]> {
  // distinct on (customers.id) — 한 customer가 여러 conversation 가질 수 있음.
  const rows = await db
    .selectDistinctOn([customers.id], {
      id: customers.id,
      name: customers.name,
      channel: customers.channel,
      externalId: customers.externalId,
      nationality: customers.nationality,
      preferredLanguage: customers.preferredLanguage,
      totalVisits: customers.totalVisits,
      ltvKrw: customers.ltvKrw,
      allergyNote: customers.allergyNote,
      preferredDesigner: customers.preferredDesigner,
    })
    .from(customers)
    .innerJoin(conversations, eq(conversations.customerId, customers.id))
    .where(
      and(eq(conversations.storeId, storeId), isNotNull(customers.channel)),
    )
    .orderBy(customers.id, desc(conversations.updatedAt))
    .limit(limit);
  return rows;
}

/**
 * Plan v3 M3.2 — 사장이 customer 메모 편집 시 ownership 검증.
 *
 * customer가 해당 store와 conversation으로 연결되어 있는지 확인 (사장이 자기
 * 매장과 무관한 customer 메모 편집 차단).
 */
export async function isCustomerInStore(
  db: DbClient,
  storeId: string,
  customerId: string,
): Promise<boolean> {
  const rows = await db
    .select({ id: conversations.id })
    .from(conversations)
    .where(
      and(
        eq(conversations.storeId, storeId),
        eq(conversations.customerId, customerId),
      ),
    )
    .limit(1);
  return rows.length > 0;
}

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
      igProfileFetched: customers.igProfileFetched,
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
 * **igProfileFetched (Sec MED-1)**: 영구 fail retry 방어용. webhook이 try
 * 성공 시 patch에 합쳐 atomic update, catch 실패 시 단독 `{igProfileFetched: true}`
 * 호출로 마크. 다음 inbound부터 guard에서 fetch 진입 차단.
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
  patch: {
    name?: string | null;
    preferredLanguage?: string | null;
    igProfileFetched?: boolean;
  },
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
