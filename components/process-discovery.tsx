"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Network, Sparkles, AlertCircle, TrendingUp, Zap } from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton-card"
import { toast } from "sonner"
import dynamic from "next/dynamic"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

const ProcessFlowchart = dynamic(() => import("@/components/process-flowchart"), {
  ssr: false,
  loading: () => <SkeletonCard />,
})

export default function ProcessDiscovery() {
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

  const discoverProcessModel = async () => {
    if (!selectedProcess) return

    setDiscovering(true)
    setDiscoveryResult(null)

    try {
      const response = await fetch(`/api/processes/${selectedProcess}/discover`, {
        method: "POST",
      })

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
          className="gap-2 bg-gradient-to-r from-brand to-brand/80 hover:from-brand/90 hover:to-brand/70 shadow-lg shadow-brand/30 transition-all active:scale-95"
          size="lg"
        >
          <Sparkles className="h-5 w-5" />
          {discovering ? "Discovering Process..." : "Discover Process Model"}
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
            <div className="space-y-6">
              <div className="flex items-center gap-3">
                <div className="rounded-lg bg-gradient-to-br from-brand to-brand/80 p-2 shadow-lg shadow-brand/20">
                  <Sparkles className="h-5 w-5 text-white" />
                </div>
                <div>
                  <h2 className="text-2xl font-bold">AI-Powered Insights</h2>
                  <p className="text-sm text-muted-foreground">Intelligent recommendations from GPT-4.1</p>
                </div>
              </div>
              
              <div className="grid gap-4 md:grid-cols-2">
                {discoveryResult.insights.map((insight: any, index: number) => {
                  let icon = AlertCircle
                  let gradientClass = "from-brand to-brand/80"
                  let bgClass = "bg-brand/5"
                  let borderClass = "border-brand/20"
                  let shadowClass = "shadow-brand/20"
                  
                  if (insight.type === "bottleneck") {
                    icon = TrendingUp
                    gradientClass = "from-destructive to-destructive/80"
                    bgClass = "bg-destructive/5"
                    borderClass = "border-destructive/20"
                    shadowClass = "shadow-destructive/20"
                  } else if (insight.type === "automation") {
                    icon = Zap
                    gradientClass = "from-success to-success/80"
                    bgClass = "bg-success/5"
                    borderClass = "border-success/20"
                    shadowClass = "shadow-success/20"
                  } else if (insight.type === "optimization") {
                    icon = Sparkles
                    gradientClass = "from-brand to-brand/80"
                    bgClass = "bg-brand/5"
                    borderClass = "border-brand/20"
                    shadowClass = "shadow-brand/20"
                  }

                  const Icon = icon

                  return (
                    <Card key={index} className={`${borderClass} ${bgClass} overflow-hidden hover:shadow-xl transition-all duration-300 hover:scale-[1.02]`}>
                      <CardHeader className="pb-3">
                        <div className="flex items-start gap-3">
                          <div className={`rounded-lg bg-gradient-to-br ${gradientClass} p-2.5 shadow-lg ${shadowClass}`}>
                            <Icon className="h-5 w-5 text-white" />
                          </div>
                          <div className="flex-1">
                            <CardTitle className="text-lg capitalize flex items-center gap-2">
                              {insight.type}
                              {insight.severity && (
                                <span className="ml-auto text-xs font-normal px-2.5 py-1 rounded-full bg-background/50 text-muted-foreground border border-border">
                                  {insight.severity}/10
                                </span>
                              )}
                            </CardTitle>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-3">
                        <p className="text-sm leading-relaxed text-foreground/90">{insight.description}</p>
                        
                        {insight.recommendation && (
                          <div className="rounded-lg bg-background/80 p-3 border border-border/50">
                            <div className="flex gap-2">
                              <Sparkles className="h-4 w-4 text-brand mt-0.5 flex-shrink-0" />
                              <p className="text-sm font-medium leading-relaxed">
                                {insight.recommendation}
                              </p>
                            </div>
                          </div>
                        )}
                        
                        {insight.affectedActivities && insight.affectedActivities.length > 0 && (
                          <div className="flex flex-wrap gap-1.5 pt-2">
                            {insight.affectedActivities.map((activity: string, i: number) => (
                              <span 
                                key={i}
                                className="inline-flex items-center px-2.5 py-1 rounded-md bg-background/80 text-xs font-medium border border-border hover:border-brand/30 transition-colors"
                              >
                                {activity}
                              </span>
                            ))}
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </div>
          )}

          <Card className="border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <div className="rounded-lg bg-gradient-to-br from-brand to-brand/80 p-1.5">
                  <Network className="h-4 w-4 text-white" />
                </div>
                Process Model Statistics
              </CardTitle>
              <CardDescription>Metrics discovered by Alpha Miner algorithm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
                <div className="rounded-lg bg-background/80 p-4 border border-border/50 hover:border-brand/30 transition-colors">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Activities</div>
                  <div className="text-3xl font-bold bg-gradient-to-br from-brand to-brand/70 bg-clip-text text-transparent">{discoveryResult.model.activities.length}</div>
                </div>
                <div className="rounded-lg bg-background/80 p-4 border border-border/50 hover:border-brand/30 transition-colors">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Transitions</div>
                  <div className="text-3xl font-bold bg-gradient-to-br from-brand to-brand/70 bg-clip-text text-transparent">{discoveryResult.model.transitions.length}</div>
                </div>
                <div className="rounded-lg bg-background/80 p-4 border border-border/50 hover:border-success/30 transition-colors">
                  <div className="text-sm font-medium text-muted-foreground mb-1">Start Points</div>
                  <div className="text-3xl font-bold bg-gradient-to-br from-success to-success/70 bg-clip-text text-transparent">{discoveryResult.model.startActivities.length}</div>
                </div>
                <div className="rounded-lg bg-background/80 p-4 border border-border/50 hover:border-destructive/30 transition-colors">
                  <div className="text-sm font-medium text-muted-foreground mb-1">End Points</div>
                  <div className="text-3xl font-bold bg-gradient-to-br from-destructive to-destructive/70 bg-clip-text text-transparent">{discoveryResult.model.endActivities.length}</div>
                </div>
              </div>
              
              {discoveryResult.model.metadata && (
                <div className="mt-6 grid gap-3 md:grid-cols-3">
                  <div className="rounded-lg bg-background/60 p-3 border border-border/40">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Causal Relations</div>
                    <div className="text-xl font-bold text-foreground">
                      {discoveryResult.model.metadata.causalRelations?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">A → B patterns</div>
                  </div>
                  <div className="rounded-lg bg-background/60 p-3 border border-border/40">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Parallel Relations</div>
                    <div className="text-xl font-bold text-foreground">
                      {discoveryResult.model.metadata.parallelRelations?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">Concurrent activities</div>
                  </div>
                  <div className="rounded-lg bg-background/60 p-3 border border-border/40">
                    <div className="text-xs font-medium text-muted-foreground mb-1">Choice Relations</div>
                    <div className="text-xl font-bold text-foreground">
                      {discoveryResult.model.metadata.choiceRelations?.length || 0}
                    </div>
                    <div className="text-xs text-muted-foreground mt-0.5">XOR decision points</div>
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
