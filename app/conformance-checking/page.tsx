"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertCircle, CheckCircle2, XCircle, Loader2, AlertTriangle, Search, Play, Activity } from "lucide-react"
import { toast } from "sonner"
import AppLayout from "@/components/app-layout"

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

interface ConformanceResult {
  caseId: string
  conformant: boolean
  fitness: number
  deviationType: string | null
  deviationDetails: {
    missingTokens: number
    remainingTokens: number
    producedTokens: number
    consumedTokens: number
    totalActivities: number
    deviations: Array<{
      activity: string
      type: 'missing' | 'unexpected' | 'wrong_order'
      timestamp: string
    }>
  }
}

interface ConformanceSummary {
  totalCases: number
  conformantCases: number
  nonConformantCases: number
  averageFitness: number
  commonDeviations: Array<{ type: string; count: number }>
}

export default function ConformanceCheckingPage() {
  const [processes, setProcesses] = useState<any[]>([])
  const [selectedProcess, setSelectedProcess] = useState("")
  const [loading, setLoading] = useState(true)
  const [analyzing, setAnalyzing] = useState(false)
  const [checking, setChecking] = useState(false)
  const [anomalyReport, setAnomalyReport] = useState<AnomalyReport | null>(null)
  const [conformanceResults, setConformanceResults] = useState<ConformanceResult[] | null>(null)
  const [conformanceSummary, setConformanceSummary] = useState<ConformanceSummary | null>(null)
  const [showAllAnomalies, setShowAllAnomalies] = useState(false)
  const [showAllResults, setShowAllResults] = useState(false)

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
        setSelectedProcess(data.processes[0].id.toString())
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

    setAnalyzing(true)
    try {
      const response = await fetch(`/api/processes/${selectedProcess}/detect-anomalies`, {
        method: 'POST',
      })

      if (!response.ok) {
        throw new Error("Failed to detect anomalies")
      }

      const report = await response.json()
      setAnomalyReport(report)
      
      if (report.totalAnomalies === 0) {
        toast.success("No anomalies detected - process execution looks normal!")
      } else {
        toast.success(`Detected ${report.totalAnomalies} anomalies with AI-powered insights`)
      }
    } catch (error) {
      console.error("Failed to detect anomalies:", error)
      toast.error("Failed to analyze process anomalies")
    } finally {
      setAnalyzing(false)
    }
  }

  const checkConformance = async () => {
    if (!selectedProcess) {
      toast.error("Please select a process first")
      return
    }

    setChecking(true)
    try {
      const response = await fetch(`/api/processes/${selectedProcess}/check-conformance`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({}),
      })

      if (!response.ok) {
        const data = await response.json()
        throw new Error(data.details || "Failed to check conformance")
      }

      const data = await response.json()
      setConformanceResults(data.results)
      setConformanceSummary(data.summary)
      
      const fitness = Math.round(data.summary.averageFitness * 100)
      toast.success(`Conformance check complete! Average fitness: ${fitness}%`)
    } catch (error) {
      console.error("Failed to check conformance:", error)
      toast.error(error instanceof Error ? error.message : "Failed to check process conformance")
    } finally {
      setChecking(false)
    }
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'critical': return 'bg-red-500/10 text-red-500 border-red-500/20'
      case 'high': return 'bg-orange-500/10 text-orange-500 border-orange-500/20'
      case 'medium': return 'bg-amber-500/10 text-amber-500 border-amber-500/20'
      case 'low': return 'bg-blue-500/10 text-blue-500 border-blue-500/20'
      default: return 'bg-gray-500/10 text-gray-500 border-gray-500/20'
    }
  }

  const formatType = (type: string) => {
    return type.split('_').map(word => word.charAt(0).toUpperCase() + word.slice(1)).join(' ')
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
            <h1 className="text-3xl font-bold tracking-tight">Conformance Checking</h1>
            <p className="text-muted-foreground">Analyze process deviations and compliance</p>
          </div>
          <Card className="border-brand/20">
            <CardContent className="flex flex-col items-center justify-center h-64">
              <p className="text-muted-foreground mb-4">No processes available. Upload event logs to start conformance checking.</p>
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
            <h1 className="text-3xl font-bold tracking-tight">Conformance Checking</h1>
            <p className="text-muted-foreground">Validate process compliance with token-based replay and anomaly detection</p>
          </div>
          <Select value={selectedProcess} onValueChange={setSelectedProcess}>
            <SelectTrigger className="w-[280px]">
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

        <Tabs defaultValue="token-replay" className="w-full">
          <TabsList className="grid w-full grid-cols-2">
            <TabsTrigger value="token-replay" className="flex items-center gap-2">
              <Play className="h-4 w-4" />
              Token-Based Replay
            </TabsTrigger>
            <TabsTrigger value="anomalies" className="flex items-center gap-2">
              <Activity className="h-4 w-4" />
              Anomaly Detection
            </TabsTrigger>
          </TabsList>

          <TabsContent value="token-replay" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button 
                onClick={checkConformance}
                disabled={!selectedProcess || checking}
                className="bg-brand hover:bg-brand/90"
              >
                {checking ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Checking...
                  </>
                ) : (
                  <>
                    <Play className="mr-2 h-4 w-4" />
                    Check Conformance
                  </>
                )}
              </Button>
            </div>

            {conformanceSummary && (
              <>
                <div className="grid gap-4 md:grid-cols-4">
                  <Card className="border-brand/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Total Cases</CardTitle>
                      <Activity className="h-4 w-4 text-brand" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold">{conformanceSummary.totalCases}</div>
                      <p className="text-xs text-muted-foreground">Process instances analyzed</p>
                    </CardContent>
                  </Card>

                  <Card className="border-brand/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Conformant</CardTitle>
                      <CheckCircle2 className="h-4 w-4 text-emerald-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-emerald-500">{conformanceSummary.conformantCases}</div>
                      <p className="text-xs text-muted-foreground">Perfect model alignment</p>
                    </CardContent>
                  </Card>

                  <Card className="border-brand/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Non-Conformant</CardTitle>
                      <XCircle className="h-4 w-4 text-red-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-red-500">{conformanceSummary.nonConformantCases}</div>
                      <p className="text-xs text-muted-foreground">Model deviations found</p>
                    </CardContent>
                  </Card>

                  <Card className="border-brand/20">
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">Avg Fitness</CardTitle>
                      <AlertCircle className="h-4 w-4 text-blue-500" />
                    </CardHeader>
                    <CardContent>
                      <div className="text-2xl font-bold text-blue-500">
                        {Math.round(conformanceSummary.averageFitness * 100)}%
                      </div>
                      <p className="text-xs text-muted-foreground">Token replay fitness score</p>
                    </CardContent>
                  </Card>
                </div>

                <Card className="border-brand/20">
                  <CardHeader>
                    <CardTitle>Conformance Results</CardTitle>
                    <CardDescription>Token-based replay analysis for each process instance</CardDescription>
                  </CardHeader>
                  <CardContent>
                    {conformanceResults && conformanceResults.length > 0 ? (
                      <>
                        <Table>
                          <TableHeader>
                            <TableRow>
                              <TableHead>Case ID</TableHead>
                              <TableHead>Status</TableHead>
                              <TableHead>Fitness Score</TableHead>
                              <TableHead>Deviation Type</TableHead>
                              <TableHead>Missing Tokens</TableHead>
                              <TableHead>Remaining Tokens</TableHead>
                              <TableHead>Activities</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {(showAllResults ? conformanceResults : conformanceResults.slice(0, 20)).map((result, idx) => (
                              <TableRow key={idx} className="hover:bg-brand/5 transition-colors">
                                <TableCell className="font-mono text-xs">{result.caseId}</TableCell>
                                <TableCell>
                                  {result.conformant ? (
                                    <Badge className="bg-emerald-500/10 text-emerald-500 border-emerald-500/20">
                                      CONFORMANT
                                    </Badge>
                                  ) : (
                                    <Badge className="bg-red-500/10 text-red-500 border-red-500/20">
                                      NON-CONFORMANT
                                    </Badge>
                                  )}
                                </TableCell>
                                <TableCell className="font-medium">
                                  {Math.round(result.fitness * 100)}%
                                </TableCell>
                                <TableCell>
                                  {result.deviationType ? (
                                    <span className="text-sm">{result.deviationType.replace(/_/g, ' ')}</span>
                                  ) : (
                                    <span className="text-muted-foreground">-</span>
                                  )}
                                </TableCell>
                                <TableCell>{result.deviationDetails.missingTokens}</TableCell>
                                <TableCell>{result.deviationDetails.remainingTokens}</TableCell>
                                <TableCell>{result.deviationDetails.totalActivities}</TableCell>
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                        {conformanceResults.length > 20 && (
                          <div className="mt-4 text-center">
                            <Button
                              variant="outline"
                              onClick={() => setShowAllResults(!showAllResults)}
                              className="border-brand/20 hover:bg-brand/5"
                            >
                              {showAllResults ? 'Show Top 20' : `Show All ${conformanceResults.length} Results`}
                            </Button>
                          </div>
                        )}
                      </>
                    ) : (
                      <div className="text-center text-muted-foreground py-8">
                        Click "Check Conformance" to analyze process compliance
                      </div>
                    )}
                  </CardContent>
                </Card>
              </>
            )}

            {!conformanceSummary && (
              <Card className="border-brand/20">
                <CardContent className="flex flex-col items-center justify-center h-64">
                  <Play className="h-12 w-12 text-muted-foreground mb-4" />
                  <p className="text-muted-foreground text-center">
                    Select a process and click "Check Conformance" to perform token-based replay analysis
                  </p>
                </CardContent>
              </Card>
            )}
          </TabsContent>

          <TabsContent value="anomalies" className="space-y-4 mt-4">
            <div className="flex justify-end">
              <Button 
                onClick={detectAnomalies}
                disabled={!selectedProcess || analyzing}
                className="bg-brand hover:bg-brand/90"
              >
                {analyzing ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Analyzing...
                  </>
                ) : (
                  <>
                    <Search className="mr-2 h-4 w-4" />
                    Detect Anomalies
                  </>
                )}
              </Button>
            </div>

      <div className="grid gap-4 md:grid-cols-4">
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
            <CardTitle className="text-sm font-medium">Critical</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-red-500">{anomalyReport?.criticalCount || 0}</div>
            <p className="text-xs text-muted-foreground">Requires immediate attention</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">High Priority</CardTitle>
            <AlertCircle className="h-4 w-4 text-orange-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-orange-500">{anomalyReport?.highCount || 0}</div>
            <p className="text-xs text-muted-foreground">Needs investigation</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Medium/Low</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-blue-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-blue-500">
              {(anomalyReport?.mediumCount || 0) + (anomalyReport?.lowCount || 0)}
            </div>
            <p className="text-xs text-muted-foreground">Monitor for patterns</p>
          </CardContent>
        </Card>
      </div>

      {anomalyReport && anomalyReport.aiInsights.length > 0 && (
        <Card className="border-brand/20">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-brand" />
              AI-Powered Insights
            </CardTitle>
            <CardDescription>Intelligent analysis of detected anomalies</CardDescription>
          </CardHeader>
          <CardContent>
            <ul className="space-y-3">
              {anomalyReport.aiInsights.map((insight, idx) => (
                <li key={idx} className="flex items-start gap-2">
                  <div className="mt-1 h-1.5 w-1.5 rounded-full bg-brand shrink-0" />
                  <p className="text-sm">{insight}</p>
                </li>
              ))}
            </ul>
          </CardContent>
        </Card>
      )}

      <Card className="border-brand/20">
        <CardHeader>
          <CardTitle>Detected Anomalies</CardTitle>
          <CardDescription>Statistical and AI-detected unusual process patterns</CardDescription>
        </CardHeader>
        <CardContent>
          {!anomalyReport ? (
            <div className="text-center text-muted-foreground py-8">
              Select a process and click "Detect Anomalies" to analyze unusual patterns
            </div>
          ) : anomalyReport.anomalies.length === 0 ? (
            <div className="text-center text-muted-foreground py-8">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 text-emerald-500" />
              <p>No anomalies detected - process execution looks normal!</p>
            </div>
          ) : (
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
                {(showAllAnomalies ? anomalyReport.anomalies : anomalyReport.anomalies.slice(0, 20)).map((anomaly, idx) => (
                  <TableRow key={idx} className="hover:bg-brand/5 transition-colors">
                    <TableCell className="font-medium">{formatType(anomaly.type)}</TableCell>
                    <TableCell>
                      <Badge className={getSeverityColor(anomaly.severity)}>
                        {anomaly.severity.toUpperCase()}
                      </Badge>
                    </TableCell>
                    <TableCell className="max-w-[200px] truncate">{anomaly.activity}</TableCell>
                    <TableCell className="font-mono text-xs">{anomaly.caseId}</TableCell>
                    <TableCell className="max-w-[400px]">{anomaly.description}</TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
          {anomalyReport && anomalyReport.anomalies.length > 20 && (
            <div className="mt-4 text-center">
              <Button
                variant="outline"
                onClick={() => setShowAllAnomalies(!showAllAnomalies)}
                className="border-brand/20 hover:bg-brand/5"
              >
                {showAllAnomalies ? 'Show Top 20' : `Show All ${anomalyReport.anomalies.length} Anomalies`}
              </Button>
            </div>
          )}
        </CardContent>
      </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  )
}
