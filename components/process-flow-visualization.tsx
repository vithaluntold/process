"use client"

import { useCallback } from "react"
import ReactFlow, {
  addEdge,
  Background,
  Controls,
  MiniMap,
  type Node,
  type Edge,
  type Connection,
  useNodesState,
  useEdgesState,
} from "reactflow"
import "reactflow/dist/style.css"

const initialNodes: Node[] = [
  {
    id: "1",
    type: "input",
    data: { label: "Start Process" },
    position: { x: 250, y: 0 },
    style: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" },
  },
  {
    id: "2",
    data: { label: "Document Review" },
    position: { x: 100, y: 100 },
    style: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" },
  },
  {
    id: "3",
    data: { label: "Approval" },
    position: { x: 400, y: 100 },
    style: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" },
  },
  {
    id: "4",
    data: { label: "Data Entry" },
    position: { x: 100, y: 200 },
    style: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" },
  },
  {
    id: "5",
    data: { label: "Verification" },
    position: { x: 400, y: 200 },
    style: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" },
  },
  {
    id: "6",
    type: "output",
    data: { label: "Process Complete" },
    position: { x: 250, y: 300 },
    style: { background: "#f1f5f9", border: "1px solid #e2e8f0", borderRadius: "8px", padding: "10px" },
  },
]

const initialEdges: Edge[] = [
  { id: "e1-2", source: "1", target: "2", animated: true },
  { id: "e1-3", source: "1", target: "3", animated: true },
  { id: "e2-4", source: "2", target: "4", animated: true },
  { id: "e3-5", source: "3", target: "5", animated: true },
  { id: "e4-6", source: "4", target: "6", animated: true },
  { id: "e5-6", source: "5", target: "6", animated: true },
]

export default function ProcessFlowVisualization() {
  const [nodes, setNodes, onNodesChange] = useNodesState(initialNodes)
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialEdges)

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge({ ...params, animated: true }, eds)),
    [setEdges],
  )

  return (
    <div style={{ height: 500 }}>
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        fitView
      >
        <Background />
        <Controls />
        <MiniMap />
      </ReactFlow>
    </div>
  )
}
