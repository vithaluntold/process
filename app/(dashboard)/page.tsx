"use client"

import { useEffect, useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import {
  BarChart3,
  Layers,
  Zap,
  Lightbulb,
  GitCompare,
  Activity,
  FileText,
  Bot,
  Database,
  TrendingUp,
  Users,
  Clock,
  AlertCircle,
  CheckCircle2,
  ArrowRight,
  Loader2,
} from "lucide-react"
import Link from "next/link"
import { useAuth } from "@/hooks/useAuth"
import { apiClient } from "@/lib/api-client"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

interface DashboardStats {
  processCount: number
  avgCycleTime: number
  conformanceRate: number
  automationPotential: number
}

interface RecentActivity {
  id: number
  action: string
  resource: string
  timestamp: string
  userId: number
}

interface MonitoringAlert {
  id: number
  severity: "low" | "medium" | "high" | "critical"
  message: string
  timestamp: string
}

export default function DashboardPage() {
  const { user, loading: authLoading } = useAuth()
  const [stats, setStats] = useState<DashboardStats | null>(null)
  const [recentActivity, setRecentActivity] = useState<RecentActivity[]>([])
  const [alerts, setAlerts] = useState<MonitoringAlert[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchDashboardData() {
      try {
        setLoading(true)
        
        const [statsRes, activityRes, alertsRes] = await Promise.all([
          apiClient("/api/dashboard/stats").catch(() => null),
          apiClient("/api/dashboard/activity").catch(() => ({ data: [] })),
          apiClient("/api/monitoring/alerts").catch(() => ({ data: [] })),
        ])

        if (statsRes?.stats) {
          setStats(statsRes.stats)
        }
        
        if (activityRes?.data) {
          setRecentActivity(activityRes.data.slice(0, 5))
        }

        if (alertsRes?.data) {
          setAlerts(alertsRes.data.slice(0, 3))
        }
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error)
      } finally {
        setLoading(false)
      }
    }

    if (!authLoading && user) {
      fetchDashboardData()
    }
  }, [authLoading, user])

  if (authLoading || loading) {
    return (
      <div className="flex items-center justify-center min-h-[60vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    )
  }

  const quickActions = [
    {
      title: "Process Discovery",
      description: "Discover and visualize business processes",
      icon: Layers,
      href: "/process-discovery",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Process Analysis",
      description: "Analyze process performance and bottlenecks",
      icon: BarChart3,
      href: "/process-analysis",
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Task Mining",
      description: "Analyze desktop activities and patterns",
      icon: Activity,
      href: "/task-mining",
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Predictive Analytics",
      description: "Forecast outcomes and detect anomalies",
      icon: Lightbulb,
      href: "/predictive-analytics",
      color: "text-amber-600 dark:text-amber-400",
    },
    {
      title: "Digital Twin",
      description: "Simulate and optimize processes",
      icon: GitCompare,
      href: "/digital-twin",
      color: "text-cyan-600 dark:text-cyan-400",
    },
    {
      title: "AI Assistant",
      description: "Get AI-powered process insights",
      icon: Bot,
      href: "/ai-assistant",
      color: "text-pink-600 dark:text-pink-400",
    },
  ]

  const kpis = [
    {
      title: "Total Processes",
      value: stats?.processCount ?? 0,
      icon: Database,
      change: "+12%",
      color: "text-blue-600 dark:text-blue-400",
    },
    {
      title: "Avg Cycle Time",
      value: stats?.avgCycleTime ?? 0,
      unit: "hrs",
      icon: Clock,
      change: "-8%",
      changePositive: true,
      color: "text-purple-600 dark:text-purple-400",
    },
    {
      title: "Conformance Rate",
      value: stats?.conformanceRate ?? 0,
      unit: "%",
      icon: CheckCircle2,
      change: "+5%",
      changePositive: true,
      color: "text-green-600 dark:text-green-400",
    },
    {
      title: "Automation Potential",
      value: stats?.automationPotential ?? 0,
      unit: "%",
      icon: Zap,
      change: "+15%",
      changePositive: true,
      color: "text-amber-600 dark:text-amber-400",
    },
  ]

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight">
          Welcome back{user?.firstName ? `, ${user.firstName}` : ""}
        </h1>
        <p className="text-muted-foreground mt-2">
          Here's what's happening with your processes today
        </p>
      </div>

      {/* KPI Cards */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        {kpis.map((kpi) => (
          <Card key={kpi.title}>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">{kpi.title}</CardTitle>
              <kpi.icon className={cn("h-4 w-4", kpi.color)} />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {kpi.value.toLocaleString()}
                {kpi.unit && <span className="text-sm text-muted-foreground ml-1">{kpi.unit}</span>}
              </div>
              <p className="text-xs text-muted-foreground flex items-center gap-1 mt-1">
                <TrendingUp className="h-3 w-3" />
                <span className={kpi.changePositive !== false ? "text-green-600 dark:text-green-400" : "text-muted-foreground"}>
                  {kpi.change}
                </span>{" "}
                from last month
              </p>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Quick Actions */}
      <div>
        <h2 className="text-2xl font-bold tracking-tight mb-4">Quick Actions</h2>
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {quickActions.map((action) => (
            <Link key={action.href} href={action.href}>
              <Card className="hover:shadow-md transition-shadow cursor-pointer h-full">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <action.icon className={cn("h-8 w-8", action.color)} />
                    <ArrowRight className="h-5 w-5 text-muted-foreground" />
                  </div>
                  <CardTitle className="mt-4">{action.title}</CardTitle>
                  <CardDescription>{action.description}</CardDescription>
                </CardHeader>
              </Card>
            </Link>
          ))}
        </div>
      </div>

      {/* Two Column Layout */}
      <div className="grid gap-4 md:grid-cols-2">
        {/* Recent Activity */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Clock className="h-5 w-5" />
              Recent Activity
            </CardTitle>
            <CardDescription>Latest actions in your organization</CardDescription>
          </CardHeader>
          <CardContent>
            {recentActivity.length > 0 ? (
              <div className="space-y-4">
                {recentActivity.map((activity) => (
                  <div key={activity.id} className="flex items-start gap-3 text-sm">
                    <div className="rounded-full bg-primary/10 p-1.5">
                      <Activity className="h-3 w-3 text-primary" />
                    </div>
                    <div className="flex-1 space-y-1">
                      <p className="font-medium">{activity.action}</p>
                      <p className="text-xs text-muted-foreground">
                        {activity.resource} • {new Date(activity.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <Activity className="h-8 w-8 mx-auto mb-2 opacity-50" />
                <p className="text-sm">No recent activity</p>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Monitoring & Alerts */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertCircle className="h-5 w-5" />
              System Status & Alerts
            </CardTitle>
            <CardDescription>Monitor your processes in real-time</CardDescription>
          </CardHeader>
          <CardContent>
            {alerts.length > 0 ? (
              <div className="space-y-3">
                {alerts.map((alert) => (
                  <div
                    key={alert.id}
                    className="flex items-start gap-3 p-3 rounded-lg border"
                  >
                    {alert.severity === "critical" || alert.severity === "high" ? (
                      <AlertCircle className="h-5 w-5 text-red-500 mt-0.5" />
                    ) : (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center gap-2">
                        <Badge
                          variant={
                            alert.severity === "critical" || alert.severity === "high"
                              ? "destructive"
                              : "secondary"
                          }
                        >
                          {alert.severity}
                        </Badge>
                      </div>
                      <p className="text-sm">{alert.message}</p>
                      <p className="text-xs text-muted-foreground">
                        {new Date(alert.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-6 text-muted-foreground">
                <CheckCircle2 className="h-8 w-8 mx-auto mb-2 text-green-500" />
                <p className="text-sm font-medium text-green-600 dark:text-green-400">
                  All systems operational
                </p>
                <p className="text-xs mt-1">No alerts at this time</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Role-Based Quick Links */}
      {(user?.role === "admin" || user?.role === "super_admin") && (
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Users className="h-5 w-5" />
              Admin Tools
            </CardTitle>
            <CardDescription>Manage your organization and teams</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {user?.role === "super_admin" && (
                <Link href="/admin/organizations">
                  <Button variant="outline" size="sm">
                    Organizations
                  </Button>
                </Link>
              )}
              <Link href="/admin/teams">
                <Button variant="outline" size="sm">
                  Teams
                </Button>
              </Link>
              <Link href="/admin/invitations">
                <Button variant="outline" size="sm">
                  Invitations
                </Button>
              </Link>
              <Link href="/admin/tickets">
                <Button variant="outline" size="sm">
                  Support Tickets
                </Button>
              </Link>
              <Link href="/subscription">
                <Button variant="outline" size="sm">
                  Subscription
                </Button>
              </Link>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
