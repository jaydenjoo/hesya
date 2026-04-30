import { createAuth } from "@hesya/auth";
import { createDbClient } from "@hesya/database";
import { env } from "@/shared/config/env";

const db = createDbClient(env.DATABASE_URL);

export const auth = createAuth({
  db,
  secret: env.BETTER_AUTH_SECRET,
  baseURL: env.BETTER_AUTH_URL,
  google: {
    clientId: env.GOOGLE_CLIENT_ID,
    clientSecret: env.GOOGLE_CLIENT_SECRET,
  },
});
