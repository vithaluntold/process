"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import AppLayout from "@/components/app-layout"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Separator } from "@/components/ui/separator"
import { ScrollArea } from "@/components/ui/scroll-area"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import { apiClient } from "@/lib/api-client"
import {
  Building2,
  Users,
  Shield,
  Activity,
  Server,
  Database,
  AlertTriangle,
  CheckCircle2,
  XCircle,
  RefreshCw,
  Settings,
  Lock,
  Eye,
  EyeOff,
  TrendingUp,
  Clock,
  FileText,
  Key,
  Globe,
  Zap,
  BarChart3,
  Search,
  Filter,
  MoreVertical,
  Pause,
  Play,
  Trash2,
  Mail,
  Calendar,
  CreditCard,
  HardDrive,
  Cpu,
  Wifi,
  ShieldAlert,
  ShieldCheck,
  UserX,
  UserCheck,
} from "lucide-react"

interface Organization {
  id: number
  name: string
  slug: string
  status: string
  industry: string | null
  size: string | null
  createdAt: string
  userCount: number
  processCount: number
}

interface SystemHealth {
  database: { status: string; latency: number }
  encryption: { status: string; provider: string }
  api: { status: string; uptime: number }
  memory: { used: number; total: number }
  cpu: { usage: number }
}

interface PlatformMetrics {
  totalOrganizations: number
  activeOrganizations: number
  totalUsers: number
  activeUsers: number
  totalProcesses: number
  totalEventLogs: number
  storageUsed: string
  apiCallsToday: number
}

interface AuditLogEntry {
  id: number
  action: string
  resource: string
  resourceId: string | null
  timestamp: string
  ipAddress: string | null
  userEmail?: string
}

interface SecurityEvent {
  id: number
  type: string
  severity: string
  message: string
  timestamp: string
  resolved: boolean
}

export default function SuperAdminPortal() {
  const router = useRouter()
  const { user, isLoading: loading } = useAuth()
  const { toast } = useToast()
  
  const [organizations, setOrganizations] = useState<Organization[]>([])
  const [systemHealth, setSystemHealth] = useState<SystemHealth | null>(null)
  const [platformMetrics, setPlatformMetrics] = useState<PlatformMetrics | null>(null)
  const [auditLogs, setAuditLogs] = useState<AuditLogEntry[]>([])
  const [securityEvents, setSecurityEvents] = useState<SecurityEvent[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("all")
  const [selectedOrg, setSelectedOrg] = useState<Organization | null>(null)
  const [actionDialogOpen, setActionDialogOpen] = useState(false)
  const [actionType, setActionType] = useState<string>("")

  useEffect(() => {
    if (!loading && user?.role !== "super_admin") {
      router.push("/dashboard")
      toast({
        title: "Access Denied",
        description: "Super Admin access required",
        variant: "destructive",
      })
    }
  }, [user, loading, router, toast])

  useEffect(() => {
    if (user?.role === "super_admin") {
      fetchAllData()
    }
  }, [user])

  const fetchAllData = async () => {
    setIsLoading(true)
    try {
      const [orgsRes, healthRes, metricsRes, auditRes, securityRes] = await Promise.all([
        apiClient.get("/api/super-admin/organizations"),
        apiClient.get("/api/super-admin/health"),
        apiClient.get("/api/super-admin/metrics"),
        apiClient.get("/api/super-admin/audit-logs?limit=50"),
        apiClient.get("/api/super-admin/security-events"),
      ])

      if (orgsRes.ok) setOrganizations(await orgsRes.json())
      if (healthRes.ok) setSystemHealth(await healthRes.json())
      if (metricsRes.ok) setPlatformMetrics(await metricsRes.json())
      if (auditRes.ok) setAuditLogs((await auditRes.json()).logs || [])
      if (securityRes.ok) setSecurityEvents((await securityRes.json()).events || [])
    } catch (error) {
      console.error("Failed to fetch super admin data:", error)
      toast({
        title: "Error",
        description: "Failed to load platform data",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
    }
  }

  const handleOrgAction = async (action: string, orgId: number) => {
    try {
      const res = await apiClient.post(`/api/super-admin/organizations/${orgId}/${action}`)
      if (res.ok) {
        toast({
          title: "Success",
          description: `Organization ${action} successful`,
        })
        fetchAllData()
      } else {
        throw new Error("Action failed")
      }
    } catch (error) {
      toast({
        title: "Error",
        description: `Failed to ${action} organization`,
        variant: "destructive",
      })
    }
    setActionDialogOpen(false)
    setSelectedOrg(null)
  }

  const filteredOrgs = organizations.filter(org => {
    const matchesSearch = org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                          org.slug.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = statusFilter === "all" || org.status === statusFilter
    return matchesSearch && matchesStatus
  })

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">Active</Badge>
      case "suspended":
        return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">Suspended</Badge>
      case "trial":
        return <Badge className="bg-blue-500/10 text-blue-500 border-blue-500/20">Trial</Badge>
      case "canceled":
        return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">Canceled</Badge>
      default:
        return <Badge variant="secondary">{status}</Badge>
    }
  }

  const getHealthIcon = (status: string) => {
    return status === "healthy" || status === "operational" ? (
      <CheckCircle2 className="h-5 w-5 text-green-500" />
    ) : status === "degraded" ? (
      <AlertTriangle className="h-5 w-5 text-yellow-500" />
    ) : (
      <XCircle className="h-5 w-5 text-red-500" />
    )
  }

  if (loading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </AppLayout>
    )
  }

  if (user?.role !== "super_admin") {
    return null
  }

  return (
    <AppLayout>
      <div className="space-y-6 p-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Super Admin Portal</h1>
            <p className="text-muted-foreground">
              Platform-wide administration and monitoring
            </p>
          </div>
          <Button onClick={fetchAllData} variant="outline" size="sm">
            <RefreshCw className="h-4 w-4 mr-2" />
            Refresh
          </Button>
        </div>

        <Alert className="border-amber-500/50 bg-amber-500/10">
          <ShieldAlert className="h-4 w-4 text-amber-500" />
          <AlertTitle className="text-amber-500">Privacy Protection Active</AlertTitle>
          <AlertDescription>
            Super Admin access is restricted from viewing client data, personal information, 
            and process content. Only aggregate metrics and system health data are accessible.
          </AlertDescription>
        </Alert>

        <Tabs defaultValue="overview" className="space-y-6">
          <TabsList className="grid w-full grid-cols-6 lg:w-auto lg:inline-grid">
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="tenants">Tenants</TabsTrigger>
            <TabsTrigger value="health">System Health</TabsTrigger>
            <TabsTrigger value="security">Security</TabsTrigger>
            <TabsTrigger value="audit">Audit Logs</TabsTrigger>
            <TabsTrigger value="settings">Settings</TabsTrigger>
          </TabsList>

          <TabsContent value="overview" className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
                  <Building2 className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformMetrics?.totalOrganizations || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {platformMetrics?.activeOrganizations || 0} active
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Users</CardTitle>
                  <Users className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformMetrics?.totalUsers || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {platformMetrics?.activeUsers || 0} active today
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">Total Processes</CardTitle>
                  <Activity className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformMetrics?.totalProcesses || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    {platformMetrics?.totalEventLogs?.toLocaleString() || 0} event logs
                  </p>
                </CardContent>
              </Card>

              <Card>
                <CardHeader className="flex flex-row items-center justify-between pb-2">
                  <CardTitle className="text-sm font-medium">API Calls Today</CardTitle>
                  <Zap className="h-4 w-4 text-muted-foreground" />
                </CardHeader>
                <CardContent>
                  <div className="text-2xl font-bold">{platformMetrics?.apiCallsToday?.toLocaleString() || 0}</div>
                  <p className="text-xs text-muted-foreground">
                    Storage: {platformMetrics?.storageUsed || "0 GB"}
                  </p>
                </CardContent>
              </Card>
            </div>

            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Server className="h-5 w-5" />
                    System Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Database className="h-4 w-4" />
                      <span>Database</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(systemHealth?.database?.status || "unknown")}
                      <span className="text-sm">{systemHealth?.database?.latency || 0}ms</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span>Encryption</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(systemHealth?.encryption?.status || "unknown")}
                      <Badge variant="outline">{systemHealth?.encryption?.provider || "N/A"}</Badge>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(systemHealth?.api?.status || "unknown")}
                      <span className="text-sm">{systemHealth?.api?.uptime || 0}% uptime</span>
                    </div>
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span>Memory</span>
                    </div>
                    <span className="text-sm">
                      {systemHealth?.memory?.used || 0} / {systemHealth?.memory?.total || 0} MB
                    </span>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span>CPU</span>
                    </div>
                    <span className="text-sm">{systemHealth?.cpu?.usage || 0}%</span>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <ShieldCheck className="h-5 w-5" />
                    Recent Security Events
                  </CardTitle>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[200px]">
                    {securityEvents.length === 0 ? (
                      <p className="text-sm text-muted-foreground text-center py-8">
                        No security events
                      </p>
                    ) : (
                      <div className="space-y-3">
                        {securityEvents.slice(0, 5).map((event) => (
                          <div key={event.id} className="flex items-start gap-3 p-2 rounded-lg bg-muted/50">
                            {event.severity === "high" ? (
                              <AlertTriangle className="h-4 w-4 text-red-500 mt-0.5" />
                            ) : event.severity === "medium" ? (
                              <AlertTriangle className="h-4 w-4 text-yellow-500 mt-0.5" />
                            ) : (
                              <ShieldCheck className="h-4 w-4 text-blue-500 mt-0.5" />
                            )}
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium truncate">{event.message}</p>
                              <p className="text-xs text-muted-foreground">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="tenants" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle>Tenant Management</CardTitle>
                <CardDescription>
                  Manage organizations without accessing their data
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center gap-4">
                  <div className="relative flex-1">
                    <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input
                      placeholder="Search organizations..."
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      className="pl-9"
                    />
                  </div>
                  <Select value={statusFilter} onValueChange={setStatusFilter}>
                    <SelectTrigger className="w-[150px]">
                      <SelectValue placeholder="Status" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Status</SelectItem>
                      <SelectItem value="active">Active</SelectItem>
                      <SelectItem value="trial">Trial</SelectItem>
                      <SelectItem value="suspended">Suspended</SelectItem>
                      <SelectItem value="canceled">Canceled</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="rounded-md border">
                  <div className="grid grid-cols-7 gap-4 p-4 font-medium border-b bg-muted/50">
                    <div className="col-span-2">Organization</div>
                    <div>Status</div>
                    <div>Industry</div>
                    <div>Users</div>
                    <div>Processes</div>
                    <div className="text-right">Actions</div>
                  </div>
                  <ScrollArea className="h-[400px]">
                    {filteredOrgs.map((org) => (
                      <div key={org.id} className="grid grid-cols-7 gap-4 p-4 border-b items-center hover:bg-muted/30">
                        <div className="col-span-2">
                          <p className="font-medium">{org.name}</p>
                          <p className="text-sm text-muted-foreground">{org.slug}</p>
                        </div>
                        <div>{getStatusBadge(org.status)}</div>
                        <div className="text-sm">{org.industry || "-"}</div>
                        <div className="text-sm">{org.userCount}</div>
                        <div className="text-sm">{org.processCount}</div>
                        <div className="flex justify-end gap-2">
                          {org.status === "active" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrg(org)
                                setActionType("suspend")
                                setActionDialogOpen(true)
                              }}
                            >
                              <Pause className="h-4 w-4" />
                            </Button>
                          )}
                          {org.status === "suspended" && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setSelectedOrg(org)
                                setActionType("activate")
                                setActionDialogOpen(true)
                              }}
                            >
                              <Play className="h-4 w-4" />
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                    {filteredOrgs.length === 0 && (
                      <div className="p-8 text-center text-muted-foreground">
                        No organizations found
                      </div>
                    )}
                  </ScrollArea>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Database className="h-5 w-5" />
                    Database Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(systemHealth?.database?.status || "unknown")}
                      <span className="capitalize">{systemHealth?.database?.status || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Latency</span>
                    <span>{systemHealth?.database?.latency || 0}ms</span>
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    PostgreSQL (Neon) - Production
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Key className="h-5 w-5" />
                    Encryption Status
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(systemHealth?.encryption?.status || "unknown")}
                      <span className="capitalize">{systemHealth?.encryption?.status || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Provider</span>
                    <Badge variant="outline">{systemHealth?.encryption?.provider || "N/A"}</Badge>
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    HSM-backed envelope encryption
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Wifi className="h-5 w-5" />
                    API Health
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <span>Status</span>
                    <div className="flex items-center gap-2">
                      {getHealthIcon(systemHealth?.api?.status || "unknown")}
                      <span className="capitalize">{systemHealth?.api?.status || "Unknown"}</span>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <span>Uptime</span>
                    <span>{systemHealth?.api?.uptime || 0}%</span>
                  </div>
                  <Separator />
                  <div className="text-sm text-muted-foreground">
                    Next.js API Routes
                  </div>
                </CardContent>
              </Card>
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Resource Utilization</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-6">
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Memory Usage</span>
                      <span className="text-sm text-muted-foreground">
                        {systemHealth?.memory?.used || 0} / {systemHealth?.memory?.total || 0} MB
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-blue-500 rounded-full transition-all"
                        style={{
                          width: `${((systemHealth?.memory?.used || 0) / (systemHealth?.memory?.total || 1)) * 100}%`
                        }}
                      />
                    </div>
                  </div>
                  <div>
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">CPU Usage</span>
                      <span className="text-sm text-muted-foreground">
                        {systemHealth?.cpu?.usage || 0}%
                      </span>
                    </div>
                    <div className="h-2 rounded-full bg-muted overflow-hidden">
                      <div
                        className="h-full bg-green-500 rounded-full transition-all"
                        style={{ width: `${systemHealth?.cpu?.usage || 0}%` }}
                      />
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="security" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <Shield className="h-5 w-5" />
                    Security Controls
                  </CardTitle>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Lock className="h-4 w-4" />
                      <span>Envelope Encryption</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Key className="h-4 w-4" />
                      <span>HSM Key Protection</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <FileText className="h-4 w-4" />
                      <span>Tamper-Proof Audit Logs</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500">Enabled</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>Multi-Tenant Isolation</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500">Active</Badge>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Globe className="h-4 w-4" />
                      <span>SSO/SAML</span>
                    </div>
                    <Badge className="bg-green-500/10 text-green-500">Available</Badge>
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle className="flex items-center gap-2">
                    <AlertTriangle className="h-5 w-5" />
                    Security Events
                  </CardTitle>
                  <CardDescription>Recent security-related events across the platform</CardDescription>
                </CardHeader>
                <CardContent>
                  <ScrollArea className="h-[250px]">
                    {securityEvents.length === 0 ? (
                      <div className="flex flex-col items-center justify-center py-8 text-muted-foreground">
                        <ShieldCheck className="h-12 w-12 mb-2" />
                        <p>No security events to display</p>
                      </div>
                    ) : (
                      <div className="space-y-3">
                        {securityEvents.map((event) => (
                          <div key={event.id} className="flex items-start gap-3 p-3 rounded-lg border">
                            {event.severity === "high" ? (
                              <AlertTriangle className="h-5 w-5 text-red-500 mt-0.5" />
                            ) : event.severity === "medium" ? (
                              <AlertTriangle className="h-5 w-5 text-yellow-500 mt-0.5" />
                            ) : (
                              <ShieldCheck className="h-5 w-5 text-blue-500 mt-0.5" />
                            )}
                            <div className="flex-1">
                              <div className="flex items-center justify-between">
                                <p className="font-medium">{event.type}</p>
                                <Badge variant={event.resolved ? "outline" : "destructive"}>
                                  {event.resolved ? "Resolved" : "Active"}
                                </Badge>
                              </div>
                              <p className="text-sm text-muted-foreground mt-1">{event.message}</p>
                              <p className="text-xs text-muted-foreground mt-1">
                                {new Date(event.timestamp).toLocaleString()}
                              </p>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </ScrollArea>
                </CardContent>
              </Card>
            </div>
          </TabsContent>

          <TabsContent value="audit" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Platform Audit Logs
                </CardTitle>
                <CardDescription>
                  System-level audit trail (excludes client data access)
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ScrollArea className="h-[500px]">
                  <div className="space-y-2">
                    {auditLogs.map((log) => (
                      <div key={log.id} className="flex items-start gap-4 p-3 rounded-lg border hover:bg-muted/30">
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2">
                            <Badge variant="outline">{log.action}</Badge>
                            <span className="text-sm font-medium">{log.resource}</span>
                            {log.resourceId && (
                              <span className="text-xs text-muted-foreground">#{log.resourceId}</span>
                            )}
                          </div>
                          <div className="flex items-center gap-4 mt-1 text-xs text-muted-foreground">
                            <span>{new Date(log.timestamp).toLocaleString()}</span>
                            {log.ipAddress && <span>IP: {log.ipAddress}</span>}
                          </div>
                        </div>
                      </div>
                    ))}
                    {auditLogs.length === 0 && (
                      <div className="text-center py-8 text-muted-foreground">
                        No audit logs available
                      </div>
                    )}
                  </div>
                </ScrollArea>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="settings" className="space-y-6">
            <div className="grid gap-6 md:grid-cols-2">
              <Card>
                <CardHeader>
                  <CardTitle>Platform Settings</CardTitle>
                  <CardDescription>Global configuration options</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Maintenance Mode</Label>
                      <p className="text-sm text-muted-foreground">
                        Temporarily disable access for all users
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>New Registrations</Label>
                      <p className="text-sm text-muted-foreground">
                        Allow new organization sign-ups
                      </p>
                    </div>
                    <Switch defaultChecked />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Trial Period (Days)</Label>
                      <p className="text-sm text-muted-foreground">
                        Default trial duration for new organizations
                      </p>
                    </div>
                    <Input type="number" defaultValue={14} className="w-20" />
                  </div>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Security Settings</CardTitle>
                  <CardDescription>Platform-wide security configuration</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Force SSO</Label>
                      <p className="text-sm text-muted-foreground">
                        Require SSO for all enterprise accounts
                      </p>
                    </div>
                    <Switch />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Session Timeout (Minutes)</Label>
                      <p className="text-sm text-muted-foreground">
                        Auto-logout after inactivity
                      </p>
                    </div>
                    <Input type="number" defaultValue={60} className="w-20" />
                  </div>
                  <Separator />
                  <div className="flex items-center justify-between">
                    <div>
                      <Label>Failed Login Lockout</Label>
                      <p className="text-sm text-muted-foreground">
                        Lock account after failed attempts
                      </p>
                    </div>
                    <Input type="number" defaultValue={5} className="w-20" />
                  </div>
                </CardContent>
              </Card>
            </div>
          </TabsContent>
        </Tabs>

        <Dialog open={actionDialogOpen} onOpenChange={setActionDialogOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>
                {actionType === "suspend" ? "Suspend Organization" : "Activate Organization"}
              </DialogTitle>
              <DialogDescription>
                {actionType === "suspend"
                  ? `Are you sure you want to suspend "${selectedOrg?.name}"? Users will lose access until reactivated.`
                  : `Are you sure you want to activate "${selectedOrg?.name}"? Users will regain full access.`}
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setActionDialogOpen(false)}>
                Cancel
              </Button>
              <Button
                variant={actionType === "suspend" ? "destructive" : "default"}
                onClick={() => selectedOrg && handleOrgAction(actionType, selectedOrg.id)}
              >
                {actionType === "suspend" ? "Suspend" : "Activate"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </AppLayout>
  )
}
