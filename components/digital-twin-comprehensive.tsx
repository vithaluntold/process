"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Slider } from "@/components/ui/slider";
import {
  Network,
  Play,
  TrendingUp,
  Clock,
  Zap,
  AlertCircle,
  CheckCircle2,
  RefreshCw,
  BarChart3,
  ArrowRight,
} from "lucide-react";
import { toast } from "sonner";
import ReactFlow, {
  Node,
  Edge,
  Background,
  Controls,
  MiniMap,
  MarkerType,
} from "reactflow";
import "reactflow/dist/style.css";

interface Process {
  id: number;
  name: string;
  description: string | null;
}

interface ProcessModel {
  id: number;
  processId: number;
  activities: string[];
  transitions: Array<{ from: string; to: string; frequency: number }>;
  startActivities: string[];
  endActivities: string[];
}

interface SimulationResults {
  totalCases: number;
  completedCases: number;
  avgCycleTime: number;
  throughput: number;
  activityStats: Array<{
    activity: string;
    avgProcessingTime: number;
    utilizationRate: number;
    completionCount: number;
  }>;
  bottlenecks: string[];
  caseTimes: number[];
}

interface Scenario {
  id: number;
  processId: number;
  name: string;
  description: string | null;
  parameters: any;
  results: SimulationResults | null;
  status: string;
  createdAt: string;
  completedAt: string | null;
}

export default function DigitalTwinComprehensive() {
  const [activeTab, setActiveTab] = useState("modeling");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [processModel, setProcessModel] = useState<ProcessModel | null>(null);
  const [loadingModel, setLoadingModel] = useState(false);
  
  // What-If Analysis State
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [scenarioName, setScenarioName] = useState("");
  const [numberOfCases, setNumberOfCases] = useState("100");
  const [durationMultiplier, setDurationMultiplier] = useState(1.0);
  const [running, setRunning] = useState(false);

  // Impact Simulation State
  const [baselineScenario, setBaselineScenario] = useState<Scenario | null>(null);
  const [optimizedScenario, setOptimizedScenario] = useState<Scenario | null>(null);
  const [comparisonResults, setComparisonResults] = useState<any>(null);

  // ReactFlow State
  const [nodes, setNodes] = useState<Node[]>([]);
  const [edges, setEdges] = useState<Edge[]>([]);

  useEffect(() => {
    loadProcesses();
  }, []);

  useEffect(() => {
    if (selectedProcessId) {
      // Reset all state when process changes
      setProcessModel(null);
      setNodes([]);
      setEdges([]);
      setScenarios([]);
      setBaselineScenario(null);
      setOptimizedScenario(null);
      setComparisonResults(null);
      setScenarioName("");
      setRunning(false); // Reset running state to unblock UI
      
      // Load new process data
      loadProcessModel();
      loadScenarios();
    }
  }, [selectedProcessId]);

  async function loadProcesses() {
    try {
      const response = await fetch("/api/processes");
      if (!response.ok) throw new Error("Failed to load processes");
      const data = await response.json();
      setProcesses(data.processes || []);
    } catch (error) {
      toast.error("Failed to load processes");
      setProcesses([]);
    }
  }

  async function loadProcessModel() {
    if (!selectedProcessId) return;
    
    const processIdAtStart = selectedProcessId; // Capture the ID for validation
    
    try {
      setLoadingModel(true);
      const response = await fetch(`/api/processes/${processIdAtStart}/discover`, {
        method: "POST",
      });
      
      if (!response.ok) throw new Error("Failed to load process model");
      
      const data = await response.json();
      
      // Check if process changed while we were fetching
      if (processIdAtStart !== selectedProcessId) {
        console.log("Process changed during fetch, discarding stale model");
        return;
      }
      
      // Extract the model from the response
      const model = data.model || data;
      
      // Validate model structure
      if (!model.activities || !Array.isArray(model.activities)) {
        throw new Error("Invalid model structure");
      }
      
      setProcessModel(model);
      
      // Create ReactFlow nodes and edges from the model
      createFlowVisualization(model);
    } catch (error) {
      // Only show error if we're still on the same process
      if (processIdAtStart === selectedProcessId) {
        console.error("Process model error:", error);
        toast.error("Failed to load process model. Please ensure process has event logs.");
        setProcessModel(null);
      }
    } finally {
      // Only clear loading if we're still on the same process
      if (processIdAtStart === selectedProcessId) {
        setLoadingModel(false);
      }
    }
  }

  function createFlowVisualization(model: ProcessModel) {
    // Validate model data
    if (!model.activities || !Array.isArray(model.activities) || model.activities.length === 0) {
      setNodes([]);
      setEdges([]);
      return;
    }

    const activityPositions = new Map<string, { x: number; y: number }>();
    const activities = model.activities;
    
    // Simple layout algorithm
    const width = 800;
    const height = 600;
    const cols = Math.ceil(Math.sqrt(activities.length));
    const rows = Math.ceil(activities.length / cols);
    const xSpacing = width / (cols + 1);
    const ySpacing = height / (rows + 1);
    
    activities.forEach((activity, index) => {
      const col = index % cols;
      const row = Math.floor(index / cols);
      activityPositions.set(activity, {
        x: (col + 1) * xSpacing,
        y: (row + 1) * ySpacing,
      });
    });

    const startActivities = model.startActivities || [];
    const endActivities = model.endActivities || [];

    const flowNodes: Node[] = activities.map((activity) => {
      const pos = activityPositions.get(activity) || { x: 0, y: 0 };
      const isStart = startActivities.includes(activity);
      const isEnd = endActivities.includes(activity);
      
      return {
        id: activity,
        position: pos,
        data: { 
          label: activity,
        },
        type: 'default',
        style: {
          background: isStart ? 'var(--success)' : isEnd ? 'var(--destructive)' : 'var(--brand)',
          color: 'white',
          border: '2px solid var(--brand)',
          borderRadius: '8px',
          padding: '10px',
          fontSize: '12px',
          fontWeight: '500',
        },
      };
    });

    const transitions = model.transitions || [];
    const flowEdges: Edge[] = transitions.map((transition, index) => ({
      id: `${transition.from}-${transition.to}-${index}`,
      source: transition.from,
      target: transition.to,
      label: `${transition.frequency}`,
      type: 'smoothstep',
      animated: transition.frequency > 10,
      style: {
        strokeWidth: Math.min(transition.frequency / 10, 5),
      },
      markerEnd: {
        type: MarkerType.ArrowClosed,
      },
    }));

    setNodes(flowNodes);
    setEdges(flowEdges);
  }

  async function loadScenarios() {
    if (!selectedProcessId) return;
    
    const processIdAtStart = selectedProcessId; // Capture the ID for validation
    
    try {
      const response = await fetch(`/api/simulations?processId=${processIdAtStart}`);
      if (!response.ok) throw new Error("Failed to load scenarios");
      const data = await response.json();
      
      // Check if process changed while we were fetching
      if (processIdAtStart !== selectedProcessId) {
        console.log("Process changed during fetch, discarding stale scenarios");
        return;
      }
      
      setScenarios(data);
    } catch (error) {
      // Only show error if we're still on the same process
      if (processIdAtStart === selectedProcessId) {
        toast.error("Failed to load scenarios");
      }
    }
  }

  async function runSimulation() {
    if (!selectedProcessId || !scenarioName) {
      toast.error("Please select a process and enter a scenario name");
      return;
    }

    const processIdAtStart = selectedProcessId; // Capture for validation
    const wasBaselineNeeded = !baselineScenario && durationMultiplier === 1.0;

    try {
      setRunning(true);
      const response = await fetch("/api/simulations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId: parseInt(processIdAtStart),
          name: scenarioName,
          description: `Duration multiplier: ${durationMultiplier}x`,
          parameters: {
            numberOfCases: parseInt(numberOfCases),
            arrivalRate: 300000,
            durationMultipliers: { "*": durationMultiplier },
          },
        }),
      });

      if (!response.ok) throw new Error("Failed to run simulation");
      
      const newScenario = await response.json();
      
      // Check if process changed while simulation was running
      if (processIdAtStart !== selectedProcessId) {
        console.log("Process changed during simulation, discarding result");
        setRunning(false); // Reset running state before early exit
        return;
      }
      
      toast.success("Simulation completed successfully!");
      
      // Use functional setter to avoid stale closure
      setScenarios(prevScenarios => [newScenario, ...prevScenarios]);
      setScenarioName("");
      setDurationMultiplier(1.0);
      setNumberOfCases("100");
      
      // Auto-select for comparison (only if still on same process)
      if (wasBaselineNeeded && processIdAtStart === selectedProcessId) {
        setBaselineScenario(newScenario);
      }
    } catch (error) {
      // Only show error if we're still on the same process
      if (processIdAtStart === selectedProcessId) {
        toast.error("Failed to run simulation");
      }
    } finally {
      // Only clear running state if we're still on the same process
      if (processIdAtStart === selectedProcessId) {
        setRunning(false);
      }
    }
  }

  function compareScenarios() {
    if (!baselineScenario?.results || !optimizedScenario?.results) {
      toast.error("Please select both baseline and optimized scenarios");
      return;
    }

    const baseline = baselineScenario.results;
    const optimized = optimizedScenario.results;

    const cycleTimeImprovement = ((baseline.avgCycleTime - optimized.avgCycleTime) / baseline.avgCycleTime) * 100;
    const throughputImprovement = ((optimized.throughput - baseline.throughput) / baseline.throughput) * 100;
    
    setComparisonResults({
      cycleTimeImprovement,
      throughputImprovement,
      baselineCycleTime: baseline.avgCycleTime,
      optimizedCycleTime: optimized.avgCycleTime,
      baselineThroughput: baseline.throughput,
      optimizedThroughput: optimized.throughput,
      bottlenecksResolved: baseline.bottlenecks.filter(b => !optimized.bottlenecks.includes(b)),
    });
  }

  function formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Digital Twin Simulation</h1>
          <p className="text-muted-foreground">
            Create virtual replicas of business processes for simulation and testing
          </p>
        </div>
        <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a process" />
          </SelectTrigger>
          <SelectContent>
            {processes.map((process) => (
              <SelectItem key={process.id} value={process.id.toString()}>
                {process.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Main Content */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid grid-cols-3 w-full max-w-2xl">
          <TabsTrigger value="modeling">
            <Network className="h-4 w-4 mr-2" />
            Process Modeling
          </TabsTrigger>
          <TabsTrigger value="whatif">
            <TrendingUp className="h-4 w-4 mr-2" />
            What-If Analysis
          </TabsTrigger>
          <TabsTrigger value="impact">
            <BarChart3 className="h-4 w-4 mr-2" />
            Impact Simulation
          </TabsTrigger>
        </TabsList>

        {/* Process Modeling Tab */}
        <TabsContent value="modeling" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Process Digital Twin</CardTitle>
              <CardDescription>
                Visual representation of your business process with all activities and transitions
              </CardDescription>
            </CardHeader>
            <CardContent>
              {!selectedProcessId ? (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <div className="rounded-full bg-brand/10 p-8 mb-4">
                    <Network className="h-16 w-16 text-brand" />
                  </div>
                  <p className="text-muted-foreground">Select a process to view its digital twin model</p>
                </div>
              ) : loadingModel ? (
                <div className="flex items-center justify-center py-16">
                  <RefreshCw className="h-8 w-8 animate-spin text-brand" />
                  <span className="ml-3 text-muted-foreground">Building digital twin...</span>
                </div>
              ) : processModel && nodes.length > 0 ? (
                <div className="space-y-4">
                  <div className="flex items-center gap-4 p-4 bg-muted rounded-lg">
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-success"></div>
                      <span className="text-sm">Start Activities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-destructive"></div>
                      <span className="text-sm">End Activities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-4 h-4 rounded bg-brand"></div>
                      <span className="text-sm">Process Activities</span>
                    </div>
                  </div>
                  
                  <div style={{ height: "600px" }} className="border rounded-lg">
                    <ReactFlow
                      nodes={nodes}
                      edges={edges}
                      fitView
                      attributionPosition="bottom-left"
                    >
                      <Background />
                      <Controls />
                      <MiniMap />
                    </ReactFlow>
                  </div>

                  <div className="grid grid-cols-3 gap-4">
                    <Card className="border-brand/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Activities</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {processModel?.activities?.length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-brand/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Transitions</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {processModel?.transitions?.length || 0}
                        </div>
                      </CardContent>
                    </Card>
                    <Card className="border-brand/20">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Paths</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="text-2xl font-bold">
                          {processModel?.startActivities?.length || 0} → {processModel?.endActivities?.length || 0}
                        </div>
                      </CardContent>
                    </Card>
                  </div>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground">No process model available. Upload event logs first.</p>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* What-If Analysis Tab */}
        <TabsContent value="whatif" className="space-y-4">
          <div className="grid md:grid-cols-2 gap-6">
            {/* Simulation Configuration */}
            <Card>
              <CardHeader>
                <CardTitle>Configure Scenario</CardTitle>
                <CardDescription>
                  Test different scenarios by adjusting process parameters
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <Label htmlFor="scenario-name">Scenario Name</Label>
                  <Input
                    id="scenario-name"
                    value={scenarioName}
                    onChange={(e) => setScenarioName(e.target.value)}
                    placeholder="e.g., Optimized Process"
                  />
                </div>

                <div>
                  <Label htmlFor="cases">Number of Cases: {numberOfCases}</Label>
                  <Slider
                    id="cases"
                    min={10}
                    max={500}
                    step={10}
                    value={[parseInt(numberOfCases)]}
                    onValueChange={(value) => setNumberOfCases(value[0].toString())}
                  />
                </div>

                <div>
                  <Label htmlFor="multiplier">
                    Duration Multiplier: {durationMultiplier.toFixed(1)}x
                    <span className="text-xs text-muted-foreground ml-2">
                      ({durationMultiplier < 1 ? "Faster" : durationMultiplier > 1 ? "Slower" : "Baseline"})
                    </span>
                  </Label>
                  <Slider
                    id="multiplier"
                    min={0.5}
                    max={2.0}
                    step={0.1}
                    value={[durationMultiplier]}
                    onValueChange={(value) => setDurationMultiplier(value[0])}
                  />
                </div>

                <Button
                  onClick={runSimulation}
                  disabled={running || !selectedProcessId || !scenarioName}
                  className="w-full"
                >
                  {running ? (
                    <>
                      <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                      Running Simulation...
                    </>
                  ) : (
                    <>
                      <Play className="h-4 w-4 mr-2" />
                      Run Simulation
                    </>
                  )}
                </Button>
              </CardContent>
            </Card>

            {/* Latest Results */}
            <Card>
              <CardHeader>
                <CardTitle>Latest Results</CardTitle>
                <CardDescription>
                  Most recent simulation results
                </CardDescription>
              </CardHeader>
              <CardContent>
                {scenarios.length > 0 && scenarios[0].results ? (
                  <div className="space-y-4">
                    <div>
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-medium">{scenarios[0].name}</span>
                        <Badge variant="outline" className="bg-success/10">
                          <CheckCircle2 className="h-3 w-3 mr-1" />
                          Completed
                        </Badge>
                      </div>
                      <p className="text-xs text-muted-foreground">
                        {scenarios[0].description}
                      </p>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Avg Cycle Time</span>
                          <Clock className="h-3 w-3 text-brand" />
                        </div>
                        <p className="text-lg font-bold">
                          {formatDuration(scenarios[0].results.avgCycleTime)}
                        </p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Throughput</span>
                          <TrendingUp className="h-3 w-3 text-brand" />
                        </div>
                        <p className="text-lg font-bold">
                          {scenarios[0].results.throughput.toFixed(2)}
                        </p>
                        <p className="text-xs text-muted-foreground">cases/hour</p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Completed</span>
                          <Zap className="h-3 w-3 text-brand" />
                        </div>
                        <p className="text-lg font-bold">
                          {scenarios[0].results.completedCases}/{scenarios[0].results.totalCases}
                        </p>
                      </div>

                      <div className="border rounded-lg p-3">
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-xs text-muted-foreground">Bottlenecks</span>
                          <AlertCircle className="h-3 w-3 text-warning" />
                        </div>
                        <p className="text-sm font-semibold truncate">
                          {scenarios[0].results.bottlenecks[0] || "None"}
                        </p>
                      </div>
                    </div>

                    <div className="pt-2">
                      <h4 className="text-sm font-medium mb-2">Activity Performance</h4>
                      <div className="space-y-2 max-h-[200px] overflow-y-auto">
                        {scenarios[0].results.activityStats.slice(0, 5).map((stat) => (
                          <div key={stat.activity} className="flex items-center justify-between text-sm">
                            <span className="truncate max-w-[200px]">{stat.activity}</span>
                            <span className="text-muted-foreground">
                              {formatDuration(stat.avgProcessingTime)}
                            </span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center py-8 text-center">
                    <AlertCircle className="h-12 w-12 text-muted-foreground mb-2" />
                    <p className="text-muted-foreground text-sm">
                      Run a simulation to see results
                    </p>
                  </div>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Scenario History */}
          <Card>
            <CardHeader>
              <CardTitle>Scenario History</CardTitle>
              <CardDescription>
                All simulation scenarios for this process
              </CardDescription>
            </CardHeader>
            <CardContent>
              {scenarios.length === 0 ? (
                <div className="text-center py-8 text-muted-foreground">
                  No scenarios yet. Create your first one above!
                </div>
              ) : (
                <div className="space-y-2">
                  {scenarios.map((scenario) => (
                    <div
                      key={scenario.id}
                      className="flex items-center justify-between p-4 border rounded-lg hover:bg-muted/50 transition-colors"
                    >
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium">{scenario.name}</span>
                          {scenario.status === "completed" && (
                            <Badge variant="outline" className="bg-success/10">
                              <CheckCircle2 className="h-3 w-3 mr-1" />
                              Completed
                            </Badge>
                          )}
                        </div>
                        <p className="text-xs text-muted-foreground">
                          {scenario.description} • {new Date(scenario.createdAt).toLocaleString()}
                        </p>
                      </div>
                      {scenario.results && (
                        <div className="flex gap-4 text-sm">
                          <div>
                            <span className="text-muted-foreground">Cycle: </span>
                            <span className="font-medium">{formatDuration(scenario.results.avgCycleTime)}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Throughput: </span>
                            <span className="font-medium">{scenario.results.throughput.toFixed(2)}/h</span>
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>

        {/* Impact Simulation Tab */}
        <TabsContent value="impact" className="space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>Scenario Comparison</CardTitle>
              <CardDescription>
                Compare baseline vs. optimized scenarios to quantify improvements
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <Label>Baseline Scenario</Label>
                  <Select 
                    value={baselineScenario?.id.toString() || ""} 
                    onValueChange={(val) => {
                      const scenario = scenarios.find(s => s.id === parseInt(val));
                      setBaselineScenario(scenario || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select baseline" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.filter(s => s.results).map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id.toString()}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <Label>Optimized Scenario</Label>
                  <Select 
                    value={optimizedScenario?.id.toString() || ""} 
                    onValueChange={(val) => {
                      const scenario = scenarios.find(s => s.id === parseInt(val));
                      setOptimizedScenario(scenario || null);
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select optimized" />
                    </SelectTrigger>
                    <SelectContent>
                      {scenarios.filter(s => s.results).map((scenario) => (
                        <SelectItem key={scenario.id} value={scenario.id.toString()}>
                          {scenario.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <Button
                onClick={compareScenarios}
                disabled={!baselineScenario || !optimizedScenario}
                className="w-full"
              >
                <BarChart3 className="h-4 w-4 mr-2" />
                Compare Scenarios
              </Button>

              {comparisonResults && (
                <div className="space-y-4 pt-4 border-t">
                  <h3 className="text-lg font-semibold">Impact Analysis</h3>
                  
                  <div className="grid md:grid-cols-2 gap-4">
                    <Card className="border-brand/20 bg-brand/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Cycle Time Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-brand">
                            {Math.abs(comparisonResults.cycleTimeImprovement).toFixed(1)}%
                          </span>
                          {comparisonResults.cycleTimeImprovement > 0 ? (
                            <Badge className="bg-success">Faster</Badge>
                          ) : (
                            <Badge variant="destructive">Slower</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>{formatDuration(comparisonResults.baselineCycleTime)}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium">{formatDuration(comparisonResults.optimizedCycleTime)}</span>
                        </div>
                      </CardContent>
                    </Card>

                    <Card className="border-brand/20 bg-brand/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium">Throughput Improvement</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="flex items-baseline gap-2">
                          <span className="text-3xl font-bold text-brand">
                            {Math.abs(comparisonResults.throughputImprovement).toFixed(1)}%
                          </span>
                          {comparisonResults.throughputImprovement > 0 ? (
                            <Badge className="bg-success">Higher</Badge>
                          ) : (
                            <Badge variant="destructive">Lower</Badge>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mt-2 text-sm text-muted-foreground">
                          <span>{comparisonResults.baselineThroughput.toFixed(2)}</span>
                          <ArrowRight className="h-3 w-3" />
                          <span className="font-medium">{comparisonResults.optimizedThroughput.toFixed(2)}</span>
                          <span>cases/hour</span>
                        </div>
                      </CardContent>
                    </Card>
                  </div>

                  {comparisonResults.bottlenecksResolved.length > 0 && (
                    <Card className="border-success/20 bg-success/5">
                      <CardHeader className="pb-2">
                        <CardTitle className="text-sm font-medium flex items-center gap-2">
                          <CheckCircle2 className="h-4 w-4 text-success" />
                          Bottlenecks Resolved
                        </CardTitle>
                      </CardHeader>
                      <CardContent>
                        <ul className="space-y-1">
                          {comparisonResults.bottlenecksResolved.map((bottleneck: string) => (
                            <li key={bottleneck} className="text-sm flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-success"></div>
                              {bottleneck}
                            </li>
                          ))}
                        </ul>
                      </CardContent>
                    </Card>
                  )}

                  <div className="p-4 bg-brand/5 border border-brand/20 rounded-lg">
                    <h4 className="font-medium mb-2 flex items-center gap-2">
                      <Zap className="h-4 w-4 text-brand" />
                      Key Insights
                    </h4>
                    <ul className="space-y-1 text-sm text-muted-foreground">
                      <li>• {comparisonResults.cycleTimeImprovement > 0 
                        ? `Process execution time reduced by ${formatDuration(comparisonResults.baselineCycleTime - comparisonResults.optimizedCycleTime)}`
                        : "Process taking longer than baseline"
                      }</li>
                      <li>• {comparisonResults.throughputImprovement > 0
                        ? `System can handle ${Math.abs(comparisonResults.throughputImprovement).toFixed(1)}% more cases per hour`
                        : "System throughput decreased"
                      }</li>
                      {comparisonResults.bottlenecksResolved.length > 0 && (
                        <li>• {comparisonResults.bottlenecksResolved.length} bottleneck(s) eliminated in optimized scenario</li>
                      )}
                    </ul>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
