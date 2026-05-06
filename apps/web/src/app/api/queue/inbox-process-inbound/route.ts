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
 * Retry 정책 (D2): 3회 exponential backoff (1s/5s/30s). 4회째 deliveryCount
 * 도달 시 acknowledge → DLQ 격리 (application-level — Vercel Queues는
 * built-in DLQ 없음). Sentry alert는 Task 7에서 추가.
 */
const payloadSchema = z.object({
  messageId: z.string().uuid(),
});

const RETRY_BACKOFFS_SECONDS = [1, 5, 30] as const;

export const POST = handleCallback(
  async (rawMessage: unknown) => {
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
