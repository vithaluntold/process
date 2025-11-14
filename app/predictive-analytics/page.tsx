"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { TrendingUp, AlertTriangle, Target, Loader2, LineChart as LineChartIcon, Play, BarChart3, Lightbulb } from "lucide-react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis, Bar, BarChart, Area, AreaChart } from "recharts"
import AppLayout from "@/components/app-layout"
import { PageHeader } from "@/components/page-header"
import { toast } from "sonner"
import { apiClient } from "@/lib/api-client"

interface AnomalyDetection {
  type: string
  severity: 'low' | 'medium' | 'high' | 'critical'
  activity: string
  caseId: string
  description: string
  details: Record<string, any>
}

interface AnomalyReport {
  totalAnomalies: number
  criticalCount: number
  highCount: number
  mediumCount: number
  lowCount: number
  anomalies: AnomalyDetection[]
  aiInsights: string[]
}

interface ForecastMetric {
  metric: string
  current: number
  forecast30d: number
  forecast60d: number
  forecast90d: number
  lower30d: number
  upper30d: number
  lower60d: number
  upper60d: number
  lower90d: number
  upper90d: number
  confidence: number
  dataQuality: string
  dataPoints: number
  modelType: string
}

interface ForecastReport {
  processId: number
  generatedAt: string
  cycleTime: ForecastMetric
  throughput: ForecastMetric
  resourceUtilization: ForecastMetric
  bottlenecks: Array<{
    activity: string
    currentUtilization: number
    forecast30d: number
    forecast60d: number
    forecast90d: number
  }>
  chartData: Array<any>
}

interface ScenarioResult {
  name: string
  type: string
  avgCycleTime: number
  throughput: number
  completedCases: number
  bottlenecks: string[]
  utilizationRate: number
}

interface ScenarioAnalysisReport {
  processId: number
  scenarios: ScenarioResult[]
  comparisons: Array<{
    metric: string
    best: number
    expected: number
    worst: number
    deltaVsExpected: number
    percentChange: number
  }>
  riskAssessment: {
    slaBreachProbability: number
    highRiskActivities: string[]
    recommendations: string[]
  }
  chartData: Array<any>
}

export default function PredictiveAnalyticsPage() {
  const [processes, setProcesses] = useState<any[]>([])
  const [selectedProcess, setSelectedProcess] = useState("")
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState("anomalies")
  
  const [detecting, setDetecting] = useState(false)
  const [anomalyReport, setAnomalyReport] = useState<AnomalyReport | null>(null)
  
  const [forecasting, setForecasting] = useState(false)
  const [forecastReport, setForecastReport] = useState<ForecastReport | null>(null)
  
  const [analyzing, setAnalyzing] = useState(false)
  const [scenarioReport, setScenarioReport] = useState<ScenarioAnalysisReport | null>(null)

  useEffect(() => {
    fetchProcesses()
  }, [])

  const fetchProcesses = async () => {
    try {
      const response = await fetch("/api/processes")
      if (!response.ok) throw new Error("Failed to fetch processes")
      const data = await response.json()
      setProcesses(data.processes || [])
      if (data.processes?.length > 0) {
        setSelectedProcess(data.processes[0].id)
      }
    } catch (error) {
      console.error("Failed to fetch processes:", error)
    } finally {
      setLoading(false)
    }
  }

  const detectAnomalies = async () => {
    if (!selectedProcess) {
      toast.error("Please select a process first")
      return
    }

    setDetecting(true)
    try {
      const response = await apiClient.post(`/api/processes/${selectedProcess}/detect-anomalies`, {})

      if (!response.ok) {
        throw new Error("Failed to detect anomalies")
      }

      const report: AnomalyReport = await response.json()
      setAnomalyReport(report)
      
      if (report.totalAnomalies === 0) {
        toast.success("No anomalies detected - process is running normally!")
      } else if (report.criticalCount > 0) {
        toast.warning(`Found ${report.totalAnomalies} anomalies, including ${report.criticalCount} critical issues`)
      } else {
        toast.info(`Found ${report.totalAnomalies} anomalies`)
      }
    } catch (error) {
      console.error("Failed to detect anomalies:", error)
      toast.error("Failed to detect anomalies. Please try again.")
    } finally {
      setDetecting(false)
    }
  }

  const generateForecast = async () => {
    if (!selectedProcess) {
      toast.error("Please select a process first")
      return
    }

    setForecasting(true)
    try {
      const response = await apiClient.post(`/api/processes/${selectedProcess}/forecast`, {})

      if (!response.ok) {
        throw new Error("Failed to generate forecast")
      }

      const report: ForecastReport = await response.json()
      setForecastReport(report)
      
      toast.success(`Forecast generated using ${report.cycleTime.modelType} model`)
    } catch (error) {
      console.error("Failed to generate forecast:", error)
      toast.error("Failed to generate forecast. Please try again.")
    } finally {
      setForecasting(false)
    }
  }

  const analyzeScenarios = async () => {
    if (!selectedProcess) {
      toast.error("Please select a process first")
      return
    }

    setAnalyzing(true)
    try {
      const response = await apiClient.post(`/api/processes/${selectedProcess}/scenario-analysis`, {})

      if (!response.ok) {
        throw new Error("Failed to analyze scenarios")
      }

      const report: ScenarioAnalysisReport = await response.json()
      setScenarioReport(report)
      
      toast.success("Scenario analysis complete")
    } catch (error) {
      console.error("Failed to analyze scenarios:", error)
      toast.error("Failed to analyze scenarios. Please try again.")
    } finally {
      setAnalyzing(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical':
        return 'destructive'
      case 'high':
        return 'default'
      case 'medium':
        return 'secondary'
      case 'low':
        return 'outline'
      default:
        return 'outline'
    }
  }

  const getAnomalyTypeLabel = (type: string) => {
    return type.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
  }

  const getDataQualityBadge = (quality: string) => {
    const colors = {
      excellent: 'bg-green-500/10 text-green-500',
      good: 'bg-blue-500/10 text-blue-500',
      fair: 'bg-amber-500/10 text-amber-500',
      poor: 'bg-orange-500/10 text-orange-500',
      insufficient: 'bg-red-500/10 text-red-500',
    }
    return colors[quality as keyof typeof colors] || colors.insufficient
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <Loader2 className="h-8 w-8 animate-spin text-brand" />
        </div>
      </AppLayout>
    )
  }

  if (processes.length === 0) {
    return (
      <AppLayout>
        <div className="flex flex-col gap-6 p-4 md:p-6">
          <PageHeader
            icon={Lightbulb}
            title="Predictive Analytics"
            description="AI-powered forecasting and anomaly detection"
            gradient="from-yellow-500 to-amber-600"
          />
          <Card className="border-brand/20">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground mb-4">No processes available. Upload event logs to start predictive analytics.</p>
            </CardContent>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <div className="flex items-center justify-between">
          <PageHeader
            icon={Lightbulb}
            title="Predictive Analytics"
            description="AI-powered forecasting, anomaly detection, and scenario analysis"
            gradient="from-yellow-500 to-amber-600"
          />
          <div className="flex items-center gap-2">
            <Select value={selectedProcess} onValueChange={setSelectedProcess}>
              <SelectTrigger className="w-[280px]">
                <SelectValue placeholder="Select a process" />
              </SelectTrigger>
              <SelectContent>
                {processes.map((process) => (
                  <SelectItem key={process.id} value={process.id}>
                    {process.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-3">
            <TabsTrigger value="anomalies">
              <AlertTriangle className="h-4 w-4 mr-2" />
              Anomaly Detection
            </TabsTrigger>
            <TabsTrigger value="forecasting">
              <LineChartIcon className="h-4 w-4 mr-2" />
              Forecasting
            </TabsTrigger>
            <TabsTrigger value="scenarios">
              <BarChart3 className="h-4 w-4 mr-2" />
              Scenario Analysis
            </TabsTrigger>
          </TabsList>

          <TabsContent value="anomalies" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={detectAnomalies}
                disabled={detecting || !selectedProcess}
              >
                {detecting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Detecting...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Detect Anomalies
                  </>
                )}
              </Button>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <Card className="border-brand/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Total Anomalies</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-amber-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{anomalyReport?.totalAnomalies || 0}</div>
                  <p className="text-xs text-muted-foreground">Unusual patterns detected</p>
                </CardContent>
              </Card>

              <Card className="border-brand/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Critical Issues</CardTitle>
                  <AlertTriangle className="h-4 w-4 text-red-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold text-red-600">{anomalyReport?.criticalCount || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {anomalyReport?.highCount || 0} high, {anomalyReport?.mediumCount || 0} medium, {anomalyReport?.lowCount || 0} low
                  </p>
                </CardContent>
              </Card>

              <Card className="border-brand/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Detection Status</CardTitle>
                  <Target className="h-4 w-4 text-emerald-500" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">
                    {detecting ? "..." : anomalyReport ? "✓" : "—"}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    {detecting ? "Analyzing..." : anomalyReport ? "Analysis complete" : "Ready to analyze"}
                  </p>
                </CardContent>
              </Card>
            </div>

            {anomalyReport && anomalyReport.aiInsights && anomalyReport.aiInsights.length > 0 && (
              <Card className="border-brand/20">
                <CardHeader>
                  <CardTitle>AI Insights</CardTitle>
                  <CardDescription>Expert analysis of detected anomalies</CardDescription>
                </CardHeader>
                <CardContent>
                  <ul className="space-y-2">
                    {anomalyReport.aiInsights.map((insight, idx) => (
                      <li key={idx} className="flex items-start gap-2">
                        <div className="mt-1 h-1.5 w-1.5 rounded-full bg-brand flex-shrink-0" />
                        <span className="text-sm">{insight}</span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>
            )}

            {anomalyReport && anomalyReport.anomalies && anomalyReport.anomalies.length > 0 && (
              <Card className="border-brand/20">
                <CardHeader>
                  <CardTitle>Detected Anomalies</CardTitle>
                  <CardDescription>
                    Showing {anomalyReport.anomalies.length} anomal{anomalyReport.anomalies.length === 1 ? 'y' : 'ies'}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Type</TableHead>
                        <TableHead>Severity</TableHead>
                        <TableHead>Activity</TableHead>
                        <TableHead>Case ID</TableHead>
                        <TableHead>Description</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {anomalyReport.anomalies.slice(0, 50).map((anomaly, idx) => (
                        <TableRow key={idx}>
                          <TableCell className="font-medium">
                            {getAnomalyTypeLabel(anomaly.type)}
                          </TableCell>
                          <TableCell>
                            <Badge variant={getSeverityColor(anomaly.severity) as any}>
                              {anomaly.severity.toUpperCase()}
                            </Badge>
                          </TableCell>
                          <TableCell className="max-w-[150px] truncate">
                            {anomaly.activity}
                          </TableCell>
                          <TableCell className="max-w-[100px] truncate">
                            {anomaly.caseId}
                          </TableCell>
                          <TableCell className="max-w-[400px]">
                            {anomaly.description}
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                  {anomalyReport.anomalies.length > 50 && (
                    <p className="text-sm text-muted-foreground text-center mt-4">
                      Showing first 50 of {anomalyReport.anomalies.length} anomalies
                    </p>
                  )}
                </CardContent>
              </Card>
            )}

            {!anomalyReport && !detecting && (
              <Card className="border-brand/20">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <AlertTriangle className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Click "Detect Anomalies" to analyze the selected process for unusual patterns
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="forecasting" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={generateForecast}
                disabled={forecasting || !selectedProcess}
              >
                {forecasting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Forecasting...
                  </>
                ) : (
                  <>
                    <TrendingUp className="mr-2 h-4 w-4" />
                    Generate Forecast
                  </>
                )}
              </Button>
            </div>

            {forecastReport && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  <Card className="border-brand/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Cycle Time</CardTitle>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getDataQualityBadge(forecastReport.cycleTime.dataQuality)}`}>
                        {forecastReport.cycleTime.dataQuality}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{forecastReport.cycleTime.current.toFixed(1)}h</div>
                      <p className="text-xs text-muted-foreground">
                        30d: {forecastReport.cycleTime.forecast30d.toFixed(1)}h • 
                        90d: {forecastReport.cycleTime.forecast90d.toFixed(1)}h
                      </p>
                      <p className="text-xs text-brand mt-1">
                        {forecastReport.cycleTime.confidence * 100}% confidence • {forecastReport.cycleTime.dataPoints} data points
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-brand/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getDataQualityBadge(forecastReport.throughput.dataQuality)}`}>
                        {forecastReport.throughput.dataQuality}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{forecastReport.throughput.current.toFixed(0)}</div>
                      <p className="text-xs text-muted-foreground">
                        30d: {forecastReport.throughput.forecast30d.toFixed(0)} • 
                        90d: {forecastReport.throughput.forecast90d.toFixed(0)}
                      </p>
                      <p className="text-xs text-brand mt-1">
                        {forecastReport.throughput.confidence * 100}% confidence • {forecastReport.throughput.dataPoints} data points
                      </p>
                    </CardContent>
                  </Card>

                  <Card className="border-brand/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Resource Utilization</CardTitle>
                      <div className={`px-2 py-1 rounded text-xs font-medium ${getDataQualityBadge(forecastReport.resourceUtilization.dataQuality)}`}>
                        {forecastReport.resourceUtilization.dataQuality}
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{forecastReport.resourceUtilization.current.toFixed(0)}%</div>
                      <p className="text-xs text-muted-foreground">
                        30d: {forecastReport.resourceUtilization.forecast30d.toFixed(0)}% • 
                        90d: {forecastReport.resourceUtilization.forecast90d.toFixed(0)}%
                      </p>
                      <p className="text-xs text-brand mt-1">
                        Model: {forecastReport.cycleTime.modelType.replace(/-/g, ' ')}
                      </p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-brand/20">
                  <CardHeader>
                    <CardTitle>Cycle Time Forecast</CardTitle>
                    <CardDescription>Historical data and 90-day forecast with confidence intervals</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <AreaChart data={forecastReport.chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="date" className="text-xs" />
                        <YAxis className="text-xs" />
                        <Tooltip />
                        <Legend />
                        <Area
                          type="monotone"
                          dataKey="upper"
                          stroke="#22d3ee"
                          strokeWidth={1}
                          fill="#22d3ee"
                          fillOpacity={0.15}
                          name="Upper Bound"
                        />
                        <Area
                          type="monotone"
                          dataKey="lower"
                          stroke="#22d3ee"
                          strokeWidth={1}
                          fill="#22d3ee"
                          fillOpacity={0.15}
                          name="Lower Bound"
                        />
                        <Line
                          type="monotone"
                          dataKey="cycletime"
                          stroke="#0891b2"
                          strokeWidth={3}
                          dot={false}
                          name="Historical"
                        />
                        <Line
                          type="monotone"
                          dataKey="forecast"
                          stroke="#06b6d4"
                          strokeWidth={2.5}
                          strokeDasharray="5 5"
                          dot={false}
                          name="Forecast"
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>

                {forecastReport.bottlenecks.length > 0 && (
                  <Card className="border-brand/20">
                    <CardHeader>
                      <CardTitle>Bottleneck Forecast</CardTitle>
                      <CardDescription>Predicted utilization for top activities</CardDescription>
                    </CardHeader>
                    <CardContent>
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Activity</TableHead>
                            <TableHead>Current</TableHead>
                            <TableHead>30d Forecast</TableHead>
                            <TableHead>60d Forecast</TableHead>
                            <TableHead>90d Forecast</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {forecastReport.bottlenecks.map((bottleneck, idx) => (
                            <TableRow key={idx}>
                              <TableCell className="font-medium">{bottleneck.activity}</TableCell>
                              <TableCell>{bottleneck.currentUtilization.toFixed(1)}%</TableCell>
                              <TableCell>{bottleneck.forecast30d.toFixed(1)}%</TableCell>
                              <TableCell>{bottleneck.forecast60d.toFixed(1)}%</TableCell>
                              <TableCell>{bottleneck.forecast90d.toFixed(1)}%</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </CardContent>
                  </Card>
                )}
              </>
            )}

            {!forecastReport && !forecasting && (
              <Card className="border-brand/20">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Click "Generate Forecast" to predict future cycle times, throughput, and resource utilization
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="scenarios" className="space-y-4">
            <div className="flex justify-end">
              <Button 
                onClick={analyzeScenarios}
                disabled={analyzing || !selectedProcess}
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Run Scenario Analysis
                  </>
                )}
              </Button>
            </div>

            {scenarioReport && (
              <>
                <div className="grid gap-4 md:grid-cols-3">
                  {scenarioReport.scenarios.map((scenario) => (
                    <Card key={scenario.name} className="border-brand/20">
                      <CardHeader>
                        <CardTitle className="text-lg">{scenario.name}</CardTitle>
                        <CardDescription>{scenario.type}</CardDescription>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        <div>
                          <p className="text-xs text-muted-foreground">Cycle Time</p>
                          <p className="text-lg font-bold">{scenario.avgCycleTime.toFixed(1)}h</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Throughput</p>
                          <p className="text-lg font-bold">{scenario.throughput.toFixed(1)}/hr</p>
                        </div>
                        <div>
                          <p className="text-xs text-muted-foreground">Utilization</p>
                          <p className="text-lg font-bold">{scenario.utilizationRate.toFixed(0)}%</p>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>

                <Card className="border-brand/20">
                  <CardHeader>
                    <CardTitle>Scenario Comparison</CardTitle>
                    <CardDescription>Compare metrics across best, expected, and worst case scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Metric</TableHead>
                          <TableHead>Best Case</TableHead>
                          <TableHead>Expected</TableHead>
                          <TableHead>Worst Case</TableHead>
                          <TableHead>Impact</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {scenarioReport.comparisons.map((comp, idx) => (
                          <TableRow key={idx}>
                            <TableCell className="font-medium">{comp.metric}</TableCell>
                            <TableCell className="text-green-600">{comp.best.toFixed(2)}</TableCell>
                            <TableCell>{comp.expected.toFixed(2)}</TableCell>
                            <TableCell className="text-red-600">{comp.worst.toFixed(2)}</TableCell>
                            <TableCell>
                              <Badge variant={comp.percentChange > 0 ? "destructive" : "default"}>
                                {comp.percentChange > 0 ? "+" : ""}{comp.percentChange.toFixed(1)}%
                              </Badge>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </CardContent>
                </Card>

                <Card className="border-brand/20">
                  <CardHeader>
                    <CardTitle>Risk Assessment</CardTitle>
                    <CardDescription>Analysis of potential risks and recommendations</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium mb-2">SLA Breach Probability</p>
                      <div className="flex items-center gap-2">
                        <div className="flex-1 bg-muted rounded-full h-2">
                          <div 
                            className="bg-brand h-2 rounded-full transition-all" 
                            style={{ width: `${scenarioReport.riskAssessment.slaBreachProbability}%` }}
                          />
                        </div>
                        <span className="text-sm font-bold">{scenarioReport.riskAssessment.slaBreachProbability.toFixed(0)}%</span>
                      </div>
                    </div>

                    {scenarioReport.riskAssessment.highRiskActivities.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">High Risk Activities</p>
                        <div className="flex flex-wrap gap-2">
                          {scenarioReport.riskAssessment.highRiskActivities.map((activity, idx) => (
                            <Badge key={idx} variant="destructive">{activity}</Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {scenarioReport.riskAssessment.recommendations.length > 0 && (
                      <div>
                        <p className="text-sm font-medium mb-2">Recommendations</p>
                        <ul className="space-y-2">
                          {scenarioReport.riskAssessment.recommendations.map((rec, idx) => (
                            <li key={idx} className="flex items-start gap-2">
                              <div className="mt-1 h-1.5 w-1.5 rounded-full bg-brand flex-shrink-0" />
                              <span className="text-sm">{rec}</span>
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}
                  </CardContent>
                </Card>

                <Card className="border-brand/20">
                  <CardHeader>
                    <CardTitle>Scenario Performance Comparison</CardTitle>
                    <CardDescription>Visual comparison of key metrics across scenarios</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ResponsiveContainer width="100%" height={300}>
                      <BarChart data={scenarioReport.chartData}>
                        <CartesianGrid strokeDasharray="3 3" className="stroke-muted" />
                        <XAxis dataKey="scenario" />
                        <YAxis />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="cycleTime" fill="hsl(var(--brand))" name="Cycle Time (h)" />
                        <Bar dataKey="throughput" fill="hsl(var(--chart-2))" name="Throughput" />
                      </BarChart>
                    </ResponsiveContainer>
                  </CardContent>
                </Card>
              </>
            )}

            {!scenarioReport && !analyzing && (
              <Card className="border-brand/20">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <BarChart3 className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground mb-4">
                    Click "Run Scenario Analysis" to compare optimistic, expected, and pessimistic outcomes
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
