"use client"

import { useState, useEffect } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { SkeletonChart, SkeletonCard } from "@/components/ui/skeleton-card"

export default function PerformanceAnalytics() {
  const [timeframe, setTimeframe] = useState("6m")
  const [metrics, setMetrics] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchMetrics()
  }, [])

  const fetchMetrics = async () => {
    try {
      const processesResponse = await fetch("/api/processes")
      if (!processesResponse.ok) {
        throw new Error("Failed to fetch processes")
      }
      const processesData = await processesResponse.json()
      const processes = processesData.processes || []
      
      if (processes.length === 0) {
        setMetrics([])
        setLoading(false)
        return
      }

      const firstProcessId = processes[0].id
      const metricsResponse = await fetch(`/api/analytics/performance?processId=${firstProcessId}`)
      
      if (!metricsResponse.ok) {
        throw new Error("Failed to fetch performance metrics")
      }
      
      const metricsData = await metricsResponse.json()
      setMetrics(metricsData.metrics || [])
    } catch (error) {
      console.error("Failed to fetch performance metrics:", error)
      setMetrics([])
    } finally {
      setLoading(false)
    }
  }

  if (loading) {
    return (
      <div className="space-y-4">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
        <Card className="border-brand/20 p-6">
          <SkeletonChart />
        </Card>
      </div>
    )
  }

  if (metrics.length === 0) {
    return (
      <Card className="border-[#11c1d6]/20">
        <CardContent className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">No performance metrics available. Upload event logs to see analytics.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <Card className="border-[#11c1d6]/20">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <div>
            <CardTitle>Performance Trends</CardTitle>
            <CardDescription>Key performance indicators over time.</CardDescription>
          </div>
          <div className="flex items-center gap-2">
            <Select defaultValue="6m" onValueChange={setTimeframe}>
              <SelectTrigger className="w-[120px]">
                <SelectValue placeholder="Select timeframe" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="1m">Last Month</SelectItem>
                <SelectItem value="3m">Last 3 Months</SelectItem>
                <SelectItem value="6m">Last 6 Months</SelectItem>
                <SelectItem value="1y">Last Year</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="cycle-time">
            <TabsList className="bg-[#11c1d6]/10">
              <TabsTrigger
                value="cycle-time"
                className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
              >
                Cycle Time
              </TabsTrigger>
              <TabsTrigger
                value="throughput"
                className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
              >
                Throughput
              </TabsTrigger>
              <TabsTrigger value="rework" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
                Rework Rate
              </TabsTrigger>
            </TabsList>
            <TabsContent value="cycle-time" className="pt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg_cycle_time" stroke="#11c1d6" name="Cycle Time (days)" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="throughput" className="pt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis label={{ value: "Cases", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg_throughput" stroke="#11c1d6" name="Throughput (cases/month)" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
            <TabsContent value="rework" className="pt-4">
              <ResponsiveContainer width="100%" height={350}>
                <LineChart data={metrics} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="period" />
                  <YAxis label={{ value: "Percentage", angle: -90, position: "insideLeft" }} />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="avg_rework_rate" stroke="#11c1d6" name="Rework Rate (%)" />
                </LineChart>
              </ResponsiveContainer>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>
    </div>
  )
}
