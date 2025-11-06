"use client"

import { useState } from "react"
import {
  Line,
  LineChart,
  CartesianGrid,
  Legend,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Area,
  AreaChart,
} from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { AlertTriangle, TrendingUp, X, Lightbulb } from "lucide-react"

const forecastData = [
  { month: "Jul", actual: 2.4, forecast: null, lower: null, upper: null },
  { month: "Aug", actual: 2.3, forecast: null, lower: null, upper: null },
  { month: "Sep", actual: 2.2, forecast: null, lower: null, upper: null },
  { month: "Oct", actual: 2.1, forecast: null, lower: null, upper: null },
  { month: "Nov", actual: 2.0, forecast: null, lower: null, upper: null },
  { month: "Dec", actual: 1.9, forecast: null, lower: null, upper: null },
  { month: "Jan", actual: null, forecast: 1.8, lower: 1.7, upper: 1.9 },
  { month: "Feb", actual: null, forecast: 1.7, lower: 1.5, upper: 1.9 },
  { month: "Mar", actual: null, forecast: 1.6, lower: 1.4, upper: 1.8 },
  { month: "Apr", actual: null, forecast: 1.5, lower: 1.2, upper: 1.8 },
  { month: "May", actual: null, forecast: 1.4, lower: 1.1, upper: 1.7 },
  { month: "Jun", actual: null, forecast: 1.3, lower: 0.9, upper: 1.7 },
]

const anomalyData = [
  { date: "2023-12-01", value: 2.1, isAnomaly: false },
  { date: "2023-12-02", value: 2.0, isAnomaly: false },
  { date: "2023-12-03", value: 2.2, isAnomaly: false },
  { date: "2023-12-04", value: 1.9, isAnomaly: false },
  { date: "2023-12-05", value: 3.8, isAnomaly: true },
  { date: "2023-12-06", value: 2.3, isAnomaly: false },
  { date: "2023-12-07", value: 2.1, isAnomaly: false },
  { date: "2023-12-08", value: 2.0, isAnomaly: false },
  { date: "2023-12-09", value: 1.8, isAnomaly: false },
  { date: "2023-12-10", value: 1.9, isAnomaly: false },
  { date: "2023-12-11", value: 0.8, isAnomaly: true },
  { date: "2023-12-12", value: 1.7, isAnomaly: false },
  { date: "2023-12-13", value: 1.8, isAnomaly: false },
  { date: "2023-12-14", value: 1.9, isAnomaly: false },
]

const scenarioData = [
  { month: "Jan", baseline: 1.8, optimistic: 1.6, pessimistic: 2.0 },
  { month: "Feb", baseline: 1.7, optimistic: 1.4, pessimistic: 2.0 },
  { month: "Mar", baseline: 1.6, optimistic: 1.2, pessimistic: 2.1 },
  { month: "Apr", baseline: 1.5, optimistic: 1.0, pessimistic: 2.2 },
  { month: "May", baseline: 1.4, optimistic: 0.9, pessimistic: 2.3 },
  { month: "Jun", baseline: 1.3, optimistic: 0.8, pessimistic: 2.5 },
]

export default function PredictiveAnalytics() {
  const [metric, setMetric] = useState("cycle-time")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-3 border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <div>
              <CardTitle>Predictive Forecasting</CardTitle>
              <CardDescription>AI-powered forecasts of key process metrics.</CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Select defaultValue="cycle-time" onValueChange={setMetric}>
                <SelectTrigger className="w-[180px]">
                  <SelectValue placeholder="Select metric" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="cycle-time">Cycle Time</SelectItem>
                  <SelectItem value="throughput">Throughput</SelectItem>
                  <SelectItem value="rework">Rework Rate</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" size="sm">
                Export
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={350}>
              <AreaChart data={forecastData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis label={{ value: "Cycle Time (days)", angle: -90, position: "insideLeft" }} />
                <Tooltip />
                <Legend />
                <Area type="monotone" dataKey="actual" stroke="#11c1d6" fill="#11c1d620" name="Historical" />
                <Area type="monotone" dataKey="forecast" stroke="#00aaff" fill="#00aaff20" name="Forecast" />
                <Area type="monotone" dataKey="upper" stroke="transparent" fill="#00aaff10" name="Upper Bound" />
                <Area type="monotone" dataKey="lower" stroke="transparent" fill="#00aaff10" name="Lower Bound" />
              </AreaChart>
            </ResponsiveContainer>
            <div className="mt-4 flex items-center justify-between rounded-lg border border-[#11c1d6]/20 p-4">
              <div>
                <div className="text-sm font-medium">Current</div>
                <div className="text-2xl font-bold">1.9 days</div>
                <div className="text-xs text-muted-foreground">Last month</div>
              </div>
              <div>
                <div className="text-sm font-medium">Forecast (6 months)</div>
                <div className="text-2xl font-bold">1.3 days</div>
                <div className="text-xs text-muted-foreground">
                  <span className="text-emerald-500">↓ 31.6%</span> improvement
                </div>
              </div>
              <div>
                <div className="text-sm font-medium">Confidence Interval</div>
                <div className="text-2xl font-bold">0.9 - 1.7</div>
                <div className="text-xs text-muted-foreground">95% confidence</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="anomalies">
        <TabsList className="bg-[#11c1d6]/10">
          <TabsTrigger value="anomalies" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Anomaly Detection
          </TabsTrigger>
          <TabsTrigger value="scenarios" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Scenario Analysis
          </TabsTrigger>
          <TabsTrigger value="insights" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Predictive Insights
          </TabsTrigger>
        </TabsList>
        <TabsContent value="anomalies" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="md:col-span-2 border-[#11c1d6]/20">
              <CardHeader>
                <CardTitle>Anomaly Detection</CardTitle>
                <CardDescription>AI-powered detection of unusual process behavior.</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <LineChart data={anomalyData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="date" />
                    <YAxis label={{ value: "Cycle Time (days)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="value"
                      stroke="#11c1d6"
                      name="Cycle Time"
                      dot={(props) => {
                        const { cx, cy, payload } = props
                        if (payload.isAnomaly) {
                          return <circle cx={cx} cy={cy} r={6} fill="red" stroke="none" />
                        }
                        return <circle cx={cx} cy={cy} r={3} fill="#11c1d6" stroke="none" />
                      }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
            <Card className="border-[#11c1d6]/20">
              <CardHeader>
                <CardTitle>Detected Anomalies</CardTitle>
                <CardDescription>Unusual patterns detected in process data.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-red-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-red-500" />
                      <div className="font-medium">Spike Detected</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">December 5, 2023</div>
                      <div className="text-sm text-muted-foreground">
                        Cycle time spiked to 3.8 days (90% above normal)
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="font-medium">Potential causes:</span>
                        <ul className="mt-1 list-disc list-inside">
                          <li>System outage during payment processing</li>
                          <li>Temporary staff shortage</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-amber-50">
                    <div className="flex items-center gap-2">
                      <AlertTriangle className="h-5 w-5 text-amber-500" />
                      <div className="font-medium">Dip Detected</div>
                    </div>
                    <div className="mt-2">
                      <div className="text-sm font-medium">December 11, 2023</div>
                      <div className="text-sm text-muted-foreground">
                        Cycle time dropped to 0.8 days (58% below normal)
                      </div>
                      <div className="mt-2 text-xs">
                        <span className="font-medium">Potential causes:</span>
                        <ul className="mt-1 list-disc list-inside">
                          <li>Data recording error</li>
                          <li>Process steps skipped</li>
                        </ul>
                      </div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="scenarios" className="pt-4">
          <Card className="border-[#11c1d6]/20">
            <CardHeader>
              <CardTitle>Scenario Analysis</CardTitle>
              <CardDescription>
                Explore different future scenarios and their impact on process performance.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="md:col-span-2">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={scenarioData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis label={{ value: "Cycle Time (days)", angle: -90, position: "insideLeft" }} />
                      <Tooltip />
                      <Legend />
                      <Line type="monotone" dataKey="baseline" stroke="#11c1d6" name="Baseline Forecast" />
                      <Line type="monotone" dataKey="optimistic" stroke="#10b981" name="Optimistic Scenario" />
                      <Line type="monotone" dataKey="pessimistic" stroke="#f59e0b" name="Pessimistic Scenario" />
                    </LineChart>
                  </ResponsiveContainer>
                </div>
                <div>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-[#11c1d6]"></div>
                        <div className="font-medium">Baseline Scenario</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Current improvement trajectory continues with existing initiatives.
                      </p>
                      <div className="mt-2 text-sm font-medium">1.3 days by June</div>
                    </div>
                    <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-emerald-50">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-emerald-500"></div>
                        <div className="font-medium">Optimistic Scenario</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        New automation initiatives are implemented successfully.
                      </p>
                      <div className="mt-2 text-sm font-medium">0.8 days by June</div>
                    </div>
                    <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-amber-50">
                      <div className="flex items-center gap-2">
                        <div className="h-3 w-3 rounded-full bg-amber-500"></div>
                        <div className="font-medium">Pessimistic Scenario</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-2">
                        Resource constraints and increased order volume.
                      </p>
                      <div className="mt-2 text-sm font-medium">2.5 days by June</div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="insights" className="pt-4">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card className="border-[#11c1d6]/20">
              <CardHeader>
                <CardTitle>Predictive Insights</CardTitle>
                <CardDescription>AI-generated insights based on predictive analysis.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                    <div className="rounded-full bg-[#11c1d6]/10 p-2">
                      <TrendingUp className="h-4 w-4 text-[#11c1d6]" />
                    </div>
                    <div>
                      <h4 className="font-medium">Cycle Time Improvement</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Based on current trends, cycle time is predicted to improve by 31.6% over the next 6 months,
                        primarily due to process optimizations in the verification and payment steps.
                      </p>
                      <Button variant="link" className="h-auto p-0 text-sm text-[#11c1d6]">
                        View Details
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                    <div className="rounded-full bg-[#11c1d6]/10 p-2">
                      <AlertTriangle className="h-4 w-4 text-amber-500" />
                    </div>
                    <div>
                      <h4 className="font-medium">Seasonal Risk Alert</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Historical data suggests a 40% increase in order volume during Q4, which may impact cycle times
                        if additional resources are not allocated. Recommend increasing capacity by 25%.
                      </p>
                      <Button variant="link" className="h-auto p-0 text-sm text-[#11c1d6]">
                        View Details
                      </Button>
                    </div>
                  </div>
                  <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                    <div className="rounded-full bg-[#11c1d6]/10 p-2">
                      <Lightbulb className="h-4 w-4 text-[#11c1d6]" />
                    </div>
                    <div>
                      <h4 className="font-medium">Process Optimization Opportunity</h4>
                      <p className="text-sm text-muted-foreground mt-1">
                        Predictive analysis indicates that implementing parallel processing for verification and payment
                        steps could reduce cycle time by an additional 15% beyond current forecasts.
                      </p>
                      <Button variant="link" className="h-auto p-0 text-sm text-[#11c1d6]">
                        View Details
                      </Button>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#11c1d6]/20">
              <CardHeader>
                <CardTitle>Predictive KPIs</CardTitle>
                <CardDescription>Forecasted key performance indicators.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Cycle Time</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">1.9 days</span>
                        <span className="text-xs text-emerald-500">→ 1.3 days</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[68%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Throughput</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">525 cases/mo</span>
                        <span className="text-xs text-emerald-500">→ 610 cases/mo</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[86%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Rework Rate</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">7%</span>
                        <span className="text-xs text-emerald-500">→ 4%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[57%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Automation Rate</div>
                      <div className="flex items-center gap-2">
                        <span className="text-sm">45%</span>
                        <span className="text-xs text-emerald-500">→ 68%</span>
                      </div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[66%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                  <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5 mt-6">
                    <div className="flex items-center gap-2">
                      <X className="h-5 w-5 text-[#11c1d6]" />
                      <div className="font-medium">AI Recommendation</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-2">
                      Focus on automation initiatives to achieve the most significant improvements across all KPIs.
                      Prioritize payment processing and verification steps for maximum impact.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
      </Tabs>
    </div>
  )
}
