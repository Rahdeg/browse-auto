import * as React from "react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { auth } from "@clerk/nextjs/server"

import { createWorkflowAction } from "@/features/workflows/actions"
import { listWorkflows } from "@/features/workflows/data"
import { WorkflowNav } from "@/features/workflows/components/workflow-nav"
import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarHeader,
  SidebarTrigger,
} from "@/components/ui/sidebar"

async function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  // Workflows are owned by an organization, so there is nothing to list until
  // the user picks one at /choose-organization.
  const { orgId } = await auth()
  const workflows = orgId ? await listWorkflows(orgId) : []

  return (
    <TooltipProvider>
      <Sidebar collapsible="icon" {...props} variant="inset">
        <SidebarHeader className="flex-row items-center justify-between gap-2 p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:gap-0">
          <OrganizationSwitcher
            hidePersonal
            appearance={{
              elements: {
                // The switcher is an inline-flex box sized to its content, and
                // the preview inside it is capped at 30ch — both far wider than
                // the sidebar. Let it shrink so the name truncates instead.
                // Collapsed, the header stacks so the toggle stays reachable.
                rootBox:
                  "min-w-0 flex-1 group-data-[collapsible=icon]:flex-col group-data-[collapsible=icon]:items-center group-data-[collapsible=icon]:gap-1",
                organizationSwitcherTrigger:
                  "w-full min-w-0 justify-start! group-data-[collapsible=icon]:!hidden group-data-[collapsible=icon]:p-1!",
                organizationPreview__organizationSwitcherTrigger: "max-w-full!",
                // Collapsed there is only room for the organization avatar.
                organizationPreviewTextContainer__organizationSwitcherTrigger:
                  "group-data-[collapsible=icon]:hidden",
                organizationSwitcherTriggerIcon:
                  "shrink-0 group-data-[collapsible=icon]:hidden",
              },
            }}
          />
          <SidebarTrigger className="shrink-0" />
        </SidebarHeader>
        <SidebarContent>
          <WorkflowNav
            workflows={workflows}
            createWorkflowAction={createWorkflowAction}
          />
        </SidebarContent>
        <SidebarFooter className="group-data-[collapsible=icon]:items-center">
          <UserButton appearance={{
            elements: {
              rootBox: "w-full",
              userButtonTrigger: " w-full justify-start group-data-[collapsible=icon]:justify-center",
              userButtonOuterIdentifier: "group-data-[collapsible=icon]:hidden"
            }
          }} />
        </SidebarFooter>
      </Sidebar>
    </TooltipProvider>
  )
}

export { AppSidebar }
