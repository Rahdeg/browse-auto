"use client"

import { useCallback, useSyncExternalStore } from "react"
import {
  addEdge,
  Background,
  BackgroundVariant,
  ConnectionLineType,
  Controls,
  MiniMap,
  ReactFlow,
  useEdgesState,
  useNodesState,
  type ColorMode,
  type Edge,
  type Node,
  type OnConnect,
} from "@xyflow/react"
import { useTheme } from "next-themes"

import "@xyflow/react/dist/style.css"

const initialNodes: Node[] = [
  {
    id: "start",
    type: "input",
    position: { x: 0, y: 0 },
    data: { label: "Start" },
  },
  {
    id: "navigate",
    position: { x: 0, y: 120 },
    data: { label: "Navigate" },
  },
  {
    id: "extract",
    type: "output",
    position: { x: 0, y: 240 },
    data: { label: "Extract" },
  },
]

const initialEdges: Edge[] = [
  { id: "start-navigate", source: "start", target: "navigate" },
  { id: "navigate-extract", source: "navigate", target: "extract" },
]

// React swaps these snapshots only once hydration has finished, which is what
// makes the pair safe to branch on while rendering.
const subscribeToNothing = () => () => { }
const onClient = () => true
const onServer = () => false

function Canvas() {
  const [nodes, , onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

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

  const onConnect = useCallback<OnConnect>(
    (connection) => setEdges((eds) => addEdge(connection, eds)),
    [setEdges],
  )

  return (
    <ReactFlow
      nodes={nodes}
      edges={edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
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
      <MiniMap pannable zoomable />
    </ReactFlow>
  )
}

export { Canvas }
