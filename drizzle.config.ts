import { loadEnvConfig } from "@next/env"
import { defineConfig } from "drizzle-kit"

// drizzle-kit runs outside the Next.js runtime, so nothing has read .env.local
// for us yet.
loadEnvConfig(process.cwd())

const connectionString = process.env.DATABASE_URL_UNPOOLED

if (!connectionString) {
  throw new Error("DATABASE_URL_UNPOOLED is not set")
}

export default defineConfig({
  schema: "./db/schema.ts",
  out: "./drizzle",
  dialect: "postgresql",
  // Migrations must use the direct connection: PgBouncer runs the pooled
  // endpoint in transaction mode, which drops the session state DDL relies on.
  dbCredentials: { url: connectionString },
})
