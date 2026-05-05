import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { createInstagramAdapter } from "@/lib/inbox/instagram-adapter";
import { processInbound } from "@/lib/inbox/process-inbound";
import {
  upsertCustomer,
  updateCustomerProfile,
} from "@/shared/lib/dal/customers";
import {
  upsertConversation,
  setMessagingWindow,
  updateLastMessage,
  incrementUnread,
} from "@/shared/lib/dal/conversations";
import { insertMessage } from "@/shared/lib/dal/messages";
import { findStoreByExternalAccount } from "@/shared/lib/dal/stores";
import { getIntegration } from "@/shared/lib/dal/store-integrations";
import { mapLocaleToLanguage } from "@/lib/inbox/locale-to-language";
import { WebhookSignatureError } from "@/shared/lib/errors";

// 모듈 로드 시 1회만 인스턴스화. IG_APP_SECRET 변경 시 서버 재시작 필요.
const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

const REPLAY_WINDOW_MS = 5 * 60 * 1000;
const MAX_CHALLENGE_LEN = 256;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  if (
    params.get("hub.mode") === "subscribe" &&
    params.get("hub.verify_token") === env.IG_WEBHOOK_VERIFY_TOKEN
  ) {
    // hub.challenge는 Meta가 짧은 알파벳 토큰으로 발송. 길이 제한으로 amplifier 방어.
    const challenge = (params.get("hub.challenge") ?? "").slice(
      0,
      MAX_CHALLENGE_LEN,
    );
    return new NextResponse(challenge, { status: 200 });
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

      // CC-4: profile enrichment — customer.name === null 시 IG fetch + 갱신.
      // 신규 customer + 기존 customer (name 미설정 backfill 대상) 모두 처리.
      // 실패 silent skip + Sentry tag — 메시지 처리 흐름 차단 X.
      // PII 방어: customer.id는 8자만 노출 (storeId 패턴 일관).
      if (customer.name === null) {
        const integration = await getIntegration(db, store.id, "instagram");
        if (integration) {
          try {
            const profile = await fetchInstagramApiClient.fetchUserProfile({
              igUserId: m.senderExternalId,
              accessToken: integration.accessToken,
            });
            const language = mapLocaleToLanguage(profile.locale);
            await updateCustomerProfile(db, customer.id, {
              name: profile.name,
              ...(language !== null ? { preferredLanguage: language } : {}),
            });
          } catch (profileErr) {
            // Sentry tag에 storeId 8자 포함 (Code MED-4 사후 리뷰) — 매장별
            // fetch 실패율 추적. customer는 8자만 (PII 방어 패턴 일관).
            Sentry.captureException(profileErr, {
              tags: {
                phase: "fetchUserProfile",
                storeIdShort: store.id.slice(0, 8),
              },
              extra: { customerIdShort: customer.id.slice(0, 8) },
            });
          }
        }
      }

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
