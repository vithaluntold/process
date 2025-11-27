"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Slider } from "@/components/ui/slider"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { GitCompare, Play, RefreshCw, TrendingUp, TrendingDown, Minus, DollarSign, Clock, Zap } from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  LineChart,
  Line,
} from "recharts"

interface Process {
  id: number
  name: string
}

interface SimulationResult {
  success: boolean
  source: string
  algorithm: string
  numSimulations: number
  results: {
    cycle_times?: number[]
    percentiles: {
      p10: number
      p25: number
      p50: number
      p75: number
      p90: number
      p95: number
      p99: number
    }
  }
  statistics: {
    mean: number
    median: number
    std_dev: number
    min: number
    max: number
  }
  processInfo: {
    activities: number
    baseCycleTime: number
    variance: number
  }
}

interface ScenarioComparison {
  baseline: SimulationResult
  optimized: SimulationResult
  improvement: {
    cycleTimeReduction: number
    throughputIncrease: number
    costSavings: number
  }
}

export default function ScenarioAnalysisPage() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [simulating, setSimulating] = useState(false)
  const [baselineResult, setBaselineResult] = useState<SimulationResult | null>(null)
  const [optimizedResult, setOptimizedResult] = useState<SimulationResult | null>(null)
  
  const [scenarioParams, setScenarioParams] = useState({
    numSimulations: 1000,
    cycleTimeReduction: 20,
    varianceReduction: 10,
    automationLevel: 30,
  })

  useEffect(() => {
    fetchProcesses()
  }, [])

  const fetchProcesses = async () => {
    try {
      const response = await fetch("/api/processes")
      const data = await response.json()
      const processArray = data.processes || []
      setProcesses(processArray)
      if (processArray.length > 0) {
        setSelectedProcess(processArray[0].id.toString())
      }
    } catch (error) {
      console.error("Failed to fetch processes:", error)
      setProcesses([])
    } finally {
      setLoading(false)
    }
  }

  const runSimulation = async () => {
    if (!selectedProcess) return

    setSimulating(true)
    setBaselineResult(null)
    setOptimizedResult(null)

    try {
      const baselineResponse = await apiClient.post("/api/ml/simulation", {
        processId: selectedProcess,
        numSimulations: scenarioParams.numSimulations,
        algorithm: "monte_carlo",
        parameters: {},
      })

      if (!baselineResponse.ok) {
        throw new Error("Baseline simulation failed")
      }

      const baseline = await baselineResponse.json()
      setBaselineResult(baseline)

      const optimizedResponse = await apiClient.post("/api/ml/simulation", {
        processId: selectedProcess,
        numSimulations: scenarioParams.numSimulations,
        algorithm: "monte_carlo",
        parameters: {
          base_cycle_time: baseline.processInfo.baseCycleTime * (1 - scenarioParams.cycleTimeReduction / 100),
          variance: baseline.processInfo.variance * (1 - scenarioParams.varianceReduction / 100),
        },
      })

      if (!optimizedResponse.ok) {
        throw new Error("Optimized simulation failed")
      }

      const optimized = await optimizedResponse.json()
      setOptimizedResult(optimized)

      toast.success("Scenario Analysis Complete", {
        description: `Simulated ${scenarioParams.numSimulations} cases for baseline and optimized scenarios`,
      })
    } catch (error: any) {
      toast.error("Simulation Failed", {
        description: error.message || "An error occurred",
      })
    } finally {
      setSimulating(false)
    }
  }

  const getComparisonData = () => {
    if (!baselineResult || !optimizedResult) return []

    return [
      {
        metric: "Mean",
        baseline: baselineResult.statistics.mean,
        optimized: optimizedResult.statistics.mean,
      },
      {
        metric: "Median",
        baseline: baselineResult.statistics.median,
        optimized: optimizedResult.statistics.median,
      },
      {
        metric: "P90",
        baseline: baselineResult.results.percentiles.p90,
        optimized: optimizedResult.results.percentiles.p90,
      },
      {
        metric: "P95",
        baseline: baselineResult.results.percentiles.p95,
        optimized: optimizedResult.results.percentiles.p95,
      },
    ]
  }

  const getDistributionData = () => {
    if (!baselineResult || !optimizedResult) return []

    const baselineTimes = baselineResult.results.cycle_times || []
    const optimizedTimes = optimizedResult.results.cycle_times || []

    const buckets = 10
    const allValues = [...baselineTimes, ...optimizedTimes]
    const minVal = Math.min(...allValues)
    const maxVal = Math.max(...allValues)
    const range = maxVal - minVal
    const bucketSize = range / buckets

    const data = []
    for (let i = 0; i < buckets; i++) {
      const lower = minVal + i * bucketSize
      const upper = lower + bucketSize
      const label = `${lower.toFixed(0)}-${upper.toFixed(0)}`
      
      const baselineCount = baselineTimes.filter(t => t >= lower && t < upper).length
      const optimizedCount = optimizedTimes.filter(t => t >= lower && t < upper).length
      
      data.push({
        range: label,
        baseline: baselineCount,
        optimized: optimizedCount,
      })
    }

    return data
  }

  const calculateImprovement = () => {
    if (!baselineResult || !optimizedResult) return null

    const cycleTimeReduction = ((baselineResult.statistics.mean - optimizedResult.statistics.mean) / baselineResult.statistics.mean) * 100
    const varianceReduction = ((baselineResult.statistics.std_dev - optimizedResult.statistics.std_dev) / baselineResult.statistics.std_dev) * 100
    const estimatedCostSavings = cycleTimeReduction * 1000

    return {
      cycleTimeReduction,
      varianceReduction,
      estimatedCostSavings,
    }
  }

  if (loading) {
    return <SkeletonCard />
  }

  const improvement = calculateImprovement()

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">What-If Scenario Analysis</h1>
        <p className="text-muted-foreground">
          Test different process scenarios and predict their impact on performance using Monte Carlo simulation.
        </p>
      </div>

      <Card className="border-brand/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <GitCompare className="h-5 w-5 text-brand" />
                Scenario Configuration
              </CardTitle>
              <CardDescription>
                Configure baseline and optimized scenarios for comparison
              </CardDescription>
            </div>
            <div className="flex items-center gap-4">
              <Select value={selectedProcess || ""} onValueChange={setSelectedProcess}>
                <SelectTrigger className="w-[200px]">
                  <SelectValue placeholder="Select process" />
                </SelectTrigger>
                <SelectContent>
                  {processes.map((process) => (
                    <SelectItem key={process.id} value={process.id.toString()}>
                      {process.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Button 
                onClick={runSimulation} 
                disabled={simulating || !selectedProcess}
                className="gap-2"
              >
                {simulating ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Simulating...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Run Simulation
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-6">
            <div className="space-y-2">
              <Label>Simulations</Label>
              <Input
                type="number"
                value={scenarioParams.numSimulations}
                onChange={(e) => setScenarioParams(p => ({ ...p, numSimulations: parseInt(e.target.value) || 1000 }))}
              />
            </div>
            <div className="space-y-2">
              <Label>Cycle Time Reduction: {scenarioParams.cycleTimeReduction}%</Label>
              <Slider
                value={[scenarioParams.cycleTimeReduction]}
                onValueChange={([v]) => setScenarioParams(p => ({ ...p, cycleTimeReduction: v }))}
                max={50}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Variance Reduction: {scenarioParams.varianceReduction}%</Label>
              <Slider
                value={[scenarioParams.varianceReduction]}
                onValueChange={([v]) => setScenarioParams(p => ({ ...p, varianceReduction: v }))}
                max={50}
                step={5}
              />
            </div>
            <div className="space-y-2">
              <Label>Automation Level: {scenarioParams.automationLevel}%</Label>
              <Slider
                value={[scenarioParams.automationLevel]}
                onValueChange={([v]) => setScenarioParams(p => ({ ...p, automationLevel: v }))}
                max={100}
                step={10}
              />
            </div>
          </div>
        </CardContent>
      </Card>

      {baselineResult && optimizedResult && (
        <>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-brand" />
                  <div>
                    <div className="text-2xl font-bold">{baselineResult.statistics.mean.toFixed(1)} min</div>
                    <p className="text-sm text-muted-foreground">Baseline Avg Cycle Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <Clock className="h-5 w-5 text-green-500" />
                  <div>
                    <div className="text-2xl font-bold text-green-500">{optimizedResult.statistics.mean.toFixed(1)} min</div>
                    <p className="text-sm text-muted-foreground">Optimized Avg Cycle Time</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  {improvement && improvement.cycleTimeReduction > 0 ? (
                    <TrendingDown className="h-5 w-5 text-green-500" />
                  ) : (
                    <Minus className="h-5 w-5 text-gray-500" />
                  )}
                  <div>
                    <div className="text-2xl font-bold">
                      {improvement ? `${improvement.cycleTimeReduction.toFixed(1)}%` : '-'}
                    </div>
                    <p className="text-sm text-muted-foreground">Cycle Time Reduction</p>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <div className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-amber-500" />
                  <div>
                    <div className="text-2xl font-bold text-amber-500">
                      ${improvement ? improvement.estimatedCostSavings.toFixed(0) : 0}
                    </div>
                    <p className="text-sm text-muted-foreground">Est. Annual Savings</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Scenario Comparison</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getComparisonData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="metric" />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="baseline" fill="#6b7280" name="Baseline" />
                      <Bar dataKey="optimized" fill="#22c55e" name="Optimized" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-lg">Cycle Time Distribution</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="h-[300px]">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={getDistributionData()}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="range" angle={-45} textAnchor="end" height={80} />
                      <YAxis />
                      <Tooltip />
                      <Legend />
                      <Bar dataKey="baseline" fill="#6b7280" name="Baseline" />
                      <Bar dataKey="optimized" fill="#22c55e" name="Optimized" />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Percentile Analysis</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-7 gap-4">
                {['p10', 'p25', 'p50', 'p75', 'p90', 'p95', 'p99'].map((p) => (
                  <div key={p} className="text-center p-4 rounded-lg bg-muted/50">
                    <p className="text-sm text-muted-foreground uppercase">{p.toUpperCase()}</p>
                    <div className="mt-2">
                      <p className="text-lg font-medium text-gray-500">
                        {baselineResult.results.percentiles[p as keyof typeof baselineResult.results.percentiles].toFixed(1)}
                      </p>
                      <p className="text-lg font-bold text-green-500">
                        {optimizedResult.results.percentiles[p as keyof typeof optimizedResult.results.percentiles].toFixed(1)}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </>
      )}

      {!baselineResult && !simulating && (
        <Card className="border-brand/20">
          <CardContent>
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <div className="rounded-full bg-brand/10 p-8 mb-4">
                <GitCompare className="h-16 w-16 text-brand" />
              </div>
              <h3 className="text-xl font-semibold mb-2">Run Monte Carlo Simulation</h3>
              <p className="text-muted-foreground max-w-lg mb-8">
                Configure your optimization parameters and run a simulation to compare baseline vs optimized process scenarios. Results include cycle time distributions, percentile analysis, and estimated cost savings.
              </p>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
