"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Play, Plus, TrendingUp, Clock, Zap, GitCompare } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface Process {
  id: number;
  name: string;
  description: string | null;
}

interface SimulationResults {
  totalCases: number;
  completedCases: number;
  avgCycleTime: number;
  throughput: number;
  activityStats: Array<{
    activity: string;
    avgWaitTime: number;
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

export default function WhatIfScenariosPage() {
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [scenarios, setScenarios] = useState<Scenario[]>([]);
  const [loading, setLoading] = useState(false);
  const [running, setRunning] = useState(false);

  const [scenarioName, setScenarioName] = useState("");
  const [scenarioDescription, setScenarioDescription] = useState("");
  const [numberOfCases, setNumberOfCases] = useState("100");
  const [arrivalRate, setArrivalRate] = useState("300000");
  const [durationMultiplier, setDurationMultiplier] = useState("1.0");

  useEffect(() => {
    loadProcesses();
  }, []);

  useEffect(() => {
    if (selectedProcessId) {
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

  async function loadScenarios() {
    if (!selectedProcessId) return;
    
    try {
      setLoading(true);
      const response = await fetch(`/api/simulations?processId=${selectedProcessId}`);
      if (!response.ok) throw new Error("Failed to load scenarios");
      const data = await response.json();
      setScenarios(data);
    } catch (error) {
      toast.error("Failed to load scenarios");
    } finally {
      setLoading(false);
    }
  }

  async function runSimulation() {
    if (!selectedProcessId || !scenarioName) {
      toast.error("Please select a process and enter a scenario name");
      return;
    }

    try {
      setRunning(true);
      const response = await apiClient.post("/api/simulations", {
        processId: parseInt(selectedProcessId),
        name: scenarioName,
        description: scenarioDescription || null,
        parameters: {
          numberOfCases: parseInt(numberOfCases),
          arrivalRate: parseInt(arrivalRate),
          durationMultipliers: { "*": parseFloat(durationMultiplier) },
        },
      });

      if (!response.ok) throw new Error("Failed to run simulation");
      
      const newScenario = await response.json();
      toast.success("Simulation completed successfully!");
      
      setScenarios([newScenario, ...scenarios]);
      setScenarioName("");
      setScenarioDescription("");
      setNumberOfCases("100");
      setArrivalRate("300000");
      setDurationMultiplier("1.0");
    } catch (error) {
      toast.error("Failed to run simulation");
    } finally {
      setRunning(false);
    }
  }

  function formatDuration(ms: number): string {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    return `${hours}h ${minutes}m`;
  }

  function formatNumber(num: number): string {
    return num.toFixed(2);
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader 
          icon={GitCompare} 
          title="What-If Scenarios" 
          description="Simulate process changes and analyze impacts" 
          gradient="from-cyan-500 to-blue-600" 
        />

      <Tabs defaultValue="create" className="w-full">
        <TabsList>
          <TabsTrigger value="create">Create Scenario</TabsTrigger>
          <TabsTrigger value="scenarios">Saved Scenarios</TabsTrigger>
        </TabsList>

        <TabsContent value="create" className="space-y-6">
          <Card className="p-6">
            <h2 className="text-xl font-semibold mb-4">New Simulation Scenario</h2>
            
            <div className="space-y-4">
              <div>
                <Label htmlFor="process">Process</Label>
                <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
                  <SelectTrigger id="process">
                    <SelectValue placeholder="Select a process" />
                  </SelectTrigger>
                  <SelectContent>
                    {Array.isArray(processes) && processes.length > 0 ? (
                      processes.map((process) => (
                        <SelectItem key={process.id} value={process.id.toString()}>
                          {process.name}
                        </SelectItem>
                      ))
                    ) : (
                      <SelectItem value="no-processes" disabled>
                        No processes available
                      </SelectItem>
                    )}
                  </SelectContent>
                </Select>
              </div>

              <div>
                <Label htmlFor="name">Scenario Name</Label>
                <Input
                  id="name"
                  value={scenarioName}
                  onChange={(e) => setScenarioName(e.target.value)}
                  placeholder="e.g., Optimized Process - 20% faster"
                />
              </div>

              <div>
                <Label htmlFor="description">Description (Optional)</Label>
                <Input
                  id="description"
                  value={scenarioDescription}
                  onChange={(e) => setScenarioDescription(e.target.value)}
                  placeholder="Describe the changes in this scenario"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <Label htmlFor="cases">Number of Cases</Label>
                  <Input
                    id="cases"
                    type="number"
                    value={numberOfCases}
                    onChange={(e) => setNumberOfCases(e.target.value)}
                    placeholder="100"
                  />
                </div>

                <div>
                  <Label htmlFor="arrivalRate">Arrival Rate (ms)</Label>
                  <Input
                    id="arrivalRate"
                    type="number"
                    value={arrivalRate}
                    onChange={(e) => setArrivalRate(e.target.value)}
                    placeholder="300000"
                  />
                </div>

                <div>
                  <Label htmlFor="durationMultiplier">Duration Multiplier</Label>
                  <Input
                    id="durationMultiplier"
                    type="number"
                    step="0.1"
                    value={durationMultiplier}
                    onChange={(e) => setDurationMultiplier(e.target.value)}
                    placeholder="1.0"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    1.0 = baseline, 0.8 = 20% faster, 1.2 = 20% slower
                  </p>
                </div>
              </div>

              <Button
                onClick={runSimulation}
                disabled={running || !selectedProcessId || !scenarioName}
                className="w-full"
              >
                {running ? (
                  <>Running Simulation...</>
                ) : (
                  <>
                    <Play className="h-4 w-4 mr-2" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </Card>
        </TabsContent>

        <TabsContent value="scenarios" className="space-y-6">
          {loading ? (
            <Card className="p-6">
              <p className="text-muted-foreground">Loading scenarios...</p>
            </Card>
          ) : scenarios.length === 0 ? (
            <Card className="p-6">
              <p className="text-muted-foreground">
                No scenarios yet. Create your first scenario to get started!
              </p>
            </Card>
          ) : (
            <div className="space-y-4">
              {scenarios.map((scenario) => (
                <Card key={scenario.id} className="p-6">
                  <div className="space-y-4">
                    <div>
                      <h3 className="text-lg font-semibold">{scenario.name}</h3>
                      {scenario.description && (
                        <p className="text-sm text-muted-foreground">{scenario.description}</p>
                      )}
                      <p className="text-xs text-muted-foreground mt-1">
                        Created: {new Date(scenario.createdAt).toLocaleString()}
                      </p>
                    </div>

                    {scenario.results && (
                      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Completed Cases</span>
                            <Zap className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-2xl font-bold">
                            {scenario.results.completedCases}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            of {scenario.results.totalCases}
                          </p>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Avg Cycle Time</span>
                            <Clock className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-2xl font-bold">
                            {formatDuration(scenario.results.avgCycleTime)}
                          </p>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Throughput</span>
                            <TrendingUp className="h-4 w-4 text-primary" />
                          </div>
                          <p className="text-2xl font-bold">
                            {formatNumber(scenario.results.throughput)}
                          </p>
                          <p className="text-xs text-muted-foreground">cases/hour</p>
                        </div>

                        <div className="border rounded-lg p-4">
                          <div className="flex items-center justify-between mb-2">
                            <span className="text-sm text-muted-foreground">Bottlenecks</span>
                          </div>
                          <p className="text-sm font-semibold">
                            {scenario.results.bottlenecks.slice(0, 2).join(", ")}
                          </p>
                        </div>
                      </div>
                    )}

                    {scenario.status === "running" && (
                      <p className="text-sm text-muted-foreground">Simulation in progress...</p>
                    )}
                  </div>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
