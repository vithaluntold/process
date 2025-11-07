"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { EmptyState } from "@/components/ui/empty-state"
import { FileSearch } from "lucide-react"

export default function ConformanceChecking() {
  const [processes, setProcesses] = useState<any[]>([])
  const [selectedProcess, setSelectedProcess] = useState<string>("")
  const [deviations, setDeviations] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchProcesses()
  }, [])

  useEffect(() => {
    if (selectedProcess) {
      fetchDeviations(selectedProcess)
    }
  }, [selectedProcess])

  const fetchProcesses = async () => {
    try {
      const response = await fetch("/api/processes")
      if (!response.ok) throw new Error("Failed to fetch processes")
      const data = await response.json()
      setProcesses(data.processes || [])
      if (data.processes && data.processes.length > 0) {
        setSelectedProcess(data.processes[0].id.toString())
      }
    } catch (error) {
      console.error("Failed to fetch processes:", error)
    } finally {
      setLoading(false)
    }
  }

  const fetchDeviations = async (processId: string) => {
    try {
      setLoading(true)
      setError(null)
      const response = await fetch(`/api/conformance/deviations?processId=${processId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || "Failed to fetch deviations")
      }
      const data = await response.json()
      setDeviations(data.deviations || [])
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : "Failed to fetch deviations"
      console.error("Failed to fetch deviations:", errorMessage)
      setError(errorMessage)
      setDeviations([])
    } finally {
      setLoading(false)
    }
  }

  if (loading && processes.length === 0) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-brand"></div>
      </div>
    )
  }

  if (processes.length === 0) {
    return (
      <EmptyState
        icon={FileSearch}
        title="No Processes Available"
        description="Create a process and upload event logs to see conformance analysis"
      />
    )
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-4">
        <Select value={selectedProcess} onValueChange={setSelectedProcess}>
          <SelectTrigger className="w-[300px]">
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
      {error && (
        <div className="bg-destructive/10 text-destructive px-4 py-3 rounded-md">
          {error}
        </div>
      )}
      <div className="grid grid-cols-1 gap-4">
        <Card className="border-brand/20">
          <CardHeader>
            <CardTitle>Conformance Analysis</CardTitle>
            <CardDescription>Analysis of process deviations and compliance issues.</CardDescription>
          </CardHeader>
          <CardContent>
                <div className="rounded-md border border-brand/20">
                  <div className="relative w-full overflow-auto">
                    <table className="w-full caption-bottom text-sm">
                      <thead>
                        <tr className="border-b transition-colors hover:bg-muted/50">
                          <th className="h-12 px-4 text-left font-medium">Deviation Type</th>
                          <th className="h-12 px-4 text-left font-medium">Frequency</th>
                          <th className="h-12 px-4 text-left font-medium">Impact</th>
                          <th className="h-12 px-4 text-left font-medium">Description</th>
                        </tr>
                      </thead>
                      <tbody>
                        {loading ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center">
                              <div className="flex justify-center">
                                <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-brand"></div>
                              </div>
                            </td>
                          </tr>
                        ) : deviations.length === 0 ? (
                          <tr>
                            <td colSpan={4} className="p-8 text-center text-muted-foreground">
                              No deviations found for this process
                            </td>
                          </tr>
                        ) : (
                          deviations.map((item: any, index: number) => (
                            <tr key={index} className="border-b transition-colors hover:bg-muted/50">
                              <td className="p-4 align-middle font-medium">{item.name}</td>
                              <td className="p-4 align-middle">{item.frequency}</td>
                              <td className="p-4 align-middle">
                                <Badge
                                  variant={
                                    item.impact === "High"
                                      ? "destructive"
                                      : item.impact === "Medium"
                                        ? "default"
                                        : "outline"
                                  }
                                  className={
                                    item.impact === "Medium" ? "bg-brand text-white hover:bg-brand/90" : ""
                                  }
                                >
                                  {item.impact}
                                </Badge>
                              </td>
                              <td className="p-4 align-middle">{item.description || "-"}</td>
                            </tr>
                          ))
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
