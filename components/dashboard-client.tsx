"use client"

import { useState, useEffect } from "react"
import Link from "next/link"
import {
  BarChart3,
  FileUp,
  Filter,
  PieChart,
  Zap,
  Lightbulb,
  Layers,
  ArrowUpRight,
  ArrowDownRight,
  TrendingUp,
  TrendingDown,
  Activity,
  Target,
  Sparkles,
  LayoutGrid,
  ChevronRight,
  RefreshCw,
  Download,
  Calendar,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import ProcessDiscovery from "@/components/process-discovery"
import ConformanceChecking from "@/components/conformance-checking"
import PerformanceAnalytics from "@/components/performance-analytics"
import AutomationOpportunities from "@/components/automation-opportunities"
import PredictiveAnalytics from "@/components/predictive-analytics"
import UploadModal from "@/components/upload-modal"

interface DashboardStats {
  processCount: number
  avgCycleTime: number
  conformanceRate: number
  automationPotential: number
}

export default function DashboardClient() {
  const { user } = useAuth()
  const { toast } = useToast()
  const [uploadModalOpen, setUploadModalOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    processCount: 0,
    avgCycleTime: 0,
    conformanceRate: 0,
    automationPotential: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")
  const [refreshing, setRefreshing] = useState(false)

  useEffect(() => {
    if (user) {
      fetchDashboardStats()
    } else {
      setLoading(false)
    }
  }, [user])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/dashboard/stats")
      if (!response.ok) {
        if (response.status === 401) {
          setStats({
            processCount: 0,
            avgCycleTime: 0,
            conformanceRate: 0,
            automationPotential: 0,
          })
          return
        }
        throw new Error("Failed to fetch dashboard stats")
      }
      const data = await response.json()
      setStats(data.stats)
    } catch (error) {
      console.error("Failed to fetch dashboard stats:", error)
      setStats({
        processCount: 0,
        avgCycleTime: 0,
        conformanceRate: 0,
        automationPotential: 0,
      })
    } finally {
      setLoading(false)
    }
  }

  const handleDataChange = () => {
    window.location.reload()
  }

  const handleRefresh = async () => {
    setRefreshing(true)
    await fetchDashboardStats()
    setTimeout(() => setRefreshing(false), 500)
    toast({
      title: "Dashboard Refreshed",
      description: "Data has been updated successfully",
    })
  }

  const handleDateRangeChange = (range: string) => {
    setDateRange(range)
    toast({
      title: "Date Range Updated",
      description: `Showing data for ${range === "7d" ? "last 7 days" : range === "30d" ? "last 30 days" : range === "90d" ? "last 90 days" : "all time"}`,
    })
    fetchDashboardStats()
  }

  const handleExport = async () => {
    try {
      const response = await fetch("/api/dashboard/export", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dateRange,
          format: "pdf",
        }),
      })

      if (!response.ok) {
        throw new Error("Export failed")
      }

      const blob = await response.blob()
      const url = window.URL.createObjectURL(blob)
      const a = document.createElement("a")
      a.href = url
      a.download = `dashboard-report-${new Date().toISOString().split("T")[0]}.pdf`
      document.body.appendChild(a)
      a.click()
      window.URL.revokeObjectURL(url)
      document.body.removeChild(a)

      toast({
        title: "Export Successful",
        description: "Dashboard report has been downloaded",
      })
    } catch (error) {
      toast({
        title: "Export Failed",
        description: "Failed to export dashboard report",
        variant: "destructive",
      })
    }
  }

  const metricCards = [
    {
      title: "Active Processes",
      value: stats.processCount,
      icon: Layers,
      change: "+12%",
      changePositive: true,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
    },
    {
      title: "Avg. Cycle Time",
      value: `${stats.avgCycleTime} days`,
      icon: BarChart3,
      change: "-8%",
      changePositive: true,
      color: "text-violet-600",
      bgColor: "bg-violet-50",
    },
    {
      title: "Conformance Rate",
      value: `${stats.conformanceRate}%`,
      icon: Filter,
      change: "+5%",
      changePositive: true,
      color: "text-emerald-600",
      bgColor: "bg-emerald-50",
    },
    {
      title: "Automation Potential",
      value: `$${stats.automationPotential}M`,
      icon: Zap,
      change: "+18%",
      changePositive: true,
      color: "text-orange-600",
      bgColor: "bg-orange-50",
    },
  ]

  return (
    <>
      {uploadModalOpen && (
        <UploadModal
          open={true}
          onOpenChange={setUploadModalOpen}
          onUploadComplete={handleDataChange}
        />
      )}
      
      <div className="flex flex-col gap-6 p-6 bg-slate-50/50 min-h-screen" style={{ fontFamily: 'Inter, system-ui, sans-serif' }}>
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-sm text-slate-600">
            <LayoutGrid className="h-4 w-4" />
            <span>Dashboard</span>
            <ChevronRight className="h-3 w-3" />
            <span className="text-slate-900 font-medium">Overview</span>
          </div>
          
          <div className="flex items-center gap-2">
            <Button 
              variant="outline" 
              size="sm"
              onClick={handleRefresh}
              className="bg-white border-slate-200 hover:bg-slate-50"
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm" className="bg-white border-slate-200 hover:bg-slate-50">
                  <Calendar className="h-4 w-4 mr-2" />
                  {dateRange === "7d" ? "Last 7 Days" : dateRange === "30d" ? "Last 30 Days" : dateRange === "90d" ? "Last 90 Days" : "All Time"}
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>Date Range</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleDateRangeChange("7d")}>
                  Last 7 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange("30d")}>
                  Last 30 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange("90d")}>
                  Last 90 Days
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleDateRangeChange("all")}>
                  All Time
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleExport}
              className="bg-white border-slate-200 hover:bg-slate-50"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </Button>
            <Button 
              onClick={() => setUploadModalOpen(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Upload Data
            </Button>
          </div>
        </div>

        <div>
          <h1 className="text-3xl font-semibold text-slate-900 mb-2">
            Process Intelligence
          </h1>
          <p className="text-slate-600">
            Monitor and optimize your business processes in real-time
          </p>
        </div>

        <Tabs defaultValue="overview" className="w-full">
          <TabsList className="bg-white border border-slate-200 p-1">
            <TabsTrigger value="overview" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Overview
            </TabsTrigger>
            <TabsTrigger value="processes" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Processes
            </TabsTrigger>
            <TabsTrigger value="analytics" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              Analytics
            </TabsTrigger>
            <TabsTrigger value="ai-insights" className="data-[state=active]:bg-blue-50 data-[state=active]:text-blue-700">
              AI Insights
            </TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="mt-6 space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              {metricCards.map((metric) => (
                <Card key={metric.title} className="bg-white border border-slate-200 hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-sm font-medium text-slate-600">
                        {metric.title}
                      </CardTitle>
                      <div className={`p-2 rounded-lg ${metric.bgColor}`}>
                        <metric.icon className={`h-4 w-4 ${metric.color}`} />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-semibold text-slate-900 mb-1">
                      {loading ? (
                        <div className="h-8 w-20 bg-slate-200 animate-pulse rounded"></div>
                      ) : (
                        metric.value
                      )}
                    </div>
                    <div className="flex items-center text-sm">
                      <span className={`flex items-center font-medium ${metric.changePositive ? 'text-emerald-600' : 'text-red-600'}`}>
                        {metric.changePositive ? (
                          <TrendingUp className="h-3 w-3 mr-1" />
                        ) : (
                          <TrendingDown className="h-3 w-3 mr-1" />
                        )}
                        {metric.change}
                      </span>
                      <span className="text-slate-500 ml-2">vs last period</span>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="bg-white border border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-blue-100 rounded-lg">
                      <Layers className="h-5 w-5 text-blue-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        Digital Twin Simulation
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Create virtual replicas of your processes
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Build interactive digital twins to visualize process flows, identify bottlenecks,
                    and test improvements before implementation.
                  </p>
                  <Link href="/digital-twin">
                    <Button className="bg-blue-600 hover:bg-blue-700 text-white">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Explore Digital Twin
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="bg-white border border-slate-200 hover:shadow-md transition-shadow">
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-violet-100 rounded-lg">
                      <Target className="h-5 w-5 text-violet-600" />
                    </div>
                    <div>
                      <CardTitle className="text-lg font-semibold text-slate-900">
                        What-If Scenario Analysis
                      </CardTitle>
                      <CardDescription className="text-slate-600">
                        Test scenarios and predict impact
                      </CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  <p className="text-sm text-slate-600 leading-relaxed">
                    Create and compare multiple scenarios to evaluate improvements, automation
                    opportunities, and their impact on KPIs.
                  </p>
                  <Link href="/scenario-analysis">
                    <Button className="bg-violet-600 hover:bg-violet-700 text-white">
                      <Activity className="mr-2 h-4 w-4" />
                      Analyze Scenarios
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="processes" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Process Discovery</CardTitle>
                  <CardDescription className="text-slate-600">
                    Automatically discover and visualize your processes
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProcessDiscovery />
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Conformance Checking</CardTitle>
                  <CardDescription className="text-slate-600">
                    Verify process compliance with standards
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ConformanceChecking />
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="analytics" className="mt-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg font-semibold text-slate-900">Performance Analytics</CardTitle>
                <CardDescription className="text-slate-600">
                  Deep dive into process performance metrics
                </CardDescription>
              </CardHeader>
              <CardContent>
                <PerformanceAnalytics />
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="ai-insights" className="mt-6 space-y-6">
            <div className="grid gap-6 lg:grid-cols-2">
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Automation Opportunities</CardTitle>
                  <CardDescription className="text-slate-600">
                    Discover tasks that can be automated
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <AutomationOpportunities />
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle className="text-lg font-semibold text-slate-900">Predictive Analytics</CardTitle>
                  <CardDescription className="text-slate-600">
                    AI-powered predictions and forecasts
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <PredictiveAnalytics />
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>
      </div>
    </>
  )
}
