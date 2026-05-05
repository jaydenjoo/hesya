import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { cookies } from "next/headers";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { createInstagramAdapter } from "@/lib/inbox/instagram-adapter";
import {
  upsertIntegration,
  markWebhookSubscribed,
} from "@/shared/lib/dal/store-integrations";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ig_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL(`/ko/store/inbox/connect?error=state_mismatch`, req.url),
    );
  }
  cookieStore.delete("ig_oauth_state");

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch {
    return NextResponse.redirect(
      new URL(`/ko/sign-in?next=/ko/store/inbox/connect`, req.url),
    );
  }

  try {
    const exchanged = await adapter.exchangeCode(code, env.IG_REDIRECT_URI);
    const db = createDbClient(env.DATABASE_URL);
    await upsertIntegration(db, {
      storeId: session.storeId,
      channel: "instagram",
      externalAccountId: exchanged.externalAccountId,
      externalPageId: exchanged.externalPageId,
      externalAccountName: exchanged.externalAccountName,
      accessToken: exchanged.accessToken,
      tokenExpiresAt: exchanged.expiresAt,
      scopes: exchanged.scopes,
    });
    await fetchInstagramApiClient.subscribeWebhook({
      pageId: exchanged.externalAccountId,
      accessToken: exchanged.accessToken,
    });
    await markWebhookSubscribed(db, session.storeId, "instagram");

    return NextResponse.redirect(
      new URL(`/ko/store/inbox?connected=instagram`, req.url),
    );
  } catch (err) {
    Sentry.captureException(err, {
      tags: { route: "oauth:instagram", storeId: session.storeId },
    });
    const reason = err instanceof Error ? err.message : "unknown";
    return NextResponse.redirect(
      new URL(
        `/ko/store/inbox/connect?error=${encodeURIComponent(reason)}`,
        req.url,
      ),
    );
  }
}
