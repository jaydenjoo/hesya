import "server-only";

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
export const INBOX_PROCESS_INBOUND_TOPIC = "inbox.process-inbound";

export type ProcessInboundJob = {
  messageId: string;
};
