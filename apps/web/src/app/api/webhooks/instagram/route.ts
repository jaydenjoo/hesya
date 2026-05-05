import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { createInstagramAdapter } from "@/lib/inbox/instagram-adapter";
import { processInbound } from "@/lib/inbox/process-inbound";
import { upsertCustomer } from "@/shared/lib/dal/customers";
import {
  upsertConversation,
  setMessagingWindow,
  updateLastMessage,
  incrementUnread,
} from "@/shared/lib/dal/conversations";
import { insertMessage } from "@/shared/lib/dal/messages";
import { findStoreByExternalAccount } from "@/shared/lib/dal/stores";
import { WebhookSignatureError } from "@/shared/lib/errors";

const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

const REPLAY_WINDOW_MS = 5 * 60 * 1000;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  if (
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === env.IG_WEBHOOK_VERIFY_TOKEN
  ) {
    return new NextResponse(params.get("hub.challenge") ?? "", { status: 200 });
  }
  return new NextResponse("forbidden", { status: 403 });
}

export async function POST(req: NextRequest): Promise<NextResponse> {
  // H-4: replay defense — X-Hub-Timestamp 5분 윈도우 검증.
  // Meta가 이 헤더를 보내지 않는 경우 401로 차단되며, 그 시점에 entry.time 기반
  // fallback으로 전환을 검토한다 (별 PR).
  const tsHeader = req.headers.get("x-hub-timestamp");
  const ts = tsHeader ? Number(tsHeader) : NaN;
  if (!Number.isFinite(ts) || Math.abs(Date.now() - ts) > REPLAY_WINDOW_MS) {
    return new NextResponse("stale or missing timestamp", { status: 401 });
  }

  const rawBody = await req.text();
  const signature = req.headers.get("x-hub-signature-256") ?? "";

  let inbound;
  try {
    inbound = await adapter.parseInbound(rawBody, signature, env.IG_APP_SECRET);
  } catch (err) {
    if (err instanceof WebhookSignatureError) {
      Sentry.captureException(err, { tags: { route: "webhook:instagram" } });
      return new NextResponse("invalid signature", { status: 401 });
    }
    Sentry.captureException(err, {
      tags: { route: "webhook:instagram", phase: "parse" },
    });
    // schema mismatch는 200 — Meta retry 차단 (잘못된 payload 무한 재전송 방지)
    return new NextResponse("ok", { status: 200 });
  }

  const db = createDbClient(env.DATABASE_URL);

  try {
    for (const m of inbound) {
      const store = await findStoreByExternalAccount(db, {
        channel: "instagram",
        externalAccountId: m.recipientExternalId,
      });
      if (!store) continue;

      const customer = await upsertCustomer(db, {
        channel: "instagram",
        externalId: m.senderExternalId,
      });
      if (!customer) continue;

      const conv = await upsertConversation(db, {
        storeId: store.id,
        customerId: customer.id,
        channel: "instagram",
        externalThreadId: m.externalThreadId,
      });

      const inserted = await insertMessage(db, {
        conversationId: conv.id,
        channel: "instagram",
        direction: "inbound",
        originalText: m.text,
        externalMessageId: m.externalMessageId,
      });
      if (!inserted) continue;

      await setMessagingWindow(db, conv.id, m.receivedAt);
      await updateLastMessage(db, conv.id, {
        preview: m.text.slice(0, 80),
        at: m.receivedAt,
      });
      await incrementUnread(db, conv.id);

      void processInbound(inserted.id).catch((e) =>
        Sentry.captureException(e, { tags: { phase: "processInbound" } }),
      );
    }
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "webhook:instagram", phase: "persist" },
    });
    return new NextResponse("error", { status: 500 });
  }

  return new NextResponse("ok", { status: 200 });
}
