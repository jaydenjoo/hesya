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
  // Relative paths only — drizzle-kit 0.31.x prepends './' even to absolute paths,
  // creating malformed './/Volumes/...' lookups. Always invoke via
  // `pnpm --filter @hesya/database db:generate` so cwd is the package root.
  schema: "./src/schema/index.ts",
  out: "./migrations",
  dbCredentials: { url: process.env.DATABASE_URL },
  strict: true,
  verbose: true,
});
