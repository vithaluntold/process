"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { AlertCircle, CheckCircle2, XCircle, Loader2 } from "lucide-react"
import AppLayout from "@/components/app-layout"

export default function ConformanceCheckingPage() {
  const [processes, setProcesses] = useState<any[]>([])
  const [selectedProcess, setSelectedProcess] = useState("")
  const [loading, setLoading] = useState(true)

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
          <p className="text-muted-foreground">Analyze process deviations and compliance</p>
        </div>
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

      <div className="grid gap-4 md:grid-cols-3">
        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Conformance Rate</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0%</div>
            <p className="text-xs text-muted-foreground">Cases following the model</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Deviations</CardTitle>
            <AlertCircle className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0</div>
            <p className="text-xs text-muted-foreground">Process violations detected</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance Score</CardTitle>
            <XCircle className="h-4 w-4 text-red-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">0/100</div>
            <p className="text-xs text-muted-foreground">Overall compliance rating</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand/20">
        <CardHeader>
          <CardTitle>Deviation Analysis</CardTitle>
          <CardDescription>Detected process deviations and their impact</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="text-center text-muted-foreground py-8">
            No deviations detected. Upload event logs and run conformance checking.
          </div>
        </CardContent>
      </Card>
    </div>
    </AppLayout>
  )
}
