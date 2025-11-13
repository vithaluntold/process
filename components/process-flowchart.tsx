"use client";

import { useCallback, useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  addEdge,
  Background,
  Controls,
  MiniMap,
  Connection,
  useNodesState,
  useEdgesState,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";

interface ProcessFlowchartProps {
  activities: string[];
  transitions: Array<{ from: string; to: string; frequency: number }>;
  startActivities: string[];
  endActivities: string[];
}

export default function ProcessFlowchart({
  activities,
  transitions,
  startActivities,
  endActivities,
}: ProcessFlowchartProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  useEffect(() => {
    buildFlowchart();
  }, [activities, transitions]);

  const buildFlowchart = () => {
    const activitySet = new Set(activities);
    const nodeMap = new Map<string, { x: number; y: number }>();
    
    const layers = assignLayers(startActivities, endActivities, transitions);
    
    const newNodes: Node[] = [];
    const nodeSpacing = 250;
    const layerSpacing = 200;

    layers.forEach((layerActivities, layerIndex) => {
      layerActivities.forEach((activity, activityIndex) => {
        const x = layerIndex * layerSpacing;
        const y = activityIndex * nodeSpacing;
        
        nodeMap.set(activity, { x, y });

        let nodeType = "default";
        let bgColor = "#ffffff";
        let borderColor = "#06b6d4";
        let textColor = "#0e7490";

        if (startActivities.includes(activity)) {
          nodeType = "input";
          borderColor = "#10b981";
          textColor = "#047857";
        } else if (endActivities.includes(activity)) {
          nodeType = "output";
          borderColor = "#ef4444";
          textColor = "#dc2626";
        }

        newNodes.push({
          id: activity,
          type: nodeType,
          position: { x, y },
          data: { label: activity },
          style: {
            background: bgColor,
            color: textColor,
            border: `2px solid ${borderColor}`,
            borderRadius: "8px",
            padding: "10px 18px",
            fontSize: "13px",
            fontWeight: "600",
            boxShadow: "0 2px 8px rgba(0,0,0,0.08)",
          },
        });
      });
    });

    const newEdges: Edge[] = transitions.map((transition) => {
      const maxFrequency = Math.max(...transitions.map((t) => t.frequency));
      const isHighFrequency = transition.frequency > maxFrequency * 0.5;

      return {
        id: `${transition.from}-${transition.to}`,
        source: transition.from,
        target: transition.to,
        type: "smoothstep",
        animated: isHighFrequency,
        label: `${transition.frequency}`,
        style: {
          stroke: isHighFrequency ? "#06b6d4" : "#94a3b8",
          strokeWidth: isHighFrequency ? 2 : 1.5,
          filter: isHighFrequency ? "drop-shadow(0 0 4px rgba(6, 182, 212, 0.6))" : "none",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighFrequency ? "#06b6d4" : "#94a3b8",
          width: 16,
          height: 16,
        },
        labelStyle: {
          fill: isHighFrequency ? "#0e7490" : "#64748b",
          fontSize: "10px",
          fontWeight: "600",
        },
        labelBgStyle: {
          fill: "#ffffff",
          fillOpacity: 0.95,
          rx: 4,
          ry: 4,
        },
        labelBgPadding: [4, 8] as [number, number],
      };
    });

    setNodes(newNodes);
    setEdges(newEdges);
  };

  const assignLayers = (
    startActivities: string[],
    endActivities: string[],
    transitions: Array<{ from: string; to: string; frequency: number }>
  ): Map<number, string[]> => {
    const layers = new Map<number, string[]>();
    const activityLayers = new Map<string, number>();
    const visited = new Set<string>();

    const assignLayer = (activity: string, layer: number) => {
      const currentLayer = activityLayers.get(activity);
      if (currentLayer === undefined || layer > currentLayer) {
        activityLayers.set(activity, layer);
      }
    };

    const queue: Array<{ activity: string; layer: number }> = startActivities.map((a) => ({
      activity: a,
      layer: 0,
    }));

    while (queue.length > 0) {
      const { activity, layer } = queue.shift()!;
      
      if (visited.has(activity)) continue;
      visited.add(activity);

      assignLayer(activity, layer);

      const outgoing = transitions.filter((t) => t.from === activity);
      for (const transition of outgoing) {
        queue.push({ activity: transition.to, layer: layer + 1 });
      }
    }

    for (const endActivity of endActivities) {
      if (!visited.has(endActivity)) {
        const maxLayer = Math.max(...Array.from(activityLayers.values()), 0);
        assignLayer(endActivity, maxLayer + 1);
      }
    }

    for (const [activity, layer] of activityLayers.entries()) {
      if (!layers.has(layer)) {
        layers.set(layer, []);
      }
      layers.get(layer)!.push(activity);
    }

    return new Map([...layers.entries()].sort((a, b) => a[0] - b[0]));
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges((eds) => addEdge(params, eds)),
    []
  );

  return (
    <Card>
      <CardHeader>
        <CardTitle>Process Flow Diagram</CardTitle>
        <CardDescription>
          Discovered process model with {activities.length} activities and {transitions.length} transitions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ 
          height: "600px", 
          width: "100%", 
          borderRadius: "8px",
          border: "1px solid hsl(var(--border))",
          overflow: "hidden"
        }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            fitView
            attributionPosition="bottom-left"
          >
            <Background gap={12} size={0.5} />
            <Controls />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === "input") return "#10b981";
                if (node.type === "output") return "#ef4444";
                return "#06b6d4";
              }}
              nodeBorderRadius={8}
            />
          </ReactFlow>
        </div>
        <div className="mt-4 flex gap-6 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded border-2 border-emerald-500" />
            <span>Start Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded border-2 border-cyan-500" />
            <span>Intermediate Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-3 w-3 rounded border-2 border-red-500" />
            <span>End Activity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
