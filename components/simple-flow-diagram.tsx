"use client"

import { useState } from "react"

interface FlowNode {
  id: string
  label: string
  x: number
  y: number
  type: "start" | "activity" | "gateway" | "end" | "bottleneck" | "automated"
}

interface FlowEdge {
  from: string
  to: string
  label?: string
}

interface SimpleFlowDiagramProps {
  nodes: FlowNode[]
  edges: FlowEdge[]
  width?: number
  height?: number
  onNodeSelect?: (nodeId: string) => void
}

const nodeStyles = {
  start: "bg-[#11c1d6] text-white border-[#0ea5b9]",
  activity: "bg-slate-100 text-slate-900 border-[#11c1d6]",
  gateway: "bg-cyan-50 text-slate-900 border-[#11c1d6]",
  end: "bg-red-500 text-white border-red-600",
  bottleneck: "bg-amber-100 text-slate-900 border-amber-500",
  automated: "bg-emerald-100 text-slate-900 border-emerald-500",
}

export default function SimpleFlowDiagram({
  nodes,
  edges,
  width = 800,
  height = 700,
  onNodeSelect,
}: SimpleFlowDiagramProps) {
  const [selectedNode, setSelectedNode] = useState<string | null>(null)

  // Calculate SVG paths for edges
  const createPath = (from: FlowNode, to: FlowNode) => {
    const startX = from.x + 75 // center of node (150/2)
    const startY = from.y + 40 // bottom of node
    const endX = to.x + 75
    const endY = to.y

    // Create curved path
    const midY = (startY + endY) / 2
    return `M ${startX} ${startY} Q ${startX} ${midY}, ${(startX + endX) / 2} ${midY} T ${endX} ${endY}`
  }

  const handleNodeClick = (nodeId: string) => {
    setSelectedNode(nodeId)
    if (onNodeSelect) {
      onNodeSelect(nodeId)
    }
  }

  return (
    <div className="relative w-full h-full bg-slate-50 rounded-lg border overflow-auto">
      <svg width={width} height={height} className="absolute top-0 left-0">
        {/* Draw edges */}
        {edges.map((edge, index) => {
          const fromNode = nodes.find((n) => n.id === edge.from)
          const toNode = nodes.find((n) => n.id === edge.to)
          if (!fromNode || !toNode) return null

          return (
            <g key={index}>
              <path
                d={createPath(fromNode, toNode)}
                stroke="#11c1d6"
                strokeWidth="2"
                fill="none"
                markerEnd="url(#arrowhead)"
              />
              {edge.label && (
                <text
                  x={(fromNode.x + toNode.x) / 2 + 75}
                  y={(fromNode.y + toNode.y) / 2 + 20}
                  fill="#64748b"
                  fontSize="12"
                  textAnchor="middle"
                >
                  {edge.label}
                </text>
              )}
            </g>
          )
        })}

        {/* Arrow marker definition */}
        <defs>
          <marker
            id="arrowhead"
            markerWidth="10"
            markerHeight="10"
            refX="9"
            refY="3"
            orient="auto"
            markerUnits="strokeWidth"
          >
            <polygon points="0 0, 10 3, 0 6" fill="#11c1d6" />
          </marker>
        </defs>
      </svg>

      {/* Draw nodes */}
      {nodes.map((node) => (
        <div
          key={node.id}
          className={`absolute w-[150px] rounded-lg border-2 p-2 text-center cursor-pointer transition-all ${
            nodeStyles[node.type]
          } ${selectedNode === node.id ? "ring-2 ring-[#11c1d6] ring-offset-2 shadow-lg" : "shadow hover:shadow-md"}`}
          style={{ left: node.x, top: node.y }}
          onClick={() => handleNodeClick(node.id)}
        >
          <div className="text-sm font-medium">{node.label}</div>
        </div>
      ))}
    </div>
  )
}
