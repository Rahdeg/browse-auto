import { Pool } from "@neondatabase/serverless"
import { drizzle } from "drizzle-orm/neon-serverless"

import * as schema from "./schema"

const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  throw new Error("DATABASE_URL is not set")
}

// `next dev` re-evaluates modules on every hot reload, which would leak a pool
// per edit. Keep one on globalThis, which survives reloads.
const globalForDb = globalThis as typeof globalThis & {
  __neonPool?: Pool
}

const pool = (globalForDb.__neonPool ??= new Pool({ connectionString }))

export const db = drizzle(pool, { schema })
