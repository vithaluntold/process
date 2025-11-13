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
  X,
  GitCompare,
  LinkIcon,
  LogOut,
  User,
  Activity,
  Monitor,
  FileText,
  DollarSign,
  Bot,
  Target,
  Sparkles,
  Settings,
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
import { motion } from "framer-motion"
import { MetricCardSkeleton } from "@/components/loading-states"

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
  const [analysisModalOpen, setAnalysisModalOpen] = useState(false)
  const [stats, setStats] = useState<DashboardStats>({
    processCount: 0,
    avgCycleTime: 0,
    conformanceRate: 0,
    automationPotential: 0,
  })
  const [loading, setLoading] = useState(true)
  const [dateRange, setDateRange] = useState("30d")

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
      trend: "+12%",
      trendUp: true,
      gradient: "from-cyan-500 to-blue-600",
      bgGradient: "from-cyan-500/10 to-blue-600/10",
    },
    {
      title: "Avg. Cycle Time",
      value: `${stats.avgCycleTime} days`,
      icon: BarChart3,
      trend: "-8%",
      trendUp: true,
      gradient: "from-violet-500 to-purple-600",
      bgGradient: "from-violet-500/10 to-purple-600/10",
    },
    {
      title: "Conformance Rate",
      value: `${stats.conformanceRate}%`,
      icon: Filter,
      trend: "+5%",
      trendUp: true,
      gradient: "from-emerald-500 to-green-600",
      bgGradient: "from-emerald-500/10 to-green-600/10",
    },
    {
      title: "Automation Potential",
      value: `$${stats.automationPotential}M`,
      icon: Zap,
      trend: "+18%",
      trendUp: true,
      gradient: "from-orange-500 to-red-600",
      bgGradient: "from-orange-500/10 to-red-600/10",
    },
  ]

  return (
    <>
      {(uploadModalOpen || analysisModalOpen) && (
        <UploadModal
          open={true}
          onOpenChange={(open) => {
            setUploadModalOpen(open)
            setAnalysisModalOpen(open)
          }}
          onUploadComplete={handleDataChange}
        />
      )}
      <div className="flex min-h-screen w-full flex-col bg-gradient-to-br from-background via-background to-muted/20">
        <header className="sticky top-0 z-50 flex h-16 items-center gap-4 border-b bg-background/80 backdrop-blur-xl px-4 md:px-6 shadow-sm">
          <div className="flex items-center gap-3">
            <div className="relative group">
              <div className="absolute inset-0 bg-gradient-to-br from-cyan-400 to-blue-600 rounded-lg blur opacity-40 group-hover:opacity-60 transition-opacity"></div>
              <div className="relative p-1.5 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                <X className="h-5 w-5 text-white" />
              </div>
            </div>
            <div>
              <span className="text-lg font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">EPI-Q</span>
              <div className="flex items-center gap-1">
                <Sparkles className="h-3 w-3 text-cyan-500" />
                <span className="text-xs text-muted-foreground">Enterprise</span>
              </div>
            </div>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm ml-8">
            <Link href="/" className="font-medium transition-colors hover:text-brand">
              Dashboard
            </Link>
            <Link href="/process-discovery" className="text-muted-foreground transition-colors hover:text-brand">
              Process Repository
            </Link>
            <Link href="/performance-analytics" className="text-muted-foreground transition-colors hover:text-brand">
              Analytics
            </Link>
            <Link href="/automation-opportunities" className="text-muted-foreground transition-colors hover:text-brand">
              Automation
            </Link>
            <Link href="/api-integrations" className="text-muted-foreground transition-colors hover:text-brand">
              Integration
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-3">
            <Button 
              variant="outline" 
              size="sm" 
              onClick={() => setUploadModalOpen(true)}
              className="hover:bg-brand/10 hover:text-brand hover:border-brand/50 transition-all"
            >
              <FileUp className="mr-2 h-4 w-4" />
              Import Data
            </Button>
            <Button 
              size="sm" 
              className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 transition-all" 
              onClick={() => setAnalysisModalOpen(true)}
            >
              <Sparkles className="mr-2 h-4 w-4" />
              New Analysis
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2 hover:bg-brand/10">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user?.email || "User"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem asChild className="cursor-pointer">
                  <Link href="/settings" className="flex items-center">
                    <Settings className="mr-2 h-4 w-4" />
                    <span>Settings</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem
                  className="cursor-pointer"
                  onClick={async () => {
                    try {
                      await fetch("/api/auth/logout", { method: "POST" })
                      toast({
                        title: "Logged out",
                        description: "You have been logged out successfully.",
                      })
                      window.location.href = "/"
                    } catch (error) {
                      toast({
                        title: "Error",
                        description: "Failed to logout",
                        variant: "destructive",
                      })
                    }
                  }}
                >
                  <LogOut className="mr-2 h-4 w-4" />
                  <span>Log out</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <div className="grid md:grid-cols-[260px_1fr]">
          <aside className="hidden md:flex flex-col border-r bg-muted/30 p-4 space-y-6">
            <div className="flex items-center gap-2 px-3">
              <div className="h-1 w-1 rounded-full bg-cyan-500"></div>
              <span className="font-semibold text-sm">Process Intelligence</span>
            </div>
            <nav className="grid gap-1.5">
              <Link
                href="/"
                className="flex items-center gap-3 rounded-xl bg-gradient-to-r from-cyan-500 to-blue-600 text-white px-4 py-2.5 text-sm font-medium shadow-lg shadow-cyan-500/20 transition-all"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/process-discovery"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Layers className="h-4 w-4" />
                Process Discovery
              </Link>
              <Link
                href="/conformance-checking"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Filter className="h-4 w-4" />
                Conformance Checking
              </Link>
              <Link
                href="/performance-analytics"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <PieChart className="h-4 w-4" />
                Performance Analytics
              </Link>
              <Link
                href="/automation-opportunities"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Zap className="h-4 w-4" />
                Automation
              </Link>
              <Link
                href="/predictive-analytics"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Lightbulb className="h-4 w-4" />
                Predictive Analytics
              </Link>
              <Link
                href="/monitoring"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Monitor className="h-4 w-4" />
                Real-Time Monitoring
              </Link>
              <Link
                href="/task-mining"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Activity className="h-4 w-4" />
                Task Mining
              </Link>
              <Link
                href="/cost-analysis"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <DollarSign className="h-4 w-4" />
                Cost Analysis & ROI
              </Link>
              <Link
                href="/custom-kpis"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Target className="h-4 w-4" />
                Custom KPI Builder
              </Link>
              <Link
                href="/reports"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <FileText className="h-4 w-4" />
                Reports & Exports
              </Link>
              <Link
                href="/ai-assistant"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Bot className="h-4 w-4" />
                AI Assistant
              </Link>
              <Link
                href="/document-upload"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <FileUp className="h-4 w-4" />
                Document Upload
              </Link>
              <Link
                href="/api-integrations"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <LinkIcon className="h-4 w-4" />
                API Integrations
              </Link>
              <Link
                href="/digital-twin"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <Layers className="h-4 w-4" />
                Digital Twin
              </Link>
              <Link
                href="/scenario-analysis"
                className="flex items-center gap-3 rounded-xl px-4 py-2.5 text-sm font-medium text-muted-foreground hover:bg-brand/10 hover:text-brand transition-all"
              >
                <GitCompare className="h-4 w-4" />
                What-If Scenarios
              </Link>
            </nav>
          </aside>
          <main className="flex flex-1 flex-col gap-6 p-6 md:gap-8 md:p-8">
            <motion.div 
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
              className="flex items-center justify-between"
            >
              <div>
                <h1 className="text-3xl font-bold tracking-tight bg-gradient-to-r from-foreground to-foreground/60 bg-clip-text">
                  Process Intelligence Dashboard
                </h1>
                <p className="text-muted-foreground mt-1">Analyze, optimize, and automate your business processes.</p>
              </div>
              <div className="flex items-center gap-2">
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <Button variant="outline" size="sm" className="hover:bg-brand/10 hover:text-brand hover:border-brand/50">
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
                  className="hover:bg-brand/10 hover:text-brand hover:border-brand/50"
                >
                  Export
                </Button>
              </div>
            </motion.div>

            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-4">
              {metricCards.map((metric, index) => (
                <motion.div
                  key={metric.title}
                  initial={{ opacity: 0, scale: 0.9, y: 20 }}
                  animate={{ opacity: 1, scale: 1, y: 0 }}
                  transition={{ duration: 0.4, delay: index * 0.1 }}
                >
                  <Card className={`relative overflow-hidden border-0 bg-gradient-to-br ${metric.bgGradient} backdrop-blur-sm hover:shadow-xl hover:scale-105 transition-all duration-300 group`}>
                    <div className={`absolute inset-0 bg-gradient-to-br ${metric.gradient} opacity-0 group-hover:opacity-10 transition-opacity`}></div>
                    <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                      <CardTitle className="text-sm font-medium">{metric.title}</CardTitle>
                      <div className={`p-2.5 bg-gradient-to-br ${metric.gradient} rounded-xl shadow-lg group-hover:shadow-xl group-hover:scale-110 transition-all`}>
                        <metric.icon className="h-4 w-4 text-white" />
                      </div>
                    </CardHeader>
                    <CardContent>
                      <div className="text-3xl font-bold bg-gradient-to-r from-foreground to-foreground/70 bg-clip-text">
                        {loading ? (
                          <div className="h-9 w-24 bg-muted animate-pulse rounded"></div>
                        ) : (
                          metric.value
                        )}
                      </div>
                      <div className="flex items-center gap-2 text-xs mt-2">
                        <span className={`flex items-center font-semibold ${metric.trendUp ? 'text-emerald-600' : 'text-red-600'}`}>
                          {metric.trendUp ? (
                            <TrendingUp className="h-3 w-3 mr-1" />
                          ) : (
                            <TrendingDown className="h-3 w-3 mr-1" />
                          )}
                          {metric.trend}
                        </span>
                        <span className="text-muted-foreground">vs last month</span>
                      </div>
                    </CardContent>
                  </Card>
                </motion.div>
              ))}
            </div>

            <motion.div 
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.4 }}
              className="grid gap-6 md:grid-cols-2"
            >
              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-cyan-500/10 via-blue-500/10 to-purple-500/10 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-cyan-500 to-blue-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-cyan-500 to-blue-600 rounded-lg">
                      <Layers className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">Digital Twin Simulation</CardTitle>
                      <CardDescription>Create a virtual replica of your processes</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-start space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Build an interactive digital twin of your business processes to visualize flows, identify bottlenecks,
                    and test improvements before implementation.
                  </p>
                  <Link href="/digital-twin">
                    <Button className="bg-gradient-to-r from-cyan-500 to-blue-600 hover:from-cyan-600 hover:to-blue-700 text-white shadow-lg shadow-cyan-500/20 hover:shadow-xl hover:shadow-cyan-500/30 transition-all">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Explore Digital Twin
                    </Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="relative overflow-hidden border-0 bg-gradient-to-br from-violet-500/10 via-purple-500/10 to-pink-500/10 backdrop-blur-sm hover:shadow-xl transition-all duration-300 group">
                <div className="absolute inset-0 bg-gradient-to-br from-violet-500 to-purple-600 opacity-0 group-hover:opacity-5 transition-opacity"></div>
                <CardHeader>
                  <div className="flex items-center gap-2">
                    <div className="p-2 bg-gradient-to-br from-violet-500 to-purple-600 rounded-lg">
                      <GitCompare className="h-5 w-5 text-white" />
                    </div>
                    <div>
                      <CardTitle className="text-xl">What-If Scenario Analysis</CardTitle>
                      <CardDescription>Test scenarios and predict their impact</CardDescription>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="flex flex-col items-start space-y-4">
                  <p className="text-sm text-muted-foreground leading-relaxed">
                    Create and compare multiple process scenarios to evaluate potential improvements, automation
                    opportunities, and their impact on key performance metrics.
                  </p>
                  <Link href="/scenario-analysis">
                    <Button className="bg-gradient-to-r from-violet-500 to-purple-600 hover:from-violet-600 hover:to-purple-700 text-white shadow-lg shadow-violet-500/20 hover:shadow-xl hover:shadow-violet-500/30 transition-all">
                      <Sparkles className="mr-2 h-4 w-4" />
                      Analyze Scenarios
                    </Button>
                  </Link>
                </CardContent>
              </Card>
            </motion.div>

            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5, delay: 0.5 }}
            >
              <Tabs defaultValue="process-discovery">
                <div className="flex items-center gap-4 mb-6">
                  <TabsList className="bg-muted/50 p-1 rounded-xl border border-border/50">
                    <TabsTrigger
                      value="process-discovery"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                    >
                      Process Discovery
                    </TabsTrigger>
                    <TabsTrigger
                      value="conformance"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                    >
                      Conformance
                    </TabsTrigger>
                    <TabsTrigger
                      value="performance"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                    >
                      Performance
                    </TabsTrigger>
                    <TabsTrigger
                      value="automation"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                    >
                      Automation
                    </TabsTrigger>
                    <TabsTrigger
                      value="predictive"
                      className="data-[state=active]:bg-gradient-to-r data-[state=active]:from-cyan-500 data-[state=active]:to-blue-600 data-[state=active]:text-white data-[state=active]:shadow-lg rounded-lg transition-all"
                    >
                      Predictive
                    </TabsTrigger>
                  </TabsList>
                  <div className="ml-auto flex items-center gap-2">
                    <Button variant="outline" size="sm" className="hover:bg-brand/10 hover:text-brand hover:border-brand/50">
                      <Filter className="mr-2 h-4 w-4" />
                      Filter
                    </Button>
                    <Button variant="outline" size="sm" className="hover:bg-brand/10 hover:text-brand hover:border-brand/50">
                      Share
                    </Button>
                  </div>
                </div>
                <TabsContent value="process-discovery" className="border-none p-0">
                  <ProcessDiscovery />
                </TabsContent>
                <TabsContent value="conformance" className="border-none p-0">
                  <ConformanceChecking />
                </TabsContent>
                <TabsContent value="performance" className="border-none p-0">
                  <PerformanceAnalytics />
                </TabsContent>
                <TabsContent value="automation" className="border-none p-0">
                  <AutomationOpportunities />
                </TabsContent>
                <TabsContent value="predictive" className="border-none p-0">
                  <PredictiveAnalytics />
                </TabsContent>
              </Tabs>
            </motion.div>
          </main>
        </div>
      </div>
    </>
  )
}
