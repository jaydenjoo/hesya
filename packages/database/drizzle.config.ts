import { config } from "dotenv";
import { dirname, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "drizzle-kit";

const __dirname = dirname(fileURLToPath(import.meta.url));
config({ path: resolve(__dirname, "../../apps/web/.env.local") });

if (!process.env.DATABASE_URL) {
  throw new Error(
    "DATABASE_URL is not set. Expected at apps/web/.env.local (loaded by drizzle.config.ts).",
  );
}

export default defineConfig({
  dialect: "postgresql",
  schema: resolve(__dirname, "./src/schema/index.ts"),
  out: resolve(__dirname, "./migrations"),
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
