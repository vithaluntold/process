"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Lightbulb, TrendingUp, AlertTriangle, Play, RefreshCw } from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"
import {
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  Area,
  AreaChart,
} from "recharts"

interface Process {
  id: number
  name: string
}

interface Anomaly {
  caseId: string
  activity: string
  timestamp: string
  score: number
  severity: string
}

interface AnomalyResult {
  success: boolean
  source: string
  algorithm: string
  totalEvents: number
  anomaliesDetected: number
  anomalyRate: number
  anomalies: Anomaly[]
  modelMetrics: Record<string, any>
}

interface ForecastResult {
  success: boolean
  source: string
  algorithm: string
  metric: string
  current: number
  forecast: {
    day30?: number
    day60?: number
    day90?: number
  }
  chartData: Array<{
    date: string
    actual?: number
    forecast?: number
    lower?: number
    upper?: number
  }>
  metrics: Record<string, any>
}

export default function PredictiveAnalytics() {
  const [processes, setProcesses] = useState<Process[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [anomalyResult, setAnomalyResult] = useState<AnomalyResult | null>(null)
  const [forecastResult, setForecastResult] = useState<ForecastResult | null>(null)
  const [activeTab, setActiveTab] = useState("anomalies")
  const [algorithm, setAlgorithm] = useState("isolation_forest")

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

  const runAnomalyDetection = async () => {
    if (!selectedProcess) return

    setAnalyzing(true)
    setAnomalyResult(null)

    try {
      const response = await apiClient.post("/api/ml/anomaly-detection", {
        processId: selectedProcess,
        algorithm,
        contamination: 0.05,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to detect anomalies")
      }

      const data = await response.json()
      setAnomalyResult(data)
      
      toast.success("Anomaly Detection Complete", {
        description: `Found ${data.anomaliesDetected} anomalies in ${data.totalEvents} events`,
      })
    } catch (error: any) {
      toast.error("Analysis Failed", {
        description: error.message || "An error occurred",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const runForecasting = async () => {
    if (!selectedProcess) return

    setAnalyzing(true)
    setForecastResult(null)

    try {
      const response = await apiClient.post("/api/ml/forecast", {
        processId: selectedProcess,
        horizon: 90,
        algorithm: "holt_winters",
        metric: "cycle_time",
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || "Failed to generate forecast")
      }

      const data = await response.json()
      setForecastResult(data)
      
      toast.success("Forecast Generated", {
        description: `Predicted trends for the next 90 days`,
      })
    } catch (error: any) {
      toast.error("Forecasting Failed", {
        description: error.message || "An error occurred",
      })
    } finally {
      setAnalyzing(false)
    }
  }

  const handleAnalyze = () => {
    if (activeTab === "anomalies") {
      runAnomalyDetection()
    } else {
      runForecasting()
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
            <Lightbulb className="h-5 w-5 text-brand" />
            Predictive Analytics
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <p className="text-muted-foreground">
              Upload event log data first to enable predictive analytics.
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
                <Lightbulb className="h-5 w-5 text-brand" />
                Predictive Analytics
              </CardTitle>
              <CardDescription>
                AI-powered forecasting and anomaly detection for process optimization
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
                onClick={handleAnalyze} 
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
                    Analyze
                  </>
                )}
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="anomalies" className="gap-2">
                <AlertTriangle className="h-4 w-4" />
                Anomaly Detection
              </TabsTrigger>
              <TabsTrigger value="forecast" className="gap-2">
                <TrendingUp className="h-4 w-4" />
                Forecasting
              </TabsTrigger>
            </TabsList>

            <TabsContent value="anomalies" className="space-y-4">
              <div className="flex items-center gap-4 pt-4">
                <Select value={algorithm} onValueChange={setAlgorithm}>
                  <SelectTrigger className="w-[200px]">
                    <SelectValue placeholder="Select algorithm" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="isolation_forest">Isolation Forest</SelectItem>
                    <SelectItem value="statistical_zscore">Z-Score Analysis</SelectItem>
                    <SelectItem value="dbscan">DBSCAN Clustering</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {anomalyResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">{anomalyResult.totalEvents}</div>
                        <p className="text-sm text-muted-foreground">Total Events</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-red-500">
                          {anomalyResult.anomaliesDetected}
                        </div>
                        <p className="text-sm text-muted-foreground">Anomalies Found</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {(anomalyResult.anomalyRate * 100).toFixed(1)}%
                        </div>
                        <p className="text-sm text-muted-foreground">Anomaly Rate</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <Badge variant={anomalyResult.source === "ml_api" ? "default" : "secondary"}>
                          {anomalyResult.algorithm}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">Algorithm Used</p>
                      </CardContent>
                    </Card>
                  </div>

                  {anomalyResult.anomalies.length > 0 && (
                    <Card>
                      <CardHeader>
                        <CardTitle className="text-lg">Detected Anomalies</CardTitle>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-2 max-h-[300px] overflow-y-auto">
                          {anomalyResult.anomalies.slice(0, 20).map((anomaly, i) => (
                            <div
                              key={i}
                              className="flex items-center justify-between p-3 rounded-lg bg-muted/50"
                            >
                              <div className="flex items-center gap-3">
                                <AlertTriangle
                                  className={`h-4 w-4 ${
                                    anomaly.severity === "critical"
                                      ? "text-red-500"
                                      : anomaly.severity === "high"
                                      ? "text-orange-500"
                                      : "text-yellow-500"
                                  }`}
                                />
                                <div>
                                  <p className="font-medium">{anomaly.activity}</p>
                                  <p className="text-sm text-muted-foreground">
                                    Case: {anomaly.caseId}
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <Badge
                                  variant={
                                    anomaly.severity === "critical"
                                      ? "destructive"
                                      : anomaly.severity === "high"
                                      ? "default"
                                      : "secondary"
                                  }
                                >
                                  {anomaly.severity}
                                </Badge>
                                <p className="text-sm text-muted-foreground mt-1">
                                  Score: {anomaly.score.toFixed(2)}
                                </p>
                              </div>
                            </div>
                          ))}
                        </div>
                      </CardContent>
                    </Card>
                  )}
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-brand/10 p-6 mb-4">
                    <AlertTriangle className="h-12 w-12 text-brand" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Detect Process Anomalies</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Analyze your event logs to detect unusual patterns, outliers, and potential issues using machine learning algorithms.
                  </p>
                </div>
              )}
            </TabsContent>

            <TabsContent value="forecast" className="space-y-4">
              {forecastResult ? (
                <div className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold">
                          {forecastResult.current.toFixed(1)}h
                        </div>
                        <p className="text-sm text-muted-foreground">Current Avg Cycle Time</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-blue-500">
                          {forecastResult.forecast.day30?.toFixed(1) || "-"}h
                        </div>
                        <p className="text-sm text-muted-foreground">30-Day Forecast</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <div className="text-2xl font-bold text-purple-500">
                          {forecastResult.forecast.day60?.toFixed(1) || "-"}h
                        </div>
                        <p className="text-sm text-muted-foreground">60-Day Forecast</p>
                      </CardContent>
                    </Card>
                    <Card>
                      <CardContent className="pt-6">
                        <Badge variant={forecastResult.source === "ml_api" ? "default" : "secondary"}>
                          {forecastResult.algorithm}
                        </Badge>
                        <p className="text-sm text-muted-foreground mt-1">Model Used</p>
                      </CardContent>
                    </Card>
                  </div>

                  <Card>
                    <CardHeader>
                      <CardTitle className="text-lg">Forecast Trend</CardTitle>
                    </CardHeader>
                    <CardContent>
                      <div className="h-[300px]">
                        <ResponsiveContainer width="100%" height="100%">
                          <AreaChart data={forecastResult.chartData}>
                            <CartesianGrid strokeDasharray="3 3" />
                            <XAxis 
                              dataKey="date" 
                              tickFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <YAxis />
                            <Tooltip 
                              labelFormatter={(value) => new Date(value).toLocaleDateString()}
                            />
                            <Legend />
                            <Area
                              type="monotone"
                              dataKey="actual"
                              stroke="#2563eb"
                              fill="#2563eb"
                              fillOpacity={0.3}
                              name="Historical"
                            />
                            <Area
                              type="monotone"
                              dataKey="forecast"
                              stroke="#9333ea"
                              fill="#9333ea"
                              fillOpacity={0.3}
                              name="Forecast"
                              strokeDasharray="5 5"
                            />
                            <Area
                              type="monotone"
                              dataKey="upper"
                              stroke="#94a3b8"
                              fill="#94a3b8"
                              fillOpacity={0.1}
                              name="Upper Bound"
                              strokeDasharray="3 3"
                            />
                            <Area
                              type="monotone"
                              dataKey="lower"
                              stroke="#94a3b8"
                              fill="#94a3b8"
                              fillOpacity={0.1}
                              name="Lower Bound"
                              strokeDasharray="3 3"
                            />
                          </AreaChart>
                        </ResponsiveContainer>
                      </div>
                    </CardContent>
                  </Card>
                </div>
              ) : (
                <div className="flex flex-col items-center justify-center py-12 text-center">
                  <div className="rounded-full bg-brand/10 p-6 mb-4">
                    <TrendingUp className="h-12 w-12 text-brand" />
                  </div>
                  <h3 className="text-lg font-semibold mb-2">Process Forecasting</h3>
                  <p className="text-muted-foreground max-w-md mb-6">
                    Generate predictions for cycle time, throughput, and resource utilization using time series analysis and machine learning models.
                  </p>
                </div>
              )}
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
