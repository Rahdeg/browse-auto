import { auth, currentUser } from "@clerk/nextjs/server"

import { liveblocks } from "@/lib/liveblocks"

export async function POST() {
  const { userId, orgId } = await auth()

  if (!userId) {
    return new Response("Unauthorized", { status: 401 })
  }

  // Rooms are owned by an organization, so without an active one there is no
  // group to scope this token to and nothing the user may join.
  if (!orgId) {
    return new Response("No active organization", { status: 403 })
  }

  const user = await currentUser()

  if (!user) {
    return new Response("Unauthorized", { status: 401 })
  }

  // ID tokens carry identity only — the room's `groupsAccesses` decides what
  // this user can actually do, so passing Clerk's `orgId` as the single group
  // keeps access scoped to rooms that grant it to that organization.
  const { status, body } = await liveblocks.identifyUser(
    {
      userId,
      groupIds: [orgId],
      organizationId: orgId,
    },
    {
      userInfo: {
        name:
          user.fullName ??
          user.username ??
          user.primaryEmailAddress?.emailAddress ??
          "Anonymous",
        avatar: user.hasImage ? user.imageUrl : undefined,
      },
    }
  )

  return new Response(body, { status })
}
