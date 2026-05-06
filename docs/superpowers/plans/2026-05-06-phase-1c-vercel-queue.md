# Phase 1C — Vercel Queue 분리 Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** webhook route의 fire-and-forget `processInbound` 호출을 `@vercel/queue` 기반 push mode worker로 분리하여 webhook ACK 시간 3-5s → 200-500ms로 단축.

**Architecture:** Webhook은 inbound 메시지를 DB에 저장한 후 `send("inbox.process-inbound", { messageId })`로 enqueue + 즉시 200 OK. Vercel Queue가 별 worker endpoint(`/api/queue/inbox-process-inbound`)를 push 호출 → `handleCallback`이 `generateAndStoreReply(messageId)` 실행. Retry 3회 exponential backoff(1s/5s/30s)는 `retry` callback에서 `metadata.deliveryCount`로 구현, 4회째에 `acknowledge: true`로 DLQ 격리(application-level + Sentry alert).

**Tech Stack:** `@vercel/queue` SDK (push mode), Next.js 16 App Router, Zod validation, vitest 4, Sentry 모니터링, vercel.json `experimentalTriggers` (queue/v2beta).

**Spec:** `docs/superpowers/specs/2026-05-06-phase-1c-vercel-queue-design.md`

---

## File Structure

### 신규 파일 (4)

| 파일                                                             | 역할                                                                                                                   |
| ---------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/lib/inbox/queue.ts`                                | topic 상수 `INBOX_PROCESS_INBOUND_TOPIC` + `enqueueProcessInbound(messageId)` helper. `@vercel/queue`의 `send()` 래핑. |
| `apps/web/src/lib/inbox/queue.test.ts`                           | enqueue 단위 test — `send` mock + topic/payload 검증                                                                   |
| `apps/web/src/app/api/queue/inbox-process-inbound/route.ts`      | Worker endpoint — `handleCallback`으로 `generateAndStoreReply` 호출 + retry policy                                     |
| `apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts` | Worker route 단위 test — Zod 검증/skip/throw/멱등 4 시나리오                                                           |

### 수정 파일 (3)

| 파일                                                          | 변경                                                                                                                                                 |
| ------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------- |
| `apps/web/src/app/api/webhooks/instagram/route.ts` (라인 156) | `void processInbound(...).catch(...)` → `await enqueueProcessInbound(inserted.id).catch((e) => Sentry.captureException(...))`. 200 OK 반환은 그대로. |
| `apps/web/src/app/api/webhooks/instagram/route.test.ts`       | `processInbound` mock 검증 → `enqueueProcessInbound` mock 검증. `vi.mock("@/lib/inbox/queue")` 추가.                                                 |
| `vercel.json`                                                 | `experimentalTriggers` 추가: `queue/v2beta` topic `inbox.process-inbound` → worker route.                                                            |

### 변경 없음

- `apps/web/src/lib/inbox/process-inbound.ts` — worker가 직접 호출. wrapper 그대로.
- `apps/web/src/features/inbox/ai/generate-and-store-reply.ts` — 비즈니스 로직 100% 동일. 멱등성 (`markAIResponded` race-safe claim) 그대로 활용.

---

## Task 1: SDK 설치 + topic 상수

**Files:**

- Modify: `apps/web/package.json` (dependencies에 `@vercel/queue` 추가)
- Create: `apps/web/src/lib/inbox/queue.ts`

- [ ] **Step 1: SDK 설치**

```bash
cd /Volumes/jayden-ssd/projects/hesya/apps/web
pnpm add @vercel/queue
```

Expected: `@vercel/queue` 추가됨. lockfile 갱신.

- [ ] **Step 2: topic 상수만 export하는 최소 파일 작성**

`apps/web/src/lib/inbox/queue.ts`:

```ts
import "server-only";

/**
 * Phase 1C — Vercel Queue topic for inbound message processing.
 *
 * Webhook route가 inbound INSERT 후 enqueue → Vercel Queue가 worker
 * endpoint(`/api/queue/inbox-process-inbound`)를 push 호출.
 *
 * vercel.json `experimentalTriggers`의 topic name과 정확히 일치해야 함.
 */
export const INBOX_PROCESS_INBOUND_TOPIC = "inbox.process-inbound";

export type ProcessInboundJob = {
  messageId: string;
};
```

- [ ] **Step 3: type-check**

```bash
cd /Volumes/jayden-ssd/projects/hesya
pnpm exec turbo run type-check
```

Expected: PASS (단순 export만이라 OK).

- [ ] **Step 4: Commit**

```bash
git add apps/web/package.json apps/web/../pnpm-lock.yaml apps/web/src/lib/inbox/queue.ts
git commit -m "feat(inbox): @vercel/queue SDK 설치 + INBOX_PROCESS_INBOUND_TOPIC 상수"
```

---

## Task 2: enqueueProcessInbound helper (RED-first)

**Files:**

- Create: `apps/web/src/lib/inbox/queue.test.ts`
- Modify: `apps/web/src/lib/inbox/queue.ts`

- [ ] **Step 1: 실패하는 test 작성**

`apps/web/src/lib/inbox/queue.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";

const sendMock = vi.fn();
vi.mock("@vercel/queue", () => ({
  send: sendMock,
}));

import { enqueueProcessInbound, INBOX_PROCESS_INBOUND_TOPIC } from "./queue";

describe("enqueueProcessInbound", () => {
  beforeEach(() => {
    sendMock.mockReset();
    sendMock.mockResolvedValue({ messageId: "queue_msg_1" });
  });

  it("calls send() with correct topic and payload", async () => {
    await enqueueProcessInbound("msg_uuid_42");

    expect(sendMock).toHaveBeenCalledTimes(1);
    expect(sendMock).toHaveBeenCalledWith(INBOX_PROCESS_INBOUND_TOPIC, {
      messageId: "msg_uuid_42",
    });
  });

  it("propagates send() rejection (caller가 Sentry capture)", async () => {
    sendMock.mockRejectedValue(new Error("queue unavailable"));
    await expect(enqueueProcessInbound("msg_uuid_99")).rejects.toThrow(
      "queue unavailable",
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
cd /Volumes/jayden-ssd/projects/hesya
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/lib/inbox/queue.test.ts
```

Expected: FAIL — `enqueueProcessInbound is not exported`.

- [ ] **Step 3: 최소 구현**

`apps/web/src/lib/inbox/queue.ts`에 추가:

```ts
import { send } from "@vercel/queue";

/**
 * Inbound 메시지 처리를 Vercel Queue에 enqueue.
 *
 * 호출 패턴: webhook route가 DB INSERT 직후 호출 → 즉시 200 OK 반환.
 * Worker(`/api/queue/inbox-process-inbound`)가 별 process로 처리.
 *
 * Throw 정책: caller(webhook route)가 Sentry capture + 200 OK 유지
 * (Meta retry 폭증 방어 우선).
 */
export async function enqueueProcessInbound(messageId: string): Promise<void> {
  await send(INBOX_PROCESS_INBOUND_TOPIC, {
    messageId,
  } satisfies ProcessInboundJob);
}
```

- [ ] **Step 4: 통과 확인**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/lib/inbox/queue.test.ts
```

Expected: PASS (2 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/lib/inbox/queue.ts apps/web/src/lib/inbox/queue.test.ts
git commit -m "feat(inbox): enqueueProcessInbound helper + 단위 test 2건"
```

---

## Task 3: vercel.json experimentalTriggers 추가

**Files:**

- Modify: `vercel.json`

- [ ] **Step 1: experimentalTriggers 추가**

`vercel.json`:

```json
{
  "$schema": "https://openapi.vercel.sh/vercel.json",
  "crons": [
    {
      "path": "/api/cron/revalidate-stores",
      "schedule": "0 18 1 */3 *"
    }
  ],
  "functions": {
    "apps/web/src/app/api/queue/inbox-process-inbound/route.ts": {
      "experimentalTriggers": [
        {
          "type": "queue/v2beta",
          "topic": "inbox.process-inbound",
          "retryAfterSeconds": 60,
          "initialDelaySeconds": 0
        }
      ]
    }
  }
}
```

> 주: `topic`은 Task 1의 `INBOX_PROCESS_INBOUND_TOPIC` 값과 정확히 일치. `retryAfterSeconds: 60`은 Vercel default visibility timeout. application-level retry callback이 실제 backoff(1s/5s/30s) 제어.

- [ ] **Step 2: vercel CLI validate (있으면)**

```bash
cd /Volumes/jayden-ssd/projects/hesya
pnpm exec vercel check 2>&1 || echo "vercel check 없으면 skip"
```

Expected: 검증 OK 또는 skip.

- [ ] **Step 3: Commit**

```bash
git add vercel.json
git commit -m "feat(infra): vercel.json experimentalTriggers — inbox.process-inbound topic"
```

---

## Task 4: Worker route — Zod payload 검증 (RED-first)

**Files:**

- Create: `apps/web/src/app/api/queue/inbox-process-inbound/route.ts`
- Create: `apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts`

- [ ] **Step 1: payload Zod 검증 + 200 happy path 실패 test 작성**

`apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts`:

```ts
import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const generateAndStoreReplyMock = vi.fn();
vi.mock("@/features/inbox/ai/generate-and-store-reply", () => ({
  generateAndStoreReply: generateAndStoreReplyMock,
}));

// @vercel/queue handleCallback이 받은 handler를 직접 호출하도록 stub.
const handleCallbackImpl = vi.fn();
vi.mock("@vercel/queue", () => ({
  handleCallback: (handler: unknown, opts: unknown) => {
    handleCallbackImpl(handler, opts);
    // Returns a Next.js POST handler that, when invoked with a NextRequest,
    // parses the body as the message and calls the user's handler.
    return async (req: NextRequest) => {
      const body = await req.json();
      try {
        await (handler as (msg: unknown, meta: unknown) => Promise<void>)(
          body,
          { messageId: "q_msg_1", deliveryCount: 1 },
        );
        return new Response(null, { status: 200 });
      } catch (err) {
        return new Response(JSON.stringify({ error: (err as Error).message }), {
          status: 500,
        });
      }
    };
  },
}));

import { POST } from "./route";

function makeReq(body: unknown): NextRequest {
  return new NextRequest("http://localhost/api/queue/inbox-process-inbound", {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("worker /api/queue/inbox-process-inbound", () => {
  beforeEach(() => {
    generateAndStoreReplyMock.mockReset();
  });

  it("happy path: 유효 messageId → generateAndStoreReply 호출 + 200", async () => {
    generateAndStoreReplyMock.mockResolvedValue({
      stored: true,
      aiMessageId: "ai_1",
      tokensUsed: { input: 5, output: 3 },
    });
    const res = await POST(
      makeReq({ messageId: "00000000-0000-4000-8000-000000000001" }),
    );
    expect(res.status).toBe(200);
    expect(generateAndStoreReplyMock).toHaveBeenCalledWith(
      "00000000-0000-4000-8000-000000000001",
    );
  });
});
```

- [ ] **Step 2: 실패 확인**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/app/api/queue/inbox-process-inbound/route.test.ts
```

Expected: FAIL — `Cannot find module "./route"`.

- [ ] **Step 3: 최소 구현 (happy path만)**

`apps/web/src/app/api/queue/inbox-process-inbound/route.ts`:

```ts
import { handleCallback } from "@vercel/queue";
import { z } from "zod";
import { generateAndStoreReply } from "@/features/inbox/ai/generate-and-store-reply";
import type { ProcessInboundJob } from "@/lib/inbox/queue";

/**
 * Phase 1C — Vercel Queue worker for inbound message processing.
 *
 * Push mode: Vercel Queue가 자동 호출. vercel.json `experimentalTriggers`
 * 의 topic `inbox.process-inbound`와 매핑.
 *
 * 비즈니스 로직 100% 동일 — `generateAndStoreReply`만 호출. Throw 시
 * Vercel Queue가 자동 재시도(retry callback 정책).
 */
const payloadSchema = z.object({
  messageId: z.string().uuid(),
});

export const POST = handleCallback(
  async (rawMessage: unknown, _metadata: unknown) => {
    const { messageId } = payloadSchema.parse(
      rawMessage,
    ) satisfies ProcessInboundJob;
    await generateAndStoreReply(messageId);
  },
);
```

- [ ] **Step 4: 통과 확인**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/app/api/queue/inbox-process-inbound/route.test.ts
```

Expected: PASS (1 test).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/queue/inbox-process-inbound/route.ts apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts
git commit -m "feat(inbox): worker /api/queue/inbox-process-inbound — payload Zod + happy path"
```

---

## Task 5: Worker — invalid payload 처리 (RED-first)

**Files:**

- Modify: `apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts`
- Modify: `apps/web/src/app/api/queue/inbox-process-inbound/route.ts` (이미 Zod parse가 throw하므로 변경 무 — test만 추가)

- [ ] **Step 1: 실패 test 추가 (Zod 실패 → throw → 5xx)**

`apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts`의 describe 블록에 추가:

```ts
it("invalid payload (messageId 누락) → ZodError throw → 5xx", async () => {
  const res = await POST(makeReq({ wrongField: "x" }));
  expect(res.status).toBe(500);
  expect(generateAndStoreReplyMock).not.toHaveBeenCalled();
});

it("invalid payload (messageId UUID 형식 아님) → ZodError throw → 5xx", async () => {
  const res = await POST(makeReq({ messageId: "not-a-uuid" }));
  expect(res.status).toBe(500);
  expect(generateAndStoreReplyMock).not.toHaveBeenCalled();
});
```

> 주: 위 stub은 ZodError 시 5xx로 매핑. **실제 운영 정책 (4xx vs 5xx)은 retry callback에서 결정** (Task 6). 단위 test는 throw 발생 자체를 검증.

- [ ] **Step 2: 실행 — 새 test 2건도 PASS여야 (Zod parse는 이미 구현됨)**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/app/api/queue/inbox-process-inbound/route.test.ts
```

Expected: PASS (3 tests — happy + invalid 2건).

- [ ] **Step 3: Commit**

```bash
git add apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts
git commit -m "test(inbox): worker invalid payload Zod 검증 회귀 2건"
```

---

## Task 6: Worker — retry policy (3회 exp backoff + DLQ acknowledge)

**Files:**

- Modify: `apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts`
- Modify: `apps/web/src/app/api/queue/inbox-process-inbound/route.ts`

- [ ] **Step 1: retry callback 검증 test 추가**

`route.test.ts`에서 `handleCallbackImpl`이 받은 옵션을 검증:

```ts
it("handleCallback에 retry option 전달 — 3회 exp backoff + 4회째 acknowledge", () => {
  // POST가 import 시 실행되어 handleCallbackImpl이 1회 호출됨
  expect(handleCallbackImpl).toHaveBeenCalled();
  const opts = handleCallbackImpl.mock.calls[0]?.[1] as
    | { retry: (err: Error, meta: { deliveryCount: number }) => unknown }
    | undefined;
  expect(typeof opts?.retry).toBe("function");

  // deliveryCount 1 → 1s 후 retry
  const r1 = opts!.retry(new Error("transient"), { deliveryCount: 1 });
  expect(r1).toEqual({ afterSeconds: 1 });

  // deliveryCount 2 → 5s
  const r2 = opts!.retry(new Error("transient"), { deliveryCount: 2 });
  expect(r2).toEqual({ afterSeconds: 5 });

  // deliveryCount 3 → 30s
  const r3 = opts!.retry(new Error("transient"), { deliveryCount: 3 });
  expect(r3).toEqual({ afterSeconds: 30 });

  // deliveryCount 4 → DLQ acknowledge (Sentry alert는 별도 — Task 6b)
  const r4 = opts!.retry(new Error("permanent"), { deliveryCount: 4 });
  expect(r4).toEqual({ acknowledge: true });
});
```

- [ ] **Step 2: 실패 확인 (현재 retry 옵션 없음)**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/app/api/queue/inbox-process-inbound/route.test.ts
```

Expected: FAIL — `opts.retry is not a function`.

- [ ] **Step 3: retry callback 구현**

`route.ts` 갱신:

```ts
import { handleCallback } from "@vercel/queue";
import { z } from "zod";
import { generateAndStoreReply } from "@/features/inbox/ai/generate-and-store-reply";
import type { ProcessInboundJob } from "@/lib/inbox/queue";

const payloadSchema = z.object({
  messageId: z.string().uuid(),
});

/**
 * Phase 1C — Vercel Queue worker for inbound message processing.
 *
 * Retry 정책 (D2): 3회 exponential backoff (1s/5s/30s). 4회째 deliveryCount
 * 도달 시 acknowledge → DLQ 격리 (application-level — Vercel Queues는 built-in
 * DLQ 없음). 별 commit에서 Sentry alert 추가.
 */
const RETRY_BACKOFFS_SECONDS = [1, 5, 30] as const;

export const POST = handleCallback(
  async (rawMessage: unknown, _metadata: unknown) => {
    const { messageId } = payloadSchema.parse(
      rawMessage,
    ) satisfies ProcessInboundJob;
    await generateAndStoreReply(messageId);
  },
  {
    retry: (_err, metadata) => {
      const idx = metadata.deliveryCount - 1;
      if (idx < RETRY_BACKOFFS_SECONDS.length) {
        return { afterSeconds: RETRY_BACKOFFS_SECONDS[idx] };
      }
      return { acknowledge: true };
    },
  },
);
```

- [ ] **Step 4: 통과 확인**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/app/api/queue/inbox-process-inbound/route.test.ts
```

Expected: PASS (4 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/queue/inbox-process-inbound/route.ts apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts
git commit -m "feat(inbox): worker retry — 3회 exp backoff + 4회째 DLQ acknowledge"
```

---

## Task 7: Worker — DLQ 진입 시 Sentry alert (RED-first)

**Files:**

- Modify: `apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts`
- Modify: `apps/web/src/app/api/queue/inbox-process-inbound/route.ts`

- [ ] **Step 1: Sentry capture 검증 test 추가**

`route.test.ts`에 추가:

```ts
const sentryCaptureMock = vi.fn();
vi.mock("@sentry/nextjs", () => ({
  captureException: sentryCaptureMock,
}));
```

```ts
it("deliveryCount 4 (DLQ 진입) → Sentry capture + acknowledge", () => {
  sentryCaptureMock.mockReset();
  const opts = handleCallbackImpl.mock.calls[0]?.[1] as
    | {
        retry: (
          err: Error,
          meta: { deliveryCount: number; messageId: string },
        ) => unknown;
      }
    | undefined;
  const result = opts!.retry(new Error("permanent fail"), {
    deliveryCount: 4,
    messageId: "q_msg_x",
  });
  expect(result).toEqual({ acknowledge: true });
  expect(sentryCaptureMock).toHaveBeenCalledWith(
    expect.any(Error),
    expect.objectContaining({
      tags: expect.objectContaining({
        phase: "queue:inbox.process-inbound:dlq",
      }),
    }),
  );
});
```

- [ ] **Step 2: 실패 확인**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/app/api/queue/inbox-process-inbound/route.test.ts
```

Expected: FAIL — `sentryCaptureMock.mock.calls.length === 0`.

- [ ] **Step 3: retry callback에 Sentry capture 추가**

`route.ts`:

```ts
import * as Sentry from "@sentry/nextjs";
import { handleCallback } from "@vercel/queue";
import { z } from "zod";
import { generateAndStoreReply } from "@/features/inbox/ai/generate-and-store-reply";
import type { ProcessInboundJob } from "@/lib/inbox/queue";

const payloadSchema = z.object({
  messageId: z.string().uuid(),
});

const RETRY_BACKOFFS_SECONDS = [1, 5, 30] as const;

export const POST = handleCallback(
  async (rawMessage: unknown, _metadata: unknown) => {
    const { messageId } = payloadSchema.parse(
      rawMessage,
    ) satisfies ProcessInboundJob;
    await generateAndStoreReply(messageId);
  },
  {
    retry: (err, metadata) => {
      const idx = metadata.deliveryCount - 1;
      if (idx < RETRY_BACKOFFS_SECONDS.length) {
        return { afterSeconds: RETRY_BACKOFFS_SECONDS[idx] };
      }
      // DLQ 진입 — Sentry alert 후 acknowledge
      Sentry.captureException(err, {
        tags: { phase: "queue:inbox.process-inbound:dlq" },
        extra: {
          queueMessageId: metadata.messageId,
          deliveryCount: metadata.deliveryCount,
        },
      });
      return { acknowledge: true };
    },
  },
);
```

- [ ] **Step 4: 통과 확인**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test src/app/api/queue/inbox-process-inbound/route.test.ts
```

Expected: PASS (5 tests).

- [ ] **Step 5: Commit**

```bash
git add apps/web/src/app/api/queue/inbox-process-inbound/route.ts apps/web/src/app/api/queue/inbox-process-inbound/route.test.ts
git commit -m "feat(inbox): worker DLQ entry — Sentry capture + acknowledge (D3 정책)"
```

---

## Task 8: Webhook route — fire-and-forget → enqueue 전환 (RED-first)

**Files:**

- Modify: `apps/web/src/app/api/webhooks/instagram/route.test.ts`
- Modify: `apps/web/src/app/api/webhooks/instagram/route.ts` (라인 156)

- [ ] **Step 1: 기존 webhook test에 enqueue mock 검증 추가**

`webhook route.test.ts` 상단의 vi.mock 블록에 추가:

```ts
const enqueueProcessInboundMock = vi.fn();
vi.mock("@/lib/inbox/queue", () => ({
  enqueueProcessInbound: enqueueProcessInboundMock,
  INBOX_PROCESS_INBOUND_TOPIC: "inbox.process-inbound",
}));
```

기존 "HMAC OK + 매장 연결됨 → 200 + DB 저장" test 안에 마지막에 추가 (이미 있던 expect 라인 다음):

```ts
expect(enqueueProcessInboundMock).toHaveBeenCalledTimes(1);
expect(enqueueProcessInboundMock).toHaveBeenCalledWith(expect.any(String));
```

> 주: insertedId는 random UUID라 `expect.any(String)`. webhook이 DB INSERT 결과 id를 그대로 enqueue하는지 검증.

- [ ] **Step 2: 실패 확인**

```bash
HESYA_TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54522/postgres" pnpm --filter @hesya/web test src/app/api/webhooks/instagram/route.test.ts
```

Expected: FAIL — `enqueueProcessInboundMock not called` (현재 webhook은 `processInbound` 직접 호출).

> 주: 로컬 supabase 안 켜져 있으면 `supabase start` 필요 (PR #71 작업 시 셋업한 config로). 또는 통합 test 영역 한정이라 단위 mock으로도 검증 가능 — 단독 실행 시 setup이 environment skip.

- [ ] **Step 3: webhook route 수정**

`apps/web/src/app/api/webhooks/instagram/route.ts` 라인 156 변경 — `void processInbound(...).catch(...)` 라인 교체:

```ts
// Phase 1C: Vercel Queue로 enqueue. webhook은 즉시 200 OK 반환 (Meta
// 5s ACK 안전마진). enqueue 실패 시 Sentry capture + 200 OK 유지
// (Meta retry 폭증 방어가 메시지 1건 누락보다 우선 — D5).
await enqueueProcessInbound(inserted.id).catch((e) =>
  Sentry.captureException(e, {
    tags: { phase: "queue:inbox.process-inbound:enqueue" },
  }),
);
```

상단 import에 추가:

```ts
import { enqueueProcessInbound } from "@/lib/inbox/queue";
```

기존 `import { processInbound } ...`은 webhook에서 직접 호출 안 하므로 삭제 (worker가 호출).

- [ ] **Step 4: 통과 확인**

```bash
HESYA_TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54522/postgres" pnpm --filter @hesya/web test src/app/api/webhooks/instagram/route.test.ts
```

Expected: PASS (11 tests, enqueue 검증 추가).

- [ ] **Step 5: type-check + lint**

```bash
cd /Volumes/jayden-ssd/projects/hesya
pnpm exec turbo run type-check lint
```

Expected: 7/7 successful.

- [ ] **Step 6: Commit**

```bash
git add apps/web/src/app/api/webhooks/instagram/route.ts apps/web/src/app/api/webhooks/instagram/route.test.ts
git commit -m "feat(inbox): webhook fire-and-forget → enqueueProcessInbound (Phase 1C)"
```

---

## Task 9: 회귀 검증 + PR open

**Files:** (변경 없음)

- [ ] **Step 1: 전체 vitest 실행 (단위)**

```bash
HESYA_TEST_DATABASE_URL="" pnpm --filter @hesya/web test
```

Expected: PASS — 기존 회귀 0 + 신규 ~7-8건 (queue 2 + worker 5 + webhook 1 갱신).

- [ ] **Step 2: 통합 test 실행 (로컬 supabase 켜진 상태)**

```bash
# supabase 미실행 시: cd /Volumes/jayden-ssd/projects/hesya && supabase start
HESYA_TEST_DATABASE_URL="postgresql://postgres:postgres@127.0.0.1:54522/postgres" pnpm --filter @hesya/web test
```

Expected: PASS 전체 (기존 webhook 통합 11건 회귀 0).

- [ ] **Step 3: type-check + lint 최종**

```bash
pnpm exec turbo run type-check lint
```

Expected: 7/7 successful.

- [ ] **Step 4: 브랜치 생성 + push**

```bash
git checkout -b feat/1c-vercel-queue-process-inbound
git push -u origin feat/1c-vercel-queue-process-inbound
```

- [ ] **Step 5: PR open with auto-merge label**

```bash
gh pr create --title "feat(inbox): Phase 1C — fire-and-forget processInbound을 Vercel Queue로 분리" --label auto-merge --body "$(cat <<'EOF'
## Summary

Spec: docs/superpowers/specs/2026-05-06-phase-1c-vercel-queue-design.md
Plan: docs/superpowers/plans/2026-05-06-phase-1c-vercel-queue.md

webhook ACK 시간 3-5s → 200-500ms (Meta 5s 안전마진 10x). retry 자동화
(3회 exp backoff 1s/5s/30s) + DLQ Sentry alert. generateAndStoreReply
비즈니스 로직 100% 동일.

## What changed

- 신규: queue.ts (enqueueProcessInbound) + worker route + 2 test
- 수정: webhook route(line 156 enqueue로 교체) + vercel.json experimentalTriggers
- 변경 없음: process-inbound.ts wrapper / generateAndStoreReply

## Test plan

- [ ] CI validate + e2e-smoke + e2e-integration 모두 pass (enforced gate)
- [ ] vitest: 기존 회귀 0 + 신규 ~7건 GREEN
- [ ] 머지 후 prod 검증: Vercel Queue dashboard에서 enqueue/dequeue 확인 + webhook ACK ≤ 500ms (Vercel Logs)
EOF
)"
```

- [ ] **Step 6: CI 결과 모니터링**

`gh pr checks <PR번호>` — validate/e2e-smoke/e2e-integration 모두 pass 확인. auto-merge가 자동 머지.

---

## Task 10: prod 검증 (배포 후)

**Files:** (코드 변경 없음 — 운영 검증)

- [ ] **Step 1: Vercel manual deploy (메모리: Hesya는 자동 배포 OFF)**

```bash
cd /Volumes/jayden-ssd/projects/hesya/apps/web
vercel deploy --prod
```

Expected: deploy 완료 후 production URL에 반영.

- [ ] **Step 2: Vercel Queue dashboard 확인**

`https://vercel.com/jaydens-projects-f5e92399/hesya-web` → Queues 탭 → `inbox.process-inbound` topic 등록 확인.

Expected: topic 보임. messages 0 (아직 트래픽 없음).

- [ ] **Step 3: 의도적 invalid payload로 DLQ 작동 검증**

```bash
# Vercel CLI로 직접 enqueue
pnpm exec vercel queue send inbox.process-inbound '{"wrongField": "x"}'
```

Expected: 4회 retry 후 Sentry alert 도착. Vercel Queue dashboard에 acknowledged 표시.

> 주: Sentry alert 채널이 Slack/Email에 연결 안 되어 있으면 sentry.io 직접 확인.

- [ ] **Step 4: webhook ACK 시간 측정**

Meta App test user로 메시지 1건 발송 → Vercel Logs에서 webhook 호출 시간 확인.

Expected: webhook ACK ≤ 500ms. AI 응답 도착은 폴링 refresh로 인박스 표시.

- [ ] **Step 5: 결과 PROGRESS.md 갱신**

`PROGRESS.md`에 "Phase 1C 완료 — webhook ACK Xms / DLQ Sentry alert 검증 ✅" 추가 + 다음 후보 (Phase 1D 또는 e2e 시나리오).

- [ ] **Step 6: Commit + push**

```bash
git checkout main
git pull --ff-only
# PROGRESS 갱신 후
git add PROGRESS.md
git commit -m "docs: PROGRESS — Phase 1C 머지 + prod 검증"
git push origin main
```

---

## Self-Review

**1. Spec coverage:**

- § 2.1 신규 4 파일: Task 1 (queue.ts) + Task 2 (queue.test.ts) + Task 4 (worker route) + Task 4-7 (worker test) ✅
- § 2.2 수정 3 파일: Task 8 (webhook route + test) + Task 3 (vercel.json) ✅ (env.ts는 SDK 자동 inject로 미변경)
- § 2.3 Worker response convention: Task 4-7에서 200/5xx/4xx 패턴 적용 ✅
- § D1 Vercel Queues: Task 1 SDK 설치 ✅
- § D2 Retry 3회 exp backoff: Task 6 ✅
- § D3 DLQ Sentry alert: Task 7 ✅
- § D4 Big Bang: Task 8 (단일 PR) + Task 9 PR open ✅
- § D5 enqueue 실패 시 200 OK: Task 8 Step 3 (catch + Sentry) ✅
- § 5.3 prod 검증: Task 10 ✅

**2. Placeholder scan:** TBD/TODO 없음. 모든 step에 실제 코드.

**3. Type consistency:**

- `enqueueProcessInbound(messageId: string)`: Task 2, 8에서 일관 ✅
- `INBOX_PROCESS_INBOUND_TOPIC = "inbox.process-inbound"`: Task 1, 3 (vercel.json) 일관 ✅
- `ProcessInboundJob` type: Task 1, 4 satisfies로 일관 ✅
- retry callback 시그니처: Task 6, 7 일관 ✅

이상 없음. 머지 후 1Cb (e2e) / 1Cc (admin DLQ UI) / 1D (multi-channel) 별 PR로.
