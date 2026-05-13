import { createAuth } from "@hesya/auth";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";
import { sendCustomerMagicLink } from "@/lib/notifications/customer-magic-link";
import { sendOwnerMagicLink } from "@/lib/notifications/owner-magic-link";

const db = createDbClient(env.DATABASE_URL);

// Better Auth가 넘기는 url은 verify endpoint `/api/auth/magic-link/verify?token=...&callbackURL=...`.
// 톤 분기는 callbackURL query param의 path가 customer 흐름(`/{locale}/c/...`)인지로 결정.
async function routeMagicLink(input: { email: string; url: string }) {
  try {
    const parsed = new URL(input.url);
    const callback = parsed.searchParams.get("callbackURL") ?? "";
    // callback은 보통 `/ko/c/mypage?locale=ko` 형태. 두 번째 segment가 "c"면 손님.
    const segs = callback.split("?")[0].split("/").filter(Boolean);
    if (segs[1] === "c") {
      return sendCustomerMagicLink(input);
    }
  } catch {
    // url parse 실패 — owner fallback
  }
  return sendOwnerMagicLink(input);
}

export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
  sendMagicLink: routeMagicLink,
});
