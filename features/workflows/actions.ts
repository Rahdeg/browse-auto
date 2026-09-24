"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { tasks, runs } from "@trigger.dev/sdk"

import type { Workflow } from "@/db/schema"
import type { runWorkflowTask } from "@/features/workflows/tasks/run-workflow"
import { liveblocks } from "@/lib/liveblocks"

import { createWorkflow, deleteWorkflow, saveWorkflowGraph } from "./data"
import { WorkflowGraph } from "@/db/schema"

export async function createWorkflowAction(name: string) {
  const { orgId } = await auth()

  // Workflows are owned by an organization, so there is nothing to write the
  // row against until the user picks one at /choose-organization.
  if (!orgId) {
    throw new Error("No active organization")
  }

  const workflow = await createWorkflow(orgId, name)

  // The sidebar listing lives in the dashboard layout, not in the page, so the
  // layout is what has to be invalidated for the new workflow to show up.
  revalidatePath("/workflows", "layout")

  // `redirect` throws, so it stays outside of any try/catch around the insert.
  redirect(`/workflows/${workflow.id}`)
}

export async function runWorkflowAction({
  id,
  graph,
}: {
  id: string
  graph: WorkflowGraph
}) {
  const { orgId } = await auth()

  // Runs are billed to the organization that owns the workflow, so an active
  // organization is required here just as it is for creating one.
  if (!orgId) {
    throw new Error("No active organization")
  }

  await saveWorkflowGraph({ orgId, id, graph })

  // The task is imported as a type only: pulling the instance into the Next.js
  // bundle would drag the whole trigger build in with it. The run is addressed
  // by the task id string instead, and the generic keeps the payload typed.
  const handle = await tasks.trigger<typeof runWorkflowTask>(
    "run-workflow",
    { workflowId: id, orgId },
    { tags: [`workflow:${id}`] }
  )

  // The handle carries a public access token scoped to read just this run, so
  // the sidebar can subscribe to it in realtime without a secret key in the
  // browser. It expires 15 minutes after the trigger.
  return { runId: handle.id, publicAccessToken: handle.publicAccessToken }
}

export async function deleteWorkflowAction(workflowId: Workflow["id"]) {
  const { userId, orgId } = await auth()

  if (!userId) {
    throw new Error("Unauthorized")
  }

  // Workflows are owned by an organization, so without an active one there is
  // no row this caller is allowed to reach.
  if (!orgId) {
    throw new Error("No active organization")
  }

  // Server actions are reachable by POST on their own, so scoping the delete to
  // the organization is the authorization check too: a workflow owned by
  // another organization matches no row and comes back undefined.
  const workflow = await deleteWorkflow(orgId, workflowId)

  if (!workflow) {
    throw new Error("Workflow not found")
  }

  // The canvas shares its graph through a Liveblocks room keyed by the workflow
  // id, so the row leaves that room behind. Everyone still in it loses their
  // connection when it goes, so the room is told what happened while it is
  // still there to broadcast into.
  //
  // Both calls are past the point of no return — the row is already gone, so
  // the workflow is deleted either way and a room or a notice that didn't make
  // it is worth logging rather than failing the delete over. They are also
  // independent: a broadcast that fails must not keep the room alive.
  try {
    await liveblocks.broadcastEvent(workflowId, {
      type: "workflowDeleted",
      deletedBy: userId,
    })
  } catch (error) {
    console.error(
      `Failed to announce the delete of workflow ${workflowId}`,
      error
    )
  }

  try {
    await liveblocks.deleteRoom(workflowId)
  } catch (error) {
    console.error(`Failed to delete Liveblocks room ${workflowId}`, error)
  }

  // The sidebar listing lives in the dashboard layout, which the home page
  // below shares with the workflow page: without invalidating that layout the
  // deleted workflow stays in the list after the navigation.
  revalidatePath("/", "layout")

  // `redirect` throws, so it stays outside the try/catch above. The name rides
  // along because this navigation is the last thing to happen in the delete:
  // the client that asked for it is on its way out, so the confirmation is left
  // for the page being landed on to show.
  redirect(`/?deleted=${encodeURIComponent(workflow.name)}`)
}

export async function cancelWorkflowRunAction(runId: string) {
  const { orgId } = await auth()
  if (!orgId) throw new Error("No active organization")

  await runs.cancel(runId)
}
