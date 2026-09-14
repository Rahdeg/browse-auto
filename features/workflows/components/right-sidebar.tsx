"use client"

import { useState, useTransition } from "react"
import { useRealtimeRun } from "@trigger.dev/react-hooks"
import { PlayIcon } from "lucide-react"
import { toast } from "sonner"

import type { Workflow } from "@/db/schema"
import type { helloWorldTask } from "@/trigger/example"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"

type RunHandle = { runId: string; publicAccessToken: string }

// Every other status means the run is still on its way through the queue, a
// retry, or a wait, so the button stays disabled until it reaches one of these.
const FINISHED_STATUSES = [
  "COMPLETED",
  "FAILED",
  "CANCELED",
  "CRASHED",
  "SYSTEM_FAILURE",
  "INTERRUPTED",
  "EXPIRED",
  "TIMED_OUT",
]

function RightSidebar({
  workflowId,
  runWorkflowAction,
}: {
  workflowId: Workflow["id"]
  runWorkflowAction: (workflowId: Workflow["id"]) => Promise<RunHandle>
}) {
  const [handle, setHandle] = useState<RunHandle | null>(null)
  // The action returns as soon as the run is queued, so the transition only
  // covers the hand-off — the run itself is tracked by the subscription below.
  const [isStarting, startRun] = useTransition()

  // `enabled` keeps the hook idle until a run exists; without it the first
  // render would subscribe to an empty run id. The payload is just the
  // workflow id we already have, so it never needs to come back over the wire.
  const { run, error } = useRealtimeRun<typeof helloWorldTask>(
    handle?.runId ?? "",
    {
      accessToken: handle?.publicAccessToken,
      enabled: handle !== null,
      skipColumns: ["payload"],
    }
  )

  const isFinished = run ? FINISHED_STATUSES.includes(run.status) : false
  const isRunning = isStarting || (handle !== null && !isFinished)

  const runWorkflow = () => {
    startRun(async () => {
      try {
        setHandle(await runWorkflowAction(workflowId))
      } catch {
        toast.error("Could not start the workflow run")
      }
    })
  }

  return (
    <div className="flex size-full flex-col items-center gap-4 p-2">
      <Button onClick={runWorkflow} disabled={isRunning}>
        {isRunning ? (
          <Spinner data-icon="inline-start" />
        ) : (
          <PlayIcon data-icon="inline-start" />
        )}
        {isRunning ? "Running" : "Run"}
      </Button>

      {handle ? (
        <div className="flex w-full flex-col items-center gap-2 text-center text-xs">
          <Badge variant={statusVariant(run?.status, error !== undefined)}>
            {/* Statuses arrive as enum names like `SYSTEM_FAILURE`. */}
            {error
              ? "Subscription failed"
              : formatStatus(run?.status ?? "QUEUED")}
          </Badge>
          {/* The output only exists once the run completes; a failure carries a
           * message instead, and a dropped subscription carries neither. */}
          <p className="break-words text-muted-foreground">
            {error?.message ??
              run?.output?.message ??
              run?.error?.message ??
              handle.runId}
          </p>
        </div>
      ) : null}
    </div>
  )
}

function formatStatus(status: string) {
  const words = status.toLowerCase().replaceAll("_", " ")

  return words.charAt(0).toUpperCase() + words.slice(1)
}

function statusVariant(status: string | undefined, hasError: boolean) {
  if (
    hasError ||
    (status && status !== "COMPLETED" && FINISHED_STATUSES.includes(status))
  ) {
    return "destructive" as const
  }

  return status === "COMPLETED" ? ("default" as const) : ("secondary" as const)
}

export { RightSidebar }
