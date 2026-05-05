"use server";

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { env } from "@/shared/config/env";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const STATE_TTL_SECONDS = 5 * 60;

/**
 * Instagram OAuth 시작 URL 생성. 클라이언트가 받은 URL로 redirect → Instagram
 * 동의 화면 → callback route로 돌아옴 (state cookie 비교).
 *
 * 반환 envelope 미사용 사유: 클라이언트는 이 string을 그대로 `window.location`에
 * 넣어 redirect한다. `{ ok, data }` 봉투는 client-side parse 단계만 추가해 부담.
 */
export async function getInstagramOAuthUrl(): Promise<string> {
  await requireStoreOwnerAuth();

  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    // 로컬 HTTP 환경(개발)에서 쿠키 미설정 방지 — prod에서만 secure 강제.
    secure: env.NODE_ENV === "production",
    sameSite: "lax",
    maxAge: STATE_TTL_SECONDS,
    path: "/",
  });
  const url = new URL("https://www.instagram.com/oauth/authorize");
  url.searchParams.set("client_id", env.IG_APP_ID);
  url.searchParams.set("redirect_uri", env.IG_REDIRECT_URI);
  url.searchParams.set(
    "scope",
    "instagram_business_basic,instagram_business_manage_messages",
  );
  url.searchParams.set("response_type", "code");
  url.searchParams.set("state", state);
  return url.toString();
}
