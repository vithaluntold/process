"use client"

import { useState, useEffect } from "react"
import { Bar, BarChart, CartesianGrid, Legend, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts"

import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { BotIcon as Robot, Zap, DollarSign, Clock, BarChart2, Loader2 } from "lucide-react"

export default function AutomationOpportunities() {
  const [selectedMetric, setSelectedMetric] = useState("automationPotential")
  const [opportunities, setOpportunities] = useState<any[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchOpportunities()
  }, [])

  const fetchOpportunities = async () => {
    try {
      const processesResponse = await fetch("/api/processes")
      if (!processesResponse.ok) {
        throw new Error("Failed to fetch processes")
      }
      const processesData = await processesResponse.json()
      const processes = processesData.processes || []
      
      if (processes.length === 0) {
        setOpportunities([])
        setLoading(false)
        return
      }

      const firstProcessId = processes[0].id
      const opportunitiesResponse = await fetch(`/api/analytics/automation?processId=${firstProcessId}`)
      
      if (!opportunitiesResponse.ok) {
        throw new Error("Failed to fetch automation opportunities")
      }
      
      const opportunitiesData = await opportunitiesResponse.json()
      setOpportunities(opportunitiesData.opportunities || [])
    } catch (error) {
      console.error("Failed to fetch automation opportunities:", error)
      setOpportunities([])
    } finally {
      setLoading(false)
    }
  }

  const getChartData = () => {
    const metricMap: Record<string, string> = {
      automationPotential: 'automation_potential',
      savingsEstimate: 'savings_estimate',
      frequency: 'frequency',
      duration: 'duration',
    }
    const backendKey = metricMap[selectedMetric] || selectedMetric
    
    return opportunities.map((item: any) => ({
      name: item.name || item.activity_name,
      value: item[backendKey] || 0,
    }))
  }

  const getChartLabel = () => {
    if (selectedMetric === "frequency") {
      return "Task Frequency (per month)"
    } else if (selectedMetric === "duration") {
      return "Avg. Duration (minutes)"
    } else if (selectedMetric === "automationPotential") {
      return "Automation Potential (%)"
    } else {
      return "Est. Annual Savings ($)"
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="h-8 w-8 animate-spin text-[#11c1d6]" />
      </div>
    )
  }

  if (opportunities.length === 0) {
    return (
      <Card className="border-[#11c1d6]/20">
        <CardContent className="flex flex-col items-center justify-center h-64">
          <p className="text-muted-foreground mb-4">No automation opportunities available. Upload event logs to see automation analysis.</p>
        </CardContent>
      </Card>
    )
  }

  const totalTasks = opportunities.reduce((sum, opp) => sum + (opp.frequency || 0), 0)
  const avgAutomationPotential = opportunities.length > 0
    ? Math.round(opportunities.reduce((sum, opp) => sum + (opp.automation_potential || 0), 0) / opportunities.length)
    : 0
  const totalTimeSavings = opportunities.reduce((sum, opp) => sum + ((opp.duration || 0) * (opp.frequency || 0)), 0) / 60
  const totalCostSavings = opportunities.reduce((sum, opp) => sum + (opp.savings_estimate || 0), 0)

  return (
    <div className="space-y-4">
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Tasks</CardTitle>
            <BarChart2 className="h-4 w-4 text-[#11c1d6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{totalTasks.toLocaleString()}</div>
            <p className="text-xs text-muted-foreground">tasks per month</p>
          </CardContent>
        </Card>
        <Card className="border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Potential</CardTitle>
            <Robot className="h-4 w-4 text-[#11c1d6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{avgAutomationPotential}%</div>
            <p className="text-xs text-muted-foreground">of tasks can be automated</p>
          </CardContent>
        </Card>
        <Card className="border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Savings</CardTitle>
            <Clock className="h-4 w-4 text-[#11c1d6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{Math.round(totalTimeSavings)}</div>
            <p className="text-xs text-muted-foreground">hours per month</p>
          </CardContent>
        </Card>
        <Card className="border-[#11c1d6]/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Cost Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-[#11c1d6]" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${(totalCostSavings / 1000).toFixed(0)}K</div>
            <p className="text-xs text-muted-foreground">annual savings</p>
          </CardContent>
        </Card>
      </div>

      <Card className="border-[#11c1d6]/20">
        <CardHeader>
          <CardTitle>Automation Opportunities</CardTitle>
          <CardDescription>Tasks with high automation potential.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between mb-4">
            <Tabs defaultValue="automationPotential" onValueChange={setSelectedMetric}>
              <TabsList className="bg-[#11c1d6]/10">
                <TabsTrigger
                  value="automationPotential"
                  className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                >
                  Automation Potential
                </TabsTrigger>
                <TabsTrigger
                  value="frequency"
                  className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                >
                  Task Frequency
                </TabsTrigger>
                <TabsTrigger
                  value="duration"
                  className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                >
                  Task Duration
                </TabsTrigger>
                <TabsTrigger
                  value="savingsEstimate"
                  className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                >
                  Cost Savings
                </TabsTrigger>
              </TabsList>
            </Tabs>
            <Button variant="outline" size="sm">
              Export
            </Button>
          </div>
          <ResponsiveContainer width="100%" height={350}>
            <BarChart data={getChartData()} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="name" />
              <YAxis label={{ value: getChartLabel(), angle: -90, position: "insideLeft" }} />
              <Tooltip />
              <Legend />
              <Bar dataKey="value" fill="#11c1d6" name={getChartLabel()} />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Automation Recommendations</CardTitle>
            <CardDescription>Recommended automation solutions for high-potential tasks.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                <div className="rounded-full bg-[#11c1d6]/10 p-2">
                  <Robot className="h-4 w-4 text-[#11c1d6]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Data Entry Automation</h4>
                    <Badge className="ml-2 bg-[#11c1d6] hover:bg-[#11c1d6]/90">High ROI</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Implement RPA bots to automate data entry from various sources into the ERP system.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Est. Savings:</span> $28,500/year
                    </div>
                    <div>
                      <span className="text-muted-foreground">Implementation:</span> 4-6 weeks
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Details
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                <div className="rounded-full bg-[#11c1d6]/10 p-2">
                  <Zap className="h-4 w-4 text-[#11c1d6]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Payment Processing Automation</h4>
                    <Badge className="ml-2 bg-[#11c1d6] hover:bg-[#11c1d6]/90">Quick Win</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Implement API integrations between payment gateways and the order management system.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Est. Savings:</span> $12,000/year
                    </div>
                    <div>
                      <span className="text-muted-foreground">Implementation:</span> 2-3 weeks
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Details
                  </Button>
                </div>
              </div>
              <div className="flex items-start gap-4 rounded-lg border border-[#11c1d6]/20 p-4">
                <div className="rounded-full bg-[#11c1d6]/10 p-2">
                  <Robot className="h-4 w-4 text-[#11c1d6]" />
                </div>
                <div>
                  <div className="flex items-center gap-2">
                    <h4 className="font-medium">Order Verification Automation</h4>
                    <Badge className="ml-2 bg-[#11c1d6] hover:bg-[#11c1d6]/90">High Impact</Badge>
                  </div>
                  <p className="text-sm text-muted-foreground mt-1">
                    Implement ML-based verification system to automatically validate orders based on historical
                    patterns.
                  </p>
                  <div className="mt-2 grid grid-cols-2 gap-2 text-sm">
                    <div>
                      <span className="text-muted-foreground">Est. Savings:</span> $34,200/year
                    </div>
                    <div>
                      <span className="text-muted-foreground">Implementation:</span> 8-10 weeks
                    </div>
                  </div>
                  <Button variant="outline" size="sm" className="mt-2">
                    View Details
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
        <Card className="border-[#11c1d6]/20">
          <CardHeader>
            <CardTitle>Implementation Roadmap</CardTitle>
            <CardDescription>Phased approach to implementing automation solutions.</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-8">
              <div className="relative">
                <div className="absolute left-0 top-0 bottom-0 w-[2px] bg-muted ml-3"></div>
                <div className="space-y-6">
                  <div className="relative">
                    <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-[#11c1d6] flex items-center justify-center">
                      <span className="text-xs font-bold text-white">1</span>
                    </div>
                    <div className="pl-10">
                      <h4 className="font-medium">Phase 1: Quick Wins (1-3 months)</h4>
                      <ul className="mt-2 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50">
                            In Progress
                          </Badge>
                          <span>Payment Processing Automation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            Planned
                          </Badge>
                          <span>Inventory Check Automation</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold">2</span>
                    </div>
                    <div className="pl-10">
                      <h4 className="font-medium">Phase 2: Core Processes (3-6 months)</h4>
                      <ul className="mt-2 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            Planned
                          </Badge>
                          <span>Data Entry Automation</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            Planned
                          </Badge>
                          <span>Customer Communication Templates</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                  <div className="relative">
                    <div className="absolute left-0 top-0 h-6 w-6 rounded-full bg-muted flex items-center justify-center">
                      <span className="text-xs font-bold">3</span>
                    </div>
                    <div className="pl-10">
                      <h4 className="font-medium">Phase 3: Advanced Automation (6-12 months)</h4>
                      <ul className="mt-2 space-y-2 text-sm">
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            Planned
                          </Badge>
                          <span>Order Verification with ML</span>
                        </li>
                        <li className="flex items-center gap-2">
                          <Badge variant="outline" className="bg-blue-50 text-blue-700 hover:bg-blue-50">
                            Planned
                          </Badge>
                          <span>Predictive Analytics for Inventory</span>
                        </li>
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
              <div className="rounded-lg border border-[#11c1d6]/20 p-4 bg-[#11c1d6]/5">
                <h4 className="font-medium">Expected Outcomes</h4>
                <div className="mt-2 space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span>Process Cycle Time Reduction</span>
                    <span>45%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[45%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Error Rate Reduction</span>
                    <span>85%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[85%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span>Staff Capacity Increase</span>
                    <span>35%</span>
                  </div>
                  <div className="h-2 w-full rounded-full bg-muted">
                    <div className="h-full w-[35%] rounded-full bg-[#11c1d6]"></div>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  )
}
