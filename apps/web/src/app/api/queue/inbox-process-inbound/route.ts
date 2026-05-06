import * as Sentry from "@sentry/nextjs";
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
 * Retry 정책 (D2 + D6 callback workaround):
 * - SDK 0.1.6 callback push 모드에서 `{ afterSeconds }` directive가
 *   `MessageNotFoundError` (404 changeVisibility)로 silent fail → 메시지가
 *   1회 invoke 후 종결되는 베타 결함이 있다. 우리는 directive를 반환하지
 *   않고 SDK가 throw를 전파하도록 두어, callback이 5xx 응답 → server-side
 *   visibility timeout(60s) 만료 후 자동 redelivery로 retry를 구현한다.
 * - deliveryCount 1~3: undefined 반환 → throw 전파 → 60s 후 재시도
 * - deliveryCount 4: DLQ 격리 → Sentry alert + acknowledge (D3)
 * - 1+5+30s 지수 백오프 패턴은 SDK 결함이 fix될 때 복구. 자세한 진단:
 *   docs/superpowers/specs/2026-05-06-vercel-queue-callback-retry-issue.md
 */
const payloadSchema = z.object({
  messageId: z.string().uuid(),
});

const MAX_DELIVERY_COUNT = 4;
const VISIBILITY_TIMEOUT_SECONDS = 60;

export const POST = handleCallback(
  async (rawMessage: unknown) => {
    const { messageId } = payloadSchema.parse(
      rawMessage,
    ) satisfies ProcessInboundJob;
    await generateAndStoreReply(messageId);
  },
  {
    visibilityTimeoutSeconds: VISIBILITY_TIMEOUT_SECONDS,
    retry: (err, metadata) => {
      if (metadata.deliveryCount < MAX_DELIVERY_COUNT) {
        return; // undefined → SDK가 throw 전파 → callback 5xx → server redelivery
      }
      Sentry.captureException(err, {
        tags: { phase: "queue:inbox.process-inbound:dlq" },
        extra: {
          queueMessageId: metadata.messageId,
          deliveryCount: metadata.deliveryCount,
        },
      });
      return { acknowledge: true };
    },
  },
);
