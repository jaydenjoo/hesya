// E2E (Playwright Node 환경)와 vitest 양쪽에서 사용 가능하도록 server-only 제거.
// Helper는 schema reference만 — client에서 import해도 DB 연결 부작용 없음.
// Production bundle 보호는 코드 리뷰·디렉토리 컨벤션에 의존 (test-helpers/**).
import {
  conversations,
  customers,
  messages,
  storeIntegrations,
  storeOwners,
  stores,
  users,
  type DbClient,
} from "@hesya/database";

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
  // users는 Better Auth 관리 — reset 안 함 (seedUser 누적은 dev/test DB에서만 무해).
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(storeIntegrations);
  await db.delete(storeOwners);
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
  input: { channel: string; externalId: string },
): Promise<string> {
  const [row] = await db
    .insert(customers)
    .values({ channel: input.channel, externalId: input.externalId })
    .returning({ id: customers.id });
  if (!row) throw new Error("seedCustomer: insert returned no row");
  return row.id;
}

export async function seedUser(
  db: DbClient,
  overrides: { email?: string; name?: string } = {},
): Promise<string> {
  const email =
    overrides.email ??
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
  const [row] = await db
    .insert(users)
    .values({ name: overrides.name ?? "Test User", email })
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
  await db.insert(storeIntegrations).values({
    storeId: input.storeId,
    channel: input.channel,
    externalAccountId: input.externalAccountId,
    externalPageId: input.externalPageId,
    accessTokenEncrypted: Buffer.from("test_tok_encrypted"),
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
    channel?: "instagram" | "whatsapp" | "kakao" | "line" | "messenger";
    status?: "delivered" | "sent" | "failed";
  },
): Promise<string> {
  const [row] = await db
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      channel: input.channel ?? "instagram",
      direction: input.direction,
      originalText: input.text,
      status: input.status ?? "delivered",
    })
    .returning({ id: messages.id });
  if (!row) throw new Error("seedMessage: insert returned no row");
  return row.id;
}
