"use client"

import * as React from "react"
import { OrganizationSwitcher, UserButton } from "@clerk/nextjs"
import { Plus, Workflow } from "lucide-react"

import { TooltipProvider } from "@/components/ui/tooltip"
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarTrigger,
} from "@/components/ui/sidebar"

const workflows = [
  "dominant-wasp",
  "honest-reindeer",
  "expected-llama",
  "essential-ocelot",
  "creepy-echidna",
  "eastern-silkworm",
  "cultural-lion",
  "proud-weasel",
  "regional-bonobo",
]

function AppSidebar({ ...props }: React.ComponentProps<typeof Sidebar>) {
  const [activeWorkflow, setActiveWorkflow] = React.useState(workflows[0])

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
          <SidebarGroup>
            <SidebarGroupLabel>Workflows</SidebarGroupLabel>
            <SidebarGroupAction title="New workflow">
              <Plus />
              <span className="sr-only">New workflow</span>
            </SidebarGroupAction>
            <SidebarGroupContent>
              <SidebarMenu className="gap-y-0.5">
                {workflows.map((workflow) => (
                  <SidebarMenuItem key={workflow}>
                    <SidebarMenuButton
                      isActive={workflow === activeWorkflow}
                      onClick={() => setActiveWorkflow(workflow)}
                      tooltip={workflow}
                    >
                      {/* Only shown collapsed — expanded, the design is
                       * text-only and the label is clipped away at 2rem. */}
                      <Workflow className="hidden group-data-[collapsible=icon]:block" />
                      <span>{workflow}</span>
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
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
