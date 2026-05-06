/**
 * Phase 1C Task 13 — DLQ workaround 검증 스크립트 (일회용)
 *
 * 목적: 의도적으로 invalid payload(`messageId: "not-a-uuid"`)를 prod queue
 * `inbox-process-inbound`에 publish → worker route가 Zod parse fail로 throw →
 * D6 workaround로 60s 간격 4회 invoke 후 DLQ 격리 + Sentry alert 도달 검증.
 *
 * 비유: 우체국에 일부러 잘못 적힌 주소의 소포를 넣어서, 배달부가 4번 배달
 * 시도 후 분실물 보관소(DLQ)로 보낸다는 것을 확인하는 시뮬레이션.
 *
 * 사전 조건:
 *   1. PR #76 prod 배포 완료 (workaround 코드가 prod에 있어야 함)
 *   2. `vercel link` 완료 (apps/web/.vercel/project.json 존재)
 *   3. `vercel env pull --environment=production` 완료 (.env.local에 OIDC 토큰)
 *
 * 실행:
 *   cd /Volumes/jayden-ssd/projects/hesya/apps/web
 *   pnpm tsx scripts/verify-dlq-publish.ts
 *
 * 명명 규칙: `verify-*.ts` — 일회용 검증/통합 스크립트. tdd-guard hook이 이
 * 패턴을 우회 처리(.claude/hooks/tdd-guard-filtered.sh). L-027 정신 — 실 외부
 * API 동작이 source of truth, unit test로 격리 부적절.
 */

import { QueueClient } from "@vercel/queue";

async function main(): Promise<void> {
  const topic = "inbox-process-inbound";
  const payload = { messageId: "not-a-uuid" };

  // 외부(로컬) 환경에서 실행 — deployment pinning 해제 (prod의 어느 deployment든
  // worker가 받게). region 자동 fallback(iad1) 사용 — prod worker region이
  // 다르면 별도 region 명시 필요.
  const client = new QueueClient({ deploymentId: null });

  console.log(`[publish] topic=${topic} payload=${JSON.stringify(payload)}`);
  const startedAt = Date.now();

  const result = await client.send(topic, payload);

  const elapsedMs = Date.now() - startedAt;
  console.log(`[publish] ok in ${elapsedMs}ms`);
  console.log(`[publish] messageId=${result.messageId ?? "(deferred)"}`);

  if (result.messageId === null) {
    console.warn(
      "[warn] messageId가 null — server가 deferred 처리. 정상 흐름이지만 로그 매칭은 어렵다.",
    );
  }

  console.log("");
  console.log("다음 단계:");
  console.log(
    `  1. Vercel Functions logs(/api/queue/inbox-process-inbound) 모니터링`,
  );
  console.log(
    `     URL: https://vercel.com/jaydens-projects-f5e92399/hesya-web/logs`,
  );
  console.log(
    `  2. ~3분 동안 60s 간격 4회 invoke 확인 (deliveryCount 1→2→3→4)`,
  );
  console.log(
    `  3. Sentry: phase=queue:inbox.process-inbound:dlq tag로 새 alert 확인`,
  );
  console.log(
    `     queueMessageId=${result.messageId ?? "(deferred)"} extra와 매칭`,
  );
}

main().catch((err: unknown) => {
  console.error("[publish] failed:", err);
  process.exitCode = 1;
});
