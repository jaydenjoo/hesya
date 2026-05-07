/**
 * Phase 1C Task 13 — QStash 마이그 검증 스크립트 (일회용)
 *
 * 목적: QStash로 전환 후 publish → worker invoke → retry/DLQ 흐름이
 * Vercel Queue beta 동등 또는 우월하게 작동하는지 prod에서 검증.
 *
 * 비유: 새 우체국(QStash)이 정상으로 가동하는지 확인하기 위해 정상 편지
 * 1통 + 잘못된 주소의 편지 1통을 보내서 (a) 정상 편지는 배달 완료 (b)
 * 잘못된 편지는 4번 배달 시도 후 분실물 보관소(DLQ Sentry alert)로 가는지
 * 확인.
 *
 * 사전 조건:
 *   1. QStash 마이그 PR 머지 + prod 배포 완료
 *   2. Vercel Marketplace에서 Upstash QStash integration 연결 (Jayden manual)
 *   3. `vercel env pull --environment=production` 완료 (.env.local에 QSTASH_*)
 *
 * 실행:
 *   cd /Volumes/jayden-ssd/projects/hesya/apps/web
 *   pnpm tsx scripts/verify-qstash.ts
 *
 * 명명 규칙: `verify-*.ts` — 일회용 검증/통합 스크립트.
 */

import { Client } from "@upstash/qstash";

const APP_URL =
  process.env.NEXT_PUBLIC_APP_URL ?? "https://hesya-web.vercel.app";
const WORKER_URL = `${APP_URL}/api/queue/inbox-process-inbound`;

async function publish(
  client: Client,
  body: Record<string, unknown>,
  label: string,
): Promise<void> {
  console.log(`[publish:${label}] body=${JSON.stringify(body)}`);
  const startedAt = Date.now();
  const res = await client.publishJSON({
    url: WORKER_URL,
    body,
    retries: 3,
  });
  const elapsedMs = Date.now() - startedAt;
  console.log(
    `[publish:${label}] ok in ${elapsedMs}ms — messageId=${res.messageId}`,
  );
}

async function main(): Promise<void> {
  const token = process.env.QSTASH_TOKEN;
  if (!token) {
    console.error(
      "[error] QSTASH_TOKEN 누락 — Vercel Marketplace integration 연결 + env pull 후 재시도",
    );
    process.exitCode = 1;
    return;
  }
  const client = new Client({ token });

  // (G2) 정상 publish — 실 messageId UUID. handler가 generateAndStoreReply를
  // 호출하지만 prod DB의 실제 데이터에 의존하므로 200 응답까지만 확인.
  // (테스트 데이터 messageId는 운영 DB에 없을 수 있음 — generateAndStoreReply가
  // throw하면 retry로 전환되어 DLQ까지 갈 수 있음. 실 메시지 검증은 IG 웹훅을
  // 통한 enqueue 흐름으로 별도 확인.)
  await publish(
    client,
    { messageId: "00000000-0000-4000-8000-000000000001" },
    "valid-shape",
  );

  // (G3) invalid payload — Zod parse fail 의도. 4회 retry 후 DLQ Sentry alert.
  await publish(client, { messageId: "not-a-uuid" }, "invalid-shape");

  console.log("");
  console.log("다음 단계:");
  console.log(`  1. Vercel Functions logs(${WORKER_URL}) 모니터링`);
  console.log(
    `     URL: https://vercel.com/jaydens-projects-f5e92399/hesya-web/logs`,
  );
  console.log(
    `  2. invalid publish는 ~30분 안 4회 invoke (retried 0→1→2→3) 후 200 ok+dlq:true`,
  );
  console.log(
    `  3. Sentry: phase=queue:inbox.process-inbound:dlq tag로 새 alert 도달`,
  );
  console.log(`     extra.retried=3 + extra.messageId='not-a-uuid'`);
}

main().catch((err: unknown) => {
  console.error("[error] verify-qstash failed:", err);
  process.exitCode = 1;
});
