"use server"

import { revalidatePath } from "next/cache"
import { redirect } from "next/navigation"
import { auth } from "@clerk/nextjs/server"

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
