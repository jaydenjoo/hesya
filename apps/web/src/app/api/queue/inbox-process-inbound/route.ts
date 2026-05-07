import * as Sentry from "@sentry/nextjs";
import { verifySignatureAppRouter } from "@upstash/qstash/nextjs";
import { z } from "zod";
import { generateAndStoreReply } from "@/features/inbox/ai/generate-and-store-reply";
import type { ProcessInboundJob } from "@/lib/inbox/queue";

/**
 * Phase 1C — QStash worker for inbound message processing.
 *
 * 전환 배경 (L-076 → L-077): Vercel Queue beta deployment pinning 결함으로
 * QStash(Upstash GA)로 전환. URL 기반 라우팅이라 deployment migration 자동.
 *
 * 비유: 우체국 배달부(QStash)가 소포(messageId)를 가지고 이 문(route)을
 * 두드리면, 문지기(verifySignatureAppRouter)가 정품 서명 확인 후 처리
 * 함수에 전달한다.
 *
 * Retry 정책 (publish 측 `retries: 3`과 페어링):
 * - `Upstash-Retried` header: 0(첫 시도), 1, 2, 3
 * - retried < 3 + handler throw → 500 응답 → QStash 자동 retry (exp backoff)
 * - retried === 3 + handler throw → Sentry alert + 200 OK 종결 (DLQ 우리
 *   alert만 사용, QStash native DLQ는 보존)
 * - retried 무관 + 정상 처리 → 200 OK
 *
 * 자세한 마이그 진단/근거: docs/superpowers/specs/2026-05-07-qstash-migration.md
 */
const payloadSchema = z.object({
  messageId: z.string().uuid(),
});

const MAX_RETRIES = 3;

async function handler(request: Request): Promise<Response> {
  const retried = Number(request.headers.get("Upstash-Retried") ?? "0");
  const rawBody = (await request.json()) as unknown;

  let payload: ProcessInboundJob;
  try {
    payload = payloadSchema.parse(rawBody) satisfies ProcessInboundJob;
  } catch (err) {
    return handleFailure(err, retried, undefined);
  }

  try {
    await generateAndStoreReply(payload.messageId);
    return Response.json({ ok: true });
  } catch (err) {
    return handleFailure(err, retried, payload.messageId);
  }
}

function handleFailure(
  err: unknown,
  retried: number,
  messageId: string | undefined,
): Response {
  if (retried >= MAX_RETRIES) {
    Sentry.captureException(err, {
      tags: { phase: "queue:inbox.process-inbound:dlq" },
      extra: {
        messageId,
        retried,
      },
    });
    return Response.json({ ok: false, dlq: true }, { status: 200 });
  }
  return Response.json({ ok: false }, { status: 500 });
}

export const POST = verifySignatureAppRouter(handler);
