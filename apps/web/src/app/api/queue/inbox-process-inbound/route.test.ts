import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest } from "next/server";

const { generateAndStoreReplyMock, sentryCaptureMock } = vi.hoisted(() => ({
  generateAndStoreReplyMock: vi.fn(),
  sentryCaptureMock: vi.fn(),
}));

vi.mock("@/features/inbox/ai/generate-and-store-reply", () => ({
  generateAndStoreReply: generateAndStoreReplyMock,
}));

vi.mock("@sentry/nextjs", () => ({
  captureException: sentryCaptureMock,
}));

// QStash verifySignatureAppRouter는 서명 검증 후 handler를 그대로 호출.
// 단위 테스트에서는 검증을 우회하고 handler만 직접 노출되도록 stub.
vi.mock("@upstash/qstash/nextjs", () => ({
  verifySignatureAppRouter: (handler: (req: Request) => Promise<Response>) =>
    handler,
}));

import { POST } from "./route";

function makeReq(body: unknown, opts: { retried?: number } = {}): NextRequest {
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (opts.retried !== undefined) {
    headers["upstash-retried"] = String(opts.retried);
  }
  return new NextRequest("http://localhost/api/queue/inbox-process-inbound", {
    method: "POST",
    headers,
    body: JSON.stringify(body),
  });
}

describe("worker /api/queue/inbox-process-inbound", () => {
  beforeEach(() => {
    generateAndStoreReplyMock.mockReset();
    sentryCaptureMock.mockReset();
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
    expect(sentryCaptureMock).not.toHaveBeenCalled();
  });

  it("invalid payload (messageId 누락) + retried=0 → 500 (QStash 자동 retry)", async () => {
    const res = await POST(makeReq({ wrongField: "x" }, { retried: 0 }));
    expect(res.status).toBe(500);
    expect(generateAndStoreReplyMock).not.toHaveBeenCalled();
    expect(sentryCaptureMock).not.toHaveBeenCalled();
  });

  it("invalid payload + retried=3 (마지막 시도) → 200 + Sentry DLQ alert", async () => {
    const res = await POST(
      makeReq({ messageId: "not-a-uuid" }, { retried: 3 }),
    );
    expect(res.status).toBe(200);
    expect(generateAndStoreReplyMock).not.toHaveBeenCalled();
    expect(sentryCaptureMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({
          phase: "queue:inbox.process-inbound:dlq",
        }),
      }),
    );
  });

  it("handler throw + retried=2 → 500 (Sentry capture 안 함, 다음 retry로)", async () => {
    generateAndStoreReplyMock.mockRejectedValue(new Error("transient"));
    const res = await POST(
      makeReq(
        { messageId: "00000000-0000-4000-8000-000000000002" },
        { retried: 2 },
      ),
    );
    expect(res.status).toBe(500);
    expect(sentryCaptureMock).not.toHaveBeenCalled();
  });

  it("handler throw + retried=3 → 200 + Sentry capture (DLQ 종결)", async () => {
    generateAndStoreReplyMock.mockRejectedValue(new Error("permanent"));
    const res = await POST(
      makeReq(
        { messageId: "00000000-0000-4000-8000-000000000003" },
        { retried: 3 },
      ),
    );
    expect(res.status).toBe(200);
    expect(sentryCaptureMock).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: expect.objectContaining({
          phase: "queue:inbox.process-inbound:dlq",
        }),
        extra: expect.objectContaining({
          messageId: "00000000-0000-4000-8000-000000000003",
          retried: 3,
        }),
      }),
    );
  });

  it("Upstash-Retried 헤더 누락 시 0으로 처리", async () => {
    generateAndStoreReplyMock.mockResolvedValue({
      stored: true,
      aiMessageId: "ai_2",
      tokensUsed: { input: 5, output: 3 },
    });
    const res = await POST(
      makeReq({ messageId: "00000000-0000-4000-8000-000000000004" }),
    );
    expect(res.status).toBe(200);
  });

  it("Upstash-Retried 헤더가 비정상 값(NaN)일 때 0 fallback → DLQ 진입 보장", async () => {
    // L-077 review HIGH: Number("abc") = NaN → NaN >= 3 = false → 영구 retry 방어.
    // 비정상 retried 값으로 4회 attempt 후에도 DLQ 종결 보장.
    generateAndStoreReplyMock.mockRejectedValue(new Error("permanent"));
    const req = new NextRequest(
      "http://localhost/api/queue/inbox-process-inbound",
      {
        method: "POST",
        headers: {
          "content-type": "application/json",
          "upstash-retried": "abc",
        },
        body: JSON.stringify({
          messageId: "00000000-0000-4000-8000-000000000005",
        }),
      },
    );
    const res = await POST(req);
    // retried=0 처리 → 첫 시도라고 봄 → 500 응답으로 retry 유도 (영구 루프 X,
    // 다음 retry에서 정상 retried=1로 들어옴 가정).
    expect(res.status).toBe(500);
    expect(sentryCaptureMock).not.toHaveBeenCalled();
  });
});
