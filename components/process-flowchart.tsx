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
        let gradient = "linear-gradient(135deg, #06b6d4 0%, #3b82f6 100%)";
        let boxShadow = "0 8px 24px rgba(6, 182, 212, 0.25), 0 0 0 1px rgba(6, 182, 212, 0.1)";

        if (startActivities.includes(activity)) {
          nodeType = "input";
          gradient = "linear-gradient(135deg, #10b981 0%, #059669 100%)";
          boxShadow = "0 8px 24px rgba(16, 185, 129, 0.3), 0 0 0 1px rgba(16, 185, 129, 0.2)";
        } else if (endActivities.includes(activity)) {
          nodeType = "output";
          gradient = "linear-gradient(135deg, #ef4444 0%, #dc2626 100%)";
          boxShadow = "0 8px 24px rgba(239, 68, 68, 0.3), 0 0 0 1px rgba(239, 68, 68, 0.2)";
        }

        newNodes.push({
          id: activity,
          type: nodeType,
          position: { x, y },
          data: { label: activity },
          style: {
            background: gradient,
            color: "white",
            border: "none",
            borderRadius: "12px",
            padding: "16px 28px",
            fontSize: "14px",
            fontWeight: "600",
            boxShadow: boxShadow,
            backdropFilter: "blur(10px)",
            transition: "all 0.3s ease",
          },
        });
      });
    });

    const newEdges: Edge[] = transitions.map((transition) => {
      const maxFrequency = Math.max(...transitions.map((t) => t.frequency));
      const width = Math.max(2, Math.min(6, (transition.frequency / maxFrequency) * 6));
      const isHighFrequency = transition.frequency > maxFrequency * 0.5;

      return {
        id: `${transition.from}-${transition.to}`,
        source: transition.from,
        target: transition.to,
        type: "smoothstep",
        animated: isHighFrequency,
        label: `${transition.frequency}`,
        style: {
          stroke: isHighFrequency ? "#06b6d4" : "#64748b",
          strokeWidth: width,
          strokeLinecap: "round",
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighFrequency ? "#06b6d4" : "#64748b",
          width: 24,
          height: 24,
        },
        labelStyle: {
          fill: "#ffffff",
          fontSize: "11px",
          fontWeight: "700",
          textShadow: "0 1px 2px rgba(0,0,0,0.2)",
        },
        labelBgStyle: {
          fill: isHighFrequency ? "#06b6d4" : "#64748b",
          fillOpacity: 1,
          rx: 6,
          ry: 6,
        },
        labelBgPadding: [6, 10] as [number, number],
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
    <Card className="border-0 shadow-xl bg-gradient-to-br from-muted/30 to-muted/10">
      <CardHeader>
        <CardTitle className="text-2xl flex items-center gap-2">
          <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg shadow-lg shadow-cyan-500/20">
            <svg className="h-5 w-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          </div>
          Process Flow Diagram
        </CardTitle>
        <CardDescription className="text-base">
          Discovered process model with {activities.length} activities and {transitions.length} transitions
        </CardDescription>
      </CardHeader>
      <CardContent>
        <div style={{ 
          height: "600px", 
          width: "100%", 
          borderRadius: "12px",
          background: "linear-gradient(to bottom right, rgba(6, 182, 212, 0.03), rgba(59, 130, 246, 0.03))",
          border: "1px solid rgba(6, 182, 212, 0.1)",
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
            <Background gap={16} size={1} color="rgba(6, 182, 212, 0.1)" />
            <Controls className="bg-background/80 backdrop-blur-sm border border-border shadow-lg rounded-lg" />
            <MiniMap
              nodeColor={(node) => {
                if (node.type === "input") return "#10b981";
                if (node.type === "output") return "#ef4444";
                return "#06b6d4";
              }}
              nodeBorderRadius={12}
              className="bg-background/80 backdrop-blur-sm border border-border shadow-lg rounded-lg"
            />
          </ReactFlow>
        </div>
        <div className="mt-6 flex gap-6 text-sm">
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-md bg-gradient-to-br from-emerald-500 to-green-600 shadow-md shadow-emerald-500/30" />
            <span className="font-medium">Start Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-md bg-gradient-to-br from-cyan-500 to-blue-600 shadow-md shadow-cyan-500/30" />
            <span className="font-medium">Intermediate Activity</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="h-4 w-4 rounded-md bg-gradient-to-br from-red-500 to-red-600 shadow-md shadow-red-500/30" />
            <span className="font-medium">End Activity</span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
