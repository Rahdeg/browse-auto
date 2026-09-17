"use client"

import { useSyncExternalStore } from "react"
import {
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MiniMap,
  NodeTypes,
  ReactFlow,
  type ColorMode,
  type Edge,
} from "@xyflow/react"
import { useLiveblocksFlow, Cursors } from "@liveblocks/react-flow"
import { useTheme } from "next-themes"

import "@xyflow/react/dist/style.css"
import "@liveblocks/react-ui/styles.css";
import "@liveblocks/react-flow/styles.css";

import { StepNode } from "@/features/workflows/components/step-node"
import type { StepNodeType } from "@/features/workflows/nodes/node-registry"



const nodeTypes: NodeTypes = { step: StepNode }

const initialNodes: StepNodeType[] = [
  {
    id: "start",
    type: "step",
    position: { x: 0, y: 0 },
    data: { type: "start", kind: "trigger", title: "Start", values: {} },
  },
]

const initialEdges: Edge[] = []

// React swaps these snapshots only once hydration has finished, which is what
// makes the pair safe to branch on while rendering.
const subscribeToNothing = () => () => { }
const onClient = () => true
const onServer = () => false

function Canvas() {
  /**
   * Storage holds the diagram, so the initial values seed an empty room rather
   * than describing local state. `suspense` lets the `ClientSideSuspense` in
   * `Room` cover the load, which is what narrows `nodes` and `edges` away from
   * null here.
   */
  const {
    nodes,
    edges,
    onNodesChange,
    onEdgesChange,
    onConnect,
    onDelete,
  } = useLiveblocksFlow<StepNodeType, Edge>({
    suspense: true,
    nodes: { initial: initialNodes },
    edges: { initial: initialEdges },
  })

  const { resolvedTheme } = useTheme()
  const hydrated = useSyncExternalStore(subscribeToNothing, onClient, onServer)

  /**
   * The stored preference lives in localStorage, so the server cannot know it
   * and always renders React Flow's light class. `hydrated` stays false through
   * the hydration pass and flips to true straight after, which keeps the first
   * client render byte-identical to the server's and lets the real theme take
   * over on the very next one.
   *
   * `resolvedTheme` is already narrowed to light/dark, so "system" never
   * reaches React Flow and the two never disagree about what "system" means.
   */
  const colorMode: ColorMode =
    hydrated && resolvedTheme === "dark" ? "dark" : "light"

  return (
    <ReactFlow
      nodeTypes={nodeTypes}
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      onDelete={onDelete}
      colorMode={colorMode}
      fitView
      connectionLineType={ConnectionLineType.SmoothStep}
      connectionLineStyle={{ stroke: "var(--border)" }}
      defaultEdgeOptions={{
        type: "smoothstep",
        style: { stroke: "var(--border)" },
      }}
      style={
        {
          "--xy-background-color": "var(--background)",
          "--xy-edge-stroke-width": 2,
          "--xy-connectionline-stroke-width": 2,
        } as React.CSSProperties
      }
      maxZoom={1}
    >
      <Background variant={BackgroundVariant.Dots} gap={16} size={1} />
      <Controls />
      <Cursors />
      {/* <MiniMap pannable zoomable /> */}
    </ReactFlow>
  )
}

export { Canvas }
