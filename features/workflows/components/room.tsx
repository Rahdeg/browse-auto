"use client"

import { ReactNode } from "react"
import { useRouter } from "next/navigation"
import {
  LiveblocksProvider,
  RoomProvider,
  ClientSideSuspense,
  useEventListener,
  useSelf,
} from "@liveblocks/react/suspense"
import { toast } from "sonner"

import { Spinner } from "@/components/ui/spinner"

// Deleting a workflow deletes its room, which on its own would just drop
// everyone else's canvas mid-edit and leave them to find out on their next
// load. The delete broadcasts into the room first, so anyone still in it hears
// why and leaves for the home page instead.
function DeletedListener() {
  const router = useRouter()
  const self = useSelf()

  useEventListener(({ event }) => {
    if (event.type !== "workflowDeleted") return

    // Whoever asked for the delete is already being redirected by the action,
    // and is confirmed to on the page it lands them on.
    if (event.deletedBy === self.id) return

    toast.info("This workflow was deleted")
    // `replace`, because the workflow behind the current entry is gone.
    router.replace("/")
  })

  return null
}

export function Room({
  roomId,
  children,
}: {
  roomId: string
  children: ReactNode
}) {
  return (
    <LiveblocksProvider
      throttle={16}
      authEndpoint="/api/liveblocks/auth"
      resolveUsers={async ({ userIds }) => {
        try {
          const response = await fetch("/api/liveblocks/users", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userIds }),
          })

          if (!response.ok) {
            return undefined
          }

          return await response.json()
        } catch {
          // Leaving users unresolved is better than breaking the room — they
          // render as anonymous until the next resolve attempt.
          return undefined
        }
      }}
    >
      <RoomProvider id={roomId}>
        <ClientSideSuspense fallback={
          <div className="flex min-h-svh items-center justify-center">
            <Spinner className="size-6 text-muted-foreground" />
          </div>
        }>
          {/* Inside the suspense boundary because `useSelf` suspends until the
              room is connected — which is also the point from which there are
              events to hear. */}
          <DeletedListener />
          {children}
        </ClientSideSuspense>
      </RoomProvider>
    </LiveblocksProvider>
  )
}
