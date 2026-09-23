"use client"

import { useState, useTransition } from "react"
import { useReactFlow, useStore, useStoreApi } from "@xyflow/react"
import { MoreHorizontal, Play, Trash2 } from "lucide-react"
import { toast } from "sonner"

import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "@/components/ui/accordion"
import { Button } from "@/components/ui/button"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { ResizablePanel } from "@/components/ui/resizable"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Textarea } from "@/components/ui/textarea"
import { cn } from "@/lib/utils"

import type { Workflow } from "@/db/schema"
import { deleteWorkflowAction } from "@/features/workflows/actions"

import {
  nodeRegistry,
  type NodeDefinition,
  type NodeField,
  type NodeType,
  type StepNodeKind,
  type StepNodeType,
} from "@/features/workflows/nodes/node-registry"

// This file builds up to the RightSidebar component exported at the bottom: a
// header with workflow actions (delete, run), then two tabs — a Toolbar for
// adding nodes and an Editor for tweaking the selected node. Each helper below is
// defined just above the block that uses it.

// ---------------------------------------------------------------------------
// Shared pieces — used by both the Toolbar and the Editor.
// ---------------------------------------------------------------------------

// The accent-colored icon chip, mirroring the node on the canvas.
function NodeIcon({ type, className }: { type: NodeType; className?: string }) {
  const def = nodeRegistry[type]
  const Icon = def.icon
  return (
    <span
      className={cn(
        "flex size-6 shrink-0 items-center justify-center rounded-md",
        def.accent,
        className
      )}
    >
      <Icon className="size-3.5" />
    </span>
  )
}

// A titled, scrollable panel. Each tab renders its content inside one.
function Section({
  title,
  icon,
  children,
}: {
  title: string
  icon?: React.ReactNode
  children: React.ReactNode
}) {
  return (
    <div className="flex min-h-0 flex-1 flex-col">
      <div className="flex items-center gap-2 border-y border-border bg-card px-3 py-1.5 text-sm font-semibold">
        {icon}
        {title}
      </div>
      <div className="min-h-0 flex-1 overflow-y-auto">{children}</div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Editor tab — edits the fields of the selected node.
// ---------------------------------------------------------------------------

// A single editor field for a node property. The registry decides the shape of
// the control: a textarea for fields that opt into `multiline`, an input for
// everything else.
function Field({
  field,
  value,
  onChange,
}: {
  field: NodeField
  value: string
  onChange: (value: string) => void
}) {
  const props = {
    id: field.key,
    value,
    placeholder: field.placeholder,
    onChange: (
      e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
    ) => onChange(e.target.value),
  }

  return field.multiline ? <Textarea {...props} /> : <Input {...props} />
}

// The Editor tab: one input per field on the selected node, or an empty state.
function Inspector({ node }: { node: StepNodeType | undefined }) {
  const { updateNodeData } = useReactFlow<StepNodeType>()

  if (!node) {
    return (
      <Section title="Editor">
        <p className="p-3 text-sm text-muted-foreground">No node selected</p>
      </Section>
    )
  }

  const { type, title, values } = node.data
  const def: NodeDefinition = nodeRegistry[type]

  return (
    <Section title={title} icon={<NodeIcon type={type} />}>
      <div className="flex flex-col gap-3 p-3">
        {def.fields.length === 0 ? (
          <p className="text-xs text-muted-foreground">No properties</p>
        ) : (
          def.fields.map((field) => (
            <div key={field.key} className="flex flex-col gap-1.5">
              <Label htmlFor={field.key} className="text-xs">
                {field.label}
                {field.required && <span className="text-destructive">*</span>}
              </Label>
              <Field
                field={field}
                value={values[field.key] ?? ""}
                onChange={(value) => {
                  updateNodeData(node.id, {
                    values: { ...values, [field.key]: value },
                  })
                }}
              />
            </div>
          ))
        )}
      </div>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Toolbar tab — adds nodes to the canvas, grouped by kind.
// ---------------------------------------------------------------------------

// The Toolbar's groups, one accordion section per node kind.
const sections: { kind: StepNodeKind; label: string }[] = [
  { kind: "trigger", label: "Triggers" },
  { kind: "action", label: "Actions" },
]

// Every node type from the registry, filtered into the groups below.
const definitions = Object.values(nodeRegistry)

// A step node is laid out at `min-w-50` around a single row of content. React
// Flow only learns a node's real size once it has rendered, so a node being
// added is centered on these nominal dimensions instead.
const nodeSize = { width: 200, height: 52 }

// The Toolbar tab: a button per node type that adds it to the canvas.
function Palette() {
  // The store these read is the one the page creates, which is also the one the
  // canvas renders from: the addition below goes through `onNodesChange` there,
  // and so through Liveblocks to everyone else in the room.
  const { getNodes, addNodes, screenToFlowPosition } =
    useReactFlow<StepNodeType>()
  const store = useStoreApi()

  const add = (type: NodeType) => {
    const def = nodeRegistry[type]
    const nodes = getNodes()

    // A run needs one unambiguous entry point, so a second trigger is rejected
    // rather than added as an unreachable node.
    if (def.kind === "trigger" && nodes.some((n) => n.data.kind === "trigger")) {
      toast.error("This workflow already has a trigger")
      return
    }

    // Copies of one node type are numbered so they stay tellable apart in the
    // editor. Taking the lowest free number keeps the names short and hands a
    // number back for reuse once its node is deleted.
    const taken = new Set(
      nodes.filter((n) => n.data.type === type).map((n) => n.data.title)
    )
    let count = 1
    while (taken.has(`${def.label} ${count}`)) count++

    // The canvas fills its own pane, so the middle of the current view is that
    // element's midpoint read back through the viewport transform. Without a
    // canvas mounted there is no view to be in the middle of, so the node falls
    // back to the origin.
    const rect = store.getState().domNode?.getBoundingClientRect()
    const center = rect
      ? screenToFlowPosition({
        x: rect.x + rect.width / 2,
        y: rect.y + rect.height / 2,
      })
      : { x: 0, y: 0 }

    addNodes({
      id: crypto.randomUUID(),
      type: "step",
      position: {
        x: center.x - nodeSize.width / 2,
        y: center.y - nodeSize.height / 2,
      },
      data: { type, kind: def.kind, title: `${def.label} ${count}`, values: {} },
    })
  }

  return (
    <Section title="Toolbar">
      <Accordion
        type="multiple"
        defaultValue={sections.map((s) => s.kind)}
        className="px-3 py-2"
      >
        {sections.map((section) => (
          <AccordionItem
            key={section.kind}
            value={section.kind}
            className="not-last:border-b-0"
          >
            <AccordionTrigger className="py-2 text-xs font-medium text-muted-foreground hover:no-underline">
              {section.label}
            </AccordionTrigger>
            <AccordionContent className="flex flex-col gap-0.5">
              {definitions
                .filter((def) => def.kind === section.kind)
                .map((def) => (
                  <Button
                    key={def.type}
                    variant="ghost"
                    onClick={() => add(def.type as NodeType)}
                    className="justify-start gap-2.5 px-1.5 text-xs"
                  >
                    <NodeIcon type={def.type as NodeType} />
                    {def.label}
                  </Button>
                ))}
            </AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </Section>
  )
}

// ---------------------------------------------------------------------------
// Header — workflow-level actions shown above the tabs.
// ---------------------------------------------------------------------------

// The "..." menu for workflow-level actions, and the confirmation the
// destructive one asks for.
function ActionsMenu({ workflowId }: { workflowId: Workflow["id"] }) {
  const [confirming, setConfirming] = useState(false)
  // The action redirects to the home page once the row and the room are gone,
  // so the transition stays pending until that navigation commits.
  const [isDeleting, startDeleting] = useTransition()

  // The action ends in a redirect, which the router delivers by rejecting this
  // promise once it has navigated. Nothing catches it here, exactly as the
  // create action is called from the sidebar: the rejection belongs to Next's
  // redirect boundary, and intercepting it is what turned every successful
  // delete into an error.
  const deleteWorkflow = () => {
    startDeleting(async () => {
      await deleteWorkflowAction(workflowId)

    })
  }

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button size="icon" variant="ghost">
            <MoreHorizontal />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="start" className="min-w-48">
          <DropdownMenuItem
            variant="destructive"
            disabled={isDeleting}
            className="text-xs [&_svg:not([class*='size-'])]:size-3.5"
            onSelect={() => setConfirming(true)}
          >
            <Trash2 />
            Delete workflow
          </DropdownMenuItem>
        </DropdownMenuContent>
      </DropdownMenu>

      {/* A workflow can't be restored, and it goes for the whole organization
          rather than just this editor, so the delete is confirmed first. This
          dialog is the last point at which it can be called off. */}
      <AlertDialog
        open={confirming}
        // A delete in flight ends in a navigation, so the dialog stays put
        // rather than letting an outside click dismiss it mid-request.
        onOpenChange={(open) => {
          if (!isDeleting) setConfirming(open)
        }}
      >
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete this workflow?</AlertDialogTitle>
            <AlertDialogDescription>
              This deletes the workflow and its canvas for everyone in your
              organization, including anyone editing it right now. It can’t be
              undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              variant="destructive"
              disabled={isDeleting}
              onClick={(event) => {
                // The action button closes the dialog on click, which would
                // unmount the disabled button before the delete lands. Keeping
                // it open leaves the pending state somewhere to show.
                event.preventDefault()
                deleteWorkflow()
              }}
            >
              {isDeleting ? "Deleting…" : "Delete workflow"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  )
}

// Kicks off a run of the current workflow.
function RunButton() {
  return (
    <Button
      size="sm"
      variant="secondary"
      onClick={() => {
        // TODO: validate the graph and run the workflow (toggle to Stop while running).
      }}
    >
      <Play fill="primary" />
      Run
    </Button>
  )
}

// ---------------------------------------------------------------------------
// The sidebar itself — header on top, then the Toolbar / Editor tabs.
// ---------------------------------------------------------------------------

export function RightSidebar({ workflowId }: { workflowId: Workflow["id"] }) {
  const [tab, setTab] = useState("toolbar")

  // TODO: read the currently selected node from React Flow.
  const selected = useStore((s) => s.nodes.find((n) => n.selected)) as StepNodeType | undefined

  // TODO: auto-switch to the Editor tab when the selection changes.
  const [prevSelectedId, setPrevSelectedId] = useState(selected?.id)
  if (selected && selected.id !== prevSelectedId) {
    setPrevSelectedId(selected.id)
    setTab("editor")
  }

  return (
    <ResizablePanel
      className="bg-background"
      defaultSize="16rem"
      minSize="14rem"
      maxSize="36rem"
      groupResizeBehavior="preserve-pixel-size"
    >
      <Tabs value={tab} onValueChange={setTab} className="size-full gap-0">
        <div className="flex items-center justify-between border-b border-border p-2">
          <ActionsMenu workflowId={workflowId} />
          <RunButton />
        </div>
        <TabsList className="m-2 w-fit bg-background">
          <TabsTrigger
            value="toolbar"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Toolbar
          </TabsTrigger>
          <TabsTrigger
            value="editor"
            className="flex-none rounded-sm data-active:bg-accent! data-active:text-accent-foreground! data-active:shadow-none! dark:data-active:border-transparent!"
          >
            Editor
          </TabsTrigger>
        </TabsList>
        <TabsContent value="toolbar" className="flex min-h-0 flex-col">
          <Palette />
        </TabsContent>
        <TabsContent value="editor" className="flex min-h-0 flex-col">
          <Inspector node={selected} />
        </TabsContent>
      </Tabs>
    </ResizablePanel>
  )
}