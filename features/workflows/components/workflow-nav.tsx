"use client"

import { useTransition } from "react"
import Link from "next/link"
import { usePathname } from "next/navigation"
import { Plus, Workflow } from "lucide-react"

import type { Workflow as WorkflowRow } from "@/db/schema"
import { generateSlug } from "@/features/workflows/lib/generate-slug"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import {
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarSeparator,
  useSidebar,
} from "@/components/ui/sidebar"

function WorkflowNav({
  workflows,
  createWorkflowAction,
}: {
  workflows: WorkflowRow[]
  createWorkflowAction: (name: string) => Promise<void>
}) {
  // On mobile the sidebar renders inside a full-width sheet, so it gets the
  // expanded list even though `state` tracks the desktop collapse.
  const { state, isMobile } = useSidebar()
  const pathname = usePathname()
  // The action redirects to the new workflow, so the transition stays pending
  // until that navigation commits.
  const [isCreating, startCreating] = useTransition()

  const createWorkflow = () => {
    startCreating(async () => {
      await createWorkflowAction(generateSlug())
    })
  }

  const workflowItems = workflows.map((workflow) => {
    const href = `/workflows/${workflow.id}`

    return (
      <SidebarMenuItem key={workflow.id}>
        <SidebarMenuButton asChild isActive={pathname === href}>
          <Link href={href}>
            <span>{workflow.name}</span>
          </Link>
        </SidebarMenuButton>
      </SidebarMenuItem>
    )
  })

  if (state === "collapsed" && !isMobile) {
    return (
      <SidebarGroup>
        <SidebarGroupContent>
          <SidebarMenu>
            <SidebarMenuItem>
              <Popover>
                <PopoverTrigger asChild>
                  <SidebarMenuButton>
                    <Workflow />
                    <span>Workflows</span>
                  </SidebarMenuButton>
                </PopoverTrigger>
                {/* Portalled out of the sidebar, so the collapsed-icon styles
                 * don't reach the menu inside and it lays out full width. */}
                <PopoverContent side="right" align="start">
                  <SidebarMenu>
                    <SidebarMenuItem>
                      <SidebarMenuButton
                        onClick={createWorkflow}
                        disabled={isCreating}
                      >
                        <Plus />
                        <span>New workflow</span>
                      </SidebarMenuButton>
                    </SidebarMenuItem>
                  </SidebarMenu>
                  <SidebarSeparator />
                  <SidebarMenu className="gap-y-0.5">{workflowItems}</SidebarMenu>
                </PopoverContent>
              </Popover>
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarGroupContent>
      </SidebarGroup>
    )
  }

  return (
    <SidebarGroup>
      <SidebarGroupLabel>Workflows</SidebarGroupLabel>
      <SidebarGroupAction
        title="New workflow"
        onClick={createWorkflow}
        disabled={isCreating}
      >
        <Plus />
        <span className="sr-only">New workflow</span>
      </SidebarGroupAction>
      <SidebarGroupContent>
        <SidebarMenu className="gap-y-0.5">{workflowItems}</SidebarMenu>
      </SidebarGroupContent>
    </SidebarGroup>
  )
}

export { WorkflowNav }
