-- 0011_inbox_conversations.sql
-- Epic 1 1A: conversations 신규 + messages 확장 + customers 인덱스 + store_integrations(pgsodium)
--
-- ROLLBACK:
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
