import { Liveblocks } from "@liveblocks/node"

const secret = process.env.LIVEBLOCKS_SECRET_KEY

if (!secret) {
  throw new Error("LIVEBLOCKS_SECRET_KEY is not set")
}

// The node client is a thin wrapper over `fetch` with no connection to keep
// alive, so unlike the database pool it is safe to re-create on hot reload.
export const liveblocks = new Liveblocks({ secret })
