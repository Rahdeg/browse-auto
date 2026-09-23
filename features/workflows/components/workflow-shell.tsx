import type { Workflow } from "@/db/schema"
import { Canvas } from "@/features/workflows/components/canvas"
import { RightSidebar } from "@/features/workflows/components/right-sidebar"
import {
  ResizableHandle,
  ResizablePanel,
  ResizablePanelGroup,
} from "@/components/ui/resizable"

/**
 * Sizes here are rem strings, not the library's default percentages: the editor
 * columns hold controls that shouldn't reflow with the viewport. Bare numbers
 * would be read as pixels and unitless strings as percentages, so every
 * constraint carries its `rem` unit.
 */
function WorkflowShell({ workflowId }: { workflowId: Workflow["id"] }) {
  return (
    <ResizablePanelGroup id={workflowId} className="size-full">
      <ResizablePanel minSize="30rem">
        <ResizablePanelGroup orientation="vertical">
          <ResizablePanel minSize="18rem">
            <Canvas />
          </ResizablePanel>
          <ResizableHandle />
          <ResizablePanel defaultSize="8rem" minSize="6rem">
            <div className="flex size-full items-center justify-center text-sm text-muted-foreground">
              Logs
            </div>
          </ResizablePanel>
        </ResizablePanelGroup>
      </ResizablePanel>
      <ResizableHandle />
      {/* The sidebar is the panel, sizes and all, so wrapping it in another one
          here would register a second panel with this group. */}
      <RightSidebar workflowId={workflowId} />
    </ResizablePanelGroup>
  )
}

export { WorkflowShell }
