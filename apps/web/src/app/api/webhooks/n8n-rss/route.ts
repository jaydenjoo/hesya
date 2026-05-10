import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createDbClient } from "@hesya/database";

import { env } from "@/shared/config/env";
import { insertApiPolicyAlert } from "@/shared/lib/dal/api-policy-alerts";

/**
 * E12-8 n8n RSS 워크플로 webhook receiver.
 *
 * n8n 워크플로(`tools/n8n/api-policy-rss.workflow.json`)가 30분마다 Meta/WhatsApp
 * 등 RSS 폴링 → 새 entry를 본 endpoint로 POST. unique(source, guid)로 중복 차단.
 *
 * 인증: `X-Webhook-Secret` 헤더와 `env.N8N_WEBHOOK_SECRET` 일치 검증
 * (instagram HMAC보다 단순 — RSS 발신자가 n8n 단일).
 *
 * 응답 정책:
 * - 401: secret 불일치 — n8n 측 재시도 차단
 * - 422: body Zod 검증 실패 — n8n payload 형식 오류, 재시도 무의미
 * - 200 + inserted: true — 신규 entry 저장
 * - 200 + inserted: false — 중복 (idempotent skip)
 */

const bodySchema = z.object({
  source: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  link: z.url(),
  guid: z.string().min(1).max(500),
  pubDate: z.string().datetime().optional().nullable(),
});

export async function POST(req: NextRequest): Promise<Response> {
  // 1) secret 검증
  const provided = req.headers.get("x-webhook-secret") ?? "";
  if (provided !== env.N8N_WEBHOOK_SECRET) {
    Sentry.captureMessage("n8n-rss webhook secret mismatch", {
      level: "warning",
      tags: { route: "webhook:n8n-rss" },
    });
    return new NextResponse("invalid secret", { status: 401 });
  }

  // 2) body 파싱 + Zod 검증
  let parsed;
  try {
    const json = await req.json();
    parsed = bodySchema.parse(json);
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "webhook:n8n-rss", phase: "parse" },
    });
    return new NextResponse("invalid body", { status: 422 });
  }

  // 3) DAL insert (idempotent)
  try {
    const db = createDbClient(env.DATABASE_URL);
    const result = await insertApiPolicyAlert(db, {
      source: parsed.source,
      title: parsed.title,
      link: parsed.link,
      guid: parsed.guid,
      pubDate: parsed.pubDate ? new Date(parsed.pubDate) : null,
    });

    if (result.inserted) {
      Sentry.captureMessage("api-policy-alert received", {
        level: "warning",
        tags: {
          route: "webhook:n8n-rss",
          feature: "api-policy",
          source: parsed.source,
        },
        extra: {
          title: parsed.title,
          link: parsed.link,
          alertId: result.alert?.id,
        },
      });
    }

    return NextResponse.json({
      ok: true,
      inserted: result.inserted,
      alertId: result.alert?.id,
    });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "webhook:n8n-rss", phase: "persist" },
    });
    return new NextResponse("server error", { status: 500 });
  }
}
