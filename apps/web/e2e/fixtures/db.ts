/**
 * Playwright E2E DB fixture.
 *
 * `HESYA_TEST_DATABASE_URL` 환경변수의 격리된 PostgreSQL에 직접 연결하여
 * 시드/리셋. test-helpers/db.ts의 헬퍼를 그대로 재사용.
 *
 * 호출 측에서 반드시 prod DB가 아닌지 확인하고 사용할 것 — 데이터 손실 위험.
 *
 * **Phase 1-β Task E 노트**: `test-helpers/db.ts`는
 * `pgsodium-helpers.ts` (`import "server-only"`)에 의존. Vitest는
 * alias로 stub 처리되지만 Playwright는 그렇지 않음 → 직접 import 시 throw.
 * 본 fixture에서 필요한 헬퍼만 inline 재구현하여 server-only 의존을
 * 우회. seedStoreIntegration의 토큰 암호화는 vault SQL 직접 호출.
 */
import {
  apiPolicyAlerts,
  bookings,
  conversations,
  createDbClient,
  customers,
  disputes,
  messages,
  services,
  sql,
  staff,
  storeDeletionRequests,
  storeIntegrations,
  storeKnowledge,
  storeOwners,
  storeVerifications,
  stores,
  STORE_DELETION_GRACE_DAYS,
  users,
  type DbClient,
  type DisputeCategory,
  type StoreDeletionSource,
} from "@hesya/database";
import { randomUUID } from "node:crypto";

function requireTestDbUrl(): string {
  const url = process.env.HESYA_TEST_DATABASE_URL;
  if (!url) {
    throw new Error(
      "E2E DB fixture: HESYA_TEST_DATABASE_URL 환경변수가 필요합니다.",
    );
  }
  if (!url.startsWith("postgres")) {
    throw new Error(
      "E2E DB fixture: HESYA_TEST_DATABASE_URL은 postgres URL이어야 합니다.",
    );
  }
  // prod URL 실수 주입 방지 — localhost / 127.0.0.1 / supabase local / "test" 키워드만 허용.
  // E2E는 격리된 schema/DB만 사용해야 하며, prod URL은 데이터 손실 위험.
  const isLocal =
    /(?:^|@)(?:localhost|127\.0\.0\.1)(?::|\/|$)/i.test(url) ||
    /\btest\b/i.test(url) ||
    /\.supabase\.local\b/i.test(url);
  if (!isLocal) {
    throw new Error(
      "E2E DB fixture: HESYA_TEST_DATABASE_URL은 localhost/127.0.0.1/test/supabase.local 만 허용. " +
        "prod URL 실수 주입 차단.",
    );
  }
  return url;
}

export function createTestDb() {
  return createDbClient(requireTestDbUrl());
}

// ---------- inline helpers (test-helpers/db.ts와 동일 의도, server-only 우회) ----------

export async function resetDb(db: DbClient): Promise<void> {
  await db.delete(apiPolicyAlerts);
  await db.delete(disputes);
  await db.delete(bookings);
  await db.delete(messages);
  await db.delete(conversations);
  await db.delete(storeDeletionRequests);
  await db.delete(storeIntegrations);
  await db.delete(storeKnowledge);
  await db.delete(storeOwners);
  await db.delete(storeVerifications);
  await db.delete(services);
  await db.delete(staff);
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
  overrides: { id?: string; email?: string; name?: string } = {},
): Promise<string> {
  const email =
    overrides.email ??
    `test-${Date.now()}-${Math.random().toString(36).slice(2)}@example.com`;
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

/**
 * Epic 12.4 시연용 분쟁 1건 seed.
 *
 * `dal/disputes.ts`의 `createDispute`는 `import "server-only"`로 막혀
 * tsx/playwright에서 직접 호출 불가 → 본 fixture에서 inline insert로 우회.
 *
 * SLA는 단순 +5일(달력일) — 데모용 정확도 충분. 운영 흐름의 정확한 영업일
 * 계산은 Server Action(`submitDisputeAction` → `computeSlaDueAt`)이 담당.
 */
export async function seedDispute(
  db: DbClient,
  input: {
    storeId: string;
    filedByUserId: string;
    category: DisputeCategory;
    description: string;
  },
): Promise<string> {
  const slaDueAt = new Date(Date.now() + 5 * 24 * 60 * 60 * 1000);
  const inserted = await db
    .insert(disputes)
    .values({
      storeId: input.storeId,
      filedByUserId: input.filedByUserId,
      category: input.category,
      description: input.description,
      slaDueAt,
    })
    .returning({ id: disputes.id });
  if (!inserted[0]) {
    throw new Error("seedDispute: insert returned 0 rows");
  }
  return inserted[0].id;
}

/**
 * vault.create_secret 직접 호출 — pgsodium-helpers 모듈 import 회피.
 * 16-byte UUID buffer를 access_token_encrypted 컬럼에 INSERT.
 */
async function encryptTokenInline(
  db: DbClient,
  plaintext: string,
): Promise<Buffer> {
  const name = `tok_${randomUUID()}`;
  const rows = (await db.execute(sql`
    SELECT vault.create_secret(${plaintext}, ${name}) AS id
  `)) as unknown as { id: string }[];
  if (!rows[0]?.id) throw new Error("vault.create_secret returned no id");
  const hex = rows[0].id.replace(/-/g, "");
  return Buffer.from(hex, "hex");
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
  const accessTokenEncrypted = await encryptTokenInline(
    db,
    "test_tok_decrypted",
  );
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
    draftStatus?: "pending_review" | "approved" | "sent" | "skipped" | "direct";
    translatedText?: string | null;
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
      translatedText: input.translatedText ?? null,
      status: input.status ?? "delivered",
      draftStatus: input.draftStatus,
    })
    .returning({ id: messages.id });
  if (!row) throw new Error("seedMessage: insert returned no row");
  return row.id;
}

/**
 * KYC manual_review 상태 매장 seed (Epic 9 / γ.2.1 통합 e2e용).
 *
 * stores.verification_status = 'manual_review' + store_verifications 1건 INSERT.
 * 호출자가 미리 seedStore + seedStoreOwner 한 후 storeId 전달. 자기신고 3종은
 * default true (KYC 폼 통과 기본값).
 */
export async function seedManualReviewVerification(
  db: DbClient,
  input: {
    storeId: string;
    businessNumber?: string;
    representativeName?: string;
  },
): Promise<string> {
  await db
    .update(stores)
    .set({ verificationStatus: "manual_review" })
    .where(sql`${stores.id} = ${input.storeId}`);

  const [row] = await db
    .insert(storeVerifications)
    .values({
      storeId: input.storeId,
      businessNumber: input.businessNumber ?? "1234567890",
      representativeName: input.representativeName ?? "테스트 대표",
      declarationNoMassage: true,
      declarationNoMedicalDevice: true,
      declarationNoOrientalMedicine: true,
      selfDeclarationSignedAt: new Date(),
      verificationStatus: "manual_review",
    })
    .returning({ id: storeVerifications.id });
  if (!row)
    throw new Error("seedManualReviewVerification: insert returned 0 rows");
  return row.id;
}

export async function seedStoreDeletionRequest(
  db: DbClient,
  input: {
    storeId: string;
    source?: StoreDeletionSource;
    requestedByEmail?: string;
    requestedByUserId?: string;
    reason?: string | null;
    daysAgo?: number;
    cancelled?: boolean;
    purged?: boolean;
  },
): Promise<string> {
  const daysAgo = input.daysAgo ?? 0;
  const createdAt = new Date(Date.now() - daysAgo * 24 * 60 * 60 * 1000);
  const scheduledPurgeAt = new Date(
    createdAt.getTime() + STORE_DELETION_GRACE_DAYS * 24 * 60 * 60 * 1000,
  );

  const updated = await db
    .update(stores)
    .set({
      deletedAt: input.cancelled || input.purged ? null : createdAt,
      deletionReason:
        input.cancelled || input.purged ? null : (input.reason ?? null),
    })
    .where(sql`${stores.id} = ${input.storeId}`)
    .returning({ name: stores.name });

  const storeNameSnapshot = updated[0]?.name ?? "Test Store";

  const [row] = await db
    .insert(storeDeletionRequests)
    .values({
      storeId: input.storeId,
      storeNameSnapshot,
      source: input.source ?? "owner",
      requestedByEmail: input.requestedByEmail ?? "owner@example.com",
      requestedByUserId: input.requestedByUserId ?? null,
      reason: input.reason ?? null,
      scheduledPurgeAt,
      cancelledAt: input.cancelled ? new Date() : null,
      cancelledByEmail: input.cancelled
        ? (input.requestedByEmail ?? "owner@example.com")
        : null,
      purgedAt: input.purged ? new Date() : null,
      createdAt,
    })
    .returning({ id: storeDeletionRequests.id });
  if (!row) throw new Error("seedStoreDeletionRequest: insert returned no row");
  return row.id;
}
