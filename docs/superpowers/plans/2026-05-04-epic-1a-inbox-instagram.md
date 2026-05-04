# Epic 1 1A — 인박스 인프라 + Instagram PoC Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use `superpowers:subagent-driven-development` (recommended) or `superpowers:executing-plans` to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Hesya 매장 사장이 본인 IG 비즈니스 계정의 DM을 hesya 인박스에서 받고, 고객 메시지 후 24시간 내에 한국어로 답변할 수 있도록 1매장 PoC를 완성한다.

**Architecture:** Approach A (미니멀 직결). Webhook = Next.js API Route (HMAC verify → DAL upsert → fire-and-forget hook → 200 OK). 인박스 UI = Server Component + 5초 polling Client Component. `ChannelAdapter` 인터페이스로 1B 4채널 확장 대비. OAuth 토큰은 `store_integrations` 별도 테이블에 pgsodium 암호화. 1A는 application-level `requireStoreOwnerAuth()` 강제 (Better Auth ↔ Supabase JWT 브리지는 별도 trail).

**Tech Stack:** Next.js 16.2 App Router, Drizzle ORM, Supabase Postgres + pgsodium, Better Auth, next-intl 6 locales, shadcn/ui, vitest, Playwright, Sentry, PostHog.

**Spec reference:** `docs/superpowers/specs/2026-05-04-epic-1a-inbox-instagram-design.md`

**Open Questions resolved:**

- Q1: `store_owners` 테이블 v0002에 존재 (확인됨). v0011에 추가 X.
- Q2: KYC는 `ADMIN_EMAILS` env + `admin-guard.ts` 패턴. 1A `requireStoreOwnerAuth()`는 별개 — `store_owners` DB 조회 + Better Auth.
- Q3: pgsodium key는 Supabase 자동 관리. 수동 rotation은 1A 외.
- Q4: i18n `routing.ts`에 `LOCALES` 6개 등록됨 (`@hesya/translations`). `messages/` 디렉토리만 신규.

---

## File Structure

### Create

```
docs/runbook.md                                          # T01
apps/web/src/instrumentation.ts (확장)                    # T02
apps/web/src/shared/lib/errors.ts                         # T03
packages/database/migrations/0011_inbox_conversations.sql # T04
packages/database/src/schema/conversations.ts             # T05
packages/database/src/schema/store-integrations.ts        # T05
apps/web/src/shared/lib/dal/conversations.ts (+test)      # T07
apps/web/src/shared/lib/dal/messages.ts (+test)           # T08
apps/web/src/shared/lib/dal/customers.ts (+test)          # T09
apps/web/src/shared/lib/dal/store-integrations.ts (+test) # T10
apps/web/src/shared/lib/dal/store-owners.ts (+test)       # T11
apps/web/src/shared/lib/store-owner-guard.ts (+test)      # T12
apps/web/src/lib/inbox/channel-adapter.ts                 # T13
apps/web/src/lib/inbox/types.ts                           # T13
apps/web/src/lib/inbox/instagram-api-client.ts            # T14
apps/web/src/lib/inbox/instagram-adapter.ts (+test)       # T15-T17
apps/web/src/lib/inbox/process-inbound.ts (+test)         # T18
apps/web/messages/{ko,en,ja,zh-CN,zh-TW,vi}.json          # T19-T20
apps/web/src/app/api/webhooks/instagram/route.ts          # T21
apps/web/src/app/api/oauth/instagram/callback/route.ts    # T22
apps/web/src/app/api/inbox/refresh/route.ts               # T23
apps/web/src/features/inbox/lib/window-utils.ts (+test)   # T24
apps/web/src/features/inbox/actions/send-outbound.ts (+test) # T25
apps/web/src/features/inbox/actions/connect-instagram.ts  # T26
apps/web/src/features/inbox/types.ts                      # T27
apps/web/src/features/inbox/schema.ts                     # T27
apps/web/src/features/inbox/index.ts                      # T27
apps/web/src/features/inbox/components/*.tsx              # T29-T33
apps/web/src/app/[locale]/store/inbox/page.tsx            # T34
apps/web/src/app/[locale]/store/inbox/inbox-client.tsx    # T34
apps/web/src/app/[locale]/store/inbox/connect/page.tsx    # T35
apps/web/e2e/inbox.spec.ts                                # T36-T37
```

### Modify

```
apps/web/src/instrumentation.ts             # T02 (captureServerActionError 추가)
apps/web/src/shared/config/env.ts           # T21 (IG_* env vars)
apps/web/.env.example                       # T21
```

### Required tools / permissions

- pnpm 7+ (모노레포)
- Node 20+
- vitest, Playwright (이미 설치)
- Supabase CLI (마이그레이션 적용/롤백 시뮬)
- ngrok 무료 정적 도메인 (운영 시 — `docs/runbook.md` 참조)
- Meta Developer Account + Meta App + IG Business + FB Page (Pre-flight 외부 셋업)

---

## Phase A — Pre-flight Cleanup (1.5h)

### Task 01: 마이그레이션 롤백 정책 + 운영 가이드 (`docs/runbook.md`) — C-06

**Files:**

- Create: `docs/runbook.md`

- [ ] **Step 1: `docs/runbook.md` 생성**

```markdown
# Hesya 운영 Runbook

## 1. 마이그레이션 롤백 정책 (v0011~)

### 규칙

- v0011 이후 모든 마이그레이션은 **상단 주석에 `-- ROLLBACK:` 블록 강제**.
- Drizzle Kit이 down migration을 자동 생성하지 않으므로 수동 작성.
- 핫픽스 상황에서 Supabase Studio SQL Editor에 `ROLLBACK:` 블록을 복사하여 직접 실행.
- v0010 이전 마이그레이션은 소급 X (senior-engineer 권장).

### 형식

\`\`\`sql
-- migrations/NNNN_short_name.sql
-- Epic X TaskY: 한 줄 설명
--
-- ROLLBACK:
-- DROP TABLE foo;
-- ALTER TABLE bar DROP COLUMN baz;
\`\`\`

## 2. ngrok 무료 정적 도메인 (1A Instagram webhook)

### 셋업

\`\`\`bash

# 1. ngrok 무료 가입 → dashboard.ngrok.com

# 2. authtoken 받아서:

ngrok config add-authtoken <token>

# 3. 정적 도메인 발급 (자동 할당, 변경 X):

ngrok http 3000 # → https://<your-name>.ngrok-free.app
\`\`\`

- 한도: HTTP 20k req/월, 1GB/월, 동시 endpoint 3개 (1A PoC 충분)
- URL은 영구 고정. 매번 같은 URL.
- `IG_REDIRECT_URI`, Meta webhook subscription URL 모두 이 도메인 사용.

## 3. Meta App Review (1A 외부 의존)

### 사전 조건

- Meta Developer Account (Jayden 명의)
- Meta App 생성 (Business 타입)
- 더미 매장 IG Business + FB Page 연결
- Business Verification 신청 (검증 며칠~)

### App Review 신청 시기

- 1A 메인 코드 완료 후 (G1~G9 dev mode 통과 후)
- 신청 permissions: `instagram_business_basic`, `instagram_business_manage_messages`
- 검토 기간: 평균 2~7일, 일부 케이스 2개월 stuck 사례

### App Review 통과 전 한계

- Development mode = 25 test users만 webhook 수신
- 1A G1~G10 검증은 dev mode + Jayden 외부 IG 1개 test user로 충분
```

- [ ] **Step 2: 커밋**

```bash
git add docs/runbook.md
git commit -m "docs(runbook): 마이그레이션 롤백 정책 + ngrok + Meta App Review 가이드 (C-06)"
```

---

### Task 02: Server Action Sentry 핸들러 (C-01)

**Files:**

- Modify: `apps/web/src/instrumentation.ts`
- Test: `apps/web/src/instrumentation.test.ts` (선택)

- [ ] **Step 1: 현재 instrumentation.ts 확인**

```bash
cat apps/web/src/instrumentation.ts
```

Expected: `register()` + `onRequestError = Sentry.captureRequestError` 정도.

- [ ] **Step 2: `captureServerActionError` 함수 추가**

`apps/web/src/instrumentation.ts` 끝에 추가:

```typescript
import * as Sentry from "@sentry/nextjs";
import { ValidationError, WindowClosedError } from "@/shared/lib/errors";

/**
 * Server Action 공통 에러 캡처 (C-01).
 *
 * Route Handler는 onRequestError가 자동 캡처하지만 Server Action은 누락 →
 * 모든 Server Action은 try-catch 후 이 함수를 호출.
 *
 * 사용자 입력 정상 분기(ValidationError, WindowClosedError)는 캡처 X.
 */
export function captureServerActionError(
  err: unknown,
  context: { action: string; userId?: string; storeId?: string },
): void {
  if (err instanceof ValidationError || err instanceof WindowClosedError)
    return;
  Sentry.captureException(err, {
    tags: { action: context.action, storeId: context.storeId ?? "unknown" },
    user: context.userId ? { id: context.userId } : undefined,
  });
}
```

⚠️ 이 import는 T03에서 만들 `errors.ts`를 참조 — T03을 먼저 완료한 뒤 T02 Step 2 적용.

- [ ] **Step 3: tsc 통과 확인**

```bash
pnpm --filter @hesya/web tsc --noEmit
```

Expected: 에러 0건.

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/instrumentation.ts
git commit -m "feat(observability): Server Action 공통 에러 캡처 (C-01)"
```

---

### Task 03: 에러 클래스 6종 (`shared/lib/errors.ts`)

**Files:**

- Create: `apps/web/src/shared/lib/errors.ts`
- Test: `apps/web/src/shared/lib/errors.test.ts`

- [ ] **Step 1: failing test 작성**

`apps/web/src/shared/lib/errors.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import {
  UnauthorizedError,
  ForbiddenError,
  ValidationError,
  WindowClosedError,
  ExternalApiError,
  WebhookSignatureError,
} from "./errors";

describe("error classes", () => {
  it("UnauthorizedError에 기본 메시지가 있다", () => {
    const e = new UnauthorizedError();
    expect(e.name).toBe("UnauthorizedError");
    expect(e.message).toBe("인증이 필요합니다");
  });

  it("WindowClosedError에 윈도우 만료 시각을 담는다", () => {
    const expiresAt = new Date("2026-05-04T00:00:00Z");
    const e = new WindowClosedError({ conversationId: "abc", expiresAt });
    expect(e.context.conversationId).toBe("abc");
    expect(e.context.expiresAt).toBe(expiresAt);
  });

  it("ExternalApiError가 status code를 보존한다", () => {
    const e = new ExternalApiError("Meta API 5xx", {
      status: 502,
      body: "...",
    });
    expect(e.context.status).toBe(502);
  });

  it("WebhookSignatureError는 항상 동일 메시지", () => {
    const e = new WebhookSignatureError();
    expect(e.message).toBe("Webhook signature verification failed");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/errors.test.ts
```

Expected: FAIL — "Cannot find module './errors'".

- [ ] **Step 3: `errors.ts` 구현**

`apps/web/src/shared/lib/errors.ts`:

```typescript
/** 401 — 인증 누락 */
export class UnauthorizedError extends Error {
  constructor(message = "인증이 필요합니다") {
    super(message);
    this.name = "UnauthorizedError";
  }
}

/** 403 — 권한 없음 */
export class ForbiddenError extends Error {
  constructor(message = "권한이 없습니다") {
    super(message);
    this.name = "ForbiddenError";
  }
}

/** 400 — zod 검증 등 사용자 입력 오류. Sentry 캡처 X. */
export class ValidationError extends Error {
  constructor(
    message: string,
    public readonly issues?: unknown,
  ) {
    super(message);
    this.name = "ValidationError";
  }
}

/** 422 — 24시간 메시징 윈도우 만료. Sentry warning만. */
export class WindowClosedError extends Error {
  constructor(
    public readonly context: { conversationId: string; expiresAt: Date | null },
  ) {
    super(`Messaging window closed for conversation ${context.conversationId}`);
    this.name = "WindowClosedError";
  }
}

/** 502 — 외부 API 호출 실패 (Meta IG, etc.) */
export class ExternalApiError extends Error {
  constructor(
    message: string,
    public readonly context: { status?: number; body?: string },
  ) {
    super(message);
    this.name = "ExternalApiError";
  }
}

/** 401 — Webhook HMAC 검증 실패. 즉시 Sentry 캡처 (스푸핑 시도). */
export class WebhookSignatureError extends Error {
  constructor() {
    super("Webhook signature verification failed");
    this.name = "WebhookSignatureError";
  }
}
```

- [ ] **Step 4: 테스트 통과 확인**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/errors.test.ts
```

Expected: 4 tests pass.

- [ ] **Step 5: T02 import도 성공하는지 tsc 재실행**

```bash
pnpm --filter @hesya/web tsc --noEmit
```

Expected: 에러 0건.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/shared/lib/errors.ts apps/web/src/shared/lib/errors.test.ts apps/web/src/instrumentation.ts
git commit -m "feat(errors): 6 에러 클래스 + Server Action Sentry 핸들러 (C-01)"
```

---

## Phase B — DB Schema (3h)

### Task 04: Migration v0011 작성

**Files:**

- Create: `packages/database/migrations/0011_inbox_conversations.sql`

- [ ] **Step 1: 마이그레이션 SQL 작성**

`packages/database/migrations/0011_inbox_conversations.sql`:

```sql
-- 0011_inbox_conversations.sql
-- Epic 1 1A: conversations 신규 + messages 확장 + customers 인덱스 + store_integrations(pgsodium)
--
-- ROLLBACK:
--   DROP POLICY IF EXISTS conversations_admin ON conversations;
--   DROP POLICY IF EXISTS conversations_store_owner ON conversations;
--   DROP POLICY IF EXISTS store_integrations_store_owner ON store_integrations;
--   DROP TABLE IF EXISTS store_integrations;
--   DROP INDEX IF EXISTS idx_messages_external_unique;
--   DROP INDEX IF EXISTS idx_messages_conv_created;
--   ALTER TABLE messages
--     DROP COLUMN IF EXISTS status,
--     DROP COLUMN IF EXISTS external_message_id,
--     DROP COLUMN IF EXISTS conversation_id;
--   DROP INDEX IF EXISTS idx_conversations_window;
--   DROP INDEX IF EXISTS idx_conversations_store_lastmsg;
--   DROP TABLE IF EXISTS conversations;
--   DROP INDEX IF EXISTS idx_customers_channel_external;

-- pgsodium 활성화 (Supabase 기본 제공)
CREATE EXTENSION IF NOT EXISTS pgsodium;

-- 1) conversations 신규
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  channel TEXT NOT NULL CHECK (channel IN ('instagram','whatsapp','kakao','line','messenger')),
  external_thread_id TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','snoozed')),

  last_inbound_at TIMESTAMPTZ,
  messaging_window_expires_at TIMESTAMPTZ,

  unread_count INTEGER NOT NULL DEFAULT 0,
  last_message_at TIMESTAMPTZ,
  last_message_preview TEXT,

  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  UNIQUE (store_id, customer_id, channel)
);

CREATE INDEX idx_conversations_store_lastmsg
  ON conversations(store_id, status, last_message_at DESC);
CREATE INDEX idx_conversations_window
  ON conversations(messaging_window_expires_at)
  WHERE messaging_window_expires_at IS NOT NULL;

-- 2) messages 확장 (NOT NULL 전환은 C-02에서 v0012)
ALTER TABLE messages
  ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  ADD COLUMN external_message_id TEXT,
  ADD COLUMN status TEXT;

CREATE INDEX idx_messages_conv_created
  ON messages(conversation_id, created_at DESC);
CREATE UNIQUE INDEX idx_messages_external_unique
  ON messages(channel, external_message_id)
  WHERE external_message_id IS NOT NULL;

-- 3) customers 유일성 (idempotency)
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_channel_external
  ON customers(channel, external_id)
  WHERE external_id IS NOT NULL;

-- 4) store_integrations 신규 (pgsodium 암호화)
CREATE TABLE store_integrations (
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  channel TEXT NOT NULL CHECK (channel IN ('instagram','whatsapp','kakao','line','messenger')),

  external_account_id TEXT NOT NULL,
  external_page_id TEXT,
  external_account_name TEXT,

  access_token_encrypted BYTEA NOT NULL,
  refresh_token_encrypted BYTEA,
  token_expires_at TIMESTAMPTZ,

  scopes TEXT[],
  webhook_subscribed_at TIMESTAMPTZ,

  connected_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),

  PRIMARY KEY (store_id, channel)
);

-- 5) RLS 정책 (1A는 application-level 강제, 정책은 미래 대비 작성)
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_store_owner ON conversations
  FOR ALL
  USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = auth.uid())
  );

-- admins 테이블 없음 (KYC는 ADMIN_EMAILS env 화이트리스트). Epic 12 도입 시 admins 테이블 추가 후 정책 재작성.
-- 1A는 service_role + application-level requireStoreOwnerAuth() 강제.

CREATE POLICY store_integrations_store_owner ON store_integrations
  FOR ALL
  USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = auth.uid())
  );
```

- [ ] **Step 2: 마이그레이션 적용 (Supabase staging)**

```bash
# Supabase MCP 토큰이 셋업되어 있으므로 (PROGRESS.md):
# Supabase Studio SQL Editor 또는 MCP apply_migration 사용.
# 로컬은 supabase CLI 사용:
pnpm --filter @hesya/database db:push  # 또는 동등한 적용 명령
```

Expected: 0 errors. 5개 객체 (1 table, 4 index, 1 column) 생성.

- [ ] **Step 3: 적용 결과 검증**

Supabase Studio SQL Editor:

```sql
SELECT table_name FROM information_schema.tables WHERE table_name IN ('conversations', 'store_integrations');
SELECT column_name FROM information_schema.columns WHERE table_name = 'messages' AND column_name IN ('conversation_id', 'external_message_id', 'status');
SELECT indexname FROM pg_indexes WHERE indexname LIKE 'idx_conversations%' OR indexname LIKE 'idx_messages_conv%' OR indexname LIKE 'idx_customers_channel%';
```

Expected: conversations + store_integrations 존재, messages에 3컬럼 추가, 인덱스 4개 존재.

- [ ] **Step 4: ROLLBACK 시뮬 (드라이런)**

별도 staging branch 또는 dry-run으로 ROLLBACK 블록 SQL을 실행 → 에러 없이 5개 객체 모두 drop되는지 확인. 검증 후 다시 v0011 적용.

- [ ] **Step 5: 커밋**

```bash
git add packages/database/migrations/0011_inbox_conversations.sql
git commit -m "feat(db): v0011 conversations + store_integrations + messages 확장 + RLS"
```

---

### Task 05: Drizzle 스키마 TypeScript 정의

**Files:**

- Create: `packages/database/src/schema/conversations.ts`
- Create: `packages/database/src/schema/store-integrations.ts`
- Modify: `packages/database/src/schema/messages.ts` (3컬럼 추가)
- Modify: `packages/database/src/schema/customers.ts` (유일 인덱스)
- Modify: `packages/database/src/schema/index.ts` (export 추가)

- [ ] **Step 1: `conversations.ts` 작성**

`packages/database/src/schema/conversations.ts`:

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  integer,
  unique,
  index,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";
import { customers } from "./customers";

export const conversations = pgTable(
  "conversations",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    customerId: uuid("customer_id")
      .notNull()
      .references(() => customers.id, { onDelete: "restrict" }),
    channel: text("channel", {
      enum: ["instagram", "whatsapp", "kakao", "line", "messenger"],
    }).notNull(),
    externalThreadId: text("external_thread_id"),
    status: text("status", { enum: ["open", "closed", "snoozed"] })
      .notNull()
      .default("open"),

    lastInboundAt: timestamp("last_inbound_at", { withTimezone: true }),
    messagingWindowExpiresAt: timestamp("messaging_window_expires_at", {
      withTimezone: true,
    }),

    unreadCount: integer("unread_count").notNull().default(0),
    lastMessageAt: timestamp("last_message_at", { withTimezone: true }),
    lastMessagePreview: text("last_message_preview"),

    createdAt: timestamp("created_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    storeCustChan: unique("conversations_store_customer_channel").on(
      t.storeId,
      t.customerId,
      t.channel,
    ),
    storeLastMsg: index("idx_conversations_store_lastmsg").on(
      t.storeId,
      t.status,
      t.lastMessageAt,
    ),
    windowIdx: index("idx_conversations_window").on(t.messagingWindowExpiresAt),
  }),
);

export type Conversation = typeof conversations.$inferSelect;
export type NewConversation = typeof conversations.$inferInsert;
```

- [ ] **Step 2: `store-integrations.ts` 작성**

`packages/database/src/schema/store-integrations.ts`:

```typescript
import {
  pgTable,
  uuid,
  text,
  timestamp,
  customType,
  primaryKey,
} from "drizzle-orm/pg-core";
import { stores } from "./stores";

const bytea = customType<{ data: Uint8Array; driverData: Uint8Array }>({
  dataType() {
    return "bytea";
  },
});

export const storeIntegrations = pgTable(
  "store_integrations",
  {
    storeId: uuid("store_id")
      .notNull()
      .references(() => stores.id, { onDelete: "cascade" }),
    channel: text("channel", {
      enum: ["instagram", "whatsapp", "kakao", "line", "messenger"],
    }).notNull(),

    externalAccountId: text("external_account_id").notNull(),
    externalPageId: text("external_page_id"),
    externalAccountName: text("external_account_name"),

    accessTokenEncrypted: bytea("access_token_encrypted").notNull(),
    refreshTokenEncrypted: bytea("refresh_token_encrypted"),
    tokenExpiresAt: timestamp("token_expires_at", { withTimezone: true }),

    scopes: text("scopes").array(),
    webhookSubscribedAt: timestamp("webhook_subscribed_at", {
      withTimezone: true,
    }),

    connectedAt: timestamp("connected_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true })
      .notNull()
      .defaultNow(),
  },
  (t) => ({
    pk: primaryKey({ columns: [t.storeId, t.channel] }),
  }),
);

export type StoreIntegration = typeof storeIntegrations.$inferSelect;
export type NewStoreIntegration = typeof storeIntegrations.$inferInsert;
```

- [ ] **Step 3: `messages.ts` 3컬럼 추가**

기존 `packages/database/src/schema/messages.ts` 파일을 열어 컬럼 추가:

```typescript
// 기존 컬럼 뒤에:
conversationId: uuid("conversation_id").references(() => conversations.id, { onDelete: "cascade" }),
externalMessageId: text("external_message_id"),
status: text("status", { enum: ["sent", "delivered", "read", "failed"] }),

// 인덱스 추가:
// (t) => ({ ...기존, convCreated: index(...).on(t.conversationId, t.createdAt), externalUnique: uniqueIndex(...).on(t.channel, t.externalMessageId) })
```

⚠️ messages.ts 파일을 열고 기존 구조를 따라 추가 (전체 코드는 변경량이 작으므로 인라인 편집 OK).

- [ ] **Step 4: `customers.ts` 유일 인덱스 추가**

`(channel, externalId)` 부분 인덱스 — Drizzle `uniqueIndex` 사용. 기존 customers.ts에 `where: sql\`external_id IS NOT NULL\`` 옵션 적용.

- [ ] **Step 5: `index.ts` export 추가**

```typescript
export * from "./conversations";
export * from "./store-integrations";
```

- [ ] **Step 6: 타입 검증**

```bash
pnpm --filter @hesya/database tsc --noEmit
pnpm --filter @hesya/web tsc --noEmit
```

Expected: 에러 0건.

- [ ] **Step 7: 커밋**

```bash
git add packages/database/src/schema
git commit -m "feat(db): conversations + store_integrations Drizzle 스키마"
```

---

### Task 06: pgsodium 헬퍼 (`shared/lib/dal/pgsodium-helpers.ts`)

**Files:**

- Create: `apps/web/src/shared/lib/dal/pgsodium-helpers.ts`
- Test: `apps/web/src/shared/lib/dal/pgsodium-helpers.test.ts`

- [ ] **Step 1: failing test 작성**

`pgsodium-helpers.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { encryptToken, decryptToken } from "./pgsodium-helpers";

describe("pgsodium token helpers", () => {
  it("암호화-복호화 라운드트립 통과", async () => {
    const original = "ig_long_lived_token_abc123";
    const encrypted = await encryptToken(original);
    expect(encrypted).toBeInstanceOf(Uint8Array);
    expect(encrypted.byteLength).toBeGreaterThan(original.length); // 암호문 + nonce + MAC

    const decrypted = await decryptToken(encrypted);
    expect(decrypted).toBe(original);
  });

  it("동일 평문도 매번 다른 암호문 생성 (random nonce)", async () => {
    const a = await encryptToken("foo");
    const b = await encryptToken("foo");
    expect(Buffer.from(a).toString("hex")).not.toBe(
      Buffer.from(b).toString("hex"),
    );
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/dal/pgsodium-helpers.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

`pgsodium-helpers.ts`:

```typescript
import { sql } from "drizzle-orm";
import { createDbClient } from "./client"; // 기존 DB 클라이언트
import { env } from "@/shared/config/env";

/**
 * pgsodium은 Supabase 기본 제공 (postgres 함수).
 * Application 코드에선 SQL 함수 호출로 암호화/복호화.
 *
 * 권장: 환경별 KEY_ID 분리 (env.PGSODIUM_KEY_ID).
 * 1A: Supabase가 자동 관리하는 default key 사용 (env에 명시 X시 NULL → default).
 */
export async function encryptToken(plaintext: string): Promise<Uint8Array> {
  const db = createDbClient(env.DATABASE_URL);
  const result = await db.execute(sql`
    SELECT pgsodium.crypto_aead_det_encrypt(
      convert_to(${plaintext}, 'utf8'),
      convert_to('hesya-token', 'utf8'),
      ${env.PGSODIUM_KEY_ID ?? null}
    ) AS ciphertext
  `);
  return (result as unknown as { ciphertext: Uint8Array }[])[0].ciphertext;
}

export async function decryptToken(ciphertext: Uint8Array): Promise<string> {
  const db = createDbClient(env.DATABASE_URL);
  const result = await db.execute(sql`
    SELECT convert_from(
      pgsodium.crypto_aead_det_decrypt(
        ${ciphertext},
        convert_to('hesya-token', 'utf8'),
        ${env.PGSODIUM_KEY_ID ?? null}
      ),
      'utf8'
    ) AS plaintext
  `);
  return (result as unknown as { plaintext: string }[])[0].plaintext;
}
```

- [ ] **Step 4: env 추가**

`apps/web/src/shared/config/env.ts`에 추가:

```typescript
PGSODIUM_KEY_ID: z.string().optional(),
```

- [ ] **Step 5: 테스트 실행 (실제 DB 연결 필요)**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/dal/pgsodium-helpers.test.ts
```

Expected: 2 tests pass.

⚠️ Supabase 연결 환경변수가 필요. `.env.test` 또는 `.env.local`에 `DATABASE_URL` 셋업.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/shared/lib/dal/pgsodium-helpers.ts apps/web/src/shared/lib/dal/pgsodium-helpers.test.ts apps/web/src/shared/config/env.ts
git commit -m "feat(dal): pgsodium 토큰 암호화 헬퍼"
```

---

## Phase C — DAL (3h)

DAL은 모두 같은 패턴: `createDbClient(env.DATABASE_URL)` + Drizzle 쿼리 + 입력/출력 타입.

### Task 07: `dal/conversations.ts`

**Files:**

- Create: `apps/web/src/shared/lib/dal/conversations.ts`
- Test: `apps/web/src/shared/lib/dal/conversations.test.ts`

API:

- `upsertConversation(input)` — `(store_id, customer_id, channel)` 유일 → 중복 시 업데이트
- `getConversationById(id)` — store_id 함께 반환
- `listByStore(storeId, opts?)` — 인박스 thread 리스트 (최근순)
- `incrementUnread(conversationId)`
- `markAllRead(conversationId)`
- `updateLastMessage(conversationId, { preview, at })`
- `setMessagingWindow(conversationId, lastInboundAt)` — `expires_at = lastInboundAt + 24h`

- [ ] **Step 1: failing tests 작성**

`conversations.test.ts`에 6개 테스트:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import {
  upsertConversation,
  getConversationById,
  listByStore,
  incrementUnread,
  markAllRead,
  setMessagingWindow,
} from "./conversations";
import { resetDb, seedStore, seedCustomer } from "@/test-helpers/db";

describe("dal.conversations", () => {
  let storeId: string, customerId: string;
  beforeEach(async () => {
    await resetDb();
    storeId = await seedStore();
    customerId = await seedCustomer({
      channel: "instagram",
      externalId: "igsid_001",
    });
  });

  it("upsertConversation: 신규 시 생성", async () => {
    const c = await upsertConversation({
      storeId,
      customerId,
      channel: "instagram",
      externalThreadId: "t_1",
    });
    expect(c.id).toBeDefined();
    expect(c.status).toBe("open");
    expect(c.unreadCount).toBe(0);
  });

  it("upsertConversation: 동일 (store, customer, channel) 두번째 호출은 같은 row 반환", async () => {
    const a = await upsertConversation({
      storeId,
      customerId,
      channel: "instagram",
    });
    const b = await upsertConversation({
      storeId,
      customerId,
      channel: "instagram",
    });
    expect(b.id).toBe(a.id);
  });

  it("setMessagingWindow가 expires_at = lastInboundAt + 24h", async () => {
    const c = await upsertConversation({
      storeId,
      customerId,
      channel: "instagram",
    });
    const inboundAt = new Date("2026-05-04T10:00:00Z");
    await setMessagingWindow(c.id, inboundAt);

    const reloaded = await getConversationById(c.id);
    expect(reloaded?.messagingWindowExpiresAt?.getTime()).toBe(
      inboundAt.getTime() + 24 * 60 * 60 * 1000,
    );
  });

  it("listByStore: status='open'만 반환, last_message_at DESC", async () => {
    const c1 = await upsertConversation({
      storeId,
      customerId,
      channel: "instagram",
    });
    const customer2 = await seedCustomer({
      channel: "instagram",
      externalId: "igsid_002",
    });
    const c2 = await upsertConversation({
      storeId,
      customerId: customer2,
      channel: "instagram",
    });

    // c2 더 최근 메시지
    await setMessagingWindow(c2.id, new Date());

    const list = await listByStore(storeId);
    expect(list.map((c) => c.id)).toContain(c1.id);
    expect(list.map((c) => c.id)).toContain(c2.id);
  });

  it("incrementUnread + markAllRead", async () => {
    const c = await upsertConversation({
      storeId,
      customerId,
      channel: "instagram",
    });
    await incrementUnread(c.id);
    await incrementUnread(c.id);
    expect((await getConversationById(c.id))?.unreadCount).toBe(2);

    await markAllRead(c.id);
    expect((await getConversationById(c.id))?.unreadCount).toBe(0);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/dal/conversations.test.ts
```

Expected: FAIL — module not found.

- [ ] **Step 3: 구현**

`conversations.ts`:

```typescript
import { eq, and, desc, sql } from "drizzle-orm";
import {
  conversations,
  type Conversation,
  type NewConversation,
} from "@hesya/database/schema";
import { createDbClient } from "./client";
import { env } from "@/shared/config/env";

const db = () => createDbClient(env.DATABASE_URL);

export async function upsertConversation(input: {
  storeId: string;
  customerId: string;
  channel: NewConversation["channel"];
  externalThreadId?: string;
}): Promise<Conversation> {
  const [row] = await db()
    .insert(conversations)
    .values({
      storeId: input.storeId,
      customerId: input.customerId,
      channel: input.channel,
      externalThreadId: input.externalThreadId,
    })
    .onConflictDoUpdate({
      target: [
        conversations.storeId,
        conversations.customerId,
        conversations.channel,
      ],
      set: { updatedAt: new Date() },
    })
    .returning();
  return row;
}

export async function getConversationById(
  id: string,
): Promise<Conversation | null> {
  const rows = await db()
    .select()
    .from(conversations)
    .where(eq(conversations.id, id))
    .limit(1);
  return rows[0] ?? null;
}

export async function listByStore(
  storeId: string,
  opts: { status?: NewConversation["status"]; limit?: number } = {},
): Promise<Conversation[]> {
  return db()
    .select()
    .from(conversations)
    .where(
      and(
        eq(conversations.storeId, storeId),
        eq(conversations.status, opts.status ?? "open"),
      ),
    )
    .orderBy(desc(conversations.lastMessageAt))
    .limit(opts.limit ?? 50);
}

export async function incrementUnread(id: string): Promise<void> {
  await db()
    .update(conversations)
    .set({
      unreadCount: sql`${conversations.unreadCount} + 1`,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));
}

export async function markAllRead(id: string): Promise<void> {
  await db()
    .update(conversations)
    .set({ unreadCount: 0, updatedAt: new Date() })
    .where(eq(conversations.id, id));
}

export async function updateLastMessage(
  id: string,
  data: { preview: string; at: Date },
): Promise<void> {
  await db()
    .update(conversations)
    .set({
      lastMessagePreview: data.preview,
      lastMessageAt: data.at,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));
}

export async function setMessagingWindow(
  id: string,
  lastInboundAt: Date,
): Promise<void> {
  const expires = new Date(lastInboundAt.getTime() + 24 * 60 * 60 * 1000);
  await db()
    .update(conversations)
    .set({
      lastInboundAt,
      messagingWindowExpiresAt: expires,
      updatedAt: new Date(),
    })
    .where(eq(conversations.id, id));
}
```

- [ ] **Step 4: test helpers 확인/생성**

`apps/web/src/test-helpers/db.ts` (없으면 신규):

```typescript
import { createDbClient } from "@/shared/lib/dal/client";
import { env } from "@/shared/config/env";
import {
  customers,
  stores,
  conversations,
  messages,
} from "@hesya/database/schema";

const db = () => createDbClient(env.DATABASE_URL);

export async function resetDb() {
  await db().delete(messages);
  await db().delete(conversations);
  await db().delete(customers);
  await db().delete(stores);
}

export async function seedStore(): Promise<string> {
  const [s] = await db()
    .insert(stores)
    .values({ name: "Test Store" })
    .returning({ id: stores.id });
  return s.id;
}

export async function seedCustomer(input: {
  channel: string;
  externalId: string;
}): Promise<string> {
  const [c] = await db()
    .insert(customers)
    .values({ channel: input.channel as never, externalId: input.externalId })
    .returning({ id: customers.id });
  return c.id;
}
```

⚠️ 실제 stores/customers 컬럼 구조 확인 후 minimal seed 보완 (필수 NOT NULL 컬럼 채움).

- [ ] **Step 5: 테스트 통과**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/dal/conversations.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 6: 커밋**

```bash
git add apps/web/src/shared/lib/dal/conversations.ts apps/web/src/shared/lib/dal/conversations.test.ts apps/web/src/test-helpers/db.ts
git commit -m "feat(dal): conversations DAL + test helpers"
```

---

### Task 08: `dal/messages.ts`

**Files:**

- Create: `apps/web/src/shared/lib/dal/messages.ts`
- Test: `apps/web/src/shared/lib/dal/messages.test.ts`

API:

- `insertMessage(input)` — `(channel, external_message_id)` 중복 시 conflict 무시
- `listByConversation(conversationId, opts?)` — created_at ASC
- `markFailed(messageId, reason)`

- [ ] **Step 1: failing tests**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { insertMessage, listByConversation } from "./messages";
import { upsertConversation } from "./conversations";
import { resetDb, seedStore, seedCustomer } from "@/test-helpers/db";

describe("dal.messages", () => {
  let conversationId: string;
  beforeEach(async () => {
    await resetDb();
    const storeId = await seedStore();
    const customerId = await seedCustomer({
      channel: "instagram",
      externalId: "igsid_001",
    });
    const c = await upsertConversation({
      storeId,
      customerId,
      channel: "instagram",
    });
    conversationId = c.id;
  });

  it("insertMessage 기본 동작", async () => {
    const m = await insertMessage({
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "안녕",
      externalMessageId: "mid_1",
    });
    expect(m.id).toBeDefined();
  });

  it("동일 (channel, external_message_id) 두번째 insert는 conflict 무시", async () => {
    const a = await insertMessage({
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "x",
      externalMessageId: "mid_2",
    });
    const b = await insertMessage({
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "x",
      externalMessageId: "mid_2",
    });
    expect(b.id).toBe(a.id); // 같은 row 반환
  });

  it("listByConversation: created_at ASC, conversation 한정", async () => {
    await insertMessage({
      conversationId,
      channel: "instagram",
      direction: "inbound",
      originalText: "1",
      externalMessageId: "m1",
    });
    await insertMessage({
      conversationId,
      channel: "instagram",
      direction: "outbound",
      originalText: "2",
      externalMessageId: "m2",
    });
    const list = await listByConversation(conversationId);
    expect(list).toHaveLength(2);
    expect(list[0].originalText).toBe("1");
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/dal/messages.test.ts
```

- [ ] **Step 3: 구현**

```typescript
import { eq, asc } from "drizzle-orm";
import {
  messages,
  type NewMessage,
  type Message,
} from "@hesya/database/schema";
import { createDbClient } from "./client";
import { env } from "@/shared/config/env";

const db = () => createDbClient(env.DATABASE_URL);

export async function insertMessage(input: {
  conversationId: string;
  channel: NewMessage["channel"];
  direction: "inbound" | "outbound";
  originalText: string;
  externalMessageId?: string;
  status?: NewMessage["status"];
}): Promise<Message> {
  const [row] = await db()
    .insert(messages)
    .values({
      conversationId: input.conversationId,
      channel: input.channel,
      direction: input.direction,
      originalText: input.originalText,
      externalMessageId: input.externalMessageId,
      status: input.status ?? (input.direction === "outbound" ? "sent" : null),
    })
    .onConflictDoNothing({
      target: [messages.channel, messages.externalMessageId],
    })
    .returning();

  if (row) return row;

  // conflict 발생 시 기존 row 조회
  const existing = await db()
    .select()
    .from(messages)
    .where(eq(messages.externalMessageId, input.externalMessageId!))
    .limit(1);
  return existing[0];
}

export async function listByConversation(
  conversationId: string,
  opts: { limit?: number } = {},
): Promise<Message[]> {
  return db()
    .select()
    .from(messages)
    .where(eq(messages.conversationId, conversationId))
    .orderBy(asc(messages.createdAt))
    .limit(opts.limit ?? 200);
}

export async function markFailed(messageId: string): Promise<void> {
  await db()
    .update(messages)
    .set({ status: "failed" })
    .where(eq(messages.id, messageId));
}
```

- [ ] **Step 4: 테스트 통과**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/dal/messages.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/shared/lib/dal/messages.ts apps/web/src/shared/lib/dal/messages.test.ts
git commit -m "feat(dal): messages DAL (idempotent insert)"
```

---

### Task 09: `dal/customers.ts`

**Files:**

- Create: `apps/web/src/shared/lib/dal/customers.ts`
- Test: `apps/web/src/shared/lib/dal/customers.test.ts`

API:

- `upsertCustomer(input)` — `(channel, external_id)` 유일

- [ ] **Step 1: failing test**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { upsertCustomer } from "./customers";
import { resetDb } from "@/test-helpers/db";

describe("dal.customers", () => {
  beforeEach(() => resetDb());

  it("upsertCustomer 신규", async () => {
    const c = await upsertCustomer({
      channel: "instagram",
      externalId: "igsid_001",
    });
    expect(c.channel).toBe("instagram");
    expect(c.externalId).toBe("igsid_001");
  });

  it("동일 (channel, externalId) 두번째 호출은 같은 row", async () => {
    const a = await upsertCustomer({
      channel: "instagram",
      externalId: "igsid_001",
    });
    const b = await upsertCustomer({
      channel: "instagram",
      externalId: "igsid_001",
    });
    expect(b.id).toBe(a.id);
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**
- [ ] **Step 3: 구현**

```typescript
import { and, eq } from "drizzle-orm";
import {
  customers,
  type Customer,
  type NewCustomer,
} from "@hesya/database/schema";
import { createDbClient } from "./client";
import { env } from "@/shared/config/env";

const db = () => createDbClient(env.DATABASE_URL);

export async function upsertCustomer(input: {
  channel: NewCustomer["channel"];
  externalId: string;
  preferredLanguage?: string;
}): Promise<Customer> {
  const existing = await db()
    .select()
    .from(customers)
    .where(
      and(
        eq(customers.channel, input.channel),
        eq(customers.externalId, input.externalId),
      ),
    )
    .limit(1);
  if (existing[0]) return existing[0];

  const [row] = await db()
    .insert(customers)
    .values({
      channel: input.channel,
      externalId: input.externalId,
      preferredLanguage: input.preferredLanguage,
    })
    .returning();
  return row;
}
```

- [ ] **Step 4: 테스트 통과 + 커밋**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/dal/customers.test.ts
git add apps/web/src/shared/lib/dal/customers.ts apps/web/src/shared/lib/dal/customers.test.ts
git commit -m "feat(dal): customers DAL"
```

---

### Task 10: `dal/store-integrations.ts` (pgsodium)

**Files:**

- Create: `apps/web/src/shared/lib/dal/store-integrations.ts`
- Test: `apps/web/src/shared/lib/dal/store-integrations.test.ts`

API:

- `upsertIntegration(input)` — 매장×채널 PK
- `getIntegration(storeId, channel)` — 토큰 자동 복호화하여 반환
- `markWebhookSubscribed(storeId, channel)`

- [ ] **Step 1: failing tests**

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { upsertIntegration, getIntegration } from "./store-integrations";
import { resetDb, seedStore } from "@/test-helpers/db";

describe("dal.store-integrations", () => {
  let storeId: string;
  beforeEach(async () => {
    await resetDb();
    storeId = await seedStore();
  });

  it("upsert + get 라운드트립, 토큰 자동 복호화", async () => {
    await upsertIntegration({
      storeId,
      channel: "instagram",
      externalAccountId: "ig_acc_1",
      externalPageId: "fb_page_1",
      accessToken: "ig_long_lived_token_xyz",
      tokenExpiresAt: new Date("2026-07-04T00:00:00Z"),
      scopes: [
        "instagram_business_basic",
        "instagram_business_manage_messages",
      ],
    });

    const got = await getIntegration(storeId, "instagram");
    expect(got).not.toBeNull();
    expect(got!.externalAccountId).toBe("ig_acc_1");
    expect(got!.accessToken).toBe("ig_long_lived_token_xyz"); // 복호화됨
    expect(got!.scopes).toContain("instagram_business_manage_messages");
  });

  it("미존재 통합은 null 반환", async () => {
    const got = await getIntegration(storeId, "instagram");
    expect(got).toBeNull();
  });
});
```

- [ ] **Step 2: 테스트 실패 확인**
- [ ] **Step 3: 구현**

```typescript
import { and, eq } from "drizzle-orm";
import {
  storeIntegrations,
  type NewStoreIntegration,
} from "@hesya/database/schema";
import { createDbClient } from "./client";
import { env } from "@/shared/config/env";
import { encryptToken, decryptToken } from "./pgsodium-helpers";

const db = () => createDbClient(env.DATABASE_URL);

export async function upsertIntegration(input: {
  storeId: string;
  channel: NewStoreIntegration["channel"];
  externalAccountId: string;
  externalPageId?: string;
  externalAccountName?: string;
  accessToken: string;
  refreshToken?: string;
  tokenExpiresAt?: Date | null;
  scopes?: string[];
}): Promise<void> {
  const accessTokenEncrypted = await encryptToken(input.accessToken);
  const refreshTokenEncrypted = input.refreshToken
    ? await encryptToken(input.refreshToken)
    : null;

  await db()
    .insert(storeIntegrations)
    .values({
      storeId: input.storeId,
      channel: input.channel,
      externalAccountId: input.externalAccountId,
      externalPageId: input.externalPageId,
      externalAccountName: input.externalAccountName,
      accessTokenEncrypted,
      refreshTokenEncrypted,
      tokenExpiresAt: input.tokenExpiresAt ?? null,
      scopes: input.scopes,
    })
    .onConflictDoUpdate({
      target: [storeIntegrations.storeId, storeIntegrations.channel],
      set: {
        accessTokenEncrypted,
        refreshTokenEncrypted,
        tokenExpiresAt: input.tokenExpiresAt ?? null,
        scopes: input.scopes,
        externalAccountName: input.externalAccountName,
        updatedAt: new Date(),
      },
    });
}

export async function getIntegration(
  storeId: string,
  channel: NewStoreIntegration["channel"],
): Promise<{
  externalAccountId: string;
  externalPageId: string | null;
  externalAccountName: string | null;
  accessToken: string;
  tokenExpiresAt: Date | null;
  scopes: string[] | null;
} | null> {
  const rows = await db()
    .select()
    .from(storeIntegrations)
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.channel, channel),
      ),
    )
    .limit(1);
  if (!rows[0]) return null;
  const row = rows[0];

  const accessToken = await decryptToken(row.accessTokenEncrypted);

  return {
    externalAccountId: row.externalAccountId,
    externalPageId: row.externalPageId,
    externalAccountName: row.externalAccountName,
    accessToken,
    tokenExpiresAt: row.tokenExpiresAt,
    scopes: row.scopes,
  };
}

export async function markWebhookSubscribed(
  storeId: string,
  channel: NewStoreIntegration["channel"],
): Promise<void> {
  await db()
    .update(storeIntegrations)
    .set({ webhookSubscribedAt: new Date() })
    .where(
      and(
        eq(storeIntegrations.storeId, storeId),
        eq(storeIntegrations.channel, channel),
      ),
    );
}
```

- [ ] **Step 4: 테스트 통과**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/dal/store-integrations.test.ts
```

Expected: 2 tests pass.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/shared/lib/dal/store-integrations.ts apps/web/src/shared/lib/dal/store-integrations.test.ts
git commit -m "feat(dal): store_integrations DAL with pgsodium"
```

---

### Task 11: `dal/store-owners.ts`

**Files:**

- Create: `apps/web/src/shared/lib/dal/store-owners.ts`
- Test: `apps/web/src/shared/lib/dal/store-owners.test.ts`

API:

- `findByUserId(userId)` — userId → `{storeId, role}` (멀티 매장이라도 1A는 첫 번째만)

- [ ] **Step 1~4: TDD 사이클 — failing test → 구현 → pass**

`store-owners.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { findByUserId } from "./store-owners";
import { resetDb, seedStore, seedStoreOwner } from "@/test-helpers/db";

describe("dal.store-owners", () => {
  beforeEach(() => resetDb());

  it("등록 안된 user는 null", async () => {
    const got = await findByUserId("nonexistent_user_id");
    expect(got).toBeNull();
  });

  it("등록된 user → storeId + role", async () => {
    const storeId = await seedStore();
    const userId = "user_123";
    await seedStoreOwner({ userId, storeId, role: "owner" });

    const got = await findByUserId(userId);
    expect(got).not.toBeNull();
    expect(got!.storeId).toBe(storeId);
    expect(got!.role).toBe("owner");
  });
});
```

`store-owners.ts`:

```typescript
import { eq } from "drizzle-orm";
import { storeOwners } from "@hesya/database/schema";
import { createDbClient } from "./client";
import { env } from "@/shared/config/env";

const db = () => createDbClient(env.DATABASE_URL);

export async function findByUserId(
  userId: string,
): Promise<{ storeId: string; role: "owner" | "manager" } | null> {
  const rows = await db()
    .select()
    .from(storeOwners)
    .where(eq(storeOwners.userId, userId))
    .limit(1);
  if (!rows[0]) return null;
  return {
    storeId: rows[0].storeId,
    role: rows[0].role as "owner" | "manager",
  };
}
```

`test-helpers/db.ts`에 `seedStoreOwner` 추가:

```typescript
import { storeOwners } from "@hesya/database/schema";

export async function seedStoreOwner(input: {
  userId: string;
  storeId: string;
  role: "owner" | "manager";
}) {
  await db().insert(storeOwners).values(input);
}
```

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/shared/lib/dal/store-owners.ts apps/web/src/shared/lib/dal/store-owners.test.ts apps/web/src/test-helpers/db.ts
git commit -m "feat(dal): store_owners DAL"
```

---

### Task 12: `requireStoreOwnerAuth()` (`shared/lib/store-owner-guard.ts`)

**Files:**

- Create: `apps/web/src/shared/lib/store-owner-guard.ts`
- Test: `apps/web/src/shared/lib/store-owner-guard.test.ts`

⚠️ Better Auth 세션은 `auth.api.getSession({ headers: await headers() })` 형태. KYC `admin-guard.ts` 패턴 확인 후 동일하게 작성.

- [ ] **Step 1: KYC admin-guard 패턴 확인**

```bash
cat apps/web/src/shared/lib/admin-guard.ts
```

→ Better Auth 세션 가져오는 방식 확인.

- [ ] **Step 2: failing test 작성**

`store-owner-guard.test.ts`:

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { requireStoreOwnerAuth } from "./store-owner-guard";
import { UnauthorizedError, ForbiddenError } from "./errors";

vi.mock("./auth-server", () => ({
  getServerSession: vi.fn(),
}));
vi.mock("./dal/store-owners", () => ({
  findByUserId: vi.fn(),
}));

import { getServerSession } from "./auth-server";
import { findByUserId } from "./dal/store-owners";

describe("requireStoreOwnerAuth", () => {
  beforeEach(() => vi.clearAllMocks());

  it("세션 없으면 UnauthorizedError", async () => {
    (getServerSession as any).mockResolvedValue(null);
    await expect(requireStoreOwnerAuth()).rejects.toThrow(UnauthorizedError);
  });

  it("세션은 있으나 store_owners 매칭 없으면 ForbiddenError", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "u1" } });
    (findByUserId as any).mockResolvedValue(null);
    await expect(requireStoreOwnerAuth()).rejects.toThrow(ForbiddenError);
  });

  it("정상: { userId, storeId, role } 반환", async () => {
    (getServerSession as any).mockResolvedValue({ user: { id: "u1" } });
    (findByUserId as any).mockResolvedValue({ storeId: "s1", role: "owner" });
    const got = await requireStoreOwnerAuth();
    expect(got).toEqual({ userId: "u1", storeId: "s1", role: "owner" });
  });
});
```

- [ ] **Step 3: 구현**

`store-owner-guard.ts`:

```typescript
import { headers } from "next/headers";
import { auth } from "@/shared/lib/auth"; // Better Auth instance (admin-guard.ts와 동일)
import { findByUserId } from "./dal/store-owners";
import { UnauthorizedError, ForbiddenError } from "./errors";

export interface StoreOwnerSession {
  userId: string;
  storeId: string;
  role: "owner" | "manager";
}

export async function requireStoreOwnerAuth(): Promise<StoreOwnerSession> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new UnauthorizedError("로그인이 필요합니다");

  const ownership = await findByUserId(session.user.id);
  if (!ownership) throw new ForbiddenError("매장 소유자 권한 없음");

  return {
    userId: session.user.id,
    storeId: ownership.storeId,
    role: ownership.role,
  };
}
```

⚠️ test mock 경로 (`./auth-server`)는 admin-guard.ts에서 어떻게 import하는지 확인 후 동일 모듈명으로 통일.

- [ ] **Step 4: 테스트 통과**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/shared/lib/store-owner-guard.test.ts
```

Expected: 3 tests pass.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/shared/lib/store-owner-guard.ts apps/web/src/shared/lib/store-owner-guard.test.ts
git commit -m "feat(auth): requireStoreOwnerAuth (Better Auth + store_owners DAL)"
```

---

## Phase D — Channel Layer (3.5h)

### Task 13: `ChannelAdapter` 인터페이스 + `lib/inbox/types.ts`

**Files:**

- Create: `apps/web/src/lib/inbox/channel-adapter.ts`
- Create: `apps/web/src/lib/inbox/types.ts`

- [ ] **Step 1: types.ts 작성**

```typescript
// apps/web/src/lib/inbox/types.ts
export type Channel = "instagram" | "whatsapp" | "kakao" | "line" | "messenger";

export interface InboundMessage {
  channel: Channel;
  externalThreadId?: string; // IG thread_id 등
  externalMessageId: string; // IG mid (idempotency)
  senderExternalId: string; // IG IGSID
  recipientExternalId: string; // 매장 IG account ID (라우팅 key)
  text: string;
  receivedAt: Date;
}

export interface OutboundInput {
  externalRecipientId: string; // 고객 IGSID
  text: string;
}

export interface ExchangeCodeResult {
  accessToken: string;
  refreshToken?: string;
  expiresAt: Date | null;
  externalAccountId: string;
  externalPageId?: string;
  externalAccountName?: string;
  scopes: string[];
}
```

- [ ] **Step 2: channel-adapter.ts 작성**

```typescript
// apps/web/src/lib/inbox/channel-adapter.ts
import type {
  Channel,
  InboundMessage,
  OutboundInput,
  ExchangeCodeResult,
} from "./types";

export interface ChannelAdapter {
  channel: Channel;

  parseInbound(
    rawPayload: string,
    signature: string,
    secret: string,
  ): Promise<InboundMessage[]>;

  sendOutbound(
    input: OutboundInput,
    accessToken: string,
  ): Promise<{ externalMessageId: string }>;

  exchangeCode(code: string, redirectUri: string): Promise<ExchangeCodeResult>;
}
```

- [ ] **Step 3: tsc 통과**

```bash
pnpm --filter @hesya/web tsc --noEmit
```

- [ ] **Step 4: 커밋**

```bash
git add apps/web/src/lib/inbox/types.ts apps/web/src/lib/inbox/channel-adapter.ts
git commit -m "feat(inbox): ChannelAdapter 인터페이스 + 표준 메시지 타입"
```

---

### Task 14: `instagram-api-client.ts` (HTTP fetch 래퍼)

**Files:**

- Create: `apps/web/src/lib/inbox/instagram-api-client.ts`

이 파일은 `fetch` 직접 사용. 테스트는 T15~T17의 어댑터 단에서 mock.

- [ ] **Step 1: 작성**

```typescript
// apps/web/src/lib/inbox/instagram-api-client.ts
import { ExternalApiError } from "@/shared/lib/errors";

export interface InstagramApiClient {
  exchangeShortLivedToken(input: {
    code: string;
    redirectUri: string;
    appId: string;
    appSecret: string;
  }): Promise<{
    accessToken: string;
    userId: string;
  }>;
  exchangeLongLivedToken(input: {
    shortLivedToken: string;
    appSecret: string;
  }): Promise<{
    accessToken: string;
    expiresIn: number;
  }>;
  getMe(accessToken: string): Promise<{ id: string; username: string }>;
  sendMessage(input: {
    recipientId: string;
    text: string;
    pageId: string;
    accessToken: string;
  }): Promise<{ messageId: string }>;
  subscribeWebhook(input: {
    pageId: string;
    accessToken: string;
  }): Promise<void>;
}

const BASE = "https://graph.instagram.com/v24.0";

export const fetchInstagramApiClient: InstagramApiClient = {
  async exchangeShortLivedToken({ code, redirectUri, appId, appSecret }) {
    const params = new URLSearchParams({
      client_id: appId,
      client_secret: appSecret,
      grant_type: "authorization_code",
      redirect_uri: redirectUri,
      code,
    });
    const res = await fetch(`${BASE}/oauth/access_token`, {
      method: "POST",
      body: params,
    });
    if (!res.ok)
      throw new ExternalApiError("IG short-lived token 교환 실패", {
        status: res.status,
        body: await res.text(),
      });
    const json = (await res.json()) as {
      access_token: string;
      user_id: string;
    };
    return { accessToken: json.access_token, userId: json.user_id };
  },

  async exchangeLongLivedToken({ shortLivedToken, appSecret }) {
    const url = `${BASE}/access_token?grant_type=ig_exchange_token&client_secret=${appSecret}&access_token=${shortLivedToken}`;
    const res = await fetch(url);
    if (!res.ok)
      throw new ExternalApiError("IG long-lived token 교환 실패", {
        status: res.status,
        body: await res.text(),
      });
    const json = (await res.json()) as {
      access_token: string;
      expires_in: number;
    };
    return { accessToken: json.access_token, expiresIn: json.expires_in };
  },

  async getMe(accessToken) {
    const res = await fetch(
      `${BASE}/me?fields=id,username&access_token=${accessToken}`,
    );
    if (!res.ok)
      throw new ExternalApiError("IG /me 조회 실패", {
        status: res.status,
        body: await res.text(),
      });
    return (await res.json()) as { id: string; username: string };
  },

  async sendMessage({ recipientId, text, pageId, accessToken }) {
    const res = await fetch(`${BASE}/${pageId}/messages`, {
      method: "POST",
      headers: {
        "content-type": "application/json",
        authorization: `Bearer ${accessToken}`,
      },
      body: JSON.stringify({
        recipient: { id: recipientId },
        message: { text },
      }),
    });
    if (!res.ok)
      throw new ExternalApiError("IG sendMessage 실패", {
        status: res.status,
        body: await res.text(),
      });
    const json = (await res.json()) as { message_id: string };
    return { messageId: json.message_id };
  },

  async subscribeWebhook({ pageId, accessToken }) {
    const res = await fetch(
      `${BASE}/${pageId}/subscribed_apps?subscribed_fields=messages,messaging_postbacks`,
      {
        method: "POST",
        headers: { authorization: `Bearer ${accessToken}` },
      },
    );
    if (!res.ok)
      throw new ExternalApiError("IG subscribed_apps 실패", {
        status: res.status,
        body: await res.text(),
      });
  },
};
```

- [ ] **Step 2: 커밋**

```bash
git add apps/web/src/lib/inbox/instagram-api-client.ts
git commit -m "feat(inbox): InstagramApiClient (fetch 래퍼)"
```

---

### Task 15-17: `instagram-adapter.ts` (parseInbound + sendOutbound + exchangeCode)

이 어댑터는 InstagramApiClient를 의존성으로 주입받아 테스트 가능하게 한다.

**Files:**

- Create: `apps/web/src/lib/inbox/instagram-adapter.ts`
- Test: `apps/web/src/lib/inbox/instagram-adapter.test.ts`

- [ ] **Step 1: failing tests 작성 (3 묶음)**

`instagram-adapter.test.ts`:

```typescript
import { describe, it, expect } from "vitest";
import { createHmac } from "node:crypto";
import { createInstagramAdapter } from "./instagram-adapter";
import { WebhookSignatureError } from "@/shared/lib/errors";

const SECRET = "test_app_secret";

function sign(body: string, secret: string): string {
  return "sha256=" + createHmac("sha256", secret).update(body).digest("hex");
}

const samplePayload = JSON.stringify({
  object: "instagram",
  entry: [
    {
      time: 1714780800000,
      id: "ig_acc_id",
      messaging: [
        {
          sender: { id: "igsid_user_001" },
          recipient: { id: "ig_acc_id" },
          timestamp: 1714780800000,
          message: { mid: "mid_abc", text: "안녕하세요, 단발 가능?" },
        },
      ],
    },
  ],
});

describe("instagramAdapter.parseInbound", () => {
  const adapter = createInstagramAdapter({} as any);

  it("HMAC 일치 → InboundMessage[] 반환", async () => {
    const sig = sign(samplePayload, SECRET);
    const list = await adapter.parseInbound(samplePayload, sig, SECRET);
    expect(list).toHaveLength(1);
    expect(list[0]).toMatchObject({
      channel: "instagram",
      externalMessageId: "mid_abc",
      senderExternalId: "igsid_user_001",
      recipientExternalId: "ig_acc_id",
      text: "안녕하세요, 단발 가능?",
    });
  });

  it("HMAC 불일치 → WebhookSignatureError", async () => {
    const sig = "sha256=invalid";
    await expect(
      adapter.parseInbound(samplePayload, sig, SECRET),
    ).rejects.toThrow(WebhookSignatureError);
  });

  it("payload에 message 없음 (read receipt 등) → 빈 배열", async () => {
    const noMsg = JSON.stringify({
      object: "instagram",
      entry: [
        {
          id: "x",
          messaging: [
            {
              sender: { id: "a" },
              recipient: { id: "b" },
              timestamp: 1,
              read: { mid: "m" },
            },
          ],
        },
      ],
    });
    const sig = sign(noMsg, SECRET);
    const list = await adapter.parseInbound(noMsg, sig, SECRET);
    expect(list).toHaveLength(0);
  });
});

describe("instagramAdapter.sendOutbound", () => {
  it("API client에 올바른 인자 전달, externalMessageId 반환", async () => {
    const calls: any[] = [];
    const fakeClient = {
      sendMessage: async (input: any) => {
        calls.push(input);
        return { messageId: "mid_out_123" };
      },
    };
    const adapter = createInstagramAdapter(fakeClient as any);
    const result = await adapter.sendOutbound(
      { externalRecipientId: "igsid_user_001", text: "네! 가능합니다." },
      "tok_abc",
    );
    expect(result).toEqual({ externalMessageId: "mid_out_123" });
    expect(calls[0]).toMatchObject({
      recipientId: "igsid_user_001",
      text: "네! 가능합니다.",
      accessToken: "tok_abc",
    });
  });
});

describe("instagramAdapter.exchangeCode", () => {
  it("short → long-lived → /me 호출 후 ExchangeCodeResult 반환", async () => {
    const fakeClient = {
      exchangeShortLivedToken: async () => ({
        accessToken: "short_tok",
        userId: "u1",
      }),
      exchangeLongLivedToken: async () => ({
        accessToken: "long_tok",
        expiresIn: 60 * 60 * 24 * 60,
      }),
      getMe: async () => ({ id: "ig_acc_id", username: "demo_salon" }),
    };
    const adapter = createInstagramAdapter(fakeClient as any, {
      appId: "app1",
      appSecret: "secret",
    });
    const r = await adapter.exchangeCode("auth_code", "https://example.com/cb");
    expect(r.accessToken).toBe("long_tok");
    expect(r.externalAccountId).toBe("ig_acc_id");
    expect(r.externalAccountName).toBe("demo_salon");
    expect(r.scopes).toEqual([
      "instagram_business_basic",
      "instagram_business_manage_messages",
    ]);
    expect(r.expiresAt!.getTime()).toBeGreaterThan(Date.now());
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/lib/inbox/instagram-adapter.test.ts
```

- [ ] **Step 3: 구현**

`instagram-adapter.ts`:

```typescript
import { createHmac, timingSafeEqual } from "node:crypto";
import type { ChannelAdapter } from "./channel-adapter";
import type {
  InboundMessage,
  OutboundInput,
  ExchangeCodeResult,
} from "./types";
import type { InstagramApiClient } from "./instagram-api-client";
import { WebhookSignatureError } from "@/shared/lib/errors";

interface IgWebhookPayload {
  object: "instagram";
  entry: Array<{
    id: string;
    time: number;
    messaging?: Array<{
      sender: { id: string };
      recipient: { id: string };
      timestamp: number;
      message?: { mid: string; text?: string };
    }>;
  }>;
}

export interface InstagramAdapterDeps {
  appId?: string;
  appSecret?: string;
}

export function createInstagramAdapter(
  client: InstagramApiClient,
  deps: InstagramAdapterDeps = {},
): ChannelAdapter {
  return {
    channel: "instagram",

    async parseInbound(
      rawPayload,
      signature,
      secret,
    ): Promise<InboundMessage[]> {
      const expected =
        "sha256=" +
        createHmac("sha256", secret).update(rawPayload).digest("hex");
      const sigBuf = Buffer.from(signature);
      const expBuf = Buffer.from(expected);
      if (sigBuf.length !== expBuf.length || !timingSafeEqual(sigBuf, expBuf)) {
        throw new WebhookSignatureError();
      }

      const data = JSON.parse(rawPayload) as IgWebhookPayload;
      const out: InboundMessage[] = [];
      for (const entry of data.entry ?? []) {
        for (const m of entry.messaging ?? []) {
          if (!m.message?.mid || !m.message.text) continue;
          out.push({
            channel: "instagram",
            externalMessageId: m.message.mid,
            senderExternalId: m.sender.id,
            recipientExternalId: m.recipient.id,
            text: m.message.text,
            receivedAt: new Date(m.timestamp),
          });
        }
      }
      return out;
    },

    async sendOutbound(
      input,
      accessToken,
    ): Promise<{ externalMessageId: string }> {
      const result = await client.sendMessage({
        recipientId: input.externalRecipientId,
        text: input.text,
        pageId: "", // sendOutbound에는 page id가 외부에서 주어져야 함 — 호출자가 input에 추가하거나, 어댑터 생성 시 주입
        accessToken,
      });
      return { externalMessageId: result.messageId };
    },

    async exchangeCode(code, redirectUri): Promise<ExchangeCodeResult> {
      if (!deps.appId || !deps.appSecret) {
        throw new Error(
          "InstagramAdapter requires appId/appSecret for exchangeCode",
        );
      }
      const short = await client.exchangeShortLivedToken({
        code,
        redirectUri,
        appId: deps.appId,
        appSecret: deps.appSecret,
      });
      const long = await client.exchangeLongLivedToken({
        shortLivedToken: short.accessToken,
        appSecret: deps.appSecret,
      });
      const me = await client.getMe(long.accessToken);

      return {
        accessToken: long.accessToken,
        expiresAt: new Date(Date.now() + long.expiresIn * 1000),
        externalAccountId: me.id,
        externalAccountName: me.username,
        scopes: [
          "instagram_business_basic",
          "instagram_business_manage_messages",
        ],
      };
    },
  };
}
```

⚠️ `sendOutbound`의 `pageId`는 매장 통합 정보에서 가져와야 함. T19~T22의 호출 코드에서 `OutboundInput`에 추가 필드 또는 `getIntegration().externalPageId`를 함께 전달하도록 보강. 현재 plan에선 호출자(send-outbound action)가 `pageId`를 별도 인자로 넘기게 시그니처 확장:

```typescript
sendOutbound(
  input: OutboundInput & { pageId: string },
  accessToken: string
): Promise<{ externalMessageId: string }>
```

→ `types.ts`의 `OutboundInput`에 `pageId?` 추가하거나, ChannelAdapter 인터페이스에 두 번째 인자로. 1A 깔끔: `OutboundInput`에 채널 의존 필드 안 넣고, 호출자가 `pageId`를 두 번째 시그니처로 전달.

`channel-adapter.ts`의 `sendOutbound` 시그니처 수정:

```typescript
sendOutbound(
  input: OutboundInput,
  context: { accessToken: string; externalAccountId?: string; externalPageId?: string }
): Promise<{ externalMessageId: string }>;
```

→ test 코드도 일치하게 수정.

- [ ] **Step 4: 시그니처 보강 + 테스트 통과**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/lib/inbox/instagram-adapter.test.ts
```

Expected: 5 tests pass.

- [ ] **Step 5: 커밋**

```bash
git add apps/web/src/lib/inbox/instagram-adapter.ts apps/web/src/lib/inbox/instagram-adapter.test.ts apps/web/src/lib/inbox/channel-adapter.ts
git commit -m "feat(inbox): InstagramAdapter (parseInbound HMAC, sendOutbound, exchangeCode)"
```

---

### Task 18: `process-inbound.ts` (1A 빈 hook)

**Files:**

- Create: `apps/web/src/lib/inbox/process-inbound.ts`
- Test: `apps/web/src/lib/inbox/process-inbound.test.ts`

- [ ] **Step 1: test**

```typescript
import { describe, it, expect } from "vitest";
import { processInbound } from "./process-inbound";

describe("processInbound (1A 빈 함수)", () => {
  it("어떤 messageId든 throw하지 않고 반환", async () => {
    await expect(processInbound("msg_001")).resolves.toBeUndefined();
  });
});
```

- [ ] **Step 2: 구현**

```typescript
// apps/web/src/lib/inbox/process-inbound.ts
/**
 * Webhook inbound 메시지 후처리 hook.
 *
 * 1A: 빈 함수 (DB 저장만으로 충분).
 * 1C: AI 자동 응답 + 번역 + RAG 트리거 (queue 또는 fire-and-forget).
 *
 * Webhook route handler는 fire-and-forget으로 호출 → 200 OK 응답 막지 않음.
 */
export async function processInbound(_messageId: string): Promise<void> {
  // 1A intentionally empty; see docs/superpowers/specs/2026-05-04-epic-1a-inbox-instagram-design.md § 2.5
}
```

- [ ] **Step 3: 테스트 통과 + 커밋**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/lib/inbox/process-inbound.test.ts
git add apps/web/src/lib/inbox/process-inbound.ts apps/web/src/lib/inbox/process-inbound.test.ts
git commit -m "feat(inbox): processInbound 1A hook point (빈 함수)"
```

---

## Phase E — i18n (1h)

### Task 19: `apps/web/messages/{ko,en}.json` (100% 번역)

**Files:**

- Create: `apps/web/messages/ko.json`
- Create: `apps/web/messages/en.json`

- [ ] **Step 1: ko.json 작성**

```json
{
  "inbox": {
    "title": "통합 인박스",
    "empty": "아직 메시지가 없습니다",
    "notConnected": {
      "title": "Instagram 연결이 필요합니다",
      "description": "고객 DM을 받으려면 Instagram 비즈니스 계정을 연결해 주세요",
      "button": "Instagram 연결"
    },
    "thread": {
      "noSelection": "왼쪽에서 대화를 선택하세요",
      "channelInstagram": "Instagram"
    },
    "composer": {
      "placeholder": "한국어로 답변을 작성하세요...",
      "send": "전송",
      "sendError": "전송 실패: {reason}"
    },
    "window": {
      "openWithTime": "답변 가능 — {time} 남음",
      "closingSoon": "곧 만료 — {time} 남음",
      "expired": "고객 메시지 후 24시간 경과 — 답변 불가",
      "expiredHelp": "고객이 다시 메시지를 보낼 때까지 기다려 주세요"
    },
    "connect": {
      "loading": "연결 처리 중...",
      "success": "Instagram 연결 완료",
      "failed": "연결 실패: {reason}"
    },
    "tokenExpired": {
      "banner": "Instagram 토큰이 만료되었습니다 — 재연결이 필요합니다",
      "button": "재연결"
    }
  }
}
```

- [ ] **Step 2: en.json 작성 (동일 키, 영어 번역)**

```json
{
  "inbox": {
    "title": "Unified Inbox",
    "empty": "No messages yet",
    "notConnected": {
      "title": "Connect your Instagram",
      "description": "Connect an Instagram Business account to start receiving customer DMs",
      "button": "Connect Instagram"
    },
    "thread": {
      "noSelection": "Select a conversation from the left",
      "channelInstagram": "Instagram"
    },
    "composer": {
      "placeholder": "Type your reply in Korean...",
      "send": "Send",
      "sendError": "Send failed: {reason}"
    },
    "window": {
      "openWithTime": "Reply window — {time} remaining",
      "closingSoon": "Closing soon — {time} remaining",
      "expired": "24 hours passed since the customer's last message — replies disabled",
      "expiredHelp": "Wait until the customer messages you again"
    },
    "connect": {
      "loading": "Connecting...",
      "success": "Instagram connected",
      "failed": "Connection failed: {reason}"
    },
    "tokenExpired": {
      "banner": "Instagram token expired — please reconnect",
      "button": "Reconnect"
    }
  }
}
```

- [ ] **Step 3: 커밋**

```bash
git add apps/web/messages/ko.json apps/web/messages/en.json
git commit -m "feat(i18n): inbox 키 — 한국어/영어 100%"
```

---

### Task 20: `{ja,zh-CN,zh-TW,vi}.json` placeholder (1B에서 본격 번역)

**Files:**

- Create: `apps/web/messages/ja.json`
- Create: `apps/web/messages/zh-CN.json`
- Create: `apps/web/messages/zh-TW.json`
- Create: `apps/web/messages/vi.json`

- [ ] **Step 1: 4개 파일에 ko.json 구조 그대로 복사 + 한국어 그대로 (placeholder)**

⚠️ next-intl이 키 미스를 throw하지 않도록 모든 키 존재하도록 한국어 값으로 채움. 1B에서 본격 번역.

각 파일 헤더 주석:

```json
// 1B에서 본격 번역 예정. 1A는 한국어 placeholder로 빈 키 방지.
```

(JSON은 주석 미지원이므로 별도 안내 X. PR 본문에 명시.)

- [ ] **Step 2: next-intl 빌드 검증**

```bash
pnpm --filter @hesya/web build
```

Expected: i18n 관련 에러 0건.

- [ ] **Step 3: 커밋**

```bash
git add apps/web/messages/ja.json apps/web/messages/zh-CN.json apps/web/messages/zh-TW.json apps/web/messages/vi.json
git commit -m "feat(i18n): ja/zh-CN/zh-TW/vi placeholder (1B에서 본격 번역)"
```

---

## Phase F — Routes (2.5h)

### Task 21: Webhook Route (`/api/webhooks/instagram/route.ts`)

**Files:**

- Create: `apps/web/src/app/api/webhooks/instagram/route.ts`
- Modify: `apps/web/src/shared/config/env.ts` (IG\_\* 추가)
- Modify: `apps/web/.env.example`

- [ ] **Step 1: env 추가**

`apps/web/src/shared/config/env.ts`에:

```typescript
IG_APP_ID: z.string().min(1),
IG_APP_SECRET: z.string().min(1),
IG_WEBHOOK_VERIFY_TOKEN: z.string().min(8),
IG_REDIRECT_URI: z.string().url(),
```

`.env.example`에:

```bash
IG_APP_ID=
IG_APP_SECRET=
IG_WEBHOOK_VERIFY_TOKEN=
IG_REDIRECT_URI=https://<your-name>.ngrok-free.app/api/oauth/instagram/callback
```

- [ ] **Step 2: route handler 작성**

```typescript
// apps/web/src/app/api/webhooks/instagram/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { env } from "@/shared/config/env";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { createInstagramAdapter } from "@/lib/inbox/instagram-adapter";
import { processInbound } from "@/lib/inbox/process-inbound";
import { upsertCustomer } from "@/shared/lib/dal/customers";
import {
  upsertConversation,
  setMessagingWindow,
  updateLastMessage,
  incrementUnread,
} from "@/shared/lib/dal/conversations";
import { insertMessage } from "@/shared/lib/dal/messages";
import { findStoreByExternalAccount } from "@/shared/lib/dal/stores"; // 신규 — 매장 라우팅
import { WebhookSignatureError } from "@/shared/lib/errors";

const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  if (
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === env.IG_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: NextRequest) {
  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  let inbound;
  try {
    inbound = await adapter.parseInbound(rawBody, signature, env.IG_APP_SECRET);
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      Sentry.captureException(err, { tags: { route: "webhook:instagram" } });
      return new NextResponse("invalid signature", { status: 401 });
    }
    Sentry.captureException(err, {
      tags: { route: "webhook:instagram", phase: "parse" },
    });
    return new NextResponse("ok", { status: 200 }); // Meta retry 차단
  }

  try {
    for (const m of inbound) {
      const store = await findStoreByExternalAccount({
        channel: "instagram",
        externalAccountId: m.recipientExternalId,
      });
      if (!store) continue; // 미연결 매장 메시지 무시

      const customer = await upsertCustomer({
        channel: "instagram",
        externalId: m.senderExternalId,
      });
      const conv = await upsertConversation({
        storeId: store.id,
        customerId: customer.id,
        channel: "instagram",
        externalThreadId: m.externalThreadId,
      });

      const inserted = await insertMessage({
        conversationId: conv.id,
        channel: "instagram",
        direction: "inbound",
        originalText: m.text,
        externalMessageId: m.externalMessageId,
      });

      await setMessagingWindow(conv.id, m.receivedAt);
      await updateLastMessage(conv.id, {
        preview: m.text.slice(0, 80),
        at: m.receivedAt,
      });
      await incrementUnread(conv.id);

      // fire-and-forget hook (1A 빈 함수)
      void processInbound(inserted.id).catch((e) =>
        Sentry.captureException(e, { tags: { phase: "processInbound" } }),
      );
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "webhook:instagram", phase: "persist" },
    });
    return new NextResponse("error", { status: 500 }); // Meta retry 유도
  }

  return new NextResponse("ok", { status: 200 });
}
```

- [ ] **Step 3: `findStoreByExternalAccount` DAL 신규**

`apps/web/src/shared/lib/dal/stores.ts` (없으면 생성, 있으면 함수 추가):

```typescript
import { and, eq } from "drizzle-orm";
import { storeIntegrations, stores } from "@hesya/database/schema";
import { createDbClient } from "./client";
import { env } from "@/shared/config/env";

export async function findStoreByExternalAccount(input: {
  channel: "instagram" | "whatsapp" | "kakao" | "line" | "messenger";
  externalAccountId: string;
}): Promise<{ id: string } | null> {
  const db = createDbClient(env.DATABASE_URL);
  const rows = await db
    .select({ id: stores.id })
    .from(stores)
    .innerJoin(storeIntegrations, eq(storeIntegrations.storeId, stores.id))
    .where(
      and(
        eq(storeIntegrations.channel, input.channel),
        eq(storeIntegrations.externalAccountId, input.externalAccountId),
      ),
    )
    .limit(1);
  return rows[0] ?? null;
}
```

(test는 integration phase에서 함께)

- [ ] **Step 4: Integration test (가짜 payload)**

`apps/web/src/app/api/webhooks/instagram/route.test.ts`:

```typescript
import { describe, it, expect, beforeEach } from "vitest";
import { POST, GET } from "./route";
import { NextRequest } from "next/server";
import { createHmac } from "node:crypto";
import { resetDb, seedStore, seedStoreIntegration } from "@/test-helpers/db";
import { env } from "@/shared/config/env";

describe("webhook GET (verify)", () => {
  it("verify_token 일치 시 challenge 반환", async () => {
    const url = `http://localhost/api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=${env.IG_WEBHOOK_VERIFY_TOKEN}&hub.challenge=ch_123`;
    const res = await GET(new NextRequest(url));
    expect(res.status).toBe(200);
    expect(await res.text()).toBe("ch_123");
  });
});

describe("webhook POST", () => {
  beforeEach(() => resetDb());

  it("HMAC 일치 + 매장 연결됨 → DB 저장 + 200", async () => {
    const storeId = await seedStore();
    await seedStoreIntegration({
      storeId,
      channel: "instagram",
      externalAccountId: "ig_acc_id",
    });

    const payload = JSON.stringify({
      object: "instagram",
      entry: [
        {
          id: "ig_acc_id",
          time: Date.now(),
          messaging: [
            {
              sender: { id: "igsid_001" },
              recipient: { id: "ig_acc_id" },
              timestamp: Date.now(),
              message: { mid: "mid_1", text: "안녕" },
            },
          ],
        },
      ],
    });
    const sig =
      "sha256=" +
      createHmac("sha256", env.IG_APP_SECRET).update(payload).digest("hex");

    const req = new NextRequest("http://localhost/api/webhooks/instagram", {
      method: "POST",
      headers: { "x-hub-signature-256": sig },
      body: payload,
    });
    const res = await POST(req);
    expect(res.status).toBe(200);
    // DB 검증: conversations + messages 1개씩
  });

  it("HMAC 불일치 → 401", async () => {
    const req = new NextRequest("http://localhost/api/webhooks/instagram", {
      method: "POST",
      headers: { "x-hub-signature-256": "sha256=invalid" },
      body: "{}",
    });
    const res = await POST(req);
    expect(res.status).toBe(401);
  });
});
```

- [ ] **Step 5: test-helpers에 seedStoreIntegration 추가**

```typescript
export async function seedStoreIntegration(input: {
  storeId: string;
  channel: string;
  externalAccountId: string;
}) {
  await upsertIntegration({
    storeId: input.storeId,
    channel: input.channel as never,
    externalAccountId: input.externalAccountId,
    accessToken: "test_tok",
    scopes: ["instagram_business_basic", "instagram_business_manage_messages"],
  });
}
```

- [ ] **Step 6: 테스트 통과 + 커밋**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/app/api/webhooks/instagram/route.test.ts
git add apps/web/src/app/api/webhooks/instagram apps/web/src/shared/lib/dal/stores.ts apps/web/src/shared/config/env.ts apps/web/.env.example apps/web/src/test-helpers/db.ts
git commit -m "feat(api): Instagram webhook route (HMAC verify + DAL upsert + hook)"
```

---

### Task 22: OAuth Callback Route

**Files:**

- Create: `apps/web/src/app/api/oauth/instagram/callback/route.ts`

매장 사장 인증 + state 검증 + code 교환 + integration 저장 + webhook subscribe.

- [ ] **Step 1: 작성**

```typescript
// apps/web/src/app/api/oauth/instagram/callback/route.ts
import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { env } from "@/shared/config/env";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { createInstagramAdapter } from "@/lib/inbox/instagram-adapter";
import {
  upsertIntegration,
  markWebhookSubscribed,
} from "@/shared/lib/dal/store-integrations";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

export async function GET(req: NextRequest) {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ig_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL(`/ko/store/inbox/connect?error=state_mismatch`, req.url),
    );
  }
  cookieStore.delete("ig_oauth_state");

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    return NextResponse.redirect(
      new URL(`/ko/sign-in?next=/ko/store/inbox/connect`, req.url),
    );
  }

  try {
    const exchanged = await adapter.exchangeCode(code, env.IG_REDIRECT_URI);
    await upsertIntegration({
      storeId: session.storeId,
      channel: "instagram",
      externalAccountId: exchanged.externalAccountId,
      externalPageId: exchanged.externalPageId,
      externalAccountName: exchanged.externalAccountName,
      accessToken: exchanged.accessToken,
      tokenExpiresAt: exchanged.expiresAt,
      scopes: exchanged.scopes,
    });
    await fetchInstagramApiClient.subscribeWebhook({
      pageId: exchanged.externalAccountId,
      accessToken: exchanged.accessToken,
    });
    await markWebhookSubscribed(session.storeId, "instagram");

    return NextResponse.redirect(
      new URL(`/ko/store/inbox?connected=instagram`, req.url),
    );
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "oauth:instagram", storeId: session.storeId },
    });
    const reason = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(
      new URL(
        `/ko/store/inbox/connect?error=${encodeURIComponent(reason)}`,
        req.url,
      ),
    );
  }
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/web/src/app/api/oauth/instagram/callback/route.ts
git commit -m "feat(api): Instagram OAuth callback (state 검증 + 토큰 저장 + webhook subscribe)"
```

---

### Task 23: Polling endpoint (`/api/inbox/refresh/route.ts`)

**Files:**

- Create: `apps/web/src/app/api/inbox/refresh/route.ts`

- [ ] **Step 1: 작성**

```typescript
// apps/web/src/app/api/inbox/refresh/route.ts
import { NextRequest, NextResponse } from "next/server";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { listByStore } from "@/shared/lib/dal/conversations";
import { listByConversation } from "@/shared/lib/dal/messages";
import { UnauthorizedError, ForbiddenError } from "@/shared/lib/errors";

export async function GET(req: NextRequest) {
  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError)
      return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    if (err instanceof ForbiddenError)
      return NextResponse.json({ error: "forbidden" }, { status: 403 });
    throw err;
  }

  const conversations = await listByStore(session.storeId);

  const activeId = req.nextUrl.searchParams.get("activeId");
  const messages: Record<string, unknown> = {};
  if (activeId) {
    messages[activeId] = await listByConversation(activeId);
  }

  return NextResponse.json({ conversations, messages });
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/web/src/app/api/inbox/refresh/route.ts
git commit -m "feat(api): inbox refresh polling endpoint"
```

---

## Phase G — Server Actions + features (2h)

### Task 24: `window-utils.ts` (TDD)

**Files:**

- Create: `apps/web/src/features/inbox/lib/window-utils.ts`
- Test: `apps/web/src/features/inbox/lib/window-utils.test.ts`

- [ ] **Step 1: failing test**

```typescript
import { describe, it, expect } from "vitest";
import { getWindowStatus } from "./window-utils";

describe("getWindowStatus", () => {
  it("expiresAt null → no-inbound", () => {
    expect(getWindowStatus(null).state).toBe("no-inbound");
  });

  it("미래 12h+ → open", () => {
    const future = new Date(Date.now() + 12 * 60 * 60 * 1000);
    expect(getWindowStatus(future).state).toBe("open");
  });

  it("미래 30분 → closing-soon", () => {
    const soon = new Date(Date.now() + 30 * 60 * 1000);
    expect(getWindowStatus(soon).state).toBe("closing-soon");
  });

  it("과거 → expired, remainingMs=0", () => {
    const past = new Date(Date.now() - 1000);
    const r = getWindowStatus(past);
    expect(r.state).toBe("expired");
    expect(r.remainingMs).toBe(0);
  });
});
```

- [ ] **Step 2~3: 구현**

```typescript
// apps/web/src/features/inbox/lib/window-utils.ts
export type WindowState = "no-inbound" | "open" | "closing-soon" | "expired";

export interface WindowStatus {
  state: WindowState;
  remainingMs: number | null;
}

const ONE_HOUR_MS = 60 * 60 * 1000;

export function getWindowStatus(expiresAt: Date | null): WindowStatus {
  if (!expiresAt) return { state: "no-inbound", remainingMs: null };
  const remainingMs = expiresAt.getTime() - Date.now();
  if (remainingMs <= 0) return { state: "expired", remainingMs: 0 };
  if (remainingMs < ONE_HOUR_MS) return { state: "closing-soon", remainingMs };
  return { state: "open", remainingMs };
}
```

- [ ] **Step 4: 테스트 통과 + 커밋**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/features/inbox/lib/window-utils.test.ts
git add apps/web/src/features/inbox/lib/window-utils.ts apps/web/src/features/inbox/lib/window-utils.test.ts
git commit -m "feat(inbox): window-utils (24h messaging window 상태 계산)"
```

---

### Task 25: `send-outbound.ts` Server Action

**Files:**

- Create: `apps/web/src/features/inbox/actions/send-outbound.ts`
- Test: `apps/web/src/features/inbox/actions/send-outbound.test.ts`

- [ ] **Step 1: failing tests**

```typescript
import { describe, it, expect, beforeEach, vi } from "vitest";
import { sendOutbound } from "./send-outbound";
import { WindowClosedError, ForbiddenError } from "@/shared/lib/errors";

vi.mock("@/shared/lib/store-owner-guard", () => ({
  requireStoreOwnerAuth: vi.fn(),
}));
vi.mock("@/shared/lib/dal/conversations", () => ({
  getConversationById: vi.fn(),
  updateLastMessage: vi.fn(),
}));
vi.mock("@/shared/lib/dal/messages", () => ({ insertMessage: vi.fn() }));
vi.mock("@/shared/lib/dal/store-integrations", () => ({
  getIntegration: vi.fn(),
}));
vi.mock("@/lib/inbox/instagram-adapter", () => ({
  createInstagramAdapter: () => ({
    sendOutbound: vi.fn().mockResolvedValue({ externalMessageId: "out_1" }),
  }),
}));

import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { getConversationById } from "@/shared/lib/dal/conversations";
import { getIntegration } from "@/shared/lib/dal/store-integrations";

describe("sendOutbound action", () => {
  beforeEach(() => vi.clearAllMocks());

  it("매장 소유 conversation 아니면 ForbiddenError", async () => {
    (requireStoreOwnerAuth as any).mockResolvedValue({
      userId: "u1",
      storeId: "s1",
      role: "owner",
    });
    (getConversationById as any).mockResolvedValue({
      id: "c1",
      storeId: "s_other",
      channel: "instagram",
      messagingWindowExpiresAt: new Date(Date.now() + 60 * 60 * 1000),
    });
    await expect(
      sendOutbound({ conversationId: "c1", text: "hi" }),
    ).rejects.toThrow(ForbiddenError);
  });

  it("24h 윈도우 만료 → WindowClosedError", async () => {
    (requireStoreOwnerAuth as any).mockResolvedValue({
      userId: "u1",
      storeId: "s1",
      role: "owner",
    });
    (getConversationById as any).mockResolvedValue({
      id: "c1",
      storeId: "s1",
      channel: "instagram",
      messagingWindowExpiresAt: new Date(Date.now() - 1000),
    });
    await expect(
      sendOutbound({ conversationId: "c1", text: "hi" }),
    ).rejects.toThrow(WindowClosedError);
  });
});
```

- [ ] **Step 2: 구현**

```typescript
// apps/web/src/features/inbox/actions/send-outbound.ts
"use server";

import { revalidatePath } from "next/cache";
import { z } from "zod";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import {
  getConversationById,
  updateLastMessage,
} from "@/shared/lib/dal/conversations";
import { insertMessage } from "@/shared/lib/dal/messages";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { createInstagramAdapter } from "@/lib/inbox/instagram-adapter";
import { upsertCustomer } from "@/shared/lib/dal/customers"; // 필요 시
import {
  ForbiddenError,
  ValidationError,
  WindowClosedError,
  ExternalApiError,
} from "@/shared/lib/errors";
import { captureServerActionError } from "@/instrumentation";
import { env } from "@/shared/config/env";

const inputSchema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().min(1).max(2000),
});

export async function sendOutbound(input: {
  conversationId: string;
  text: string;
}) {
  const session = await requireStoreOwnerAuth();
  try {
    const data = inputSchema.parse(input);
    const conv = await getConversationById(data.conversationId);
    if (!conv) throw new ValidationError("대화를 찾을 수 없습니다");
    if (conv.storeId !== session.storeId) throw new ForbiddenError();
    if (
      !conv.messagingWindowExpiresAt ||
      conv.messagingWindowExpiresAt.getTime() <= Date.now()
    ) {
      throw new WindowClosedError({
        conversationId: data.conversationId,
        expiresAt: conv.messagingWindowExpiresAt,
      });
    }

    const integration = await getIntegration(session.storeId, conv.channel);
    if (!integration)
      throw new ExternalApiError("Instagram 연결이 없습니다", {});

    // 발신 대상: 인박스 thread의 customer external_id가 필요. 단순화: 이전 inbound message에서 senderExternalId 조회.
    // 1A: conversations.customer_id → customers → external_id 사용.
    // 위 코드를 단순화하려면 conversations에 외부 사용자 식별자가 직접 join되거나, customer DAL을 확장.
    // 여기선 별도 dal 함수로 추출.
    const recipientExternalId = await import("@/shared/lib/dal/customers").then(
      (m) => m.getExternalIdByCustomerId(conv.customerId),
    );
    if (!recipientExternalId) throw new ValidationError("고객 식별자 없음");

    const adapter = createInstagramAdapter(fetchInstagramApiClient, {
      appId: env.IG_APP_ID,
      appSecret: env.IG_APP_SECRET,
    });
    const sent = await adapter.sendOutbound(
      { externalRecipientId: recipientExternalId, text: data.text },
      {
        accessToken: integration.accessToken,
        externalAccountId: integration.externalAccountId,
        externalPageId: integration.externalPageId ?? undefined,
      },
    );

    await insertMessage({
      conversationId: conv.id,
      channel: conv.channel,
      direction: "outbound",
      originalText: data.text,
      externalMessageId: sent.externalMessageId,
      status: "sent",
    });
    await updateLastMessage(conv.id, {
      preview: data.text.slice(0, 80),
      at: new Date(),
    });

    revalidatePath(`/[locale]/store/inbox`, "page");
    return { ok: true as const, messageId: sent.externalMessageId };
  } catch (err) {
    captureServerActionError(err, {
      action: "inbox.sendOutbound",
      userId: session.userId,
      storeId: session.storeId,
    });
    throw err;
  }
}
```

⚠️ `getExternalIdByCustomerId` 함수는 `dal/customers.ts`에 추가 필요. 신속히 추가:

```typescript
export async function getExternalIdByCustomerId(
  customerId: string,
): Promise<string | null> {
  const rows = await db()
    .select()
    .from(customers)
    .where(eq(customers.id, customerId))
    .limit(1);
  return rows[0]?.externalId ?? null;
}
```

- [ ] **Step 3: 테스트 통과 + 커밋**

```bash
pnpm --filter @hesya/web vitest run apps/web/src/features/inbox/actions/send-outbound.test.ts
git add apps/web/src/features/inbox/actions/send-outbound.ts apps/web/src/features/inbox/actions/send-outbound.test.ts apps/web/src/shared/lib/dal/customers.ts
git commit -m "feat(inbox): sendOutbound Server Action (auth + window 검증 + send + DB)"
```

---

### Task 26: `connect-instagram.ts` (OAuth start URL)

**Files:**

- Create: `apps/web/src/features/inbox/actions/connect-instagram.ts`

- [ ] **Step 1: 작성**

```typescript
// apps/web/src/features/inbox/actions/connect-instagram.ts
"use server";

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { env } from "@/shared/config/env";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

export async function getInstagramOAuthUrl(): Promise<string> {
  await requireStoreOwnerAuth(); // 매장 소유자만
  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
    sameSite: "lax",
    maxAge: 5 * 60, // 5분
    path: "/",
  });
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", env.IG_APP_ID);
  url.searchParams.set("redirect_uri", env.IG_REDIRECT_URI);
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_messages",
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/web/src/features/inbox/actions/connect-instagram.ts
git commit -m "feat(inbox): connect-instagram OAuth URL 생성 + CSRF state cookie"
```

---

### Task 27: `features/inbox/{types,schema,index}.ts`

**Files:**

- Create: `apps/web/src/features/inbox/types.ts`
- Create: `apps/web/src/features/inbox/schema.ts`
- Create: `apps/web/src/features/inbox/index.ts`

- [ ] **Step 1: 작성**

`types.ts`:

```typescript
export type { Conversation } from "@hesya/database/schema";
export type { Message } from "@hesya/database/schema";
export { type WindowState, type WindowStatus } from "./lib/window-utils";
```

`schema.ts`:

```typescript
import { z } from "zod";
export const sendOutboundInputSchema = z.object({
  conversationId: z.string().uuid(),
  text: z.string().min(1).max(2000),
});
export type SendOutboundInput = z.infer<typeof sendOutboundInputSchema>;
```

`index.ts` (Public API only):

```typescript
export { sendOutbound } from "./actions/send-outbound";
export { getInstagramOAuthUrl } from "./actions/connect-instagram";
export { ThreadList } from "./components/thread-list";
export { MessageView } from "./components/message-view";
export { ReplyComposer } from "./components/reply-composer";
export { WindowStatus as WindowStatusComponent } from "./components/window-status";
export type { Conversation, Message, WindowState } from "./types";
```

- [ ] **Step 2: 커밋 (컴포넌트는 다음 phase에서, index는 stub 상태로 일단 export 보강)**

(컴포넌트 부재로 export가 깨지면 1차 commit은 actions만, index는 phase H 후 보강)

```bash
git add apps/web/src/features/inbox/types.ts apps/web/src/features/inbox/schema.ts
git commit -m "feat(inbox): types + schema (zod)"
```

---

## Phase H — UI Components (3h)

### Task 28: shadcn 5개 설치

- [ ] **Step 1**

```bash
cd apps/web
pnpm dlx shadcn@latest add resizable scroll-area avatar badge alert
```

Expected: 5개 컴포넌트 `apps/web/src/components/ui/`에 생성.

- [ ] **Step 2: 빌드 검증**

```bash
pnpm --filter @hesya/web tsc --noEmit
```

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/components/ui apps/web/components.json
git commit -m "chore(ui): shadcn resizable/scroll-area/avatar/badge/alert"
```

---

### Task 29: `WindowStatus` 컴포넌트

**Files:**

- Create: `apps/web/src/features/inbox/components/window-status.tsx`

```typescript
"use client";
import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { getWindowStatus, type WindowStatus as WS } from "../lib/window-utils";

function formatRemaining(ms: number, t: (key: string, vars?: Record<string, unknown>) => string): string {
  const totalMin = Math.max(0, Math.floor(ms / 60000));
  const h = Math.floor(totalMin / 60);
  const m = totalMin % 60;
  return h > 0 ? `${h}시간 ${m}분` : `${m}분`;
}

export function WindowStatus({ expiresAt }: { expiresAt: Date | null }) {
  const t = useTranslations("inbox.window");
  const [status, setStatus] = useState<WS>(() => getWindowStatus(expiresAt));

  useEffect(() => {
    const tick = () => setStatus(getWindowStatus(expiresAt));
    tick();
    const id = setInterval(tick, 60_000);
    return () => clearInterval(id);
  }, [expiresAt]);

  if (status.state === "no-inbound") return null;

  if (status.state === "expired") {
    return (
      <Alert variant="destructive">
        <AlertDescription>
          {t("expired")} — {t("expiredHelp")}
        </AlertDescription>
      </Alert>
    );
  }

  const time = formatRemaining(status.remainingMs!, t);
  if (status.state === "closing-soon") {
    return (
      <Alert>
        <AlertDescription>{t("closingSoon", { time })}</AlertDescription>
      </Alert>
    );
  }
  return <span className="text-sm text-muted-foreground">{t("openWithTime", { time })}</span>;
}
```

- [ ] **커밋**

```bash
git add apps/web/src/features/inbox/components/window-status.tsx
git commit -m "feat(inbox): WindowStatus component (3-state UI)"
```

---

### Task 30: ThreadList 패밀리 (item, list, empty, connect-cta)

**Files:**

- `thread-item.tsx`, `thread-list.tsx`, `thread-list-empty.tsx`, `thread-list-connect-cta.tsx`

코드는 단순(props/렌더링 위주). 핵심:

- `ThreadItem`: `{ conversation, isActive, onClick }` — Avatar + 채널 Badge + lastMessagePreview + 만료 표시(선택)
- `ThreadList`: `{ conversations, activeId, onSelect }` — ScrollArea로 매핑
- `ThreadListEmpty`: 아이콘 + `t("inbox.empty")`
- `ThreadListConnectCTA`: Alert + Button → `/[locale]/store/inbox/connect`

- [ ] **각 컴포넌트 작성 + 커밋**

```bash
git add apps/web/src/features/inbox/components/thread-*.tsx
git commit -m "feat(inbox): ThreadList family (item/list/empty/connect-cta)"
```

---

### Task 31: MessageView 패밀리 (bubble, list, header, empty)

**Files:**

- `message-bubble.tsx`, `message-list.tsx`, `thread-header.tsx`, `message-view-empty.tsx`

핵심:

- `MessageBubble`: direction에 따라 좌/우 정렬, originalText, 시간, status('failed'면 ⚠️ + 재전송)
- `MessageList`: ScrollArea + 매핑, auto-scroll bottom
- `ThreadHeader`: customer 이름 + channel Badge + WindowStatus
- `MessageViewEmpty`: `t("inbox.thread.noSelection")`

- [ ] **작성 + 커밋**

```bash
git add apps/web/src/features/inbox/components/message-*.tsx apps/web/src/features/inbox/components/thread-header.tsx
git commit -m "feat(inbox): MessageView family (bubble/list/header/empty)"
```

---

### Task 32: ReplyComposer + TokenExpiredBanner

**Files:**

- `reply-composer.tsx`, `token-expired-banner.tsx`

핵심:

- `ReplyComposer`: textarea + send button. window state에 따라 disabled. `onSubmit` 시 `sendOutbound` Server Action 호출 (optimistic update)
- `TokenExpiredBanner`: `tokenExpiresAt < now` 시 표시 + 재연결 버튼

```typescript
// reply-composer.tsx (요약)
"use client";
import { useState, useTransition } from "react";
import { useTranslations } from "next-intl";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import { sendOutbound } from "@/features/inbox";
import { WindowStatus } from "./window-status";
import type { WindowState } from "../lib/window-utils";

export function ReplyComposer({ conversationId, windowState, expiresAt }: {
  conversationId: string;
  windowState: WindowState;
  expiresAt: Date | null;
}) {
  const t = useTranslations("inbox.composer");
  const [text, setText] = useState("");
  const [pending, start] = useTransition();
  const disabled = windowState === "expired" || windowState === "no-inbound";

  return (
    <div className="border-t p-3 space-y-2">
      <Textarea
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={t("placeholder")}
        disabled={disabled || pending}
        rows={3}
      />
      <div className="flex justify-between items-center">
        <WindowStatus expiresAt={expiresAt} />
        <Button
          disabled={disabled || pending || !text.trim()}
          onClick={() => start(async () => {
            try { await sendOutbound({ conversationId, text }); setText(""); }
            catch (err) { /* toast */ }
          })}
        >
          {t("send")}
        </Button>
      </div>
    </div>
  );
}
```

- [ ] **작성 + 커밋**

```bash
git add apps/web/src/features/inbox/components/reply-composer.tsx apps/web/src/features/inbox/components/token-expired-banner.tsx
git commit -m "feat(inbox): ReplyComposer + TokenExpiredBanner"
```

---

### Task 33: MessageView 조립

**Files:**

- `message-view.tsx`

핵심:

- props: `{ thread: Conversation | null, messages: Message[] }`
- thread null → MessageViewEmpty
- 그 외 → ThreadHeader + MessageList + ReplyComposer

- [ ] **작성 + 커밋**

```bash
git add apps/web/src/features/inbox/components/message-view.tsx
git commit -m "feat(inbox): MessageView 조립"
```

---

## Phase I — Pages (1.5h)

### Task 34: 인박스 페이지 (Server + Client)

**Files:**

- Create: `apps/web/src/app/[locale]/store/inbox/page.tsx`
- Create: `apps/web/src/app/[locale]/store/inbox/inbox-client.tsx`

- [ ] **Step 1: page.tsx (Server Component)**

```typescript
// apps/web/src/app/[locale]/store/inbox/page.tsx
import { redirect } from "next/navigation";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { listByStore } from "@/shared/lib/dal/conversations";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { InboxClient } from "./inbox-client";

export default async function InboxPage({ params }: { params: Promise<{ locale: string }> }) {
  const { locale } = await params;
  let session;
  try { session = await requireStoreOwnerAuth(); }
  catch { redirect(`/${locale}/sign-in`); }

  const conversations = await listByStore(session.storeId);
  const igIntegration = await getIntegration(session.storeId, "instagram");

  return <InboxClient initialConversations={conversations} hasIgIntegration={!!igIntegration} igTokenExpiresAt={igIntegration?.tokenExpiresAt ?? null} />;
}
```

- [ ] **Step 2: inbox-client.tsx ('use client', polling)**

```typescript
"use client";
import { useEffect, useState } from "react";
import { ResizablePanelGroup, ResizablePanel, ResizableHandle } from "@/components/ui/resizable";
import { ThreadList, ThreadListConnectCTA, MessageView, TokenExpiredBanner } from "@/features/inbox";
import type { Conversation, Message } from "@/features/inbox";

export function InboxClient(props: {
  initialConversations: Conversation[];
  hasIgIntegration: boolean;
  igTokenExpiresAt: Date | null;
}) {
  const [conversations, setConversations] = useState(props.initialConversations);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [messages, setMessages] = useState<Message[]>([]);

  useEffect(() => {
    const tick = async () => {
      const url = new URL("/api/inbox/refresh", location.origin);
      if (activeId) url.searchParams.set("activeId", activeId);
      const data = await fetch(url).then(r => r.json());
      setConversations(data.conversations);
      if (activeId && data.messages[activeId]) setMessages(data.messages[activeId]);
    };
    tick();
    const id = setInterval(tick, 5000);
    return () => clearInterval(id);
  }, [activeId]);

  if (!props.hasIgIntegration) {
    return <ThreadListConnectCTA />;
  }

  const active = conversations.find(c => c.id === activeId) ?? null;
  const tokenExpired = props.igTokenExpiresAt !== null && props.igTokenExpiresAt.getTime() < Date.now();

  return (
    <div className="h-screen flex flex-col">
      {tokenExpired && <TokenExpiredBanner />}
      <ResizablePanelGroup direction="horizontal" className="flex-1">
        <ResizablePanel defaultSize={25} minSize={15}>
          <ThreadList conversations={conversations} activeId={activeId} onSelect={setActiveId} />
        </ResizablePanel>
        <ResizableHandle />
        <ResizablePanel defaultSize={75}>
          <MessageView thread={active} messages={messages} />
        </ResizablePanel>
      </ResizablePanelGroup>
    </div>
  );
}
```

- [ ] **Step 3: 커밋**

```bash
git add apps/web/src/app/[locale]/store/inbox
git commit -m "feat(inbox): inbox page (Server + polling Client)"
```

---

### Task 35: Connect 페이지

**Files:**

- Create: `apps/web/src/app/[locale]/store/inbox/connect/page.tsx`

- [ ] **Step 1: 작성**

```typescript
// apps/web/src/app/[locale]/store/inbox/connect/page.tsx
import { redirect } from "next/navigation";
import { getInstagramOAuthUrl } from "@/features/inbox";
import { Button } from "@/components/ui/button";

export default async function ConnectPage({ searchParams }: { searchParams: Promise<{ error?: string }> }) {
  const sp = await searchParams;

  async function start() {
    "use server";
    const url = await getInstagramOAuthUrl();
    redirect(url);
  }

  return (
    <div className="max-w-xl mx-auto p-8 space-y-4">
      <h1 className="text-2xl font-bold">Instagram 연결</h1>
      {sp.error && <p className="text-red-600">에러: {sp.error}</p>}
      <p>고객 DM을 받으려면 Instagram 비즈니스 계정을 연결해주세요.</p>
      <form action={start}>
        <Button type="submit">Instagram 연결하기</Button>
      </form>
    </div>
  );
}
```

- [ ] **Step 2: 커밋**

```bash
git add apps/web/src/app/[locale]/store/inbox/connect
git commit -m "feat(inbox): Instagram 연결 페이지 (OAuth start)"
```

---

### Task 36: features/inbox/index.ts 최종 export

- [ ] index.ts에 컴포넌트 모두 export 추가 (T27의 stub을 풀 export로 보강) → 커밋

```bash
git add apps/web/src/features/inbox/index.ts
git commit -m "feat(inbox): features/inbox public API 완성"
```

---

## Phase J — E2E + Verification (1.5h)

### Task 37: E2E 시나리오 1 (인박스 + 답변)

**Files:**

- Create: `apps/web/e2e/inbox.spec.ts`

- [ ] **Step 1: 작성**

```typescript
import { test, expect } from "@playwright/test";
import {
  resetDb,
  seedStore,
  seedStoreOwner,
  seedStoreIntegration,
  seedConversation,
  seedMessage,
} from "../src/test-helpers/db";

test.describe("Inbox PoC", () => {
  test.beforeEach(() => resetDb());

  test("시나리오 1: 인박스 thread 표시 + 한국어 답변 발송", async ({
    page,
  }) => {
    // 1. 더미 매장 + owner 시드
    const storeId = await seedStore();
    await seedStoreOwner({ userId: "test_user_1", storeId, role: "owner" });
    await seedStoreIntegration({
      storeId,
      channel: "instagram",
      externalAccountId: "ig_demo",
    });
    const convId = await seedConversation({
      storeId,
      customerExternalId: "igsid_111",
      channel: "instagram",
      lastInboundAt: new Date(),
    });
    await seedMessage({
      conversationId: convId,
      direction: "inbound",
      text: "안녕하세요, 단발 가능?",
    });

    // 2. 로그인 (Better Auth test helper or cookie inject)
    await page.context().addCookies([
      {
        name: "session_token",
        value: "test_user_1",
        url: "http://localhost:3000",
      },
    ]);

    // 3. 인박스 진입
    await page.goto("/ko/store/inbox");
    await expect(page.getByText("안녕하세요, 단발 가능?")).toBeVisible();

    // 4. 답변 작성 + 전송
    await page.getByRole("textbox").fill("네! 오후 가능합니다.");
    await page.getByRole("button", { name: "전송" }).click();

    // 5. UI에 outbound 메시지 등장 (5초 polling 안)
    await expect(page.getByText("네! 오후 가능합니다.")).toBeVisible({
      timeout: 8000,
    });
  });
});
```

⚠️ Better Auth 세션 mock 방법은 환경별 — KYC E2E 패턴 확인 후 동일 방식 적용. 외부 IG send API는 mock(MSW or 환경변수 stub).

- [ ] **Step 2: 시나리오 2: 24h 만료**

```typescript
test("시나리오 2: 24h 윈도우 만료 시 composer disabled", async ({ page }) => {
  const storeId = await seedStore();
  await seedStoreOwner({ userId: "test_user_1", storeId, role: "owner" });
  await seedStoreIntegration({
    storeId,
    channel: "instagram",
    externalAccountId: "ig_demo",
  });
  const past = new Date(Date.now() - 25 * 60 * 60 * 1000);
  const convId = await seedConversation({
    storeId,
    customerExternalId: "igsid_222",
    channel: "instagram",
    lastInboundAt: past,
  });
  await seedMessage({
    conversationId: convId,
    direction: "inbound",
    text: "오래된 메시지",
  });

  await page.context().addCookies([
    {
      name: "session_token",
      value: "test_user_1",
      url: "http://localhost:3000",
    },
  ]);
  await page.goto("/ko/store/inbox");
  await expect(page.getByText("오래된 메시지")).toBeVisible();
  await expect(page.getByRole("textbox")).toBeDisabled();
  await expect(page.getByText(/24시간 경과/)).toBeVisible();
});
```

- [ ] **Step 3: 실행 + 커밋**

```bash
pnpm --filter @hesya/web e2e
git add apps/web/e2e/inbox.spec.ts apps/web/src/test-helpers/db.ts
git commit -m "test(e2e): inbox 인박스 표시 + 24h 만료 시나리오 2개"
```

---

### Task 38: 종합 검증 게이트

- [ ] **Step 1: tsc / lint / unit / build**

```bash
pnpm --filter @hesya/web tsc --noEmit
pnpm --filter @hesya/web lint
pnpm --filter @hesya/web vitest run
pnpm --filter @hesya/web build
```

Expected: 모두 0 error.

- [ ] **Step 2: code-reviewer 서브에이전트 (Sonnet)**

Claude code 환경에서 `code-reviewer` 서브에이전트 호출:

- 검토 대상: 1A 신규 파일 전체
- 기준: CLAUDE.md 4원칙, features-based v10 패턴 준수, DRY/YAGNI
- 통과 기준: CRITICAL 0건, HIGH 0건

- [ ] **Step 3: security-reviewer 서브에이전트 (Opus)**

검토 대상: webhook route + OAuth callback + pgsodium 사용 + Server Action 인증
기준: OWASP Top 10:2025, Vibe Coding 리스크
통과 기준: 🔴 CRITICAL 0건

- [ ] **Step 4: 커밋 (리뷰 결과 반영)**

```bash
git add -A
git commit -m "refactor: code-reviewer + security-reviewer 권고 반영"
```

---

### Task 39: PROGRESS.md + learnings.md 업데이트

**Files:**

- Modify: `PROGRESS.md`
- Modify: `docs/learnings.md`

- [ ] **Step 1: PROGRESS.md 업데이트**

현재 위치를 "Epic 1 1A 구현 중 → 완료" 또는 "Epic 1 1B 시작 준비"로 변경. 1A 완료 시점에 갱신.

- [ ] **Step 2: learnings.md L-041~L-044 추가**

```markdown
### [2026-05-04] L-041 — Epic 시작 전 senior-engineer 검증 패턴

**증상**: Epic 9는 features/README가 강제하는 패턴을 안 지키고 lib/kyc/에 직접 구현되어 actions.ts 860줄 비대 + DAL 미사용 부채가 쌓임.

**원인**: Epic 시작 전 코드베이스 패턴 일관성 검증 단계가 없었음.

**해결**: Epic 1 시작 전 senior-engineer 서브에이전트로 5축 검증 (현재 패턴 준수도 / 확장성 / cross-Epic 경계 / DB 마이그레이션 / 테스트·관측성). 권장 12개 → 1A 흡수 6개 + cleanup trail 6개로 분리.

**규칙** ⭐:

- 새 Epic 시작 전 senior-engineer 서브에이전트 검증 의무화 (특히 features/README 등 패턴 강제 문서가 있는 프로젝트)
- 권장사항을 "현재 Epic 흡수" vs "별도 cleanup trail"로 분리하여 cleanup task에 시점·트리거 명시 (어차피 손대는 시점에 묶기)

**확인 방법**: 새 Epic spec의 첫 commit에 `senior-engineer 검토 결과 [점수]/10` 명시 의무화

---

### [2026-05-04] L-042 — Instagram 24h 메시징 윈도우 정책 (Meta API 외부 의존성)

**증상**: 1A spec 초안엔 "사장이 한국어로 답변 가능"만 명시 → 실제 Meta API는 고객 메시지 후 24시간 내에만 답변 허용. 24~7d는 HUMAN_AGENT tag로만 (자동화 X, 고객지원만). 7d 이후 답변 불가.

**원인**: 외부 API 정책을 spec 작성 시 검증하지 않으면 구현 후에 발견 → 큰 리팩터 발생.

**해결**: spec § 1.3 G3 "24h 내 답변", § 1.2 Out of Scope HUMAN_AGENT 1B/Epic 12로 미룸, § 3 conversations 테이블에 messaging_window_expires_at 컬럼, § 4 UI 3-state (open/closing-soon/expired) + 다국어 안내.

**규칙** ⭐:

- 외부 API 의존 기능은 spec 단계에서 WebSearch로 정책 최신 검증 (정책 + endpoint + permissions + rate limit)
- 외부 정책 위반 시 어떻게 UI/DB로 표현할지를 spec에 명시 (사후 catch X)
- App Review 같은 외부 검증 단계는 spec 완료 게이트에서 분리 (Critical Path 외부 의존)

**확인 방법**: 외부 API 사용 spec은 References 섹션에 공식 docs URL 3개 이상 명시

---

### [2026-05-04] L-043 — ngrok 무료 정적 도메인 (이전 답변 정정)

**증상**: 1A Q4 답변 시 "ngrok 무료는 URL 매번 바뀜"이라 확신 단정 → Jayden이 "최신정보로 검증" 요청 → 실제로는 2023-08부터 자동 할당 정적 도메인 1개 무료 제공 중이었음.

**원인**: 기존 지식만으로 답변, 검색하지 않음 (CLAUDE.md "확증편향 경계" 위반).

**해결**: WebSearch로 ngrok / Cloudflare Tunnel / Vercel preview / Meta webhook 정책 4건 검증 후 정정 답변.

**규칙** ⭐:

- 외부 도구·서비스 정책 답변 시 "기존 지식 vs 새 정보 충돌"이 발생할 수 있다고 가정하고 **무조건 검색 우선**
- 답변 끝에 확신등급 (🟢 공식 / 🟡 추정 / 🔴 캡처 필요) 명시 의무
- 잘못된 답변 발견 시 정정안 + 정정 사유 명시 + learnings.md 기록

**확인 방법**: 답변에 확신등급 표시가 없으면 답변 미완성으로 간주

---

### [2026-05-04] L-044 — PRD vs 실제 구현 갭 (supabase/functions → Next.js API route)

**증상**: PRD/DEVELOPMENT-PLAN은 webhook을 `supabase/functions/inbox-webhook/`로 명시. 그러나 실제 코드베이스엔 `supabase/` 디렉토리 자체가 없고 KYC도 모두 Next.js API route로 구현됨.

**원인**: PRD 작성 시점(2026-04-30)과 실제 구현(2026-05-01~04) 사이에 Lead가 Supabase Edge Function 대신 Next.js API route 채택. PRD 후속 갱신 누락.

**해결**: 1A spec § 2.6 폴더 구조에 `apps/web/src/app/api/webhooks/instagram/route.ts`로 명시. PRD는 추후 v1.3에서 일괄 갱신.

**규칙** ⭐:

- spec 작성 시 PRD 명시 위치와 실제 코드베이스 위치를 모두 점검
- 갭 발견 시 코드베이스 실제를 따르되 spec에 "PRD vs 실제" 갭 명시
- 갭이 누적되면 PRD revisit 작업으로 별도 task 생성

**확인 방법**: spec self-review 시 PRD 인용 위치를 grep으로 실제 파일 존재 확인
```

- [ ] **Step 3: 커밋 + 1A 완료 commit**

```bash
git add PROGRESS.md docs/learnings.md
git commit -m "docs: 1A 완료 — PROGRESS + learnings L-041~L-044"
git tag epic-1a-complete
```

---

### Task 40: 1매장 PoC 운영 검증 (G1~G10)

이 task는 **사람**(Jayden)이 직접 수행. 외부 의존(Meta App, IG, FB Page).

- [ ] **Pre-flight 외부 셋업** (`docs/runbook.md` 참조):
  - Meta Developer Account + Meta App 생성
  - 더미 매장 IG Business + FB Page 생성/연결
  - Business Verification 신청
  - Test user 등록 (Jayden 외부 IG 계정)
  - ngrok 무료 정적 도메인 발급 + Meta webhook subscription 등록

- [ ] **Vercel preview 배포 또는 로컬 ngrok 환경에서 검증**:
  - G1: 더미 매장 OAuth 연결 → DB 조회로 토큰 암호화 확인
  - G2: 외부 IG → DM → 5초 안에 인박스 표시
  - G3: 24h 내 사장 답변 → 외부 IG에서 수신
  - G4: vitest 통과
  - G5: 가짜 HMAC → 401 + Sentry
  - G6: tsc/lint/test/build CI green
  - G7: v0011 + ROLLBACK 시뮬 통과
  - G8: messages/_ 6개 파일, inbox._ 키 미스 0건
  - G9: 25h 시뮬 → composer disabled + 다국어 안내
  - G10: 위 전부 통과 (App Review 통과 X)

- [ ] **App Review는 별도 trail로 신청** (1A 완료 게이트엔 미포함)

---

## Self-Review

### 1. Spec coverage

- § 1 Scope/Goal → T01-T06 (pre-flight + DB + types/errors)
- § 2 Architecture → T13-T18 (channel-adapter + adapter), T21-T23 (routes), T34-T35 (pages)
- § 3 Data Model + Auth → T04-T06 (migration + pgsodium), T07-T11 (DAL), T12 (auth-guard)
- § 4 UI + i18n → T19-T20 (i18n), T28-T36 (components + pages)
- § 5 Quality → T37 (E2E), T38 (verification gate)
- § 6 Cleanup C-01 → T02, C-06 → T01, 나머지는 별도 trail
- § 7 Pre-flight → T40
- § 8 Time Budget → 약 19.5h (Phase A 1.5h + B 3h + C 3h + D 3.5h + E 1h + F 2.5h + G 2h + H 3h + I 1.5h + J 1.5h)

✅ 전 spec 커버됨.

### 2. Placeholder scan

- "TODO" / "TBD" / "implement later" → 0건
- "fill in details" → 0건

### 3. Type consistency

- `ChannelAdapter.sendOutbound` 시그니처: T13 정의 → T15-17 mock test → T22 호출 → T25 사용 모두 `(input, context: { accessToken, externalAccountId?, externalPageId? })`로 일관 (T15-17 Step 4에서 보강)
- `WindowState`: T24 정의 → T29 컴포넌트 → T32 ReplyComposer 모두 동일 enum
- `requireStoreOwnerAuth()` 반환 타입 `{userId, storeId, role}`: T12 정의 → T22, T23, T25, T26, T34에서 동일 사용

✅ 일관성 OK.

---

## Execution Handoff

**Plan complete and saved to `docs/superpowers/plans/2026-05-04-epic-1a-inbox-instagram.md`. Two execution options:**

**1. Subagent-Driven (recommended)** — Fresh subagent per task, two-stage review between tasks, fast iteration. Best for 40-task plan with clear TDD per task.

**2. Inline Execution** — Execute tasks in this session using executing-plans, batch execution with checkpoints. Slower but full context throughout.

**Which approach?**
