declare global {
  interface Liveblocks {
    UserMeta: {
      id: string
      info: {
        name: string
        avatar?: string
      }
    }

    // Broadcast events, for `useEventListener` and the node client's
    // `broadcastEvent`. Deleting a workflow deletes its room out from under
    // whoever is still in it, so the delete announces itself first and carries
    // the Clerk user id of whoever asked for it.
    RoomEvent: { type: "workflowDeleted"; deletedBy: string }
  }
}

export {}
