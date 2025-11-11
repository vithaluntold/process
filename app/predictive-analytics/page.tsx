"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { TrendingUp, AlertTriangle, Target, Loader2 } from "lucide-react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"
import AppLayout from "@/components/app-layout"
import { toast } from "sonner"

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

export default function PredictiveAnalyticsPage() {
  const [processes, setProcesses] = useState<any[]>([])
  const [selectedProcess, setSelectedProcess] = useState("")
  const [loading, setLoading] = useState(true)
  const [detecting, setDetecting] = useState(false)
  const [anomalyReport, setAnomalyReport] = useState<AnomalyReport | null>(null)

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
      const response = await fetch(`/api/processes/${selectedProcess}/detect-anomalies`, {
        method: "POST",
      })

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
        <div className="flex flex-col gap-4 p-4 md:p-6">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Predictive Analytics</h1>
            <p className="text-muted-foreground">AI-powered forecasting and anomaly detection</p>
          </div>
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
      <div className="flex flex-col gap-4 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Predictive Analytics</h1>
          <p className="text-muted-foreground">AI-powered forecasting and anomaly detection</p>
        </div>
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
          <Button 
            variant="outline" 
            size="sm" 
            onClick={detectAnomalies}
            disabled={detecting || !selectedProcess}
          >
            {detecting ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Detecting...
              </>
            ) : (
              "Detect Anomalies"
            )}
          </Button>
        </div>
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
    </div>
    </AppLayout>
  )
}
