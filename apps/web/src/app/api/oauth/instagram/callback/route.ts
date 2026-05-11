import { NextRequest, NextResponse } from "next/server";
import * as Sentry from "@sentry/nextjs";
import { randomBytes } from "node:crypto";
import { cookies } from "next/headers";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { fetchInstagramApiClient } from "@/lib/inbox/instagram-api-client";
import { createInstagramAdapter } from "@/lib/inbox/instagram-adapter";
import type { ExchangeCodeResult } from "@/lib/inbox/types";
import {
  upsertIntegration,
  markWebhookSubscribed,
} from "@/shared/lib/dal/store-integrations";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";
import { ForbiddenError, UnauthorizedError } from "@/shared/lib/errors";

/**
 * Plan v3, M1.3: MOCK_IG_OAUTH=true 시 Meta exchange + webhook subscribe 우회.
 *
 * 가짜 access_token + externalAccountId 반환 → DB upsert 통과 → 외부인 시뮬에서
 * "Instagram 연결 완료" UX 도달. webhook 실 등록은 skip하지만 DB의
 * `webhookSubscribed` flag는 true로 표시 (UI 일관성).
 */
function buildMockExchangeResult(storeId: string): ExchangeCodeResult {
  const shortId = storeId.slice(0, 8);
  return {
    accessToken: `mock_token_${randomBytes(16).toString("hex")}`,
    expiresAt: new Date(Date.now() + 60 * 24 * 60 * 60 * 1000),
    externalAccountId: `mock_ig_${shortId}`,
    externalPageId: `mock_page_${shortId}`,
    externalAccountName: `Mock IG (${shortId})`,
    scopes: ["instagram_business_basic", "instagram_business_manage_messages"],
  };
}

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
    const exchanged = env.MOCK_IG_OAUTH
      ? buildMockExchangeResult(session.storeId)
      : await adapter.exchangeCode(code, env.IG_REDIRECT_URI);
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
    if (!env.MOCK_IG_OAUTH) {
      await fetchInstagramApiClient.subscribeWebhook({
        pageId: exchanged.externalAccountId,
        accessToken: exchanged.accessToken,
      });
    }
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
