"use server";

import { cookies } from "next/headers";
import { randomBytes } from "node:crypto";
import { env } from "@/shared/config/env";
import { requireStoreOwnerAuth } from "@/shared/lib/store-owner-guard";

const STATE_TTL_SECONDS = 5 * 60;

export async function getInstagramOAuthUrl(): Promise<string> {
  await requireStoreOwnerAuth();

  const state = randomBytes(32).toString("hex");
  const cookieStore = await cookies();
  cookieStore.set("ig_oauth_state", state, {
    httpOnly: true,
    secure: true,
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
