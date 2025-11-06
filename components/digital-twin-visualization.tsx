"use client"

import { useState, useCallback } from "react"
import SimpleFlowDiagram from "@/components/simple-flow-diagram"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Play, RotateCcw, FileDown, Lightbulb, ArrowRight, Clock, DollarSign, BarChart2 } from "lucide-react"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

// Flow node types for SimpleFlowDiagram
type NodeType = "start" | "activity" | "gateway" | "end" | "bottleneck" | "automated"

interface FlowNode {
  id: string
  label: string
  x: number
  y: number
  type: NodeType
  data?: {
    duration?: number
    cost?: number
    automated?: boolean
  }
}

interface FlowEdge {
  from: string
  to: string
  label?: string
}

// Initial process model nodes (Current State)
const getInitialNodes = (): FlowNode[] => [
  { id: "1", label: "Order Received", x: 250, y: 0, type: "start", data: { duration: 0.5, cost: 5, automated: false } },
  {
    id: "2",
    label: "Verify Order",
    x: 250,
    y: 100,
    type: "activity",
    data: { duration: 2, cost: 15, automated: false },
  },
  {
    id: "3",
    label: "Order Valid?",
    x: 250,
    y: 200,
    type: "gateway",
    data: { duration: 0.5, cost: 5, automated: false },
  },
  {
    id: "4",
    label: "Request Info",
    x: 100,
    y: 300,
    type: "bottleneck",
    data: { duration: 8, cost: 25, automated: false },
  },
  {
    id: "5",
    label: "Process Payment",
    x: 400,
    y: 300,
    type: "activity",
    data: { duration: 1, cost: 10, automated: false },
  },
  {
    id: "6",
    label: "Payment OK?",
    x: 400,
    y: 400,
    type: "gateway",
    data: { duration: 0.5, cost: 5, automated: false },
  },
  {
    id: "7",
    label: "Retry Payment",
    x: 250,
    y: 500,
    type: "activity",
    data: { duration: 4, cost: 20, automated: false },
  },
  {
    id: "8",
    label: "Fulfill Order",
    x: 550,
    y: 500,
    type: "activity",
    data: { duration: 24, cost: 50, automated: false },
  },
  { id: "9", label: "Order Complete", x: 550, y: 600, type: "end", data: { duration: 0, cost: 0, automated: false } },
]

const getInitialEdges = (): FlowEdge[] => [
  { from: "1", to: "2" },
  { from: "2", to: "3" },
  { from: "3", to: "4", label: "No (32%)" },
  { from: "3", to: "5", label: "Yes (68%)" },
  { from: "4", to: "2" },
  { from: "5", to: "6" },
  { from: "6", to: "7", label: "No (15%)" },
  { from: "6", to: "8", label: "Yes (85%)" },
  { from: "7", to: "6" },
  { from: "8", to: "9" },
]

// Predefined scenarios
const scenarios = {
  current: {
    name: "Current State",
    description: "Baseline process with no optimizations",
    metrics: {
      avgCycleTime: 40.5,
      totalCost: 135,
      throughput: 85,
      bottlenecks: ["Request Info", "Retry Payment"],
      automationRate: 0,
    },
  },
  optimize_bottlenecks: {
    name: "Optimize Bottlenecks",
    description: "Reduce time spent on information requests",
    metrics: {
      avgCycleTime: 32.8,
      totalCost: 130,
      throughput: 92,
      bottlenecks: ["Retry Payment"],
      automationRate: 0,
    },
    changes: [{ nodeId: "4", updates: { duration: 4, type: "activity" as NodeType } }],
  },
  automate_verification: {
    name: "Automate Verification",
    description: "Implement RPA for order verification",
    metrics: {
      avgCycleTime: 38.0,
      totalCost: 128,
      throughput: 88,
      bottlenecks: ["Request Info", "Retry Payment"],
      automationRate: 15,
    },
    changes: [{ nodeId: "2", updates: { duration: 0.5, type: "automated" as NodeType, automated: true } }],
  },
  reduce_rework: {
    name: "Reduce Rework Loops",
    description: "Improve payment success rate",
    metrics: {
      avgCycleTime: 36.2,
      totalCost: 125,
      throughput: 90,
      bottlenecks: ["Request Info"],
      automationRate: 0,
    },
    edgeChanges: [
      { from: "6", to: "7", label: "No (5%)" },
      { from: "6", to: "8", label: "Yes (95%)" },
    ],
  },
  full_optimization: {
    name: "Full Optimization",
    description: "Combine all optimization strategies",
    metrics: {
      avgCycleTime: 28.5,
      totalCost: 115,
      throughput: 98,
      bottlenecks: [],
      automationRate: 25,
    },
    changes: [
      { nodeId: "2", updates: { duration: 0.5, type: "automated" as NodeType, automated: true } },
      { nodeId: "4", updates: { duration: 4, type: "activity" as NodeType } },
      { nodeId: "7", updates: { duration: 2, type: "activity" as NodeType } },
    ],
    edgeChanges: [
      { from: "6", to: "7", label: "No (5%)" },
      { from: "6", to: "8", label: "Yes (95%)" },
    ],
  },
}

export default function DigitalTwinVisualization() {
  const [nodes, setNodes] = useState<FlowNode[]>(getInitialNodes())
  const [edges, setEdges] = useState<FlowEdge[]>(getInitialEdges())
  const [scenario, setScenario] = useState("current")
  const [isComparing, setIsComparing] = useState(false)
  const [compareScenario] = useState("full_optimization")
  const [metrics, setMetrics] = useState(scenarios.current.metrics)
  const [selectedNode, setSelectedNode] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState("overview")

  // Apply scenario changes
  const applyScenario = useCallback((scenarioId: string) => {
    console.log("Applying scenario:", scenarioId)
    const selectedScenario = scenarios[scenarioId as keyof typeof scenarios]

    if (!selectedScenario) {
      console.log("Scenario not found:", scenarioId)
      return
    }

    // Reset to initial state first
    let updatedNodes = getInitialNodes()
    const updatedEdges = getInitialEdges()

    // Apply node changes
    if (selectedScenario.changes) {
      selectedScenario.changes.forEach((change) => {
        updatedNodes = updatedNodes.map((node) => {
          if (node.id === change.nodeId) {
            return {
              ...node,
              type: change.updates.type || node.type,
              data: {
                ...node.data,
                duration: change.updates.duration ?? node.data?.duration,
                automated: change.updates.automated ?? node.data?.automated,
              },
            }
          }
          return node
        })
      })
    }

    // Apply edge changes
    if (selectedScenario.edgeChanges) {
      selectedScenario.edgeChanges.forEach((edgeChange) => {
        const edgeIndex = updatedEdges.findIndex((edge) => edge.from === edgeChange.from && edge.to === edgeChange.to)
        if (edgeIndex !== -1) {
          updatedEdges[edgeIndex] = {
            ...updatedEdges[edgeIndex],
            label: edgeChange.label,
          }
        }
      })
    }

    console.log("Updated nodes:", updatedNodes)
    console.log("Updated edges:", updatedEdges)

    setNodes(updatedNodes)
    setEdges(updatedEdges)
    setMetrics(selectedScenario.metrics)
    setScenario(scenarioId)
  }, [])

  // Toggle comparison mode
  const toggleComparison = useCallback(() => {
    if (isComparing) {
      // Restore to current scenario
      applyScenario(scenario)
      setIsComparing(false)
    } else {
      // Apply comparison scenario
      applyScenario(compareScenario)
      setIsComparing(true)
    }
  }, [isComparing, scenario, compareScenario, applyScenario])

  // Handle node selection
  const handleNodeSelect = useCallback((nodeId: string) => {
    console.log("Node selected:", nodeId)
    setSelectedNode(nodeId)
  }, [])

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3 border-[#11c1d6]/20">
          <CardHeader>
            <div className="flex items-center justify-between">
              <div>
                <CardTitle>Digital Twin Visualization</CardTitle>
                <CardDescription>
                  Interactive model of your business process with what-if scenario analysis.
                </CardDescription>
              </div>
              <div className="flex items-center gap-2">
                {!isComparing ? (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleComparison}
                    className="flex items-center gap-1 bg-transparent"
                  >
                    <BarChart2 className="h-4 w-4" />
                    Compare with Optimized
                  </Button>
                ) : (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={toggleComparison}
                    className="flex items-center gap-1 bg-transparent"
                  >
                    <RotateCcw className="h-4 w-4" />
                    Exit Comparison
                  </Button>
                )}
                <Button variant="outline" size="sm" className="flex items-center gap-1 bg-transparent">
                  <FileDown className="h-4 w-4" />
                  Export
                </Button>
              </div>
            </div>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <Select value={scenario} onValueChange={applyScenario} disabled={isComparing}>
                  <SelectTrigger className="w-[220px]">
                    <SelectValue placeholder="Select scenario" />
                  </SelectTrigger>
                  <SelectContent>
                    {Object.entries(scenarios).map(([id, data]) => (
                      <SelectItem key={id} value={id}>
                        {data.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                {!isComparing && (
                  <div className="text-sm text-muted-foreground max-w-md">
                    {scenarios[scenario as keyof typeof scenarios]?.description}
                  </div>
                )}
                {isComparing && (
                  <div className="flex items-center gap-2">
                    <Badge className="bg-amber-500">{scenarios[scenario as keyof typeof scenarios]?.name}</Badge>
                    <ArrowRight className="h-4 w-4" />
                    <Badge className="bg-emerald-500">
                      {scenarios[compareScenario as keyof typeof scenarios]?.name}
                    </Badge>
                  </div>
                )}
              </div>
            </div>

            {/* Process Flow Visualization */}
            <div className="p-4">
              <SimpleFlowDiagram nodes={nodes} edges={edges} width={800} height={700} onNodeSelect={handleNodeSelect} />
            </div>

            {/* Legend */}
            <div className="p-4 border-t flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-slate-100 border border-[#11c1d6]"></div>
                <span className="text-sm">Standard Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-amber-100 border border-amber-500"></div>
                <span className="text-sm">Bottleneck</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-emerald-100 border border-emerald-500"></div>
                <span className="text-sm">Automated Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-cyan-50 border border-[#11c1d6]"></div>
                <span className="text-sm">Decision Point</span>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Metrics and Insights */}
      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="bg-[#11c1d6]/10">
          <TabsTrigger value="overview" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Overview
          </TabsTrigger>
          <TabsTrigger value="metrics" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Detailed Metrics
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            AI Insights
          </TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="space-y-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
            <Card className="border-[#11c1d6]/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Clock className="h-4 w-4" />
                  Cycle Time
                </div>
                <div className="text-2xl font-bold">{metrics.avgCycleTime} hrs</div>
                {isComparing && (
                  <div className="text-xs text-emerald-500 mt-1">
                    {(
                      ((scenarios.current.metrics.avgCycleTime -
                        scenarios[compareScenario as keyof typeof scenarios].metrics.avgCycleTime) /
                        scenarios.current.metrics.avgCycleTime) *
                      100
                    ).toFixed(1)}
                    % improvement
                  </div>
                )}
              </CardHeader>
            </Card>

            <Card className="border-[#11c1d6]/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <DollarSign className="h-4 w-4" />
                  Process Cost
                </div>
                <div className="text-2xl font-bold">${metrics.totalCost}</div>
                {isComparing && (
                  <div className="text-xs text-emerald-500 mt-1">
                    {(
                      ((scenarios.current.metrics.totalCost -
                        scenarios[compareScenario as keyof typeof scenarios].metrics.totalCost) /
                        scenarios.current.metrics.totalCost) *
                      100
                    ).toFixed(1)}
                    % savings
                  </div>
                )}
              </CardHeader>
            </Card>

            <Card className="border-[#11c1d6]/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <BarChart2 className="h-4 w-4" />
                  Throughput
                </div>
                <div className="text-2xl font-bold">{metrics.throughput}/day</div>
                {isComparing && (
                  <div className="text-xs text-emerald-500 mt-1">
                    {(
                      ((scenarios[compareScenario as keyof typeof scenarios].metrics.throughput -
                        scenarios.current.metrics.throughput) /
                        scenarios.current.metrics.throughput) *
                      100
                    ).toFixed(1)}
                    % increase
                  </div>
                )}
              </CardHeader>
            </Card>

            <Card className="border-[#11c1d6]/20">
              <CardHeader className="pb-2">
                <div className="flex items-center gap-2 text-sm text-muted-foreground mb-1">
                  <Play className="h-4 w-4" />
                  Automation
                </div>
                <div className="text-2xl font-bold">{metrics.automationRate}%</div>
                {isComparing && (
                  <div className="text-xs text-emerald-500 mt-1">
                    +
                    {scenarios[compareScenario as keyof typeof scenarios].metrics.automationRate -
                      scenarios.current.metrics.automationRate}
                    % increase
                  </div>
                )}
              </CardHeader>
            </Card>
          </div>

          {selectedNode && (
            <Card className="border-[#11c1d6]/20 bg-[#11c1d6]/5">
              <CardHeader>
                <CardTitle>Selected Node Details</CardTitle>
                <CardDescription>
                  {nodes.find((n) => n.id === selectedNode)?.label || "No node selected"}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-3 gap-4">
                  <div>
                    <div className="text-sm text-muted-foreground">Duration</div>
                    <div className="text-lg font-bold">
                      {nodes.find((n) => n.id === selectedNode)?.data?.duration || 0} hrs
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Cost</div>
                    <div className="text-lg font-bold">
                      ${nodes.find((n) => n.id === selectedNode)?.data?.cost || 0}
                    </div>
                  </div>
                  <div>
                    <div className="text-sm text-muted-foreground">Status</div>
                    <div className="text-lg font-bold">
                      {nodes.find((n) => n.id === selectedNode)?.data?.automated ? (
                        <Badge className="bg-emerald-500">Automated</Badge>
                      ) : (
                        <Badge variant="outline">Manual</Badge>
                      )}
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="metrics" className="space-y-4">
          <Card className="border-[#11c1d6]/20">
            <CardHeader>
              <CardTitle>Process Performance Comparison</CardTitle>
              <CardDescription>
                {isComparing
                  ? "Comparing current scenario with optimized version"
                  : "Key performance indicators for the selected scenario"}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Cycle Time</div>
                    <div className="text-sm">
                      {isComparing
                        ? `${metrics.avgCycleTime} hrs vs ${scenarios.current.metrics.avgCycleTime} hrs`
                        : `${metrics.avgCycleTime} hrs`}
                    </div>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                    {isComparing && (
                      <div
                        className="absolute h-full rounded-full bg-muted-foreground/30"
                        style={{ width: `${Math.min(100, (scenarios.current.metrics.avgCycleTime / 50) * 100)}%` }}
                      ></div>
                    )}
                    <div
                      className="absolute h-full rounded-full bg-[#11c1d6]"
                      style={{ width: `${Math.min(100, (metrics.avgCycleTime / 50) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Process Cost</div>
                    <div className="text-sm">
                      {isComparing
                        ? `$${metrics.totalCost} vs $${scenarios.current.metrics.totalCost}`
                        : `$${metrics.totalCost}`}
                    </div>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                    {isComparing && (
                      <div
                        className="absolute h-full rounded-full bg-muted-foreground/30"
                        style={{ width: `${Math.min(100, (scenarios.current.metrics.totalCost / 150) * 100)}%` }}
                      ></div>
                    )}
                    <div
                      className="absolute h-full rounded-full bg-[#11c1d6]"
                      style={{ width: `${Math.min(100, (metrics.totalCost / 150) * 100)}%` }}
                    ></div>
                  </div>
                </div>

                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <div className="text-sm">Throughput</div>
                    <div className="text-sm">
                      {isComparing
                        ? `${metrics.throughput}/day vs ${scenarios.current.metrics.throughput}/day`
                        : `${metrics.throughput}/day`}
                    </div>
                  </div>
                  <div className="relative h-2 w-full rounded-full bg-muted overflow-hidden">
                    {isComparing && (
                      <div
                        className="absolute h-full rounded-full bg-muted-foreground/30"
                        style={{ width: `${scenarios.current.metrics.throughput}%` }}
                      ></div>
                    )}
                    <div
                      className="absolute h-full rounded-full bg-[#11c1d6]"
                      style={{ width: `${metrics.throughput}%` }}
                    ></div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        <TabsContent value="insights" className="space-y-4">
          <Card className="border-[#11c1d6]/20">
            <CardHeader>
              <CardTitle>AI-Powered Insights</CardTitle>
              <CardDescription>Recommendations based on current scenario</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start gap-2 rounded-lg border border-[#11c1d6]/20 p-3 bg-[#11c1d6]/5">
                  <Lightbulb className="h-5 w-5 text-[#11c1d6] mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Bottleneck Analysis</p>
                    <p className="text-muted-foreground mt-1">
                      {metrics.bottlenecks.length > 0
                        ? `Identified ${metrics.bottlenecks.length} bottleneck(s): ${metrics.bottlenecks.join(", ")}. Addressing these could reduce cycle time by up to 30%.`
                        : "No bottlenecks detected in this scenario. Process flow is optimized."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-[#11c1d6]/20 p-3">
                  <Lightbulb className="h-5 w-5 text-[#11c1d6] mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Automation Opportunities</p>
                    <p className="text-muted-foreground mt-1">
                      {scenario === "automate_verification" || scenario === "full_optimization"
                        ? "Verification automation reduces manual effort and improves accuracy by 35%."
                        : "The 'Verify Order' step is a prime candidate for RPA, with potential cost reduction of 45%."}
                    </p>
                  </div>
                </div>

                <div className="flex items-start gap-2 rounded-lg border border-[#11c1d6]/20 p-3">
                  <Lightbulb className="h-5 w-5 text-[#11c1d6] mt-0.5 shrink-0" />
                  <div className="text-sm">
                    <p className="font-medium">Process Optimization</p>
                    <p className="text-muted-foreground mt-1">
                      {scenario === "reduce_rework" || scenario === "full_optimization"
                        ? "Reducing payment failures from 15% to 5% significantly improves overall process efficiency."
                        : "High rework rate in payment processing suggests improving the payment gateway integration."}
                    </p>
                  </div>
                </div>

                {isComparing && (
                  <div className="flex items-start gap-2 rounded-lg border border-emerald-200 p-3 bg-emerald-50">
                    <Lightbulb className="h-5 w-5 text-emerald-600 mt-0.5 shrink-0" />
                    <div className="text-sm">
                      <p className="font-medium">Comparison Insight</p>
                      <p className="text-muted-foreground mt-1">
                        The optimized scenario could save approximately $
                        {scenarios.current.metrics.totalCost -
                          scenarios[compareScenario as keyof typeof scenarios].metrics.totalCost}{" "}
                        per process execution and reduce cycle time by{" "}
                        {(
                          scenarios.current.metrics.avgCycleTime -
                          scenarios[compareScenario as keyof typeof scenarios].metrics.avgCycleTime
                        ).toFixed(1)}{" "}
                        hours.
                      </p>
                    </div>
                  </div>
                )}

                <div className="pt-2 mt-2 border-t">
                  <h4 className="text-sm font-medium mb-2">Recommended Next Steps:</h4>
                  <ol className="text-sm space-y-1 list-decimal list-inside text-muted-foreground">
                    <li>Implement RPA for order verification process</li>
                    <li>Optimize information request workflow</li>
                    <li>Improve payment gateway integration</li>
                    <li>Consider full process optimization for maximum ROI</li>
                  </ol>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
