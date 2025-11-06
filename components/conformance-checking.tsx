"use client"

import { useState } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { AlertTriangle, CheckCircle, Info } from "lucide-react"

const conformanceData = [
  {
    name: "Skip Verification",
    frequency: 125,
    impact: "High",
    description: "Orders processed without verification step",
  },
  {
    name: "Multiple Payment Attempts",
    frequency: 87,
    impact: "Medium",
    description: "More than 3 payment attempts before success",
  },
  {
    name: "Delayed Fulfillment",
    frequency: 64,
    impact: "High",
    description: "Fulfillment started more than 2 days after payment",
  },
  {
    name: "Missing Customer Info",
    frequency: 42,
    impact: "Medium",
    description: "Orders processed with incomplete customer information",
  },
  {
    name: "Manual Price Override",
    frequency: 38,
    impact: "Low",
    description: "Price manually adjusted during order processing",
  },
]

const complianceData = [
  { name: "Verification", value: 92 },
  { name: "Documentation", value: 85 },
  { name: "Approval", value: 78 },
  { name: "Notification", value: 95 },
  { name: "Audit Trail", value: 88 },
]

export default function ConformanceChecking() {
  const [selectedTab, setSelectedTab] = useState("deviations")

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="md:col-span-2 border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Conformance Analysis</CardTitle>
            <CardDescription>Analysis of process deviations and compliance issues.</CardDescription>
          </CardHeader>
          <CardContent>
            <Tabs defaultValue="deviations" onValueChange={setSelectedTab}>
              <TabsList className="bg-[#11c1d6]/10">
                <TabsTrigger
                  value="deviations"
                  className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                >
                  Process Deviations
                </TabsTrigger>
                <TabsTrigger
                  value="compliance"
                  className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                >
                  Compliance Metrics
                </TabsTrigger>
              </TabsList>
              <TabsContent value="deviations" className="pt-4">
                <div className="rounded-md border border-[#11c1d6]/20">
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
                        {conformanceData.map((item, index) => (
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
                                  item.impact === "Medium" ? "bg-[#11c1d6] text-white hover:bg-[#11c1d6]/90" : ""
                                }
                              >
                                {item.impact}
                              </Badge>
                            </td>
                            <td className="p-4 align-middle">{item.description}</td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </TabsContent>
              <TabsContent value="compliance" className="pt-4">
                <ResponsiveContainer width="100%" height={350}>
                  <BarChart data={complianceData} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="name" />
                    <YAxis label={{ value: "Compliance Rate (%)", angle: -90, position: "insideLeft" }} />
                    <Tooltip />
                    <Legend />
                    <Bar dataKey="value" fill="#11c1d6" name="Compliance Rate (%)" />
                  </BarChart>
                </ResponsiveContainer>
              </TabsContent>
            </Tabs>
          </CardContent>
        </Card>
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Conformance Metrics</CardTitle>
            <CardDescription>Key metrics for process conformance.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <div className="flex items-center gap-2">
                  <CheckCircle className="h-5 w-5 text-emerald-500" />
                  <div className="font-medium">Fitness</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-2xl font-bold">0.85</div>
                  <Badge variant="outline">Good</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Measures how well the process model can replay the observed behavior.
                </p>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <div className="flex items-center gap-2">
                  <Info className="h-5 w-5 text-blue-500" />
                  <div className="font-medium">Precision</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-2xl font-bold">0.78</div>
                  <Badge variant="outline">Average</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Measures how much behavior is allowed by the model but never observed.
                </p>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <div className="flex items-center gap-2">
                  <AlertTriangle className="h-5 w-5 text-amber-500" />
                  <div className="font-medium">Generalization</div>
                </div>
                <div className="mt-2 flex items-center justify-between">
                  <div className="text-2xl font-bold">0.72</div>
                  <Badge variant="outline">Average</Badge>
                </div>
                <p className="text-xs text-muted-foreground mt-1">
                  Measures how well the model generalizes the observed behavior.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedTab === "deviations" && (
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Root Cause Analysis</CardTitle>
            <CardDescription>Analysis of factors contributing to process deviations.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <h3 className="font-medium mb-2">Skip Verification</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>High Order Volume</span>
                    <span>45%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[45%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Returning Customer</span>
                    <span>30%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[30%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Staff Shortage</span>
                    <span>25%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[25%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <h3 className="font-medium mb-2">Multiple Payment Attempts</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Payment Gateway Issues</span>
                    <span>55%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[55%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Insufficient Funds</span>
                    <span>35%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[35%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Card Verification Failure</span>
                    <span>10%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[10%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4">
                <h3 className="font-medium mb-2">Delayed Fulfillment</h3>
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Inventory Shortage</span>
                    <span>40%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[40%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Warehouse Capacity</span>
                    <span>35%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[35%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Staffing Issues</span>
                    <span>25%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[25%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {selectedTab === "compliance" && (
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Compliance Requirements</CardTitle>
            <CardDescription>Key compliance requirements and their status.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Customer Verification</h4>
                  <p className="text-sm text-muted-foreground">
                    All customer identities must be verified before processing orders over $500.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      Compliant
                    </Badge>
                    <span className="text-xs text-muted-foreground">98% compliance rate</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                <AlertTriangle className="h-5 w-5 text-amber-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Payment Documentation</h4>
                  <p className="text-sm text-muted-foreground">
                    All payment transactions must be documented with receipt confirmation.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-amber-50 text-amber-700 hover:bg-amber-50">
                      Partial Compliance
                    </Badge>
                    <span className="text-xs text-muted-foreground">85% compliance rate</span>
                  </div>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                <CheckCircle className="h-5 w-5 text-emerald-500 mt-0.5" />
                <div>
                  <h4 className="font-medium">Order Approval</h4>
                  <p className="text-sm text-muted-foreground">
                    Orders over $1,000 require manager approval before processing.
                  </p>
                  <div className="mt-2 flex items-center gap-2">
                    <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                      Compliant
                    </Badge>
                    <span className="text-xs text-muted-foreground">100% compliance rate</span>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
