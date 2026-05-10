import { timingSafeEqual } from "node:crypto";
import { NextResponse, type NextRequest } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { z } from "zod";
import { createDbClient } from "@hesya/database";

import { env } from "@/shared/config/env";
import { insertApiPolicyAlert } from "@/shared/lib/dal/api-policy-alerts";
import { checkRateLimit, RateLimitError } from "@/shared/lib/rate-limit";

/**
 * E12-8 n8n RSS 워크플로 webhook receiver.
 *
 * n8n 워크플로(`tools/n8n/api-policy-rss.workflow.json`)가 30분마다 Meta/WhatsApp
 * 등 RSS 폴링 → 새 entry를 본 endpoint로 POST. unique(source, guid)로 중복 차단.
 *
 * 보안:
 * - `X-Webhook-Secret` timing-safe 비교 (단순 string equality는 timing oracle 취약)
 * - body size 64KB 상한 (DoS 방지)
 * - IP 기반 rate limit 분당 10회 (secret brute-force 차단)
 * - link scheme http(s) only (javascript:/data: XSS 차단 — admin 클릭 시 직접 실행 가능)
 * - response에 alertId 미노출 (정보 누출 최소화)
 *
 * 응답 정책:
 * - 401: secret 불일치 — n8n 측 재시도 차단
 * - 413: body 너무 큼
 * - 422: body Zod 검증 실패 — n8n payload 형식 오류, 재시도 무의미
 * - 429: rate limit 초과
 * - 200 + inserted: true — 신규 entry 저장
 * - 200 + inserted: false — 중복 (idempotent skip)
 */

const MAX_BODY_BYTES = 64 * 1024; // 64KB

const bodySchema = z.object({
  source: z.string().min(1).max(100),
  title: z.string().min(1).max(500),
  link: z
    .url()
    .refine((u) => u.startsWith("http://") || u.startsWith("https://"), {
      error: "link must be http(s) URL",
    }),
  guid: z.string().min(1).max(500),
  pubDate: z.string().datetime().optional().nullable(),
});

function getClientIp(req: NextRequest): string {
  const forwarded = req.headers.get("x-forwarded-for");
  if (forwarded) {
    const first = forwarded.split(",")[0]?.trim();
    if (first) return first;
  }
  return req.headers.get("x-real-ip") ?? "unknown";
}

function isSecretValid(provided: string, expected: string): boolean {
  const a = Buffer.from(provided);
  const b = Buffer.from(expected);
  if (a.length !== b.length) return false;
  return timingSafeEqual(a, b);
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // 1) IP 기반 rate limit (secret brute-force 방어 — 분당 10회)
  const clientIp = getClientIp(req);
  try {
    await checkRateLimit(`webhook:n8n-rss:${clientIp}`, {
      max: 10,
      windowSec: 60,
    });
  } catch (err) {
    if (err instanceof RateLimitError) {
      return new NextResponse("rate limit exceeded", {
        status: 429,
        headers: { "Retry-After": err.retryAfterSec.toString() },
      });
    }
    throw err;
  }

  // 2) body size 검사 (Content-Length 우선, 누락 시 read 후 길이 검사)
  const contentLength = req.headers.get("content-length");
  if (contentLength && Number(contentLength) > MAX_BODY_BYTES) {
    return new NextResponse("payload too large", { status: 413 });
  }

  // 3) secret 검증 (timing-safe)
  const provided = req.headers.get("x-webhook-secret") ?? "";
  if (!isSecretValid(provided, env.N8N_WEBHOOK_SECRET)) {
    Sentry.captureMessage("n8n-rss webhook secret mismatch", {
      level: "warning",
      tags: { route: "webhook:n8n-rss" },
    });
    return new NextResponse("invalid secret", { status: 401 });
  }

  // 4) body 파싱 + 길이 재검사 + Zod 검증
  let parsed;
  try {
    const raw = await req.text();
    if (raw.length > MAX_BODY_BYTES) {
      return new NextResponse("payload too large", { status: 413 });
    }
    parsed = bodySchema.parse(JSON.parse(raw));
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "webhook:n8n-rss", phase: "parse" },
    });
    return new NextResponse("invalid body", { status: 422 });
  }

  // 5) DAL insert (idempotent)
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
        },
      });
    }

    // 응답: alertId 미노출 (정보 누출 최소화). n8n은 inserted boolean만 사용.
    return NextResponse.json({ ok: true, inserted: result.inserted });
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "webhook:n8n-rss", phase: "persist" },
    });
    return new NextResponse("server error", { status: 500 });
  }
}
