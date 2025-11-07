"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Network } from "lucide-react"
import { SkeletonCard } from "@/components/ui/skeleton-card"

export default function ProcessDiscovery() {
  const [processes, setProcesses] = useState<any[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)

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
            <h3 className="text-lg font-semibold mb-2">No Processes Discovered Yet</h3>
            <p className="text-muted-foreground max-w-md mb-6">
              Upload CSV files with event log data to automatically discover process models, variants, and bottlenecks using process mining algorithms.
            </p>
          </div>
        </CardContent>
      </Card>
    )
  }

  const currentProcess = processes.find(p => p.id.toString() === selectedProcess)

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between mb-4">
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
      </div>

      {currentProcess && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card className="border-brand/20">
            <CardHeader>
              <CardTitle>Process Information</CardTitle>
              <CardDescription>Details about the selected process</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
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

          <Card className="border-brand/20">
            <CardHeader>
              <CardTitle>Process Model Visualization</CardTitle>
              <CardDescription>Coming soon with Alpha Miner algorithm</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <div className="rounded-full bg-brand/10 p-6 mb-4">
                  <Network className="h-12 w-12 text-brand" />
                </div>
                <h3 className="text-lg font-semibold mb-2">Process Discovery Coming Soon</h3>
                <p className="text-sm text-muted-foreground max-w-md">
                  The Alpha Miner algorithm will automatically discover the process model, identify variants, detect bottlenecks, and visualize the complete process flow.
                </p>
              </div>
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  )
}
