import { handleCallback } from "@vercel/queue";
import { z } from "zod";
import { generateAndStoreReply } from "@/features/inbox/ai/generate-and-store-reply";
import type { ProcessInboundJob } from "@/lib/inbox/queue";

/**
 * Phase 1C — Vercel Queue worker for inbound message processing.
 *
 * Push 모드: Vercel Queue가 자동 호출. vercel.json `experimentalTriggers`
 * 의 topic `inbox-process-inbound`와 매핑.
 *
 * 비유: 우체국 배달부(Vercel Queue)가 소포(messageId)를 가지고 이 문(route)을
 * 두드리면, 문지기(worker)가 소포를 받아 처리 함수에 전달한다.
 *
 * 비즈니스 로직 100% 동일 — `generateAndStoreReply`만 호출. Throw 시
 * Vercel Queue가 자동 재시도(retry callback 정책 — Task 6에서 추가).
 */
const payloadSchema = z.object({
  messageId: z.string().uuid(),
});

export const POST = handleCallback(async (rawMessage: unknown) => {
  const { messageId } = payloadSchema.parse(
    rawMessage,
  ) satisfies ProcessInboundJob;
  await generateAndStoreReply(messageId);
});
