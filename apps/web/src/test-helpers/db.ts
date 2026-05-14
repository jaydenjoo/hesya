// E2E (Playwright Node 환경)와 vitest 양쪽에서 사용 가능하도록 server-only 제거.
// Helper는 schema reference만 — client에서 import해도 DB 연결 부작용 없음.
// Production bundle 보호는 코드 리뷰·디렉토리 컨벤션에 의존 (test-helpers/**).
import {
  apiPolicyAlerts,
  bookings,
  conversations,
  customers,
  disputes,
  messages,
  payments,
  reviews,
  services,
  staff,
  storeDeletionRequests,
  storeIntegrations,
  storeKnowledge,
  storeOwners,
  storeVerifications,
  stores,
  users,
  type DbClient,
} from "@hesya/database";
import { encryptToken } from "@/shared/lib/dal/pgsodium-helpers";

/**
 * 통합 테스트 격리용 DB 헬퍼.
 *
 * Phase B vault helper와 동일한 패턴으로 `db: DbClient`를 인자로 받음
 * (env.ts 로드 디커플 → 단위 테스트 CI 안전).
 *
 * 호출 측에서 `process.env.HESYA_TEST_DATABASE_URL`로 만든 db만
 * 주입해야 함. prod DATABASE_URL을 넘기면 데이터 손실. 테스트 파일에서
 * `describe.skipIf(!hasDb)` 게이트 필수.
 */

export async function resetDb(db: DbClient): Promise<void> {
  // FK 의존 (자식 → 부모): messages → conversations,
  // store_integrations / store_owners → stores, customers → 자체
  // store_owners.storeId는 onDelete 미지정(NO ACTION)이라 명시 delete 필요.
  // payments → bookings → stores/customers (모두 onDelete 미지정 = NO ACTION).
  // disputes → stores (NO ACTION), apiPolicyAlerts → 독립 (FK 없음),
  // storeDeletionRequests → stores (SET NULL이지만 row 잔존하므로 명시 삭제).
  // users는 Better Auth 관리 — reset 안 함 (seedUser 누적은 dev/test DB에서만 무해).
  // kyc_verification_logs는 IMMUTABLE (BEFORE DELETE trigger) → reset 불가.
  // audit trail 통합 테스트는 별도 격리 전략 필요.
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(reviews);
  await db.delete(storeIntegrations);
  await db.delete(storeKnowledge);
  await db.delete(storeOwners);
  await db.delete(storeVerifications);
  await db.delete(payments);
  await db.delete(bookings);
  await db.delete(services);
  await db.delete(staff);
  await db.delete(disputes);
  await db.delete(apiPolicyAlerts);
  await db.delete(storeDeletionRequests);
  await db.delete(customers);
  await db.delete(stores);
}

export async function seedStore(
  db: DbClient,
  overrides: { name?: string } = {},
): Promise<string> {
  const [row] = await db
    .insert(stores)
    .values({ name: overrides.name ?? "Test Store" })
    .returning({ id: stores.id });
  if (!row) throw new Error("seedStore: insert returned no row");
  return row.id;
}

export async function seedCustomer(
  db: DbClient,
  input: { channel: string; externalId: string; name?: string },
): Promise<string> {
  const [row] = await db
    .insert(customers)
    .values({
      channel: input.channel,
      externalId: input.externalId,
      name: input.name,
    })
    .returning({ id: customers.id });
  if (!row) throw new Error("seedCustomer: insert returned no row");
  return row.id;
}

export async function seedUser(
  db: DbClient,
  overrides: { id?: string; email?: string; name?: string } = {},
): Promise<string> {
  const email =
    overrides.email ??
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  // id 명시 시 그대로 INSERT (E2E에서 환경변수 동기화용).
  // 미명시 시 schema의 defaultRandom() 작동.
  const values: { name: string; email: string; id?: string } = {
    name: overrides.name ?? "Test User",
    email,
  };
  if (overrides.id) values.id = overrides.id;
  const [row] = await db
    .insert(users)
    .values(values)
    .returning({ id: users.id });
  if (!row) throw new Error("seedUser: insert returned no row");
  return row.id;
}

export async function seedStoreOwner(
  db: DbClient,
  input: { userId: string; storeId: string; role: "owner" | "manager" },
): Promise<void> {
  await db.insert(storeOwners).values(input);
}

export async function seedStoreIntegration(
  db: DbClient,
  input: {
    storeId: string;
    channel: "instagram" | "whatsapp" | "kakao" | "line" | "messenger";
    externalAccountId: string;
    externalPageId?: string;
  },
): Promise<void> {
  // Production parity (PR #71): vault.create_secret으로 16-byte UUID buffer 생성.
  // 이전 raw bytes(Buffer.from("test_tok_encrypted") 18-byte) 시드는 decryptToken
  // 16-byte UUID 가드와 충돌 → webhook integration test 500 → 200 회복.
  const accessTokenEncrypted = await encryptToken(db, "test_tok_decrypted");
  await db.insert(storeIntegrations).values({
    storeId: input.storeId,
    channel: input.channel,
    externalAccountId: input.externalAccountId,
    externalPageId: input.externalPageId,
    accessTokenEncrypted,
    scopes: ["instagram_business_basic", "instagram_business_manage_messages"],
  });
}

export async function seedConversation(
  db: DbClient,
  input: {
    storeId: string;
    customerId: string;
    channel: "instagram" | "whatsapp" | "kakao" | "line" | "messenger";
    externalThreadId?: string;
    messagingWindowExpiresAt?: Date | null;
    lastInboundAt?: Date | null;
  },
): Promise<string> {
  const [row] = await db
    .insert(conversations)
    .values({
      storeId: input.storeId,
      customerId: input.customerId,
      channel: input.channel,
      status: "open",
      externalThreadId: input.externalThreadId,
      messagingWindowExpiresAt: input.messagingWindowExpiresAt ?? null,
      lastInboundAt: input.lastInboundAt ?? null,
    })
    .returning({ id: conversations.id });
  if (!row) throw new Error("seedConversation: insert returned no row");
  return row.id;
}

export async function seedMessage(
  db: DbClient,
  input: {
    conversationId: string;
    direction: "inbound" | "outbound";
    text: string;
    customerId?: string;
    storeId?: string;
    channel?: "instagram" | "whatsapp" | "kakao" | "line" | "messenger";
    status?: "delivered" | "sent" | "failed" | "ai_draft";
    // Phase 1-β Task E — pending_review 초안 시뮬용 (E2E DraftReviewPanel 렌더 검증)
    draftStatus?: "pending_review" | "approved" | "sent" | "skipped" | "direct";
  },
): Promise<string> {
  const [row] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      customerId: input.customerId,
      storeId: input.storeId,
      channel: input.channel ?? "instagram",
      direction: input.direction,
      originalText: input.text,
      status: input.status ?? "delivered",
      draftStatus: input.draftStatus,
    })
    .returning({ id: messages.id });
  if (!row) throw new Error("seedMessage: insert returned no row");
  return row.id;
}
