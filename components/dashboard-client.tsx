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
  X,
  GitCompare,
  LinkIcon,
  LogOut,
  User,
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
import NewAnalysisModal from "@/components/new-analysis-modal"

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

  useEffect(() => {
    fetchDashboardStats()
  }, [])

  const fetchDashboardStats = async () => {
    try {
      const response = await fetch("/api/processes")
      if (!response.ok) {
        throw new Error("Failed to fetch processes")
      }
      const data = await response.json()
      const processes = data.processes || []
      
      setStats({
        processCount: processes.length,
        avgCycleTime: 0,
        conformanceRate: 0,
        automationPotential: 0,
      })
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

  return (
    <>
      <UploadModal
        open={uploadModalOpen}
        onOpenChange={setUploadModalOpen}
        onUploadComplete={handleDataChange}
      />
      <NewAnalysisModal
        open={analysisModalOpen}
        onOpenChange={setAnalysisModalOpen}
        onAnalysisCreated={handleDataChange}
      />
      <div className="flex min-h-screen w-full flex-col">
        <header className="sticky top-0 z-10 flex h-16 items-center gap-4 border-b bg-background px-4 md:px-6">
          <div className="flex items-center gap-2">
            <X className="h-6 w-6 text-[#11c1d6]" />
            <span className="text-lg font-semibold">EPI X-Ray</span>
          </div>
          <nav className="hidden md:flex items-center gap-6 text-sm">
            <Link href="/" className="font-medium transition-colors hover:text-[#11c1d6]">
              Dashboard
            </Link>
            <Link href="#" className="text-muted-foreground transition-colors hover:text-[#11c1d6]">
              Process Repository
            </Link>
            <Link href="#" className="text-muted-foreground transition-colors hover:text-[#11c1d6]">
              Analytics
            </Link>
            <Link href="#" className="text-muted-foreground transition-colors hover:text-[#11c1d6]">
              Automation
            </Link>
            <Link href="#" className="text-muted-foreground transition-colors hover:text-[#11c1d6]">
              Integration
            </Link>
          </nav>
          <div className="ml-auto flex items-center gap-4">
            <Button variant="outline" size="sm" onClick={() => setUploadModalOpen(true)}>
              <FileUp className="mr-2 h-4 w-4" />
              Import Data
            </Button>
            <Button size="sm" className="bg-[#11c1d6] hover:bg-[#0ea5b9] text-white" onClick={() => setAnalysisModalOpen(true)}>
              New Analysis
            </Button>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden md:inline">{user?.email || "User"}</span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuLabel>
                  <div className="flex flex-col space-y-1">
                    <p className="text-sm font-medium leading-none">{user?.firstName || user?.email}</p>
                    <p className="text-xs leading-none text-muted-foreground">{user?.email}</p>
                  </div>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
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
        <div className="grid md:grid-cols-[240px_1fr]">
          <aside className="hidden md:flex flex-col border-r p-4 space-y-4">
            <div className="font-medium text-sm">Process Intelligence</div>
            <nav className="grid gap-2">
              <Link
                href="/"
                className="flex items-center gap-2 rounded-lg bg-[#11c1d6]/10 text-[#11c1d6] px-3 py-2 text-sm font-medium"
              >
                <BarChart3 className="h-4 w-4" />
                Dashboard
              </Link>
              <Link
                href="/process-discovery"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <Layers className="h-4 w-4" />
                Process Discovery
              </Link>
              <Link
                href="/conformance-checking"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <Filter className="h-4 w-4" />
                Conformance Checking
              </Link>
              <Link
                href="/performance-analytics"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <PieChart className="h-4 w-4" />
                Performance Analytics
              </Link>
              <Link
                href="/automation-opportunities"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <Zap className="h-4 w-4" />
                Automation Opportunities
              </Link>
              <Link
                href="/predictive-analytics"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <Lightbulb className="h-4 w-4" />
                Predictive Analytics
              </Link>
              <Link
                href="/document-upload"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <FileUp className="h-4 w-4" />
                Document Upload
              </Link>
              <Link
                href="/api-integrations"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <LinkIcon className="h-4 w-4" />
                API Integrations
              </Link>
              <Link
                href="/digital-twin"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <Layers className="h-4 w-4" />
                Digital Twin
              </Link>
              <Link
                href="/scenario-analysis"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                <GitCompare className="h-4 w-4" />
                What-If Scenarios
              </Link>
            </nav>
            <div className="font-medium text-sm pt-4">Administration</div>
            <nav className="grid gap-2">
              <Link
                href="#"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                Data Sources
              </Link>
              <Link
                href="#"
                className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-medium text-muted-foreground hover:bg-[#11c1d6]/10 hover:text-[#11c1d6]"
              >
                Integrations
              </Link>
            </nav>
          </aside>
          <main className="flex flex-1 flex-col gap-4 p-4 md:gap-8 md:p-8">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-2xl font-bold tracking-tight">Process Intelligence Dashboard</h1>
                <p className="text-muted-foreground">Analyze, optimize, and automate your business processes.</p>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm">
                  Last 30 Days
                </Button>
                <Button variant="outline" size="sm">
                  Export
                </Button>
              </div>
            </div>
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card className="border-[#11c1d6]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Active Processes</CardTitle>
                  <Layers className="h-4 w-4 text-[#11c1d6]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.processCount}</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Total processes in system</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#11c1d6]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Avg. Cycle Time</CardTitle>
                  <BarChart3 className="h-4 w-4 text-[#11c1d6]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.avgCycleTime} days</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Average process duration</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#11c1d6]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Conformance Rate</CardTitle>
                  <Filter className="h-4 w-4 text-[#11c1d6]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{stats.conformanceRate}%</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Process compliance score</span>
                  </div>
                </CardContent>
              </Card>
              <Card className="border-[#11c1d6]/20">
                <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                  <CardTitle className="text-sm font-medium">Automation Potential</CardTitle>
                  <Zap className="h-4 w-4 text-[#11c1d6]" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">${stats.automationPotential}M</div>
                  <div className="flex items-center text-xs text-muted-foreground">
                    <span>Estimated annual savings</span>
                  </div>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <Card className="border-[#11c1d6]/20 bg-gradient-to-br from-[#11c1d6]/10 to-[#11c1d6]/5">
                <CardHeader>
                  <CardTitle>Digital Twin Simulation</CardTitle>
                  <CardDescription>Create a virtual replica of your processes and simulate changes</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-start">
                  <p className="text-sm text-muted-foreground mb-4">
                    Build an interactive digital twin of your business processes to visualize flows, identify bottlenecks,
                    and test improvements before implementation.
                  </p>
                  <Link href="/digital-twin">
                    <Button className="bg-[#11c1d6] hover:bg-[#0ea5b9] text-white">Explore Digital Twin</Button>
                  </Link>
                </CardContent>
              </Card>

              <Card className="border-[#11c1d6]/20 bg-gradient-to-br from-[#11c1d6]/10 to-[#11c1d6]/5">
                <CardHeader>
                  <CardTitle>What-If Scenario Analysis</CardTitle>
                  <CardDescription>Test different process scenarios and predict their impact</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col items-start">
                  <p className="text-sm text-muted-foreground mb-4">
                    Create and compare multiple process scenarios to evaluate potential improvements, automation
                    opportunities, and their impact on key performance metrics.
                  </p>
                  <Link href="/scenario-analysis">
                    <Button className="bg-[#11c1d6] hover:bg-[#0ea5b9] text-white">Analyze Scenarios</Button>
                  </Link>
                </CardContent>
              </Card>
            </div>

            <Tabs defaultValue="process-discovery">
              <div className="flex items-center">
                <TabsList className="bg-[#11c1d6]/10">
                  <TabsTrigger
                    value="process-discovery"
                    className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                  >
                    Process Discovery
                  </TabsTrigger>
                  <TabsTrigger
                    value="conformance"
                    className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                  >
                    Conformance Checking
                  </TabsTrigger>
                  <TabsTrigger
                    value="performance"
                    className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                  >
                    Performance Analytics
                  </TabsTrigger>
                  <TabsTrigger
                    value="automation"
                    className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                  >
                    Automation Opportunities
                  </TabsTrigger>
                  <TabsTrigger
                    value="predictive"
                    className="data-[state=active]:bg-[#11c1d6] data-[state=active]:text-white"
                  >
                    Predictive Analytics
                  </TabsTrigger>
                </TabsList>
                <div className="ml-auto flex items-center gap-2">
                  <Button variant="outline" size="sm">
                    Filter
                  </Button>
                  <Button variant="outline" size="sm">
                    Share
                  </Button>
                </div>
              </div>
              <TabsContent value="process-discovery" className="border-none p-0 pt-4">
                <ProcessDiscovery />
              </TabsContent>
              <TabsContent value="conformance" className="border-none p-0 pt-4">
                <ConformanceChecking />
              </TabsContent>
              <TabsContent value="performance" className="border-none p-0 pt-4">
                <PerformanceAnalytics />
              </TabsContent>
              <TabsContent value="automation" className="border-none p-0 pt-4">
                <AutomationOpportunities />
              </TabsContent>
              <TabsContent value="predictive" className="border-none p-0 pt-4">
                <PredictiveAnalytics />
              </TabsContent>
            </Tabs>
          </main>
        </div>
      </div>
    </>
  )
}
