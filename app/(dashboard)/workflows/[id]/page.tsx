import { auth } from "@clerk/nextjs/server"

import { WorkflowShell } from "@/features/workflows/components/workflow-shell"

export default async function Page({ params }: PageProps<"/workflows/[id]">) {
  await auth.protect()

  const { id } = await params

  // `min-h-0` lets the shell shrink inside the inset's column instead of
  // overflowing it, so its `size-full` resolves to the leftover height.
  return (
    <div className="min-h-0 flex-1">
      <WorkflowShell workflowId={id} />
    </div>
  )
}
