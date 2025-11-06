"use client"

import { useState } from "react"
import { Line, LineChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const performanceData = [
  { month: "Jan", cycleTime: 3.2, throughput: 420, rework: 15 },
  { month: "Feb", cycleTime: 3.1, throughput: 380, rework: 18 },
  { month: "Mar", cycleTime: 2.9, throughput: 450, rework: 12 },
  { month: "Apr", cycleTime: 2.7, throughput: 480, rework: 10 },
  { month: "May", cycleTime: 2.5, throughput: 510, rework: 8 },
  { month: "Jun", cycleTime: 2.4, throughput: 525, rework: 7 },
]

export default function PerformanceAnalytics() {
  const [timeframe, setTimeframe] = useState("6m")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3 border-[#11c1d6]/20">
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
                  <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: "Days", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="cycleTime" stroke="#11c1d6" name="Cycle Time (days)" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-[#11c1d6]/20 p-4">
                  <div>
                    <div className="text-sm font-medium">Average Cycle Time</div>
                    <div className="text-2xl font-bold">2.8 days</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-emerald-500">↓ 25%</span> from previous period
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Benchmark</div>
                    <div className="text-2xl font-bold">3.5 days</div>
                    <div className="text-xs text-muted-foreground">Industry average</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Target</div>
                    <div className="text-2xl font-bold">2.0 days</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-amber-500">0.8 days</span> to target
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="throughput" className="pt-4">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: "Cases", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="throughput" stroke="#11c1d6" name="Throughput (cases/month)" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-[#11c1d6]/20 p-4">
                  <div>
                    <div className="text-sm font-medium">Average Throughput</div>
                    <div className="text-2xl font-bold">460 cases</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-emerald-500">↑ 18%</span> from previous period
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Benchmark</div>
                    <div className="text-2xl font-bold">400 cases</div>
                    <div className="text-xs text-muted-foreground">Industry average</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Target</div>
                    <div className="text-2xl font-bold">500 cases</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-amber-500">40 cases</span> to target
                    </div>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="rework" className="pt-4">
                <ResponsiveContainer width="100%" height={350}>
                  <LineChart data={performanceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" />
                    <YAxis label={{ value: "Percentage", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line type="monotone" dataKey="rework" stroke="#11c1d6" name="Rework Rate (%)" />
                  </LineChart>
                </ResponsiveContainer>
                <div className="mt-4 flex items-center justify-between rounded-lg border border-[#11c1d6]/20 p-4">
                  <div>
                    <div className="text-sm font-medium">Average Rework Rate</div>
                    <div className="text-2xl font-bold">11.7%</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-emerald-500">↓ 35%</span> from previous period
                    </div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Benchmark</div>
                    <div className="text-2xl font-bold">15%</div>
                    <div className="text-xs text-muted-foreground">Industry average</div>
                  </div>
                  <div>
                    <div className="text-sm font-medium">Target</div>
                    <div className="text-2xl font-bold">5%</div>
                    <div className="text-xs text-muted-foreground">
                      <span className="text-amber-500">6.7%</span> to target
                    </div>
                  </div>
                </div>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Process Efficiency</CardTitle>
            <CardDescription>Efficiency metrics for key process steps.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Verify Order</div>
                  <div className="text-sm font-medium">92%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[92%] rounded-full bg-emerald-500"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Process Payment</div>
                  <div className="text-sm font-medium">85%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[85%] rounded-full bg-emerald-500"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Fulfill Order</div>
                  <div className="text-sm font-medium">68%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[68%] rounded-full bg-amber-500"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Request Additional Info</div>
                  <div className="text-sm font-medium">45%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[45%] rounded-full bg-red-500"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Waiting Time</CardTitle>
            <CardDescription>Average waiting time between process steps.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <div className="text-sm font-medium">Order to Verification</div>
                <div className="mt-1 text-2xl font-bold">1.2 hours</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="text-emerald-500">↓ 15%</span> from previous period
                </div>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5">
                <div className="text-sm font-medium">Verification to Payment</div>
                <div className="mt-1 text-2xl font-bold">5.5 hours</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="text-red-500">↑ 10%</span> from previous period
                </div>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5">
                <div className="text-sm font-medium">Payment to Fulfillment</div>
                <div className="mt-1 text-2xl font-bold">18.5 hours</div>
                <div className="mt-1 text-xs text-muted-foreground">
                  <span className="text-red-500">↑ 25%</span> from previous period
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Cost Analysis</CardTitle>
            <CardDescription>Cost breakdown by process step.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Verify Order</div>
                  <div className="text-sm font-medium">$4.50</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[15%] rounded-full bg-[#11c1d6]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Process Payment</div>
                  <div className="text-sm font-medium">$2.75</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[9%] rounded-full bg-[#11c1d6]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Fulfill Order</div>
                  <div className="text-sm font-medium">$18.25</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[61%] rounded-full bg-[#11c1d6]"></div>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Request Additional Info</div>
                  <div className="text-sm font-medium">$4.25</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[14%] rounded-full bg-[#11c1d6]"></div>
                </div>
              </div>
              <div className="pt-2 border-t">
                <div className="flex items-center justify-between">
                  <div className="font-medium">Total Cost Per Case</div>
                  <div className="font-medium">$29.75</div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
