"use client";

import { useEffect, useState } from "react";
import ReactFlow, {
  Node,
  Edge,
  Controls,
  Background,
  MiniMap,
  useNodesState,
  useEdgesState,
} from "reactflow";
import "reactflow/dist/style.css";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Database, Loader2 } from "lucide-react";

interface ProcessActivity {
  activity: string;
  sourceSystem: string | null;
  count: number;
}

interface UnifiedProcessMapProps {
  processId: number;
}

const SYSTEM_COLORS = {
  salesforce: {
    bg: "#3b82f6",
    border: "#2563eb",
    label: "Salesforce",
    icon: "🔵",
  },
  excel: {
    bg: "#10b981",
    border: "#059669",
    label: "Excel",
    icon: "🟢",
  },
  mainframe: {
    bg: "#a855f7",
    border: "#9333ea",
    label: "Mainframe",
    icon: "🟣",
  },
  unknown: {
    bg: "#6b7280",
    border: "#4b5563",
    label: "Unknown",
    icon: "⚪",
  },
};

export function UnifiedProcessMap({ processId }: UnifiedProcessMapProps) {
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState<{
    salesforceCount: number;
    excelCount: number;
    mainframeCount: number;
  }>({ salesforceCount: 0, excelCount: 0, mainframeCount: 0 });

  useEffect(() => {
    if (processId) {
      fetchProcessData();
    }
  }, [processId]);

  async function fetchProcessData() {
    setLoading(true);
    try {
      const response = await fetch(`/api/event-logs?processId=${processId}&limit=1000`);
      if (!response.ok) {
        console.error("Failed to fetch process data");
        return;
      }

      const data = await response.json();
      const events = data.events || [];

      const activityMap = new Map<string, ProcessActivity>();
      const transitionMap = new Map<string, { from: string; to: string; count: number }>();

      let salesforceCount = 0;
      let excelCount = 0;
      let mainframeCount = 0;

      events.forEach((event: any, index: number) => {
        const activity = event.activity || "Unknown";
        const sourceSystem = event.sourceSystem || "unknown";

        if (!activityMap.has(activity)) {
          activityMap.set(activity, {
            activity,
            sourceSystem,
            count: 0,
          });
        }
        const activityData = activityMap.get(activity)!;
        activityData.count++;

        if (sourceSystem === "salesforce") salesforceCount++;
        else if (sourceSystem === "excel") excelCount++;
        else if (sourceSystem === "mainframe") mainframeCount++;

        if (index > 0) {
          const prevEvent = events[index - 1];
          if (prevEvent.caseId === event.caseId) {
            const from = prevEvent.activity || "Unknown";
            const to = activity;
            const key = `${from}->${to}`;

            if (transitionMap.has(key)) {
              transitionMap.get(key)!.count++;
            } else {
              transitionMap.set(key, { from, to, count: 1 });
            }
          }
        }
      });

      setStats({ salesforceCount, excelCount, mainframeCount });

      const activities = Array.from(activityMap.values());
      const newNodes: Node[] = activities.map((activity, index) => {
        const system = activity.sourceSystem as keyof typeof SYSTEM_COLORS || "unknown";
        const color = SYSTEM_COLORS[system] || SYSTEM_COLORS.unknown;

        const row = Math.floor(index / 3);
        const col = index % 3;

        return {
          id: activity.activity,
          type: "default",
          position: { x: col * 250, y: row * 120 },
          data: {
            label: (
              <div className="text-center">
                <div className="font-semibold text-sm">{activity.activity}</div>
                <div className="text-xs text-gray-500 mt-1">
                  {color.icon} {color.label}
                </div>
                <div className="text-xs text-gray-400">{activity.count} events</div>
              </div>
            ),
          },
          style: {
            background: color.bg,
            border: `2px solid ${color.border}`,
            borderRadius: "8px",
            padding: "12px",
            color: "white",
            minWidth: "180px",
          },
        };
      });

      const transitions = Array.from(transitionMap.values());
      const maxCount = Math.max(...transitions.map((t) => t.count), 1);

      const newEdges: Edge[] = transitions.map((transition) => ({
        id: `${transition.from}-${transition.to}`,
        source: transition.from,
        target: transition.to,
        label: `${transition.count}x`,
        animated: transition.count > maxCount / 2,
        style: {
          strokeWidth: Math.max(1, (transition.count / maxCount) * 5),
        },
        labelStyle: {
          fontSize: "10px",
          fill: "#666",
        },
      }));

      setNodes(newNodes);
      setEdges(newEdges);
    } catch (error) {
      console.error("Error fetching process data:", error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-4">
      <div className="grid gap-3 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Salesforce Events</CardTitle>
            <Database className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.salesforceCount}</div>
            <p className="text-xs text-muted-foreground">Lead origination</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Excel Events</CardTitle>
            <Database className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.excelCount}</div>
            <p className="text-xs text-muted-foreground">Underwriting analysis</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Mainframe Events</CardTitle>
            <Database className="h-4 w-4 text-purple-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.mainframeCount}</div>
            <p className="text-xs text-muted-foreground">Loan servicing</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Unified Process Map</CardTitle>
          <CardDescription>
            Activities color-coded by source system
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center h-96">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : nodes.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-96 text-muted-foreground">
              <Database className="h-12 w-12 mb-4 opacity-50" />
              <p>No process data available</p>
              <p className="text-sm">Import demo data to visualize the process</p>
            </div>
          ) : (
            <div style={{ height: "600px", width: "100%" }}>
              <ReactFlow
                nodes={nodes}
                edges={edges}
                onNodesChange={onNodesChange}
                onEdgesChange={onEdgesChange}
                fitView
                attributionPosition="bottom-left"
              >
                <Background />
                <Controls />
                <MiniMap
                  nodeColor={(node) => {
                    const sourceSystem = node.data.label?.props?.children?.[1]?.props?.children?.[1]?.props?.children;
                    const system = sourceSystem?.toLowerCase() || "unknown";
                    return (SYSTEM_COLORS[system as keyof typeof SYSTEM_COLORS] || SYSTEM_COLORS.unknown).bg;
                  }}
                />
              </ReactFlow>
            </div>
          )}

          <div className="flex gap-4 mt-4 justify-center">
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: SYSTEM_COLORS.salesforce.bg }} />
              <span className="text-sm">Salesforce</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: SYSTEM_COLORS.excel.bg }} />
              <span className="text-sm">Excel</span>
            </div>
            <div className="flex items-center gap-2">
              <div className="w-4 h-4 rounded" style={{ background: SYSTEM_COLORS.mainframe.bg }} />
              <span className="text-sm">Mainframe</span>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
