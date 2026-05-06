import { describe, it, expect } from "vitest";
import { INBOX_PROCESS_INBOUND_TOPIC, type ProcessInboundJob } from "./queue";

describe("queue constants and types", () => {
  it("INBOX_PROCESS_INBOUND_TOPIC matches vercel.json experimentalTriggers topic", () => {
    // vercel.json `experimentalTriggers.topic`(Task 3에서 추가)와 정확히 일치 필수.
    // 이 값이 틀리면 Vercel Queue가 worker endpoint를 찾지 못해 메시지가 사라짐.
    expect(INBOX_PROCESS_INBOUND_TOPIC).toBe("inbox.process-inbound");
  });

  it("ProcessInboundJob type accepts messageId string", () => {
    const job: ProcessInboundJob = { messageId: "uuid-x" };
    expect(job.messageId).toBe("uuid-x");
  });
});
