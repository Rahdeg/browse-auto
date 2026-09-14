"use client" // Error boundaries must be Client Components

import { useEffect } from "react"
import { RotateCcw, TriangleAlert } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Empty,
  EmptyContent,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "@/components/ui/empty"

export default function WorkflowError({
  error,
  unstable_retry,
}: {
  error: Error & { digest?: string }
  unstable_retry: () => void
}) {
  useEffect(() => {
    console.error(error)
  }, [error])

  return (
    <div className="flex flex-1 flex-col">
      <Empty>
        <EmptyHeader>
          <EmptyMedia variant="icon">
            <TriangleAlert />
          </EmptyMedia>
          <EmptyTitle>Something went wrong</EmptyTitle>
          <EmptyDescription>
            This workflow could not be loaded. Try again, or pick another
            workflow from the sidebar.
          </EmptyDescription>
        </EmptyHeader>
        <EmptyContent>
          {/* Re-fetches and re-renders the segment, unlike `reset`, which only
           * clears the error state. */}
          <Button size="lg" onClick={() => unstable_retry()}>
            <RotateCcw data-icon="inline-start" />
            Try again
          </Button>
        </EmptyContent>
      </Empty>
    </div>
  )
}
