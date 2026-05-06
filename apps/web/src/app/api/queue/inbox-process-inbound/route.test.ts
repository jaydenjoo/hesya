import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

// vitest 4는 vi.mock() factory를 파일 최상단으로 hoist함 → 일반 const는
// 초기화 전 참조됨(temporal dead zone). vi.hoisted()로 mock 변수도 함께
// hoist하여 안전. queue.test.ts 패턴과 동일.
const { generateAndStoreReplyMock, handleCallbackImpl } = vi.hoisted(() => ({
  generateAndStoreReplyMock: vi.fn(),
  handleCallbackImpl: vi.fn(),
}));

vi.mock("@/features/inbox/ai/generate-and-store-reply", () => ({
  generateAndStoreReply: generateAndStoreReplyMock,
}));

// @vercel/queue handleCallback이 받은 handler를 직접 호출하도록 stub.
// 비유: 우체부(handleCallback)가 편지(handler)를 받아서 문(NextRequest)을
// 통해 전달하는 과정을 단위 테스트에서 시뮬레이션.
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
