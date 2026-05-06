import "server-only";
import { send } from "@vercel/queue";

/**
 * Phase 1C — Vercel Queue topic for inbound message processing.
 *
 * 비유: 우체국 소인(postmark)처럼, 이 문자열이 라우팅의 기준점이 된다.
 * Webhook route가 inbound INSERT 후 enqueue → Vercel Queue가 worker
 * endpoint(`/api/queue/inbox-process-inbound`)를 push 호출.
 *
 * vercel.json `experimentalTriggers`의 topic name과 정확히 일치해야 함.
 * 한 글자라도 다르면 Vercel Queue가 worker를 찾지 못해 메시지 유실.
 */
export const INBOX_PROCESS_INBOUND_TOPIC = "inbox-process-inbound";

export type ProcessInboundJob = {
  messageId: string;
};

/**
 * Inbound 메시지 처리를 Vercel Queue에 enqueue.
 *
 * 호출 패턴: webhook route가 DB INSERT 직후 호출 → 즉시 200 OK 반환.
 * Worker(`/api/queue/inbox-process-inbound`)가 별 process로 처리.
 *
 * Throw 정책: caller(webhook route)가 Sentry capture + 200 OK 유지
 * (Meta retry 폭증 방어 우선).
 */
export async function enqueueProcessInbound(messageId: string): Promise<void> {
  await send(INBOX_PROCESS_INBOUND_TOPIC, {
    messageId,
  } satisfies ProcessInboundJob);
}
