"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"
import { tasks } from "@trigger.dev/sdk"

import type { Workflow } from "@/db/schema"
import type { helloWorldTask } from "@/trigger/example"

import { createWorkflow } from "./data"

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

export async function runWorkflowAction(workflowId: Workflow["id"]) {
  const { orgId } = await auth()

  // Runs are billed to the organization that owns the workflow, so an active
  // organization is required here just as it is for creating one.
  if (!orgId) {
    throw new Error("No active organization")
  }

  // The task is imported as a type only: pulling the instance into the Next.js
  // bundle would drag the whole trigger build in with it. The run is addressed
  // by the task id string instead, and the generic keeps the payload typed.
  const handle = await tasks.trigger<typeof helloWorldTask>("hello-world", {
    message: workflowId,
  })

  // The handle carries a public access token scoped to read just this run, so
  // the sidebar can subscribe to it in realtime without a secret key in the
  // browser. It expires 15 minutes after the trigger.
  return { runId: handle.id, publicAccessToken: handle.publicAccessToken }
}
