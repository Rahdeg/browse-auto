import { auth } from "@clerk/nextjs/server"
import { Plus, Workflow } from "lucide-react"

import { DeletedToast } from "@/features/workflows/components/deleted-toast"
import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default async function Page({ searchParams }: PageProps<"/">) {
  await auth.protect()

  // Deleting a workflow redirects here with the name it removed, so this page
  // is where that gets confirmed. Anything else in the URL is ignored.
  const { deleted } = await searchParams
  const deletedName = typeof deleted === "string" ? deleted : undefined

  return (
    <div className="flex flex-1 flex-col">
      {deletedName && <DeletedToast name={deletedName} />}
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <Workflow />
          </EmptyMedia>
          <EmptyTitle>No workflow selected</EmptyTitle>
          <EmptyDescription>
            Select a workflow from the sidebar or create a new one to get
            started.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          <Button size="lg">
            <Plus data-icon="inline-start" />
            New workflow
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
