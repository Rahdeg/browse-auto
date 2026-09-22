import { auth } from "@clerk/nextjs/server"
import { ReactFlowProvider } from "@xyflow/react"

import { WorkflowShell } from "@/features/workflows/components/workflow-shell"
import { Room } from "@/features/workflows/components/room"
import { notFound } from "next/navigation"
import { getWorkflow } from "@/features/workflows/data"
import { liveblocks } from "@/lib/liveblocks"
import { title } from "node:process"

export default async function Page({ params }: PageProps<"/workflows/[id]">) {
  await auth.protect()

  const { id } = await params

  const { orgId } = await auth()
  if (!orgId) notFound()

  const workflow = await getWorkflow(orgId, id)
  if (!workflow) notFound()

  // ID token auth leaves rooms private until someone is granted access, so the
  // room has to exist with the right permissions before <Room> tries to connect.
  // This runs after the ownership check above, so `orgId` is known to own `id`.
  // Failures fall through to error.tsx, which is more honest than rendering a
  // canvas that can never connect.
  await liveblocks.getOrCreateRoom(id, {
    organizationId: orgId,
    // Private by default: only the owning organization gets in.
    defaultAccesses: [],
    groupsAccesses: { [orgId]: ["room:write"] },
    metadata: { title: workflow.name },
  })

  // The toolbar that adds nodes lives in the sidebar, a sibling of the canvas
  // rather than a child of it, so the React Flow store is created here instead
  // of by the <ReactFlow /> element. Both halves of the editor then read and
  // write the same nodes.
  //
  // `min-h-0` lets the shell shrink inside the inset's column instead of
  // overflowing it, so its `size-full` resolves to the leftover height.
  return (
    <ReactFlowProvider>
      <Room roomId={id}>
        <div className="min-h-0 flex-1">
          <WorkflowShell workflowId={id} />
        </div>
      </Room>
    </ReactFlowProvider>
  )
}
