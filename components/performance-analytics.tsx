"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { Activity, Clock, TrendingUp, BarChart3, Users, Zap } from "lucide-react"
import { toast } from "sonner"
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table"
import { apiClient } from "@/lib/api-client"

export default function PerformanceAnalytics() {
  const [processes, setProcesses] = useState<any[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [metrics, setMetrics] = useState<any>(null)

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

  const analyzePerformance = async () => {
    if (!selectedProcess) return

    setAnalyzing(true)
    setMetrics(null)

    try {
      const response = await apiClient.post("/api/analytics/analyze", { processId: selectedProcess })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to analyze performance")
      }

      const data = await response.json()
      setMetrics(data.metrics)
      toast.success("Performance analysis completed!", {
        description: `Analyzed ${data.metrics.totalCases} cases with ${data.metrics.completedCases} completed`,
      })
    } catch (error: any) {
      console.error("Performance analysis error:", error)
      toast.error("Analysis failed", {
        description: error.message || "An error occurred during performance analysis",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const formatDuration = (ms: number) => {
    const seconds = ms / 1000
    const minutes = seconds / 60
    const hours = minutes / 60
    const days = hours / 24

    if (days >= 1) return `${days.toFixed(1)} days`
    if (hours >= 1) return `${hours.toFixed(1)} hrs`
    if (minutes >= 1) return `${minutes.toFixed(1)} min`
    return `${seconds.toFixed(1)} sec`
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <SkeletonCard />
      </div>
    )
  }

  if (processes.length === 0) {
    return (
      <Card className="border-brand/20">
        <CardContent className="flex flex-col items-center justify-center py-12">
          <Activity className="h-12 w-12 text-brand mb-4" />
          <p className="text-muted-foreground">
            No processes available. Upload event logs to see performance analytics.
          </p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <Select value={selectedProcess || ""} onValueChange={setSelectedProcess}>
          <SelectTrigger className="w-[300px]">
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

        <Button onClick={analyzePerformance} disabled={!selectedProcess || analyzing} className="gap-2">
          <BarChart3 className="h-4 w-4" />
          {analyzing ? "Analyzing..." : "Run Performance Analysis"}
        </Button>
      </div>

      {metrics && (
        <>
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
            <Card className="border-brand/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
                <Clock className="h-4 w-4 text-brand" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-brand">
                  {formatDuration(metrics.averageCycleTime)}
                </div>
                <p className="text-xs text-muted-foreground">
                  Median: {formatDuration(metrics.medianCycleTime)}
                </p>
              </CardContent>
            </Card>

            <Card className="border-brand/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                <TrendingUp className="h-4 w-4 text-success" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-success">
                  {metrics.throughput.toFixed(2)}
                </div>
                <p className="text-xs text-muted-foreground">cases per hour</p>
              </CardContent>
            </Card>

            <Card className="border-brand/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                <Activity className="h-4 w-4 text-info" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-info">{metrics.totalCases}</div>
                <p className="text-xs text-muted-foreground">
                  {metrics.completedCases} completed, {metrics.activeCases} active
                </p>
              </CardContent>
            </Card>

            <Card className="border-brand/20">
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Completion Rate</CardTitle>
                <Zap className="h-4 w-4 text-warning" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold text-warning">
                  {((metrics.completedCases / metrics.totalCases) * 100).toFixed(1)}%
                </div>
                <p className="text-xs text-muted-foreground">
                  {metrics.completedCases} of {metrics.totalCases} cases
                </p>
              </CardContent>
            </Card>
          </div>

          <Tabs defaultValue="bottlenecks" className="space-y-4">
            <TabsList>
              <TabsTrigger value="bottlenecks">Bottlenecks</TabsTrigger>
              <TabsTrigger value="activities">Activity Stats</TabsTrigger>
              <TabsTrigger value="resources">Resource Utilization</TabsTrigger>
            </TabsList>

            <TabsContent value="bottlenecks" className="space-y-4">
              <Card className="border-brand/20">
                <CardHeader>
                  <CardTitle>Process Bottlenecks</CardTitle>
                  <CardDescription>
                    Activities with the longest average duration - potential improvement areas
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.bottlenecks.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activity</TableHead>
                          <TableHead>Avg Duration</TableHead>
                          <TableHead>Median</TableHead>
                          <TableHead>95th Percentile</TableHead>
                          <TableHead>Std Dev</TableHead>
                          <TableHead>Count</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.bottlenecks.map((bottleneck: any, index: number) => (
                          <TableRow key={index} className="hover:bg-brand/5 transition-colors">
                            <TableCell className="font-medium">{bottleneck.activity}</TableCell>
                            <TableCell>{formatDuration(bottleneck.avgDuration)}</TableCell>
                            <TableCell>{formatDuration(bottleneck.medianDuration)}</TableCell>
                            <TableCell>{formatDuration(bottleneck.percentile95)}</TableCell>
                            <TableCell>{formatDuration(bottleneck.stdDev)}</TableCell>
                            <TableCell>{bottleneck.count}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No bottleneck data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="activities" className="space-y-4">
              <Card className="border-brand/20">
                <CardHeader>
                  <CardTitle>Activity Statistics</CardTitle>
                  <CardDescription>
                    Detailed performance metrics for each activity in the process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.activityStats.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Activity</TableHead>
                          <TableHead>Executions</TableHead>
                          <TableHead>Avg Duration</TableHead>
                          <TableHead>Min Duration</TableHead>
                          <TableHead>Max Duration</TableHead>
                          <TableHead>Rework Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.activityStats.map((stat: any, index: number) => (
                          <TableRow key={index} className="hover:bg-brand/5 transition-colors">
                            <TableCell className="font-medium">{stat.activity}</TableCell>
                            <TableCell>{stat.totalExecutions}</TableCell>
                            <TableCell>{formatDuration(stat.avgDuration)}</TableCell>
                            <TableCell>{formatDuration(stat.minDuration)}</TableCell>
                            <TableCell>{formatDuration(stat.maxDuration)}</TableCell>
                            <TableCell>
                              <span
                                className={
                                  stat.reworkRate > 10 ? "text-destructive font-medium" : "text-muted-foreground"
                                }
                              >
                                {stat.reworkRate.toFixed(1)}%
                              </span>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No activity statistics available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="resources" className="space-y-4">
              <Card className="border-brand/20">
                <CardHeader>
                  <CardTitle>Resource Utilization</CardTitle>
                  <CardDescription>Performance metrics grouped by resource or team member</CardDescription>
                </CardHeader>
                <CardContent>
                  {metrics.resourceUtilization.length > 0 ? (
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Resource</TableHead>
                          <TableHead>Total Activities</TableHead>
                          <TableHead>Avg Duration</TableHead>
                          <TableHead>Utilization Rate</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {metrics.resourceUtilization.map((resource: any, index: number) => (
                          <TableRow key={index} className="hover:bg-brand/5 transition-colors">
                            <TableCell className="font-medium">
                              <div className="flex items-center gap-2">
                                <Users className="h-4 w-4 text-brand" />
                                {resource.resource}
                              </div>
                            </TableCell>
                            <TableCell>{resource.totalActivities}</TableCell>
                            <TableCell>{formatDuration(resource.avgDuration)}</TableCell>
                            <TableCell>
                              <div className="flex items-center gap-2">
                                <div className="flex-1 bg-muted rounded-full h-2">
                                  <div
                                    className="bg-brand h-2 rounded-full transition-all"
                                    style={{ width: `${Math.min(100, resource.utilizationRate)}%` }}
                                  />
                                </div>
                                <span className="text-sm font-medium">{resource.utilizationRate.toFixed(1)}%</span>
                              </div>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  ) : (
                    <p className="text-center text-muted-foreground py-8">No resource data available</p>
                  )}
                </CardContent>
              </Card>
            </TabsContent>
          </Tabs>
        </>
      )}
    </div>
  )
}
