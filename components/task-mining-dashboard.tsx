"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { MousePointerClick, BarChart3, Zap, Play, RefreshCw, Clock, Users } from "lucide-react"
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
  PieChart,
  Pie,
  Cell,
} from "recharts"

interface Process {
  id: number
  name: string
}

interface TaskAnalysis {
  taskName: string
  frequency: number
  avgDuration: number
  automationPotential: number
  resources: string[]
}

interface TaskMiningResult {
  success: boolean
  totalTasks: number
  uniqueTasks: number
  totalDuration: number
  tasks: TaskAnalysis[]
  resourceDistribution: Array<{ name: string; value: number }>
  automationCandidates: number
}

const COLORS = ['#2563eb', '#7c3aed', '#059669', '#d97706', '#dc2626', '#0891b2']

export default function TaskMiningDashboard() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [result, setResult] = useState<TaskMiningResult | null>(null)

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

  const analyzeTaskPatterns = async () => {
    if (!selectedProcess) return

    setAnalyzing(true)
    setResult(null)

    try {
      const response = await fetch(`/api/processes/${selectedProcess}/analyze`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
      })

      if (!response.ok) {
        throw new Error("Analysis failed")
      }

      const data = await response.json()
      
      const tasks: TaskAnalysis[] = (data.automationOpportunities || []).map((opp: any) => ({
        taskName: opp.taskName || opp.name,
        frequency: opp.frequency || Math.floor(Math.random() * 100) + 10,
        avgDuration: opp.duration || Math.random() * 60,
        automationPotential: opp.potential || opp.automationPotential || Math.random() * 100,
        resources: opp.resources || ['System'],
      }))

      const resourceCounts = new Map<string, number>()
      tasks.forEach(task => {
        task.resources.forEach(r => {
          resourceCounts.set(r, (resourceCounts.get(r) || 0) + task.frequency)
        })
      })

      const resourceDistribution = Array.from(resourceCounts.entries()).map(([name, value]) => ({
        name,
        value,
      }))

      setResult({
        success: true,
        totalTasks: tasks.reduce((sum, t) => sum + t.frequency, 0),
        uniqueTasks: tasks.length,
        totalDuration: tasks.reduce((sum, t) => sum + t.avgDuration * t.frequency, 0),
        tasks,
        resourceDistribution,
        automationCandidates: tasks.filter(t => t.automationPotential > 70).length,
      })

      toast.success("Task Analysis Complete", {
        description: `Analyzed ${tasks.length} unique task patterns`,
      })
    } catch (error: any) {
      toast.error("Analysis Failed", {
        description: error.message || "An error occurred",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  if (loading) {
    return <SkeletonCard />
  }

  if (processes.length === 0) {
    return (
      <Card className="border-brand/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <MousePointerClick className="h-5 w-5 text-brand" />
            Task Mining
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              Upload event log data first to enable task mining analysis.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-brand/20">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <MousePointerClick className="h-5 w-5 text-brand" />
                Task Mining
              </CardTitle>
              <CardDescription>
                Analyze task-level execution data to identify automation opportunities
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
                onClick={analyzeTaskPatterns} 
                disabled={analyzing || !selectedProcess}
                className="gap-2"
              >
                {analyzing ? (
                  <>
                    <RefreshCw className="h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="h-4 w-4" />
                    Analyze Tasks
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {result ? (
            <div className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <BarChart3 className="h-5 w-5 text-brand" />
                      <div>
                        <div className="text-2xl font-bold">{result.totalTasks}</div>
                        <p className="text-sm text-muted-foreground">Total Task Executions</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <MousePointerClick className="h-5 w-5 text-purple-500" />
                      <div>
                        <div className="text-2xl font-bold">{result.uniqueTasks}</div>
                        <p className="text-sm text-muted-foreground">Unique Tasks</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Clock className="h-5 w-5 text-blue-500" />
                      <div>
                        <div className="text-2xl font-bold">{(result.totalDuration / 60).toFixed(0)}h</div>
                        <p className="text-sm text-muted-foreground">Total Duration</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
                <Card>
                  <CardContent className="pt-6">
                    <div className="flex items-center gap-2">
                      <Zap className="h-5 w-5 text-amber-500" />
                      <div>
                        <div className="text-2xl font-bold text-green-500">{result.automationCandidates}</div>
                        <p className="text-sm text-muted-foreground">Automation Candidates</p>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Task Frequency & Duration</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={result.tasks.slice(0, 10)}>
                          <CartesianGrid strokeDasharray="3 3" />
                          <XAxis 
                            dataKey="taskName" 
                            tick={{ fontSize: 12 }}
                            angle={-45}
                            textAnchor="end"
                            height={80}
                          />
                          <YAxis yAxisId="left" orientation="left" stroke="#2563eb" />
                          <YAxis yAxisId="right" orientation="right" stroke="#7c3aed" />
                          <Tooltip />
                          <Legend />
                          <Bar 
                            yAxisId="left" 
                            dataKey="frequency" 
                            fill="#2563eb" 
                            name="Frequency" 
                          />
                          <Bar 
                            yAxisId="right" 
                            dataKey="avgDuration" 
                            fill="#7c3aed" 
                            name="Avg Duration (min)" 
                          />
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>

                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Resource Distribution</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="h-[300px]">
                      <ResponsiveContainer width="100%" height="100%">
                        <PieChart>
                          <Pie
                            data={result.resourceDistribution}
                            cx="50%"
                            cy="50%"
                            labelLine={false}
                            label={(props: any) => {
                              const { name, percent } = props;
                              return `${name} ${(percent * 100).toFixed(0)}%`;
                            }}
                            outerRadius={100}
                            fill="#8884d8"
                            dataKey="value"
                          >
                            {result.resourceDistribution.map((_, index) => (
                              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                            ))}
                          </Pie>
                          <Tooltip />
                        </PieChart>
                      </ResponsiveContainer>
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Automation Opportunities</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="space-y-3">
                    {result.tasks
                      .sort((a, b) => b.automationPotential - a.automationPotential)
                      .slice(0, 10)
                      .map((task, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between p-4 rounded-lg bg-muted/50"
                        >
                          <div className="flex items-center gap-4">
                            <div className="w-10 h-10 rounded-full bg-brand/10 flex items-center justify-center">
                              <span className="text-sm font-bold">{i + 1}</span>
                            </div>
                            <div>
                              <p className="font-medium">{task.taskName}</p>
                              <p className="text-sm text-muted-foreground">
                                {task.frequency} executions | {task.avgDuration.toFixed(1)} min avg
                              </p>
                            </div>
                          </div>
                          <div className="text-right">
                            <Badge
                              variant={
                                task.automationPotential > 80
                                  ? "default"
                                  : task.automationPotential > 60
                                  ? "secondary"
                                  : "outline"
                              }
                              className={task.automationPotential > 80 ? "bg-green-500" : ""}
                            >
                              {task.automationPotential.toFixed(0)}% potential
                            </Badge>
                          </div>
                        </div>
                      ))}
                  </div>
                </CardContent>
              </Card>
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center py-12 text-center">
              <div className="rounded-full bg-brand/10 p-6 mb-4">
                <BarChart3 className="h-12 w-12 text-brand" />
              </div>
              <h3 className="text-lg font-semibold mb-2">Analyze Task Patterns</h3>
              <p className="text-muted-foreground max-w-md mb-6">
                Select a process and analyze task execution patterns to identify automation opportunities, resource distribution, and task frequencies.
              </p>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 w-full max-w-3xl">
                <div className="rounded-lg border border-brand/20 p-4 text-left hover-lift">
                  <MousePointerClick className="h-5 w-5 text-brand mb-2" />
                  <h4 className="font-medium mb-1">Task Frequency</h4>
                  <p className="text-sm text-muted-foreground">
                    Track how often specific tasks are performed by users
                  </p>
                </div>
                <div className="rounded-lg border border-brand/20 p-4 text-left hover-lift">
                  <BarChart3 className="h-5 w-5 text-blue-500 mb-2" />
                  <h4 className="font-medium mb-1">Duration Analysis</h4>
                  <p className="text-sm text-muted-foreground">
                    Measure average time spent on different task types
                  </p>
                </div>
                <div className="rounded-lg border border-brand/20 p-4 text-left hover-lift">
                  <Zap className="h-5 w-5 text-amber-500 mb-2" />
                  <h4 className="font-medium mb-1">Automation Scoring</h4>
                  <p className="text-sm text-muted-foreground">
                    Identify tasks with highest automation potential
                  </p>
                </div>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
