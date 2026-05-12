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
