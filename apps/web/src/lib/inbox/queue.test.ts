import { describe, it, expect, vi, beforeEach } from "vitest";

// vitest 4는 vi.mock() factory를 파일 최상단으로 hoist함 → 일반 const sendMock은
// 초기화 전 참조됨(temporal dead zone). vi.hoisted()로 mock 변수도 같이 hoist
// 하여 안전. 일반 const 패턴 vs hoisted 패턴은 vitest 4 표준 차이 (plan spec과
// 미세 차이지만 정합성 우선).
const { sendMock } = vi.hoisted(() => ({
  sendMock: vi.fn(),
}));

vi.mock("@vercel/queue", () => ({
  send: sendMock,
}));

import {
  INBOX_PROCESS_INBOUND_TOPIC,
  type ProcessInboundJob,
  enqueueProcessInbound,
} from "./queue";

describe("queue constants and types", () => {
  it("INBOX_PROCESS_INBOUND_TOPIC matches vercel.json experimentalTriggers topic", () => {
    // vercel.json `experimentalTriggers.topic`(Task 3에서 추가)와 정확히 일치 필수.
    // 이 값이 틀리면 Vercel Queue가 worker endpoint를 찾지 못해 메시지가 사라짐.
    expect(INBOX_PROCESS_INBOUND_TOPIC).toBe("inbox-process-inbound");
  });

  it("ProcessInboundJob type accepts messageId string", () => {
    const job: ProcessInboundJob = { messageId: "uuid-x" };
    expect(job.messageId).toBe("uuid-x");
  });
});

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
