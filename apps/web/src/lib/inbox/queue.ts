import "server-only";
import { Client } from "@upstash/qstash";
import { env } from "@/shared/config/env";

/**
 * Phase 1C — QStash topic for inbound message processing.
 *
 * 비유: 우체국 소인(postmark)처럼, 이 문자열이 라우팅의 기준점이 된다.
 * Webhook route가 inbound INSERT 후 enqueueProcessInbound 호출 → QStash가
 * worker endpoint(`/api/queue/inbox-process-inbound`)를 push 호출.
 *
 * 전환 배경 (L-076 → L-077):
 * - Vercel Queue beta는 trigger registration이 새 deployment로 migration
 *   안 되는 server-side 결함이 있었다 (alias는 최신, worker invoke는 옛
 *   deployment로). customer-side patch 불가능.
 * - QStash(Upstash, GA, Vercel Marketplace native)로 전환. URL 기반 라우팅
 *   이라 deployment 변경 자동 반영(`hesya-web.vercel.app` alias가 항상 최신).
 */
export const INBOX_PROCESS_INBOUND_TOPIC = "inbox-process-inbound";

export type ProcessInboundJob = {
  messageId: string;
};

const WORKER_PATH = "/api/queue/inbox-process-inbound";
const RETRIES = 3;

let cachedClient: Client | null = null;

function getClient(): Client {
  if (cachedClient) return cachedClient;
  cachedClient = new Client({ token: env.QSTASH_TOKEN });
  return cachedClient;
}

function getWorkerUrl(): string {
  return `${env.NEXT_PUBLIC_APP_URL}${WORKER_PATH}`;
}

/**
 * Inbound 메시지 처리를 QStash에 enqueue.
 *
 * 호출 패턴: webhook route가 DB INSERT 직후 호출 → 즉시 200 OK 반환.
 * Worker(`/api/queue/inbox-process-inbound`)가 별 process로 처리.
 *
 * Retry 정책: `retries: 3` → 총 4회 attempt (initial + 3 retries).
 * Exp backoff (12s, 2m28s, 30m8s) 후 자동 DLQ. 우리 worker route는
 * 마지막 시도(`Upstash-Retried: 3`) 시 Sentry capture + 200 OK로 종결.
 *
 * Throw 정책: caller(webhook route)가 Sentry capture + 200 OK 유지
 * (Meta retry 폭증 방어 우선). publishJSON 실패는 caller에 전파.
 */
export async function enqueueProcessInbound(messageId: string): Promise<void> {
  await getClient().publishJSON({
    url: getWorkerUrl(),
    body: { messageId } satisfies ProcessInboundJob,
    retries: RETRIES,
  });
}
