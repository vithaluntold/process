"use client"

import { useState, useEffect } from "react"
import { useSearchParams } from "next/navigation"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Network, Sparkles, AlertCircle, TrendingUp, Zap } from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { apiClient } from "@/lib/api-client"

const ProcessFlowchart = dynamic(() => import("@/components/process-flowchart"), {
  ssr: false,
  loading: () => <SkeletonCard />,
})

export default function ProcessDiscovery() {
  const searchParams = useSearchParams()
  const [processes, setProcesses] = useState<any[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [discovering, setDiscovering] = useState(false)
  const [discoveryResult, setDiscoveryResult] = useState<any>(null)

  useEffect(() => {
    fetchProcesses()
  }, [])

  const fetchProcesses = async () => {
    try {
      const response = await fetch("/api/processes")
      const data = await response.json()
      const processArray = data.processes || []
      setProcesses(processArray)
      
      const processIdParam = searchParams.get('processId')
      
      if (processIdParam) {
        const matchingProcess = processArray.find((p: any) => p.id.toString() === processIdParam)
        if (matchingProcess) {
          setSelectedProcess(processIdParam)
        } else if (processArray.length > 0) {
          setSelectedProcess(processArray[0].id.toString())
        }
      } else if (processArray.length > 0) {
        setSelectedProcess(processArray[0].id.toString())
      }
    } catch (error) {
      console.error("Failed to fetch processes:", error)
      setProcesses([])
    } finally {
      setLoading(false)
    }
  }

  const discoverProcessModel = async () => {
    if (!selectedProcess) return

    setDiscovering(true)
    setDiscoveryResult(null)

    try {
      const response = await apiClient.post(`/api/processes/${selectedProcess}/discover`)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to discover process model")
      }

      const data = await response.json()
      setDiscoveryResult(data)
      toast.success("Process model discovered successfully!", {
        description: `Found ${data.model.activities.length} activities and ${data.model.transitions.length} transitions`,
      })
    } catch (error: any) {
      console.error("Process discovery error:", error)
      toast.error("Process discovery failed", {
        description: error.message || "An error occurred during process discovery",
      })
    } finally {
      setDiscovering(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
    )
  }

  if (processes.length === 0) {
    return (
      <Card className="border-brand/20">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Network className="h-5 w-5 text-brand" />
            Process Discovery
          </CardTitle>
          <CardDescription>
            Automatically discover process models from event log data
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col items-center justify-center py-12 text-center">
            <div className="rounded-full bg-brand/10 p-6 mb-4">
              <Network className="h-12 w-12 text-brand" />
            </div>
            <h3 className="text-lg font-semibold mb-2">No Processes Available</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload CSV files with event log data to automatically discover process models, variants, and bottlenecks using the Alpha Miner algorithm.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentProcess = processes.find(p => p.id.toString() === selectedProcess)

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

        <Button 
          onClick={discoverProcessModel} 
          disabled={!selectedProcess || discovering}
          className="gap-2"
        >
          <Sparkles className="h-4 w-4" />
          {discovering ? "Discovering..." : "Discover Process Model"}
        </Button>
      </div>

      {currentProcess && (
        <Card className="border-brand/20">
          <CardHeader>
            <CardTitle>Process Information</CardTitle>
            <CardDescription>Details about the selected process</CardDescription>
          </CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            <div>
              <div className="text-sm font-medium text-muted-foreground">Name</div>
              <div className="text-lg font-semibold">{currentProcess.name}</div>
            </div>
            {currentProcess.description && (
              <div>
                <div className="text-sm font-medium text-muted-foreground">Description</div>
                <div>{currentProcess.description}</div>
              </div>
            )}
            <div>
              <div className="text-sm font-medium text-muted-foreground">Source</div>
              <div>{currentProcess.source || 'N/A'}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Status</div>
              <div className="capitalize">{currentProcess.status}</div>
            </div>
            <div>
              <div className="text-sm font-medium text-muted-foreground">Created</div>
              <div>{new Date(currentProcess.createdAt).toLocaleString()}</div>
            </div>
          </CardContent>
        </Card>
      )}

      {discoveryResult && (
        <>
          <ProcessFlowchart
            activities={discoveryResult.model.activities}
            transitions={discoveryResult.model.transitions}
            startActivities={discoveryResult.model.startActivities}
            endActivities={discoveryResult.model.endActivities}
          />

          {discoveryResult.insights && discoveryResult.insights.length > 0 && (
            <div className="space-y-4">
              <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
              
              {discoveryResult.insights.map((insight: any, index: number) => {
                let icon = AlertCircle
                let variant: "default" | "destructive" = "default"
                
                if (insight.type === "bottleneck") {
                  icon = TrendingUp
                  variant = "destructive"
                } else if (insight.type === "automation") {
                  icon = Zap
                } else if (insight.type === "optimization") {
                  icon = Sparkles
                }

                const Icon = icon

                return (
                  <Alert key={index} variant={variant} className="border-brand/20">
                    <Icon className="h-5 w-5" />
                    <AlertTitle className="text-lg font-semibold capitalize">
                      {insight.type}
                      {insight.severity && (
                        <span className="ml-2 text-sm font-normal text-muted-foreground">
                          (Severity: {insight.severity}/10)
                        </span>
                      )}
                    </AlertTitle>
                    <AlertDescription className="mt-2">
                      <p className="mb-2">{insight.description}</p>
                      {insight.recommendation && (
                        <p className="text-sm font-medium">
                          💡 Recommendation: {insight.recommendation}
                        </p>
                      )}
                      {insight.affectedActivities && insight.affectedActivities.length > 0 && (
                        <div className="mt-2">
                          <span className="text-sm font-medium">Affected Activities: </span>
                          <span className="text-sm">{insight.affectedActivities.join(", ")}</span>
                        </div>
                      )}
                    </AlertDescription>
                  </Alert>
                )
              })}
            </div>
          )}

          <Card className="border-brand/20">
            <CardHeader>
              <CardTitle>Process Model Metadata</CardTitle>
              <CardDescription>Statistics from Alpha Miner algorithm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Activities</div>
                  <div className="text-2xl font-bold text-brand">{discoveryResult.model.activities.length}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Transitions</div>
                  <div className="text-2xl font-bold text-brand">{discoveryResult.model.transitions.length}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">Start Activities</div>
                  <div className="text-2xl font-bold text-success">{discoveryResult.model.startActivities.length}</div>
                </div>
                <div>
                  <div className="text-sm font-medium text-muted-foreground">End Activities</div>
                  <div className="text-2xl font-bold text-destructive">{discoveryResult.model.endActivities.length}</div>
                </div>
              </div>
              
              {discoveryResult.model.metadata && (
                <div className="mt-6 space-y-3">
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Causal Relations</div>
                    <div className="text-sm">
                      {discoveryResult.model.metadata.causalRelations?.length || 0} relations detected
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Parallel Relations</div>
                    <div className="text-sm">
                      {discoveryResult.model.metadata.parallelRelations?.length || 0} parallel activities detected
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium text-muted-foreground mb-1">Choice Relations (XOR)</div>
                    <div className="text-sm">
                      {discoveryResult.model.metadata.choiceRelations?.length || 0} mutual exclusions detected
                    </div>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
