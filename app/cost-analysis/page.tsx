"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { DollarSign, TrendingUp, Calculator, Sparkles } from "lucide-react";
import { toast } from "sonner";
import { PageHeader } from "@/components/page-header";
import { apiClient } from "@/lib/api-client";
import { z } from "zod";

const processSchema = z.object({
  id: z.number(),
  name: z.string(),
});

const processesResponseSchema = z.object({
  processes: z.array(processSchema),
});

const costMetricSchema = z.object({
  id: z.number(),
  activityName: z.string(),
  resourceCost: z.number(),
  timeCost: z.number(),
  totalCost: z.number(),
  frequency: z.number(),
  costPerExecution: z.number(),
});

const roiCalculationSchema = z.object({
  id: z.number(),
  currentCost: z.number(),
  optimizedCost: z.number(),
  savings: z.number(),
  savingsPercentage: z.number(),
  timeToRoi: z.number().nullable(),
});

const costAnalysisResponseSchema = z.object({
  metrics: z.array(costMetricSchema).optional(),
  roiCalculations: z.array(roiCalculationSchema).optional(),
});

interface CostMetric {
  id: number;
  activityName: string;
  resourceCost: number;
  timeCost: number;
  totalCost: number;
  frequency: number;
  costPerExecution: number;
}

interface ROICalculation {
  id: number;
  currentCost: number;
  optimizedCost: number;
  savings: number;
  savingsPercentage: number;
  timeToRoi: number | null;
}

export default function CostAnalysisPage() {
  const [processes, setProcesses] = useState<any[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [costMetrics, setCostMetrics] = useState<CostMetric[]>([]);
  const [roiCalculations, setRoiCalculations] = useState<ROICalculation[]>([]);
  const [currentCost, setCurrentCost] = useState("");
  const [optimizedCost, setOptimizedCost] = useState("");
  const [implementationCost, setImplementationCost] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    loadProcesses();
  }, []);

  useEffect(() => {
    if (selectedProcessId) {
      loadCostAnalysis();
    }
  }, [selectedProcessId]);

  async function loadProcesses() {
    try {
      const res = await fetch("/api/processes");
      if (!res.ok) {
        throw new Error(`Failed to load processes: ${res.status}`);
      }
      
      const rawData = await res.json();
      const validatedData = processesResponseSchema.safeParse(rawData);
      
      if (!validatedData.success) {
        console.error("Invalid processes response schema:", validatedData.error);
        toast.error("Invalid data format received from server");
        setProcesses([]);
        return;
      }
      
      setProcesses(validatedData.data.processes);
    } catch (error) {
      console.error("Failed to load processes:", error);
      toast.error("Failed to load processes. Please try again.");
      setProcesses([]);
    }
  }

  async function loadCostAnalysis() {
    setLoading(true);
    try {
      const res = await fetch(`/api/cost-analysis?processId=${selectedProcessId}`);
      if (!res.ok) {
        throw new Error(`Failed to load cost analysis: ${res.status}`);
      }
      
      const rawData = await res.json();
      const validatedData = costAnalysisResponseSchema.safeParse(rawData);
      
      if (!validatedData.success) {
        console.error("Invalid cost analysis response schema:", validatedData.error);
        toast.error("Invalid data format received from server");
        setCostMetrics([]);
        setRoiCalculations([]);
        return;
      }
      
      setCostMetrics(Array.isArray(validatedData.data.metrics) ? validatedData.data.metrics : []);
      setRoiCalculations(Array.isArray(validatedData.data.roiCalculations) ? validatedData.data.roiCalculations : []);
    } catch (error) {
      console.error("Failed to load cost analysis:", error);
      toast.error("Failed to load cost analysis data. Please try again.");
      setCostMetrics([]);
      setRoiCalculations([]);
    } finally {
      setLoading(false);
    }
  }

  async function calculateROI() {
    if (!selectedProcessId || !currentCost || !optimizedCost) {
      toast.error("Please fill in all required fields");
      return;
    }

    try {
      const res = await apiClient.post("/api/cost-analysis", {
        processId: parseInt(selectedProcessId),
        currentCost: parseFloat(currentCost),
        optimizedCost: parseFloat(optimizedCost),
        implementationCost: implementationCost ? parseFloat(implementationCost) : null,
      });

      if (res.ok) {
        toast.success("ROI calculated successfully!");
        loadCostAnalysis();
        setCurrentCost("");
        setOptimizedCost("");
        setImplementationCost("");
      } else {
        toast.error("Failed to calculate ROI");
      }
    } catch (error) {
      console.error("Failed to calculate ROI:", error);
      toast.error("Failed to calculate ROI");
    }
  }

  const totalCost = costMetrics.reduce((sum, m) => sum + m.totalCost, 0);
  const latestROI = roiCalculations[roiCalculations.length - 1];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          icon={DollarSign}
          title="Cost Analysis & ROI Calculator"
          description="Analyze process costs and calculate return on investment"
          gradient="from-green-500 to-emerald-600"
        />

        <div className="space-y-4">
          <Label>Select Process</Label>
          <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
            <SelectTrigger>
              <SelectValue placeholder="Choose a process to analyze" />
            </SelectTrigger>
            <SelectContent>
              {Array.isArray(processes) && processes.map((process) => (
                <SelectItem key={process.id} value={process.id.toString()}>
                  {process.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        {selectedProcessId && (
          <>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Cost</CardTitle>
                  <DollarSign className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${totalCost.toFixed(2)}</div>
                  <p className="text-xs text-muted-foreground">Current process cost</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                  <TrendingUp className="h-4 w-4 text-green-600" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestROI ? `$${latestROI.savings.toFixed(2)}` : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {latestROI ? `${latestROI.savingsPercentage.toFixed(1)}% reduction` : "Calculate ROI"}
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Activities</CardTitle>
                  <Calculator className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{costMetrics.length}</div>
                  <p className="text-xs text-muted-foreground">Analyzed activities</p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Time to ROI</CardTitle>
                  <Sparkles className="h-4 w-4 text-brand" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {latestROI?.timeToRoi ? `${latestROI.timeToRoi} mo` : "N/A"}
                  </div>
                  <p className="text-xs text-muted-foreground">Months to break even</p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Activity Cost Breakdown</CardTitle>
                  <CardDescription>Cost analysis by process activity</CardDescription>
                </CardHeader>
                <CardContent>
                  {loading ? (
                    <div className="text-center py-8">Loading cost metrics...</div>
                  ) : costMetrics.length === 0 ? (
                    <div className="text-center py-8 text-muted-foreground">
                      No cost data available. Analyzing...
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {costMetrics.slice(0, 10).map((metric) => (
                        <div key={metric.id} className="space-y-2">
                          <div className="flex items-center justify-between">
                            <span className="text-sm font-medium">{metric.activityName}</span>
                            <span className="text-sm font-bold">${metric.totalCost.toFixed(2)}</span>
                          </div>
                          <div className="flex items-center justify-between text-xs text-muted-foreground">
                            <span>{metric.frequency} executions</span>
                            <span>${metric.costPerExecution.toFixed(2)}/execution</span>
                          </div>
                          <div className="h-2 bg-secondary rounded-full overflow-hidden">
                            <div
                              className="h-full bg-brand"
                              style={{ width: `${Math.min((metric.totalCost / totalCost) * 100, 100)}%` }}
                            />
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>ROI Calculator</CardTitle>
                  <CardDescription>Calculate potential return on investment</CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="currentCost">Current Annual Cost ($)</Label>
                    <Input
                      id="currentCost"
                      type="number"
                      placeholder="e.g., 120000"
                      value={currentCost}
                      onChange={(e) => setCurrentCost(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="optimizedCost">Optimized Annual Cost ($)</Label>
                    <Input
                      id="optimizedCost"
                      type="number"
                      placeholder="e.g., 85000"
                      value={optimizedCost}
                      onChange={(e) => setOptimizedCost(e.target.value)}
                    />
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="implementationCost">Implementation Cost ($ - Optional)</Label>
                    <Input
                      id="implementationCost"
                      type="number"
                      placeholder="e.g., 15000"
                      value={implementationCost}
                      onChange={(e) => setImplementationCost(e.target.value)}
                    />
                  </div>

                  <Button onClick={calculateROI} className="w-full">
                    Calculate ROI
                  </Button>

                  {latestROI && (
                    <div className="mt-6 p-4 border rounded-lg space-y-2 bg-muted/50">
                      <h3 className="font-semibold">Latest Calculation</h3>
                      <div className="space-y-1 text-sm">
                        <div className="flex justify-between">
                          <span>Annual Savings:</span>
                          <span className="font-bold text-green-600">${latestROI.savings.toFixed(2)}</span>
                        </div>
                        <div className="flex justify-between">
                          <span>Savings Percentage:</span>
                          <span className="font-bold">{latestROI.savingsPercentage.toFixed(1)}%</span>
                        </div>
                        {latestROI.timeToRoi && (
                          <div className="flex justify-between">
                            <span>Time to ROI:</span>
                            <span className="font-bold">{latestROI.timeToRoi} months</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          </>
        )}
      </div>
    </AppLayout>
  );
}
