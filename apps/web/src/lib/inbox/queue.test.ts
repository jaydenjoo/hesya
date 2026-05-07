import { describe, it, expect, vi, beforeEach } from "vitest";

// QStash Client는 생성자 호출 후 publishJSON 사용. mock도 클래스 형태로.
const { publishJSONMock } = vi.hoisted(() => ({
  publishJSONMock: vi.fn(),
}));

vi.mock("@upstash/qstash", () => ({
  Client: class MockClient {
    publishJSON = publishJSONMock;
  },
}));

import {
  INBOX_PROCESS_INBOUND_TOPIC,
  type ProcessInboundJob,
  enqueueProcessInbound,
} from "./queue";

describe("queue constants and types", () => {
  it("INBOX_PROCESS_INBOUND_TOPIC remains 'inbox-process-inbound' (운영 호환성)", () => {
    // QStash는 URL 기반 라우팅이라 topic 문자열 자체는 SDK가 사용하지 않지만,
    // 로깅·Sentry tag 등에서 식별자로 유지. 변경 시 기존 alert 매칭 깨짐.
    expect(INBOX_PROCESS_INBOUND_TOPIC).toBe("inbox-process-inbound");
  });

  it("ProcessInboundJob type accepts messageId string", () => {
    const job: ProcessInboundJob = { messageId: "uuid-x" };
    expect(job.messageId).toBe("uuid-x");
  });
});

describe("enqueueProcessInbound", () => {
  beforeEach(() => {
    publishJSONMock.mockReset();
    publishJSONMock.mockResolvedValue({ messageId: "qstash_msg_1" });
  });

  it("calls publishJSON with worker URL + body + retries=3", async () => {
    await enqueueProcessInbound("msg_uuid_42");

    expect(publishJSONMock).toHaveBeenCalledTimes(1);
    const call = publishJSONMock.mock.calls[0]?.[0];
    expect(call).toMatchObject({
      body: { messageId: "msg_uuid_42" },
      retries: 3,
    });
    expect(call.url).toMatch(/\/api\/queue\/inbox-process-inbound$/);
  });

  it("propagates publishJSON rejection (caller가 Sentry capture)", async () => {
    publishJSONMock.mockRejectedValue(new Error("qstash unavailable"));
    await expect(enqueueProcessInbound("msg_uuid_99")).rejects.toThrow(
      "qstash unavailable",
    );
  });
});
