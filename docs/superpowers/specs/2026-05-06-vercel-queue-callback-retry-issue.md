# Vercel SDK GitHub Issue Body — `@vercel/queue` 0.1.6 callback retry directive silent fail

> 작성일: 2026-05-06 | 등록처: `vercel/sdk` repo (Jayden 수동 등록)
> 본문은 영어로 작성 (Vercel 측 트리아지 기본 언어). 등록 후 issue URL을 PROGRESS.md에 기록.

---

## Title (paste 그대로)

`@vercel/queue 0.1.6 — callback push mode { afterSeconds } retry directive silently fails with MessageNotFoundError 404, message ends after 1 invoke`

---

## Body (아래 "Summary"부터 끝까지 통째로 paste)

### Summary

In callback (push) mode using `handleCallback` from `@vercel/queue@0.1.6`, returning a `{ afterSeconds: N }` directive from the `retry` handler causes `changeVisibility` to fail with `MessageNotFoundError` (404). The SDK swallows this error and the callback returns 200, which the server interprets as ack. As a result, **the message is never retried** — neither via the requested backoff, nor via visibility-timeout-based redelivery.

This breaks application-level retry policies built on `{ afterSeconds }` directives. The expected exponential-backoff retry pattern documented in the SDK never executes.

### Environment

- `@vercel/queue`: `0.1.6` (npm latest at time of writing)
- Node: 20+
- Runtime: Vercel production deployment, Fluid Compute, Next.js 16 App Router
- CloudEvent type: `com.vercel.queue.v2beta` (binary mode)

### Repro

Worker route:

```ts
import { handleCallback } from "@vercel/queue";

export const POST = handleCallback(
  async (msg) => {
    throw new Error("force fail to test retry");
  },
  {
    retry: (err, metadata) => {
      if (metadata.deliveryCount === 1) return { afterSeconds: 1 };
      return { acknowledge: true };
    },
  },
);
```

`vercel.json`:

```json
{
  "experimentalTriggers": [
    {
      "type": "queue/v1beta",
      "topic": "test-topic",
      "consumer": "default-consumer"
    }
  ]
}
```

Publish a message → worker invoke fires once → handler throws → SDK calls `changeVisibility(receiptHandle, 1)` → server returns 404 → SDK throws `MessageNotFoundError` internally, catches it, logs `Failed to reschedule message for retry: ...`, and returns 200.

Server treats the 200 response as ack. Message is gone. No retry ever happens.

### Observed log line

`Failed to reschedule message for retry: MessageNotFoundError: Message s.Q.<msgId>.<lease-suffix> not found`

The ID in the error is the **receiptHandle** (lease token), not the messageId returned by `send()`. They differ in format:

- `send()` returns: `Q-<base32>` (e.g. `Q-1M0zeW2mOqC8I12gNUJP13GZZr7Sdnxi`)
- error throws: `s.Q.<base32>.<suffix>` (e.g. `s.Q.1M0zeW2mOqC8I12gNUJP13GZZr7Sdnxi.AJM4lZPnlRx`)

### Diagnosis (SDK source — `dist/index.mjs`)

`processMessage` retry block (lines 363–407):

```js
} catch (error) {
  await stopExtension();
  if (options?.retry) {
    let directive;
    try {
      directive = options.retry(error, metadata);
    } catch (retryError) { /* ... */ }
    if (directive) {
      // ...
      if ("afterSeconds" in directive && typeof directive.afterSeconds === "number") {
        try {
          await this.client.changeVisibility({
            queueName: this.topicName,
            consumerGroup: this.consumerGroupName,
            receiptHandle: message.receiptHandle,
            visibilityTimeoutSeconds: directive.afterSeconds,
          });
        } catch (changeError) {
          console.warn("Failed to reschedule message for retry:", changeError);
        }
        await this.finalizePayload(message.payload);
        return;  // ← SDK does not rethrow → callback returns 200 → server treats as ack
      }
    }
  }
  await this.finalizePayload(message.payload);
  throw error;
}
```

`changeVisibility` (lines 1864–1914):

```js
const response = await this.fetch(
  this.buildUrl(queueName, "consumer", consumerGroup, "lease", receiptHandle),
  {
    method: "PATCH",
    headers,
    body: JSON.stringify({ visibilityTimeoutSeconds }),
  },
);
if (!response.ok) {
  if (response.status === 404) {
    throw new MessageNotFoundError(receiptHandle);
  }
  // ...
}
```

In v2beta callback push mode, the receipt handle delivered with the callback (`ce-vqsreceipthandle` header) is **not accepted by the `PATCH /lease/{handle}` endpoint** at the moment the SDK calls it from the retry block. Two possible explanations:

1. The server already invalidates the lease at the moment the callback handler throws / returns non-2xx.
2. The push-mode lease is server-managed and cannot be modified via the polling-mode `lease` API.

In either case the current SDK implementation guarantees retry directives have no effect.

### Expected behavior

One of the following:

- **(a)** `changeVisibility` succeeds in callback mode — the `{ afterSeconds }` directive actually reschedules. (Either the server accepts push-mode receipt handles, or the SDK uses a different mechanism — e.g. responding 5xx with a custom `Vqs-Retry-After` header.)
- **(b)** The SDK rethrows on `changeVisibility` failure so the callback returns 5xx and the server falls back to visibility-timeout-based redelivery.
- **(c)** The docs explicitly state that `{ afterSeconds }` is unsupported in callback mode and recommend returning `undefined` to fall back to visibility-timeout redelivery.

### Current workaround

Return `undefined` from the retry handler for `deliveryCount < N`, so the SDK rethrows and the callback returns 5xx. The server then redelivers based on `visibilityTimeoutSeconds` (we set 60s explicitly). On `deliveryCount === N` we return `{ acknowledge: true }` to enter our application-level DLQ.

```ts
export const POST = handleCallback(handler, {
  visibilityTimeoutSeconds: 60,
  retry: (err, metadata) => {
    if (metadata.deliveryCount < 4) return; // throw propagates → callback 5xx → server redelivers
    return { acknowledge: true };
  },
});
```

This works but loses the granular `1s/5s/30s` exponential backoff — retries are uniform 60s intervals.

### Impact

Anyone using `{ afterSeconds }` directives in callback mode is currently getting silent failure: messages are dropped after a single invocation instead of retrying. We caught this only because we explicitly tested DLQ flow with a known-bad payload.

### Suggested next steps

- Document the limitation if it is by design.
- Otherwise, fix `changeVisibility` to work with push-mode receipt handles, or rethrow on failure so visibility-timeout redelivery kicks in.

Happy to test a fix in our environment if helpful.

---

## 등록 절차 (Jayden manual)

1. https://github.com/vercel/sdk/issues 에서 새 issue 생성
2. 위 Title 한 줄 + Body의 "### Summary"부터 "Happy to test a fix..."까지 paste
3. 등록 후 issue URL을 PROGRESS.md `## Phase 1C 후속 issue` 섹션에 기록
4. SDK fix가 머지되면 → Hesya에서 SDK upgrade + retry handler를 1+5+30s exp backoff으로 복구 (별 PR)
