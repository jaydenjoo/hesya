import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { magicLink } from "better-auth/plugins/magic-link";
import type { DbClient } from "@hesya/database";

export interface CreateAuthInput {
  db: DbClient;
  secret: string;
  baseURL: string;
  google: {
    clientId: string;
    clientSecret: string;
  };
  /**
   * M3.4 — magic link 발송 핸들러. apps/web에서 Resend로 구현 주입.
   * undefined면 plugin 미등록 → customer mypage 흐름 비활성 (owner-only 모드).
   */
  sendMagicLink?: (data: { email: string; url: string }) => Promise<void>;
}

export function createAuth({
  db,
  secret,
  baseURL,
  google,
  sendMagicLink,
}: CreateAuthInput) {
  return betterAuth({
    database: drizzleAdapter(db, { provider: "pg", usePlural: true }),
    secret,
    baseURL,
    // Match our Drizzle schema: id columns are uuid + gen_random_uuid().
    // Without this, Better Auth sends a 32-char nanoid which Postgres rejects
    // with "invalid input syntax for type uuid".
    advanced: { database: { generateId: "uuid" } },
    // Plan v3 M6.6 Phase 4 — 매 nav마다 `sessions` row SELECT 1건이 발생해 ICN1
    // 함수와 Seoul Supabase 간이지만 누적 latency 큼. 5분 cookie cache로
    // `getSession()` 호출 대다수를 DB-free로 처리. 보안 trade-off: 로그아웃/세션
    // 무효화 반영이 최대 5분 지연. owner UI는 결제·신원변경을 즉시 요구하는 흐름이
    // 없고 (베타 outbound 메시지는 별도 가드), 5분 lag 허용 범위로 판단.
    session: {
      cookieCache: { enabled: true, maxAge: 5 * 60 },
    },
    emailAndPassword: { enabled: true },
    socialProviders: {
      google: {
        clientId: google.clientId,
        clientSecret: google.clientSecret,
      },
    },
    plugins: sendMagicLink
      ? [
          magicLink({
            expiresIn: 15 * 60, // 15분
            allowedAttempts: 3,
            rateLimit: { window: 300, max: 3 }, // 5분/3회 (email enumeration 방어)
            sendMagicLink: async ({ email, url }) => {
              await sendMagicLink({ email, url });
            },
          }),
        ]
      : [],
  });
}

export type Auth = ReturnType<typeof createAuth>;
