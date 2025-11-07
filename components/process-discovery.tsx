"use client"

import { useState, useEffect } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Slider } from "@/components/ui/slider"
import SimpleFlowDiagram from "@/components/simple-flow-diagram"
import { Loader2 } from "lucide-react"

const processNodes = [
  { id: "1", label: "Order Received", x: 250, y: 0, type: "start" as const },
  { id: "2", label: "Verify Order", x: 250, y: 100, type: "activity" as const },
  { id: "3", label: "Order Valid?", x: 250, y: 200, type: "gateway" as const },
  { id: "4", label: "Request Info", x: 100, y: 300, type: "bottleneck" as const },
  { id: "5", label: "Process Payment", x: 400, y: 300, type: "activity" as const },
  { id: "6", label: "Payment OK?", x: 400, y: 400, type: "gateway" as const },
  { id: "7", label: "Retry Payment", x: 250, y: 500, type: "activity" as const },
  { id: "8", label: "Fulfill Order", x: 550, y: 500, type: "activity" as const },
  { id: "9", label: "Order Complete", x: 550, y: 600, type: "end" as const },
]

const processEdges = [
  { from: "1", to: "2" },
  { from: "2", to: "3" },
  { from: "3", to: "4", label: "No (32%)" },
  { from: "3", to: "5", label: "Yes (68%)" },
  { from: "4", to: "2" },
  { from: "5", to: "6" },
  { from: "6", to: "7", label: "No (15%)" },
  { from: "6", to: "8", label: "Yes (85%)" },
  { from: "7", to: "6" },
  { from: "8", to: "9" },
]

export default function ProcessDiscovery() {
  const [caseFrequency, setCaseFrequency] = useState(80)
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
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#11c1d6]" />
      </div>
    )
  }

  if (processes.length === 0) {
    return (
      <Card className="border-[#11c1d6]/20">
        <CardContent className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">No processes found. Upload event logs to get started.</p>
        </CardContent>
      </Card>
    )
  }

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Discovered Process Model</CardTitle>
            <CardDescription>Automatically discovered process model based on event logs.</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="flex items-center justify-between p-4 border-b">
              <div className="flex items-center gap-4">
                <Select value={selectedProcess || ""} onValueChange={setSelectedProcess}>
                  <SelectTrigger className="w-[200px]">
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
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium">Case Frequency:</span>
                  <Slider
                    value={[caseFrequency]}
                    onValueChange={(value) => setCaseFrequency(value[0])}
                    max={100}
                    step={1}
                    className="w-[100px]"
                  />
                  <span className="text-sm">{caseFrequency}%</span>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Export
                </Button>
                <Button variant="outline" size="sm">
                  Simulate
                </Button>
              </div>
            </div>
            <div className="p-4">
              <SimpleFlowDiagram nodes={processNodes} edges={processEdges} />
            </div>
            <div className="p-4 border-t flex flex-wrap gap-4">
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-slate-100 border border-[#11c1d6]"></div>
                <span className="text-sm">Standard Activity</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-amber-100 border border-amber-500"></div>
                <span className="text-sm">Bottleneck</span>
              </div>
              <div className="flex items-center gap-2">
                <div className="w-4 h-4 rounded-sm bg-cyan-50 border border-[#11c1d6]"></div>
                <span className="text-sm">Decision Point</span>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Process Variants</CardTitle>
            <CardDescription>Discovered process variants and their frequencies.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Happy Path</div>
                  <div className="text-sm font-medium">68%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[68%] rounded-full bg-[#11c1d6]"></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Order Received → Verify Order → Process Payment → Fulfill Order → Order Completed
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Variant 2</div>
                  <div className="text-sm font-medium">15%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[15%] rounded-full bg-[#11c1d6]"></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Order Received → Verify Order → Process Payment → Retry Payment → Process Payment → Fulfill Order →
                  Order Completed
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Variant 3</div>
                  <div className="text-sm font-medium">12%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[12%] rounded-full bg-[#11c1d6]"></div>
                </div>
                <div className="text-xs text-muted-foreground">
                  Order Received → Verify Order → Request Additional Info → Verify Order → Process Payment → Fulfill
                  Order → Order Completed
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <div className="text-sm font-medium">Other Variants</div>
                  <div className="text-sm font-medium">5%</div>
                </div>
                <div className="h-2 w-full rounded-full bg-muted">
                  <div className="h-full w-[5%] rounded-full bg-[#11c1d6]"></div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
      <Tabs defaultValue="activity">
        <TabsList className="bg-[#11c1d6]/10">
          <TabsTrigger value="activity" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Activity Analysis
          </TabsTrigger>
          <TabsTrigger value="case" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Case Analysis
          </TabsTrigger>
          <TabsTrigger value="resource" className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white">
            Resource Analysis
          </TabsTrigger>
        </TabsList>
        <TabsContent value="activity" className="space-y-4 pt-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <Card className="border-[#11c1d6]/20">
              <CardHeader>
                <CardTitle>Activity Frequency</CardTitle>
                <CardDescription>Number of times each activity occurs.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Verify Order</div>
                      <div className="text-sm font-medium">1,245</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[95%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Process Payment</div>
                      <div className="text-sm font-medium">1,180</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[90%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Fulfill Order</div>
                      <div className="text-sm font-medium">1,000</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[76%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Request Additional Info</div>
                      <div className="text-sm font-medium">320</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[24%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Retry Payment</div>
                      <div className="text-sm font-medium">180</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[14%] rounded-full bg-[#11c1d6]"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#11c1d6]/20">
              <CardHeader>
                <CardTitle>Activity Duration</CardTitle>
                <CardDescription>Average time spent on each activity.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Fulfill Order</div>
                      <div className="text-sm font-medium">1.2 days</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[90%] rounded-full bg-amber-500"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Process Payment</div>
                      <div className="text-sm font-medium">45 min</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[30%] rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Verify Order</div>
                      <div className="text-sm font-medium">35 min</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[25%] rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Request Additional Info</div>
                      <div className="text-sm font-medium">4.5 hours</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[45%] rounded-full bg-amber-500"></div>
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm font-medium">Retry Payment</div>
                      <div className="text-sm font-medium">25 min</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[20%] rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
            <Card className="border-[#11c1d6]/20">
              <CardHeader>
                <CardTitle>Activity Bottlenecks</CardTitle>
                <CardDescription>Activities causing the most delays.</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Request Additional Info</div>
                      <div className="text-amber-600 text-sm font-medium">High Impact</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Causes 2.5 day average delay in 32% of cases.</p>
                  </div>
                  <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Fulfill Order</div>
                      <div className="text-amber-600 text-sm font-medium">High Impact</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">Takes 45% longer than industry benchmark.</p>
                  </div>
                  <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                    <div className="flex items-center justify-between">
                      <div className="font-medium">Retry Payment</div>
                      <div className="text-amber-600 text-sm font-medium">Medium Impact</div>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Occurs in 15% of cases, adding 1.2 days to process.
                    </p>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </TabsContent>
        <TabsContent value="case" className="pt-4">
          <Card className="border-[#11c1d6]/20">
            <CardHeader>
              <CardTitle>Case Analysis</CardTitle>
              <CardDescription>Analysis of process instances and their characteristics.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Case Duration Distribution</h3>
                  <div className="space-y-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">Less than 1 day</div>
                      <div className="text-sm">15%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[15%] rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">1-2 days</div>
                      <div className="text-sm">42%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[42%] rounded-full bg-emerald-500"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">2-5 days</div>
                      <div className="text-sm">28%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[28%] rounded-full bg-amber-500"></div>
                    </div>
                  </div>
                  <div className="space-y-2 mt-2">
                    <div className="flex items-center justify-between">
                      <div className="text-sm">More than 5 days</div>
                      <div className="text-sm">15%</div>
                    </div>
                    <div className="h-2 w-full rounded-full bg-muted">
                      <div className="h-full w-[15%] rounded-full bg-red-500"></div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-4">Case Attributes</h3>
                  <div className="space-y-4">
                    <div>
                      <div className="text-sm font-medium mb-2">Order Value</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-[#11c1d6]/20 p-3 text-center">
                          <div className="text-2xl font-bold">$245</div>
                          <div className="text-xs text-muted-foreground">Average</div>
                        </div>
                        <div className="rounded-lg border border-[#11c1d6]/20 p-3 text-center">
                          <div className="text-2xl font-bold">$35</div>
                          <div className="text-xs text-muted-foreground">Minimum</div>
                        </div>
                        <div className="rounded-lg border border-[#11c1d6]/20 p-3 text-center">
                          <div className="text-2xl font-bold">$1.2K</div>
                          <div className="text-xs text-muted-foreground">Maximum</div>
                        </div>
                      </div>
                    </div>
                    <div>
                      <div className="text-sm font-medium mb-2">Customer Type</div>
                      <div className="grid grid-cols-3 gap-2">
                        <div className="rounded-lg border border-[#11c1d6]/20 p-3 text-center">
                          <div className="text-2xl font-bold">65%</div>
                          <div className="text-xs text-muted-foreground">Returning</div>
                        </div>
                        <div className="rounded-lg border border-[#11c1d6]/20 p-3 text-center">
                          <div className="text-2xl font-bold">35%</div>
                          <div className="text-xs text-muted-foreground">New</div>
                        </div>
                        <div className="rounded-lg border border-[#11c1d6]/20 p-3 text-center">
                          <div className="text-2xl font-bold">12%</div>
                          <div className="text-xs text-muted-foreground">VIP</div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="resource" className="pt-4">
          <Card className="border-[#11c1d6]/20">
            <CardHeader>
              <CardTitle>Resource Analysis</CardTitle>
              <CardDescription>Analysis of resources involved in process execution.</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <h3 className="text-sm font-medium mb-4">Resource Utilization</h3>
                  <div className="space-y-3">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Sales Team</div>
                        <div className="text-sm">85%</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[85%] rounded-full bg-red-500"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Finance Department</div>
                        <div className="text-sm">72%</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[72%] rounded-full bg-amber-500"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Warehouse Staff</div>
                        <div className="text-sm">65%</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[65%] rounded-full bg-amber-500"></div>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <div className="text-sm">Customer Support</div>
                        <div className="text-sm">45%</div>
                      </div>
                      <div className="h-2 w-full rounded-full bg-muted">
                        <div className="h-full w-[45%] rounded-full bg-emerald-500"></div>
                      </div>
                    </div>
                  </div>
                </div>
                <div>
                  <h3 className="text-sm font-medium mb-4">Resource Performance</h3>
                  <div className="space-y-4">
                    <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Sales Team</div>
                        <div className="text-emerald-600 text-sm font-medium">High Performer</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">Processes orders 15% faster than average.</p>
                    </div>
                    <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Finance Department</div>
                        <div className="text-amber-600 text-sm font-medium">Bottleneck</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Payment processing takes 30% longer than benchmark.
                      </p>
                    </div>
                    <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                      <div className="flex items-center justify-between">
                        <div className="font-medium">Warehouse Staff</div>
                        <div className="text-emerald-600 text-sm font-medium">Improving</div>
                      </div>
                      <p className="text-sm text-muted-foreground mt-1">
                        Fulfillment time improved by 12% in last quarter.
                      </p>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  )
}
