import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// vitest 4는 vi.mock() factory를 파일 최상단으로 hoist함 → 일반 const는
// 초기화 전 참조됨(temporal dead zone). vi.hoisted()로 mock 변수도 함께
// hoist하여 안전. queue.test.ts 패턴과 동일.
const { generateAndStoreReplyMock, handleCallbackImpl, sentryCaptureMock } =
  vi.hoisted(() => ({
    generateAndStoreReplyMock: vi.fn(),
    handleCallbackImpl: vi.fn(),
    sentryCaptureMock: vi.fn(),
  }));

vi.mock("@/features/inbox/ai/generate-and-store-reply", () => ({
  generateAndStoreReply: generateAndStoreReplyMock,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: sentryCaptureMock,
}));

// @vercel/queue handleCallback이 받은 handler를 직접 호출하도록 stub.
// 비유: 우체부(handleCallback)가 편지(handler)를 받아서 문(NextRequest)을
// 통해 전달하는 과정을 단위 테스트에서 시뮬레이션.
//
// ⚠️ Mock 한계 (D6 workaround 검증 범위 외):
// 이 mock은 SDK retry option을 실행하지 않고 handler throw를 직접 catch하여
// 5xx를 반환한다. 즉 "deliveryCount<4 → undefined → SDK throw 전파 → callback
// 5xx → server visibility timeout 기반 redelivery"의 실제 경로는 단위 테스트로
// 검증되지 않는다. 본 단위 테스트는 retry 함수의 반환값 시그니처(handleCallback
// options 검증)만 보장한다. End-to-end 동작 검증은 spec § 5.2 통합 테스트 또는
// prod 검증(§ 5.3)에서 수행해야 한다.
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

  it("retry 시그니처 검증 — visibilityTimeoutSeconds=60 + undefined<4 + acknowledge=4", () => {
    expect(handleCallbackImpl).toHaveBeenCalled();
    const opts = handleCallbackImpl.mock.calls[0]?.[1] as
      | {
          visibilityTimeoutSeconds?: number;
          retry: (err: Error, meta: { deliveryCount: number }) => unknown;
        }
      | undefined;
    expect(opts?.visibilityTimeoutSeconds).toBe(60);
    expect(typeof opts?.retry).toBe("function");

    // deliveryCount 1~3 → undefined (SDK가 throw 전파 → callback 5xx → server visibility timeout 기반 redelivery)
    expect(
      opts!.retry(new Error("transient"), { deliveryCount: 1 }),
    ).toBeUndefined();
    expect(
      opts!.retry(new Error("transient"), { deliveryCount: 2 }),
    ).toBeUndefined();
    expect(
      opts!.retry(new Error("transient"), { deliveryCount: 3 }),
    ).toBeUndefined();

    // deliveryCount 4 → DLQ acknowledge
    const r4 = opts!.retry(new Error("permanent"), { deliveryCount: 4 });
    expect(r4).toEqual({ acknowledge: true });
  });

  it("Sentry capture 사이드이펙트 검증 — deliveryCount 4에서 DLQ phase 태그 + acknowledge", () => {
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
});
