# Epic 1 1A — 인박스 인프라 + Instagram PoC (Design Spec)

| 항목      | 값                                                                                             |
| --------- | ---------------------------------------------------------------------------------------------- |
| 작성일    | 2026-05-04                                                                                     |
| 작성자    | Jayden + Claude (brainstorming 세션)                                                           |
| 상태      | Draft (Jayden 검토 대기)                                                                       |
| Epic      | Epic 1 통합 다국어 인박스 (PRD § 모듈 1, P0 MVP)                                               |
| 분해 단계 | **1A** (인프라 + Instagram PoC) → 1B (4채널 확장) → 1C (AI 응답+RAG+번역) → 1D (Vision + 검증) |
| 보안 등급 | 🟡 YELLOW (webhook + OAuth 토큰 = 부분 보안)                                                   |
| 예상 시간 | ~19.5h (메인 14h + Pre-flight 외부 셋업 4h + C-01/C-06 1.5h)                                   |
| 외부 의존 | Meta App Review (1A 완료 게이트에서 분리)                                                      |

---

## 0. Overview

### 0.1 한 줄 정의

> **Hesya 매장 사장이 본인 IG 비즈니스 계정의 DM을 hesya 인박스에서 받고, 고객 메시지 후 24시간 내에 한국어로 답변할 수 있다.**

### 0.2 배경

- Epic 9 매장 KYC 자동 검증 12/12 완료. KYC 통과한 매장 사장이 hesya 가입 후 처음 만나는 핵심 화면.
- 외국인 고객(외국 IG 계정)이 한국 미용실 인스타에 DM을 보내는 시나리오를 hesya 인박스로 통합.
- Epic 1 전체(56h, 11 Tasks)를 4단계로 분해 — **1A는 인프라 + Instagram 1채널 PoC만**.

### 0.3 1A 스코프 한눈에

```
[외부 IG 사용자] ──DM──> Meta IG Graph API ──webhook──> hesya
                                                          │
                                                          ▼
                                                  [매장 사장] 한국어 답변
                                                          │
                                                          ▼
                                  Meta IG Send API ──> [외부 IG 사용자]

  ✅ 1A 포함: webhook 수신, OAuth 연결, 인박스 UI, 한국어 수동 발신, 24h 윈도우 처리
  ❌ 1A 미포함: 자동 번역(1C), AI 자동 응답(1C), 사진 처리(1D), 4채널 추가(1B)
```

---

## 1. Scope & Goal

### 1.1 In Scope

1. **Instagram Business Login (OAuth)** — 매장 사장이 hesya에서 본인 IG Business 연결 (FB Page 연결 필수)
2. **Webhook 수신** — `/api/webhooks/instagram` (HMAC verify, hub.challenge echo)
3. **DB 저장** — conversations + messages + store_integrations (마이그레이션 v0011)
4. **인박스 UI (1매장)** — `/[locale]/store/inbox` thread 리스트 + 메시지 view
5. **수동 발신** — 사장이 한국어로 작성 → IG Send API로 발송
6. **24h 메시징 윈도우 처리** — DB 컬럼 + UI 3-state (open/closing-soon/expired) + 다국어 안내
7. **인프라 추상화** — `ChannelAdapter` 인터페이스 + `InstagramAdapter` 1A 유일 구현
8. **`requireStoreOwnerAuth()` 신규** — Better Auth 기반, KYC `requireAdminEmail()`과 분리
9. **next-intl 6개 언어 파일** — 한국어/영어 100% 번역, 나머지 placeholder
10. **Pre-flight cleanup**: C-01 (Server Action Sentry 핸들러), C-06 (마이그레이션 롤백 SQL 정책)

### 1.2 Out of Scope (명시 미룸)

| 기능                                 | 미루는 곳       | 이유                                    |
| ------------------------------------ | --------------- | --------------------------------------- |
| WhatsApp/카카오/LINE/Messenger 4채널 | 1B              | 1A에서 ChannelAdapter 인터페이스만 추출 |
| 자동 번역 (한 ↔ 외국어)              | 1C              | Sonnet 4.6 RAG 묶음                     |
| AI 자동 응답                         | 1C              | hook point만 1A에 마련                  |
| 사진/미디어 표시 (R2 백업)           | 1D              | 5채널 공통 처리로 묶기                  |
| Vision 시술 가능 여부                | 1D              | E1-10                                   |
| 베타 50건 정확도 검증                | 1D              | E1-11                                   |
| HUMAN_AGENT 7일 윈도우               | 1B 또는 Epic 12 | Meta 정책 위반 리스크                   |
| Comment-to-DM 자동화                 | 1A 외           | 1A는 DM만                               |
| Meta App Review 통과 자체            | 별도 trail      | 외부 의존 — 1A 완료 게이트 분리         |
| 다매장 RLS 검증                      | 1B 검증 후      | 1A는 더미 매장 1곳                      |
| 모바일 반응형 본격                   | 1B              | 1A는 데스크톱 우선                      |
| Better Auth ↔ Supabase JWT 브리지    | 별도 trail      | 1A는 application-level 인증 강제        |

### 1.3 Success Criteria (검증 가능)

- **G1**: 더미 매장 IG Business + FB Page → hesya OAuth 연결 후 pgsodium 암호화 토큰이 `store_integrations`에 저장
- **G2**: 외부 IG 계정 → 더미 매장 DM → 5초 안에 hesya 인박스에 표시
- **G3**: 외부 IG가 DM 보낸 후 24시간 내 사장이 답변 → 외부 IG에서 메시지 수신 확인
- **G4**: ChannelAdapter 인터페이스 단위 테스트 통과 (mock fetch)
- **G5**: HMAC 검증 실패 시 401 + Sentry 캡처
- **G6**: `tsc → lint → test → build` 모두 통과
- **G7**: 마이그레이션 v0011 + 롤백 SQL + RLS 정책 (admin/store-owner) 작성·검증
- **G8**: `apps/web/messages/{ko,en,ja,zh-CN,zh-TW,vi}.json` 6개 언어 + `inbox.*` 키 미스 0건
- **G9**: 24h 윈도우 만료 시 발신 UI disabled + 다국어 안내 메시지 표시
- **G10**: Development mode + 1매장 더미 + 1 test user에서 G1~G9 모두 통과 (App Review 통과 X)

### 1.4 만들지 않을 것 (4원칙 2번 — Simplicity First)

- 다매장 RLS 검증 (1B 검증 후)
- AI/번역/RAG (1C)
- 큐 기반 처리 (1A는 fire-and-forget hook point만)
- 미디어 다운로드/저장 (1D)
- 다른 채널 adapter 구현 (인터페이스만)
- HUMAN_AGENT tag 처리 (1B 또는 Epic 12)
- 토큰 자동 갱신 cron (1B)

---

## 2. Architecture

### 2.1 큰 그림 (High-Level Flow)

```
┌─────────────┐         ┌────────────────────────────────────────┐
│ 외부 IG 사용자 │  DM 보냄 │      Meta Instagram Graph API           │
│ (외국 고객)    │ ──────> │      (24h messaging window)            │
└─────────────┘         └────────────────────────────────────────┘
                                       │
                                       │ webhook POST (HMAC 서명)
                                       ▼
                        ┌──────────────────────────────────────┐
                        │ apps/web/src/app/api/webhooks/       │
                        │   instagram/route.ts                  │
                        │ ─ HMAC verify (X-Hub-Signature-256)   │
                        │ ─ ChannelAdapter.parseInbound()       │
                        │ ─ DAL.upsertConversation()            │
                        │ ─ DAL.insertMessage()                 │
                        │ ─ processInbound(messageId) ※ hook   │
                        │ ─ 200 OK (즉시)                       │
                        └──────────────────────────────────────┘
                                       │
              [1C에서 채울 hook point]   │ DB 저장됨
                                       ▼
                        ┌──────────────────────────────────────┐
                        │       Postgres (Supabase)             │
                        │   conversations + messages + RLS      │
                        └──────────────────────────────────────┘
                                       │ polling 5초
                                       ▼
                        ┌──────────────────────────────────────┐
                        │ /[locale]/store/inbox  (사장 화면)      │
                        │ ─ ThreadList (좌)                      │
                        │ ─ MessageView (우)                     │
                        │ ─ ReplyComposer (한국어 입력)           │
                        └──────────────────────────────────────┘
                                       │ Server Action
                                       │ sendOutbound(threadId, text)
                                       ▼
                        ┌──────────────────────────────────────┐
                        │ ChannelAdapter.sendOutbound()         │
                        │ → graph.instagram.com/v24.0/.../messages │
                        │   (24h 윈도우 검증 후)                 │
                        └──────────────────────────────────────┘
```

### 2.2 ChannelAdapter 인터페이스 (1B 확장 대비)

```typescript
// apps/web/src/lib/inbox/channel-adapter.ts
export interface ChannelAdapter {
  channel: "instagram" | "whatsapp" | "kakao" | "line" | "messenger";

  // 수신: webhook payload → 표준 InboundMessage[]
  parseInbound(
    rawPayload: unknown,
    signature: string,
    secret: string,
  ): Promise<InboundMessage[]>;

  // 발신: 표준 OutboundInput → 채널별 API 호출
  sendOutbound(
    input: OutboundInput,
    accessToken: string,
  ): Promise<{ externalMessageId: string }>;

  // OAuth 콜백: code → access_token 교환
  exchangeCode(code: string): Promise<{
    accessToken: string;
    expiresAt: Date | null;
    externalAccountId: string;
    externalPageId?: string;
    externalAccountName?: string;
    scopes: string[];
  }>;
}
```

**1A 단일 구현**: `apps/web/src/lib/inbox/instagram-adapter.ts`
**1B 확장**: 같은 폴더에 4 어댑터 추가 + router 등록만으로 끝남 (재구조화 X).

### 2.3 Webhook 수신 시퀀스

1. `POST /api/webhooks/instagram` (Meta가 호출)
2. `GET /api/webhooks/instagram?hub.mode=subscribe&hub.verify_token=...` (verify 챌린지) → `hub.challenge` echo
3. POST 처리:
   1. raw body 읽기 (`req.text()`)
   2. `ChannelAdapter.parseInbound(rawBody, signature, env.IG_APP_SECRET)`
      - `X-Hub-Signature-256` HMAC 검증 (실패 시 throw → 401 + Sentry)
      - Meta payload → `InboundMessage[]` 변환
   3. for each message:
      - `DAL.upsertCustomer({channel:'instagram', externalId: senderIgsid})`
      - `DAL.upsertConversation({storeId, customerId, channel, lastInboundAt: now, messagingWindowExpiresAt: now+24h})`
      - `DAL.insertMessage({conversationId, direction:'inbound', originalText, externalMessageId})`
   4. `processInbound(messageId)` (1A 빈 함수, 1C에서 AI 채움)
   5. 200 OK

**안전장치**:

- HMAC 실패 → 즉시 401 + Sentry (스푸핑 차단)
- 200 응답은 빠르게 (Meta 20초 timeout) — AI 처리는 절대 동기 X
- `processInbound`는 `void` + try-catch 자체 처리 (webhook 응답 막지 않음)
- payload 파싱 실패 시 200 OK + Sentry (Meta 무한 재시도 차단)

### 2.4 Webhook 발신 시퀀스

1. 사장이 ReplyComposer에 한국어 입력 + 전송
2. Server Action `sendOutbound({conversationId, text})`:
   1. `requireStoreOwnerAuth()` (Better Auth 기반)
   2. `DAL.getConversation(conversationId)` — 매장 소유 검증 + 윈도우 체크
   3. 24h 윈도우 만료 확인 (`messaging_window_expires_at < now` → throw `WindowClosedError`)
   4. `ChannelAdapter.sendOutbound({externalThreadId, text}, accessToken)`
   5. `DAL.insertMessage({direction:'outbound', externalMessageId, status:'sent'})`
   6. `revalidatePath()` — 인박스 UI 새로고침

### 2.5 Hook Point (1C 대비)

```typescript
// apps/web/src/lib/inbox/process-inbound.ts (1A 빈 구현)
export async function processInbound(messageId: string): Promise<void> {
  // 1A: 빈 함수
  // 1C: AI 자동 응답 + 번역 + RAG (queue 또는 fire-and-forget)
}
```

**1A → 1C 전환 시**: 이 함수만 채우면 됨. Webhook route는 변경 X.

### 2.6 폴더 구조

```
apps/web/src/
├── app/
│   ├── [locale]/store/inbox/
│   │   ├── page.tsx                    # Server Component (initial fetch)
│   │   ├── inbox-client.tsx            # 'use client' (polling + UI)
│   │   └── connect/
│   │       └── page.tsx                # Instagram 연결 페이지
│   └── api/
│       ├── webhooks/instagram/
│       │   └── route.ts                # POST + GET (verify) handler
│       ├── oauth/instagram/callback/
│       │   └── route.ts                # OAuth callback handler
│       └── inbox/refresh/
│           └── route.ts                # polling endpoint
│
├── features/inbox/
│   ├── components/
│   │   ├── thread-list.tsx
│   │   ├── thread-item.tsx
│   │   ├── thread-list-empty.tsx
│   │   ├── thread-list-connect-cta.tsx
│   │   ├── message-view.tsx
│   │   ├── message-view-empty.tsx
│   │   ├── thread-header.tsx
│   │   ├── message-list.tsx
│   │   ├── message-bubble.tsx
│   │   ├── reply-composer.tsx
│   │   ├── window-status.tsx
│   │   └── token-expired-banner.tsx
│   ├── actions/
│   │   ├── send-outbound.ts            # Server Action
│   │   └── connect-instagram.ts        # OAuth code 교환 + 저장
│   ├── lib/
│   │   ├── window-utils.ts             # 24h 계산
│   │   ├── window-utils.test.ts
│   │   └── format-message.ts
│   ├── types.ts
│   ├── schema.ts                       # zod (OutboundInput, etc.)
│   └── index.ts                        # ⭐ Public API only
│
├── lib/
│   ├── inbox/
│   │   ├── channel-adapter.ts          # 인터페이스
│   │   ├── instagram-adapter.ts        # 1A 유일 구현
│   │   ├── instagram-adapter.test.ts
│   │   ├── instagram-api-client.ts     # HTTP fetch 래퍼 (mock 가능)
│   │   ├── process-inbound.ts          # 1A 빈 함수
│   │   └── process-inbound.test.ts
│   └── llm/                            # Epic 9 기존 (1D에서 재사용)
│
└── shared/
    └── lib/
        ├── auth-guard.ts               # requireStoreOwnerAuth() 1A 신규
        ├── auth-guard.test.ts
        ├── errors.ts                   # 에러 클래스 6종
        └── dal/
            ├── conversations.ts        # 1A 신규 (DAL 패턴 시범)
            ├── conversations.test.ts
            ├── messages.ts
            ├── messages.test.ts
            ├── customers.ts
            ├── customers.test.ts
            ├── store-integrations.ts
            └── store-owners.ts
```

### 2.7 의존 방향 (`features/README` 강제)

```
app/[locale]/store/inbox/page.tsx
       ↓
features/inbox/index.ts
       ↓
features/inbox/{components, actions, lib}
       ↓
shared/lib/dal/{conversations, messages, customers, store-integrations}
       ↓
lib/inbox/{channel-adapter, instagram-adapter, process-inbound}
       ↓
외부 (Meta API, Drizzle, Supabase)
```

**금지**: `features/inbox/*` → 다른 features (Epic 3 booking 등) 직접 import
**허용**: `app/api/webhooks/instagram/route.ts` → features import (라우트는 features 사용 가능)

---

## 3. Data Model + Auth

### 3.1 Migration v0011

#### A. `conversations` 신규 테이블

```sql
CREATE TABLE conversations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  store_id UUID NOT NULL REFERENCES stores(id) ON DELETE CASCADE,
  customer_id UUID NOT NULL REFERENCES customers(id) ON DELETE RESTRICT,
  channel TEXT NOT NULL CHECK (channel IN ('instagram','whatsapp','kakao','line','messenger')),
  external_thread_id TEXT,
  status TEXT NOT NULL DEFAULT 'open' CHECK (status IN ('open','closed','snoozed')),

  -- 24시간 메시징 윈도우 (Meta 정책)
  last_inbound_at TIMESTAMPTZ,
  messaging_window_expires_at TIMESTAMPTZ,

  -- 인박스 UI 메타
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
```

#### B. `messages` 컬럼 추가 (NULL 허용 — C-02에서 NOT NULL 전환)

```sql
ALTER TABLE messages
  ADD COLUMN conversation_id UUID REFERENCES conversations(id) ON DELETE CASCADE,
  ADD COLUMN external_message_id TEXT,
  ADD COLUMN status TEXT;

CREATE INDEX idx_messages_conv_created
  ON messages(conversation_id, created_at DESC);
CREATE UNIQUE INDEX idx_messages_external_unique
  ON messages(channel, external_message_id)
  WHERE external_message_id IS NOT NULL;
```

#### C. `customers` 유일성 보강

```sql
CREATE UNIQUE INDEX IF NOT EXISTS idx_customers_channel_external
  ON customers(channel, external_id)
  WHERE external_id IS NOT NULL;
```

#### D. `store_integrations` 신규 (pgsodium 암호화)

```sql
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
```

#### E. RLS 정책 (admin + store-owner 이중)

```sql
ALTER TABLE conversations ENABLE ROW LEVEL SECURITY;
ALTER TABLE store_integrations ENABLE ROW LEVEL SECURITY;

CREATE POLICY conversations_store_owner ON conversations
  FOR ALL USING (
    store_id IN (SELECT store_id FROM store_owners WHERE user_id = auth.uid())
  );

CREATE POLICY conversations_admin ON conversations
  FOR ALL USING (
    EXISTS (SELECT 1 FROM admins WHERE user_id = auth.uid())
  );

-- messages, store_integrations 동일 패턴
```

⚠️ **현실 주의**: Better Auth ↔ Supabase JWT 브리지 미구현 상태. 1A는 service_role + 애플리케이션 레벨 `requireStoreOwnerAuth()`가 실질 보안. RLS 정책은 미래 대비 작성·테스트만.

#### F. 롤백 SQL (C-06 정책 시범)

```sql
-- migrations/0011_inbox_conversations.sql 상단 주석:
-- ROLLBACK:
--   DROP TABLE store_integrations;
--   ALTER TABLE messages DROP COLUMN status, DROP COLUMN external_message_id, DROP COLUMN conversation_id;
--   DROP TABLE conversations;
--   DROP INDEX IF EXISTS idx_customers_channel_external;
```

`docs/runbook.md`에 정책 명시: **v0011부터 모든 마이그레이션은 `-- ROLLBACK:` 주석 강제. Epic 9 소급 X**.

### 3.2 Instagram Business Login OAuth 흐름

1. 매장 사장이 `/[locale]/store/inbox/connect`에서 "Instagram 연결" 클릭
2. Browser → `https://www.instagram.com/oauth/authorize?...`
   - `client_id={IG_APP_ID}`
   - `redirect_uri={IG_REDIRECT_URI}`
   - `scope=instagram_business_basic,instagram_business_manage_messages`
   - `response_type=code`
   - `state={csrf_token}`
3. 사용자 IG 로그인 + 권한 승인
4. Meta callback → `/api/oauth/instagram/callback?code=...&state=...`
5. Route Handler:
   1. CSRF state 검증 (server-side 5분 만료 토큰 비교)
   2. `code → short-lived token` (`POST graph.instagram.com/oauth/access_token`)
   3. `short → long-lived` (60일, `GET graph.instagram.com/access_token?grant_type=ig_exchange_token`)
   4. `/me` 조회 → `instagram_business_account.id`, `page_id`, `username`
   5. pgsodium 암호화 → `store_integrations` INSERT
   6. `POST .../subscribed_apps?subscribed_fields=messages,messaging_postbacks` (webhook 등록)
6. → `/[locale]/store/inbox` 리다이렉트

### 3.3 토큰 갱신

- IG long-lived = 60일 유효
- 1A: cron 추가 X (PoC 단기간) — 만료 시 사장이 수동 재연결
- UI에 "Instagram 재연결 필요" 배너 (G+H 미만 시)
- 1B에서 `/api/cron/refresh-instagram-tokens` 추가

### 3.4 `requireStoreOwnerAuth()` 신규

```typescript
// apps/web/src/shared/lib/auth-guard.ts
export async function requireStoreOwnerAuth(): Promise<StoreOwnerSession> {
  const session = await auth.api.getSession({ headers: await headers() });
  if (!session?.user) throw new UnauthorizedError("로그인이 필요합니다");

  const ownership = await dal.storeOwners.findByUserId(session.user.id);
  if (!ownership) throw new ForbiddenError("매장 소유자 권한 없음");

  return {
    userId: session.user.id,
    storeId: ownership.storeId,
    role: ownership.role,
  };
}
```

KYC `requireAdminEmail()`과 분리.

⚠️ **선결 검증**: `store_owners` 테이블이 v0010 이전에 존재하는지 마이그레이션 점검 필요. 없으면 v0011에 함께 추가.

### 3.5 환경변수 (1A 신규)

```bash
# Instagram Business Login (Meta App)
IG_APP_ID=
IG_APP_SECRET=
IG_WEBHOOK_VERIFY_TOKEN=
IG_REDIRECT_URI=https://...

# pgsodium key (Supabase 자동 관리)
PGSODIUM_KEY_ID=
```

`.env.example` 업데이트 + `apps/web/src/shared/config/env.ts`에 zod 검증 추가 (KYC 패턴).

---

## 4. UI Structure + i18n

### 4.1 페이지 라우트

```
apps/web/src/app/
├── [locale]/store/inbox/
│   ├── page.tsx                 # 인박스 메인 (Server Component)
│   ├── inbox-client.tsx         # 'use client'
│   └── connect/
│       └── page.tsx             # Instagram 연결 페이지
└── api/
    ├── webhooks/instagram/
    │   └── route.ts             # POST + GET (verify)
    ├── oauth/instagram/callback/
    │   └── route.ts             # OAuth callback
    └── inbox/refresh/
        └── route.ts             # polling endpoint
```

### 4.2 인박스 레이아웃 (데스크톱)

```
┌────────────────────────────────────────────────────────────────────┐
│ Header (사장 이름, 매장명, locale switcher)                          │
├──────────────────┬─────────────────────────────────────────────────┤
│ ThreadList (320px)│ MessageView (flex-1)                            │
│                  │ ┌──────────────────────────────────────────────┐│
│ ▼ 사쿠라 [IG] 🔵 │ │ 사쿠라 (Instagram) — 24h 윈도우 (12h 30m 남음)││
│   "안녕하세요..."  │ │  외부메시지 5개 (직전 응답 시각: 2h 전)        ││
│   2시간 전        │ │ ──────────────────────────────────────────  ││
│ ▼ 리메이 [IG]    │ │ [고객] 안녕하세요, 단발 디자인 가능한가요?      ││
│   "예약 가능?"    │ │ 14:32                                         ││
│   1일 전 (만료)   │ │ [매장] 네! 오후 시간 비어있습니다.              ││
│ + 더 보기...      │ │ 16:45                                         ││
│                  │ ├──────────────────────────────────────────────┤│
│                  │ │ [한국어 입력 textarea]                  [전송] ││
│                  │ │ ⏱ 답변 가능 — 12시간 30분 남음                ││
│                  │ └──────────────────────────────────────────────┘│
└──────────────────┴─────────────────────────────────────────────────┘
```

### 4.3 shadcn/ui 컴포넌트 (1A 신규)

```bash
pnpm dlx shadcn@latest add resizable scroll-area avatar badge alert
```

| 컴포넌트              | 용도                              |
| --------------------- | --------------------------------- |
| `ResizablePanelGroup` | 좌우 분할 (사용자 폭 조절)        |
| `ScrollArea`          | thread list / message view        |
| `Avatar`              | 고객 프로필 (IG username 첫 글자) |
| `Badge`               | 채널 표시, unread count           |
| `Alert`               | 24h 만료, 토큰 만료 등 경고       |

기존 사용 가능성 높음 (확인 후 결정): `Button`, `Textarea`, `Separator`, `Sheet`.

### 4.4 컴포넌트 트리

```
<InboxPage>                                      Server Component
  └─ <InboxClient initialData={...}>              'use client'
      └─ <ResizablePanelGroup>
          ├─ <ResizablePanel> (320px)
          │   └─ <ThreadList>
          │       ├─ <ThreadListEmpty />
          │       ├─ <ThreadListConnectCTA />     ← IG 미연결 시
          │       └─ <ThreadItem * N>
          └─ <ResizablePanel>
              └─ <MessageView threadId={active}>
                  ├─ <MessageViewEmpty />
                  ├─ <ThreadHeader>              ← 고객명 + 윈도우
                  ├─ <MessageList>
                  │   └─ <MessageBubble * N>
                  └─ <ReplyComposer>
                      ├─ <Textarea />
                      ├─ <WindowStatus />
                      └─ <SendButton />          ← Server Action
```

### 4.5 상태 관리 + Polling (1A 단순화)

```typescript
// inbox-client.tsx
"use client";

useEffect(() => {
  const tick = async () => {
    const data = await fetch("/api/inbox/refresh").then((r) => r.json());
    setConversations(data.conversations);
    if (activeThreadId) setMessages(data.messages[activeThreadId] ?? []);
  };
  tick();
  const id = setInterval(tick, 5000);
  return () => clearInterval(id);
}, [activeThreadId]);
```

`/api/inbox/refresh` → `requireStoreOwnerAuth()` 통과 후 DAL 조회. < 200ms 목표.

**1A → 1C/1D 진화**: Supabase Realtime 또는 SSE로 교체.

**Optimistic update (발신)**: `tempId` 부여 후 실패 시 `status: 'failed'` 표시 + 재전송 버튼.

### 4.6 24h 윈도우 UI (3-state)

```
1. open (12h+ 남음):       "답변 가능 — XX시간 XX분 남음" (회색)
2. closing-soon (1h 미만): "곧 만료 — XX분 남음" (주황 Alert)
3. expired:               textarea disabled + Alert "고객 메시지 후 24시간 경과"
```

```typescript
// features/inbox/lib/window-utils.ts
export function getWindowStatus(expiresAt: Date | null) {
  if (!expiresAt) return { state: "no-inbound", remainingMs: null };
  const remainingMs = expiresAt.getTime() - Date.now();
  if (remainingMs <= 0) return { state: "expired", remainingMs: 0 };
  if (remainingMs < 60 * 60 * 1000)
    return { state: "closing-soon", remainingMs };
  return { state: "open", remainingMs };
}
```

UI는 1분마다 재계산 (별도 `setInterval`).

### 4.7 i18n — next-intl 6개 언어 (1A 신규)

```
apps/web/messages/
├── ko.json          (기본, 100% 번역)
├── en.json          (100% 번역)
├── ja.json          (placeholder, 1B에서 본격)
├── zh-CN.json       (placeholder)
├── zh-TW.json       (placeholder)
└── vi.json          (placeholder)
```

⚠️ 1A 인박스 UI는 **매장 사장 화면(한국어)만**. 6개 언어 파일 셋업 + 라우팅 검증은 G8.

#### `inbox.*` 키 (~15개)

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

### 4.8 빈 상태 / 에러 표시

| 상황              | UI                                                              |
| ----------------- | --------------------------------------------------------------- |
| IG 미연결         | `<ThreadListConnectCTA />` + "Instagram 연결" 버튼 → `/connect` |
| 연결됨, 메시지 0  | `<ThreadListEmpty />`                                           |
| thread 미선택     | `<MessageViewEmpty />`                                          |
| 토큰 만료         | 상단 Alert 배너 + "재연결"                                      |
| 24h 만료          | textarea disabled + 입력란 위 Alert                             |
| Send API 실패     | 메시지 옆 ⚠️ + 재전송 버튼 + Sentry                             |
| Webhook HMAC 실패 | UI 노출 X — 401 + Sentry                                        |

### 4.9 모바일 반응형 (1A 최소)

- `< 768px`: ThreadList 전체 → 클릭 시 MessageView 슬라이드 (shadcn `Sheet`)
- 1A 데스크톱 우선. 모바일 완성도는 1B.

---

## 5. Quality (Error / Testing / Acceptance)

### 5.1 Error Handling

#### 에러 클래스 (1A 신규, `apps/web/src/shared/lib/errors.ts`)

```typescript
class UnauthorizedError extends Error {} // 401
class ForbiddenError extends Error {} // 403
class ValidationError extends Error {} // 400
class WindowClosedError extends Error {} // 422
class ExternalApiError extends Error {} // 502
class WebhookSignatureError extends Error {} // 401
```

#### 레이어별 처리

| 레이어                      | 에러                      | 응답                         | Sentry     |
| --------------------------- | ------------------------- | ---------------------------- | ---------- |
| Webhook HMAC 실패           | `WebhookSignatureError`   | 401                          | ✅         |
| Webhook payload 파싱 실패   | catch → log               | **200 OK** (Meta retry 차단) | ✅         |
| Webhook DB 저장 실패        | catch → log               | 500                          | ✅         |
| Server Action auth 실패     | `UnauthorizedError`       | throw → UI 리다이렉트        | ✅         |
| Server Action 24h 만료      | `WindowClosedError`       | UI 토스트 (다국어)           | ⚠️ warning |
| Server Action Meta API 실패 | `ExternalApiError`        | UI 토스트 + 재전송           | ✅         |
| OAuth state mismatch        | 400 + redirect error page | ✅                           |
| OAuth code 교환 실패        | 500 + redirect error page | ✅                           |

#### Sentry 통합 (C-01 1A pre-flight)

```typescript
// instrumentation.ts (확장)
export function captureServerActionError(
  err: unknown,
  context: { action: string; userId?: string },
) {
  if (err instanceof ValidationError || err instanceof WindowClosedError)
    return;
  Sentry.captureException(err, {
    tags: { action: context.action },
    user: { id: context.userId },
  });
}
```

모든 Server Action은 try-catch 후 위 호출.

### 5.2 Testing Strategy (목표 80% 커버리지)

#### Unit (vitest)

| 대상                            | 핵심 검증                                                        |
| ------------------------------- | ---------------------------------------------------------------- |
| `instagram-adapter.test.ts`     | parseInbound (HMAC ✓/✗), sendOutbound (mock fetch), exchangeCode |
| `process-inbound.test.ts`       | 1A 빈 함수 — 호출 시 throw X                                     |
| `window-utils.test.ts`          | open / closing-soon (1h) / expired 경계                          |
| `dal/conversations.test.ts`     | upsert idempotency                                               |
| `dal/messages.test.ts`          | external_message_id 중복 시 conflict 무시                        |
| `auth-guard.test.ts`            | requireStoreOwnerAuth — 3 분기                                   |
| `actions/send-outbound.test.ts` | window 만료 시 throw, adapter 인자 검증                          |

**Mock 패턴 (Repository 주입 — KYC 패턴 재사용)**:

```typescript
interface InstagramApiClient {
  sendMessage(input, token): Promise<{...}>;
  exchangeToken(code): Promise<{...}>;
}
// 테스트: mock 주입 / prod: fetch-based
```

#### Integration (vitest + Supabase branch DB)

| 시나리오           | 검증                                                         |
| ------------------ | ------------------------------------------------------------ |
| Webhook end-to-end | 가짜 IG payload + HMAC → DB에 conversation+message 저장      |
| OAuth callback     | mock Meta 응답 → store_integrations 암호화 토큰 저장         |
| Send + DB          | Server Action → adapter mock → DB outbound 저장 + revalidate |

#### E2E (Playwright, `apps/web/e2e/inbox.spec.ts`)

- **시나리오 1 인박스 표시 + 한국어 답변**: 더미 매장 로그인 → IG 연결 (mock OAuth) → 가짜 inbound → thread 표시 → 한국어 입력 → 전송 → outbound 표시
- **시나리오 2 24h 윈도우 만료**: inbound 시각 25h 전 조작 → composer disabled + Alert

#### HTTP Client Mock 패턴 정립 (1A 신규)

`lib/inbox/instagram-api-client.ts`에서 패턴 정립 → C-03(1B 시작 시 KYC 소급).

### 5.3 Security Checklist (🔴 webhook + OAuth 토큰)

- [ ] HMAC `X-Hub-Signature-256` (timing-safe compare)
- [ ] OAuth CSRF state (random 32바이트, 5분 만료)
- [ ] pgsodium 토큰 암호화 (`crypto_aead_det_encrypt`)
- [ ] Rate limit:
  - Webhook 200 req/min/IP
  - Polling 30 req/min/store
  - OAuth callback 5 req/min/IP
- [ ] Audit log: 토큰 연결/해제 이벤트 (`kyc_verification_logs` 패턴)
- [ ] Sentry scrub: `access_token`, `code`, `state` 제외
- [ ] `.env.local`에 `IG_APP_SECRET` 평문 보관 + `.gitignore` 확인
- [ ] **`security-reviewer` 서브에이전트 (Opus) 통과 필수**

### 5.4 Performance Budget

| 지표                    | 목표                 |
| ----------------------- | -------------------- |
| Webhook 응답            | < 1s (Meta 20s 한도) |
| Polling endpoint        | < 200ms              |
| 인박스 LCP              | < 2.0s (글로벌 헌장) |
| Send Server Action      | < 2s                 |
| 첫 페이지 First Load JS | ≤ 250KB gzipped      |

### 5.5 Observability

#### Sentry

- `Sentry.captureRequestError` — Route Handler (기존)
- `captureServerActionError` 공통 (C-01)
- 토큰 scrub list

#### PostHog (이벤트)

- `inbox_thread_opened`
- `inbox_message_sent`
- `inbox_window_expired_blocked`
- `inbox_oauth_completed`
- `inbox_oauth_failed`

#### 구조화 로그

```
[webhook:instagram] received {bytes, signature}
[webhook:instagram] hmac_verified
[webhook:instagram] parsed {messageCount}
[webhook:instagram] persisted {conversationId, messageId}
[webhook:instagram] processInbound queued
[webhook:instagram] response 200
```

### 5.6 Acceptance Criteria 검증 절차

| #   | Goal                                          | 검증 방법                                                               | 자동/수동 |
| --- | --------------------------------------------- | ----------------------------------------------------------------------- | --------- |
| G1  | OAuth 연결 + Vault 저장                       | E2E + DB 조회 (`store_integrations.access_token_encrypted IS NOT NULL`) | 자동      |
| G2  | 외부 IG → 5초 안에 표시                       | 수동 (Jayden 외부 IG → 더미 매장 DM)                                    | 수동      |
| G3  | 24h 내 답변 → 외부 IG 수신                    | 수동 (위 시나리오 연속)                                                 | 수동      |
| G4  | ChannelAdapter 단위 테스트                    | `pnpm test instagram-adapter.test.ts`                                   | 자동      |
| G5  | HMAC 실패 401 + Sentry                        | Integration test (가짜 signature)                                       | 자동      |
| G6  | tsc/lint/test/build                           | CI green                                                                | 자동      |
| G7  | v0011 + 롤백 + RLS                            | 마이그레이션 적용 + 롤백 시뮬 + RLS 컴파일                              | 자동      |
| G8  | next-intl 6개 + inbox.\* 키                   | 파일 6개 + 키 미스 0건                                                  | 자동      |
| G9  | 24h 만료 disabled + 다국어                    | E2E 시뮬                                                                | 자동      |
| G10 | Dev mode + 1매장 + 1 test user에서 G1~G9 통과 | 종합                                                                    | 종합      |

App Review 통과는 G에 포함 X.

### 5.7 Definition of Done

```
[ ] G1~G10 전부 통과
[ ] code-reviewer 서브에이전트 (Sonnet) — CRITICAL/HIGH 0건
[ ] security-reviewer 서브에이전트 (Opus) — 🔴 webhook + OAuth 토큰
[ ] consistency-reviewer (선택) — 코드베이스 패턴 일관성
[ ] PROGRESS.md 업데이트
[ ] learnings.md 추가:
    - L-041: senior-engineer 검증을 Epic 시작 전 돌리는 패턴
    - L-042: Instagram 24h messaging window 정책
    - L-043: ngrok 무료 정적 도메인 제공 (이전 답변 정정)
    - L-044: PRD vs 실제 구현 갭 (supabase/functions → Next.js API route)
[ ] docs/runbook.md 신규 — 마이그레이션 롤백 정책 (C-06)
[ ] Vercel preview + ngrok webhook 등록 후 1매장 PoC 통과
```

---

## 6. Cleanup Trail (Senior-Engineer 권장 사항 매핑)

### 6.1 1A 흡수 (이 spec 범위)

| #   | 항목                                       | 위치            |
| --- | ------------------------------------------ | --------------- |
| 1   | `features/inbox/` 시작                     | § 2.6 폴더 구조 |
| 2   | ChannelAdapter 인터페이스                  | § 2.2           |
| 3   | Webhook hook point                         | § 2.5           |
| 4   | v0011 (conversations + RLS + 롤백 + Vault) | § 3.1           |
| 5   | `requireStoreOwnerAuth()`                  | § 3.4           |
| 6   | next-intl 6개 언어 파일                    | § 4.7           |

### 6.2 별도 trail (추후)

| #        | 항목                                                     | 시점                              | 시간   |
| -------- | -------------------------------------------------------- | --------------------------------- | ------ |
| **C-01** | Server Action Sentry 핸들러                              | **1A 시작 직전 (pre-flight)**     | ~1h    |
| **C-02** | `messages.conversation_id` NOT NULL 전환 (v0012)         | **1B 시작 시**                    | ~2h    |
| **C-03** | KYC HTTP client mock 테스트 소급                         | **1B 시작 시**                    | ~3h    |
| **C-04** | 인박스 ↔ 예약 cross-feature 경계 + `shared/lib/actions/` | **1C 시작 시**                    | ~2h    |
| **C-05** | KYC `actions.ts` 860줄 분리 + `features/kyc/` 이전       | **Epic 12 시작 직전**             | ~10h   |
| **C-06** | 마이그레이션 롤백 SQL 정책 명시                          | **1A에 포함** (`docs/runbook.md`) | ~30min |

---

## 7. Pre-flight Critical Path (외부 의존성)

```
[1A spec 승인 즉시 — 병행 시작]
├─ Meta Developer 계정 + Meta App 생성 (Jayden 명의)
├─ 더미 매장 IG Business + FB Page 셋업 (~3~4h)
├─ Business Verification 신청 (검증 며칠~)
├─ Test user 등록 (Jayden 외부 계정)
└─ ngrok 무료 정적 도메인 발급 + Meta webhook subscription 등록

[1A 메인 코드 완료 후 — 별도 trail]
└─ App Review 신청 (instagram_business_basic + instagram_business_manage_messages)
   └─ 통과 = 1A 운영 검증 게이트 (1A 완료 정의에선 제외)
```

---

## 8. Time Budget

| 항목                                                                        | 시간       |
| --------------------------------------------------------------------------- | ---------- |
| 1A 메인 (DB + API + UI + OAuth + Adapter)                                   | ~14h       |
| C-01 pre-flight (Server Action Sentry)                                      | ~1h        |
| C-06 (롤백 정책 + runbook.md)                                               | ~30min     |
| Pre-flight 외부 셋업 (Meta App + IG Business + FB Page + Verification 신청) | ~4h        |
| **합계 작업**                                                               | **~19.5h** |
| 외부 검증 대기 (Business Verification, App Review)                          | 별도       |

---

## 9. Open Questions (구현 전 점검)

1. **`store_owners` 테이블 존재 여부 확인** — 마이그레이션 0000~0010 점검 필요. 없으면 v0011에 추가.
2. **`admins` 테이블 존재 여부** — KYC `requireAdminEmail()`이 어떻게 구현됐는지 검토 후 RLS 정책 정확화.
3. **pgsodium key 관리** — Supabase 자동 vs 수동 key rotation 정책.
4. **next-intl 라우팅 현재 설정 확인** — `apps/web/src/i18n/`에 6개 locale이 routing으로 등록됐는지.

이 4개는 writing-plans 단계에서 코드 점검으로 해결.

---

## 10. References

### Meta API

- [Instagram Messaging API 24-Hour Window Policy 2026](https://www.keyapi.ai/blog/instagram-messaging-api-policy)
- [App Review — Instagram Platform — Meta for Developers](https://developers.facebook.com/docs/instagram-platform/app-review/)
- [Business Login for Instagram — Meta for Developers](https://developers.facebook.com/docs/instagram-platform/instagram-api-with-instagram-login/business-login/)
- [Instagram Webhooks — Meta for Developers](https://developers.facebook.com/docs/instagram-platform/webhooks/)

### 인프라

- [Free Plan Limits — ngrok](https://ngrok.com/docs/pricing-limits/free-plan-limits)
- [Static dev domains for all ngrok users (2023-08)](https://ngrok.com/blog/free-static-domains-ngrok-users)
- [Vercel Setting Up Webhooks](https://vercel.com/docs/webhooks)

### 프로젝트 문서

- `docs/PRD.md` § 4 모듈 1, § 5.2 운영 플로우, § 7 Data Model
- `docs/DEVELOPMENT-PLAN.md` § 2.1 Epic 의존성, § 3.2 Epic 1 Task 분해
- `docs/DECISIONS.md` v1.2 § 1.7 (Better Auth + Google OAuth)
- `apps/web/src/features/README.md` (Feature-Based v10 + Server Action + DAL)
- `apps/web/src/shared/lib/dal/README.md`

### Senior-Engineer 검토

- 본 spec 작성 직전 senior-engineer 서브에이전트 검토 (종합 6.5/10)
- 발견 갭 5축 + 권장 12개 → 1A 흡수 6개 + cleanup trail 6개로 분리 (§ 6)

---

**End of Design Spec — Epic 1 1A**
