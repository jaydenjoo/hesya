import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import type { DbClient } from "@hesya/database";

export interface CreateAuthInput {
  db: DbClient;
  secret: string;
  baseURL: string;
  google: {
    clientId: string;
    clientSecret: string;
  };
}

export function createAuth({ db, secret, baseURL, google }: CreateAuthInput) {
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
  });
}

export type Auth = ReturnType<typeof createAuth>;
