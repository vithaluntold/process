"use client";

import { useCallback, useEffect, useState, useMemo } from "react";
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
  BackgroundVariant,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import ProcessNode from "@/components/process-node";

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

  const nodeTypes = useMemo(() => ({ process: ProcessNode }), []);

  useEffect(() => {
    buildFlowchart();
  }, [activities, transitions]);

  const buildFlowchart = () => {
    const layers = assignLayers(startActivities, endActivities, transitions);
    
    const newNodes: Node[] = [];
    const nodeSpacing = 160;
    const layerSpacing = 300;

    layers.forEach((layerActivities, layerIndex) => {
      layerActivities.forEach((activity, activityIndex) => {
        const x = layerIndex * layerSpacing;
        const y = activityIndex * nodeSpacing;

        let nodeType: "start" | "activity" | "end" = "activity";

        if (startActivities.includes(activity)) {
          nodeType = "start";
        } else if (endActivities.includes(activity)) {
          nodeType = "end";
        }

        newNodes.push({
          id: activity,
          type: "process",
          position: { x, y },
          data: { 
            label: activity,
            nodeType: nodeType,
          },
        });
      });
    });

    const maxFrequency = Math.max(...transitions.map((t) => t.frequency), 1);

    const newEdges: Edge[] = transitions.map((transition) => {
      const width = Math.max(2, Math.min(6, (transition.frequency / maxFrequency) * 6));
      const isHighFrequency = transition.frequency > maxFrequency * 0.5;

      return {
        id: `${transition.from}-${transition.to}`,
        source: transition.from,
        target: transition.to,
        type: "smoothstep",
        animated: isHighFrequency,
        label: `${transition.frequency}×`,
        style: {
          stroke: isHighFrequency ? "hsl(var(--brand))" : "hsl(var(--muted-foreground) / 0.4)",
          strokeWidth: width,
        },
        markerEnd: {
          type: MarkerType.ArrowClosed,
          color: isHighFrequency ? "hsl(var(--brand))" : "hsl(var(--muted-foreground) / 0.4)",
          width: 20,
          height: 20,
        },
        labelStyle: {
          fill: "hsl(var(--foreground))",
          fontSize: "13px",
          fontWeight: "600",
        },
        labelBgStyle: {
          fill: "hsl(var(--background))",
          fillOpacity: 0.95,
          rx: 4,
        },
        labelBgPadding: [8, 4],
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
    <Card className="border-brand/20 overflow-hidden">
      <CardHeader className="bg-gradient-to-r from-brand/5 to-transparent">
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-2xl">Discovered Process Flow</CardTitle>
            <CardDescription className="mt-1">
              Interactive visualization of your process model
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Badge variant="outline" className="border-brand/30 bg-brand/5 text-brand">
              {activities.length} Activities
            </Badge>
            <Badge variant="outline" className="border-brand/30 bg-brand/5 text-brand">
              {transitions.length} Transitions
            </Badge>
          </div>
        </div>
      </CardHeader>
      <CardContent className="p-0">
        <div className="relative" style={{ height: "700px", width: "100%" }}>
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            nodeTypes={nodeTypes}
            fitView
            fitViewOptions={{ padding: 0.2 }}
            attributionPosition="bottom-right"
            className="bg-gradient-to-br from-background to-muted/20"
          >
            <Background 
              variant={BackgroundVariant.Dots}
              gap={16}
              size={1}
              color="hsl(var(--brand) / 0.1)"
            />
            <Controls className="bg-card border-border" />
            <MiniMap
              nodeColor={(node) => {
                const data = node.data as any;
                if (data.nodeType === "start") return "hsl(var(--brand))";
                if (data.nodeType === "end") return "hsl(var(--destructive))";
                return "hsl(var(--muted))";
              }}
              nodeBorderRadius={12}
              className="bg-card/80 border-border"
              maskColor="hsl(var(--background) / 0.8)"
            />
          </ReactFlow>
        </div>
        
        <div className="px-6 py-4 border-t border-border bg-muted/30">
          <div className="flex flex-wrap gap-6 text-sm">
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-3 rounded-full bg-gradient-to-br from-brand to-brand/80 shadow-lg shadow-brand/30" />
              <span className="font-medium">Start Activity</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-3 rounded border-2 border-brand/30 bg-card shadow" />
              <span className="font-medium">Process Step</span>
            </div>
            <div className="flex items-center gap-2.5">
              <div className="h-3 w-3 rounded-full bg-gradient-to-br from-destructive to-destructive/80 shadow-lg shadow-destructive/30" />
              <span className="font-medium">End Activity</span>
            </div>
            <div className="flex items-center gap-2.5 ml-auto">
              <div className="h-0.5 w-8 bg-gradient-to-r from-brand to-brand/60" />
              <span className="font-medium text-muted-foreground">High Frequency Path</span>
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
