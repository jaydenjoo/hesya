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
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";

// 모듈 로드 시 1회만 인스턴스화. IG_APP_SECRET 변경 시 서버 재시작 필요.
const adapter = createInstagramAdapter(fetchInstagramApiClient, {
  appId: env.IG_APP_ID,
  appSecret: env.IG_APP_SECRET,
});

// req.url의 Host 헤더 변조에 따른 open-redirect 방지.
const baseUrl = env.NEXT_PUBLIC_APP_URL;

export async function GET(req: NextRequest): Promise<NextResponse> {
  const params = req.nextUrl.searchParams;
  const code = params.get("code");
  const state = params.get("state");
  const cookieStore = await cookies();
  const expectedState = cookieStore.get("ig_oauth_state")?.value;

  if (!code || !state || !expectedState || state !== expectedState) {
    return NextResponse.redirect(
      new URL(`/ko/store/inbox/connect?error=state_mismatch`, baseUrl),
    );
  }
  cookieStore.delete("ig_oauth_state");

  let session;
  try {
    session = await requireStoreOwnerAuth();
  } catch (err) {
    if (err instanceof UnauthorizedError || err instanceof ForbiddenError) {
      return NextResponse.redirect(
        new URL(`/ko/sign-in?next=/ko/store/inbox/connect`, baseUrl),
      );
    }
    // 알 수 없는 에러는 Next.js 500 처리에 위임 (Sentry instrumentation이 자동 캡처)
    throw err;
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
      new URL(`/ko/store/inbox?connected=instagram`, baseUrl),
    );
  } catch (err) {
    // S3: PII 최소화 — storeId 8자 short (다른 Sentry tag와 일관 패턴).
    Sentry.captureException(err, {
      tags: {
        route: "oauth:instagram",
        storeIdShort: session.storeId.slice(0, 8),
      },
    });
    // err.message는 Sentry로만 — URL에는 안전한 카테고리 코드만 노출.
    return NextResponse.redirect(
      new URL(`/ko/store/inbox/connect?error=exchange_failed`, baseUrl),
    );
  }
}
