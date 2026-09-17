import { auth, clerkClient } from "@clerk/nextjs/server"
import type { NextRequest } from "next/server"

type UserInfo = Liveblocks["UserMeta"]["info"]

// Clerk caps the `userId` filter at 100 IDs per request, so larger batches are
// split across several calls.
const MAX_IDS_PER_REQUEST = 100

export async function POST(request: NextRequest) {
  const { userId, orgId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Rooms belong to an organization, so without an active one there is nobody
  // this caller is allowed to resolve.
  if (!orgId) {
    return new Response("No active organization", { status: 403 })
  }

  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return new Response("Expected a JSON body", { status: 400 })
  }

  const userIds = (payload as { userIds?: unknown } | null)?.userIds

  if (
    !Array.isArray(userIds) ||
    userIds.some((id) => typeof id !== "string" || id.length === 0)
  ) {
    return new Response("Expected `userIds` to be an array of strings", {
      status: 400,
    })
  }

  if (userIds.length === 0) {
    return Response.json([])
  }

  const uniqueIds = [...new Set(userIds as string[])]
  const chunks: string[][] = []

  for (let i = 0; i < uniqueIds.length; i += MAX_IDS_PER_REQUEST) {
    chunks.push(uniqueIds.slice(i, i + MAX_IDS_PER_REQUEST))
  }

  const client = await clerkClient()

  const pages = await Promise.all(
    chunks.map((chunk) =>
      client.users.getUserList({
        userId: chunk,
        // Scoping to the caller's organization means IDs outside it resolve to
        // `null` rather than leaking names and avatars across tenants.
        organizationId: [orgId],
        limit: chunk.length,
      })
    )
  )

  const infoById = new Map<string, UserInfo>()

  for (const page of pages) {
    for (const user of page.data) {
      infoById.set(user.id, {
        name:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress ??
          "Anonymous",
        avatar: user.hasImage ? user.imageUrl : undefined,
      })
    }
  }

  // Liveblocks' `resolveUsers` requires one entry per requested ID, in the same
  // order, with `null` for users it could not resolve.
  const users: (UserInfo | null)[] = (userIds as string[]).map(
    (id) => infoById.get(id) ?? null
  )

  return Response.json(users)
}
