import { describe, expect, it } from "vitest";
import { processInbound } from "./process-inbound";

/**
 * 1A는 빈 hook — DB 저장만으로 충분 (spec § 2.5).
 * 1C에서 AI 자동 응답 + 번역 + RAG 트리거 추가 예정.
 */
describe("processInbound (1A 빈 함수)", () => {
  it("어떤 messageId든 throw하지 않고 undefined 반환", async () => {
    await expect(processInbound("msg_001")).resolves.toBeUndefined();
  });

  it("빈 string도 throw 안 함", async () => {
    await expect(processInbound("")).resolves.toBeUndefined();
  });
});
