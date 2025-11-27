"use client"

import { useState, useEffect } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import {
  Plus,
  RefreshCw,
  Link2,
  CheckCircle2,
  XCircle,
  AlertCircle,
  Clock,
  Settings,
  Trash2,
  Play,
  ExternalLink,
  Building2,
  Cloud,
  Database,
} from "lucide-react"

import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { useToast } from "@/hooks/use-toast"
import { useAuth } from "@/hooks/useAuth"
import AppLayout from "@/components/app-layout"
import { PageHeader } from "@/components/page-header"
import { apiClient } from "@/lib/api-client"

interface ConnectorConfig {
  id: number
  connectorType: string
  displayName: string
  instanceUrl: string | null
  status: string
  createdAt: string
  updatedAt: string
  health?: {
    status: string
    lastCheckedAt: string | null
    errorMessage: string | null
    responseTimeMs: number | null
  }
  hasOAuth?: boolean
}

const connectorTypes = [
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Connect to Salesforce CRM to extract opportunity and case data",
    icon: Cloud,
    color: "text-blue-500",
    bgColor: "bg-blue-500/10",
  },
  {
    id: "servicenow",
    name: "ServiceNow",
    description: "Connect to ServiceNow ITSM for incident and change data",
    icon: Database,
    color: "text-green-500",
    bgColor: "bg-green-500/10",
  },
  {
    id: "sap",
    name: "SAP",
    description: "Connect to SAP ERP via OData for process data (Coming Soon)",
    icon: Building2,
    color: "text-orange-500",
    bgColor: "bg-orange-500/10",
    comingSoon: true,
  },
]

function getStatusBadge(status: string, healthStatus?: string) {
  const effectiveStatus = healthStatus || status
  
  switch (effectiveStatus) {
    case "active":
    case "healthy":
      return <Badge className="bg-green-500/10 text-green-600 border-green-500/20">Active</Badge>
    case "error":
    case "unhealthy":
      return <Badge className="bg-red-500/10 text-red-600 border-red-500/20">Error</Badge>
    case "pending":
    case "unknown":
      return <Badge className="bg-yellow-500/10 text-yellow-600 border-yellow-500/20">Pending</Badge>
    case "inactive":
      return <Badge className="bg-gray-500/10 text-gray-600 border-gray-500/20">Inactive</Badge>
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}

function getHealthIcon(healthStatus?: string) {
  switch (healthStatus) {
    case "healthy":
      return <CheckCircle2 className="h-4 w-4 text-green-500" />
    case "unhealthy":
      return <XCircle className="h-4 w-4 text-red-500" />
    case "degraded":
      return <AlertCircle className="h-4 w-4 text-yellow-500" />
    default:
      return <Clock className="h-4 w-4 text-gray-400" />
  }
}

export default function IntegrationsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const { user, isLoading: authLoading } = useAuth()
  const { toast } = useToast()

  const [connectors, setConnectors] = useState<ConnectorConfig[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [refreshing, setRefreshing] = useState(false)
  const [addDialogOpen, setAddDialogOpen] = useState(false)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [selectedConnector, setSelectedConnector] = useState<ConnectorConfig | null>(null)
  const [selectedConnectorType, setSelectedConnectorType] = useState<string | null>(null)
  const [formData, setFormData] = useState({
    displayName: "",
    instanceUrl: "",
    clientId: "",
    clientSecret: "",
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState<number | null>(null)

  useEffect(() => {
    const error = searchParams.get("error")
    const success = searchParams.get("success")
    const connectorId = searchParams.get("connectorId")

    if (error) {
      toast({
        title: "OAuth Error",
        description: decodeURIComponent(error),
        variant: "destructive",
      })
      router.replace("/integrations")
    } else if (success === "true" && connectorId) {
      toast({
        title: "Connected Successfully",
        description: "Your connector has been authenticated.",
      })
      router.replace("/integrations")
      fetchConnectors()
    }
  }, [searchParams, toast, router])

  useEffect(() => {
    if (user) {
      fetchConnectors()
    } else if (!authLoading) {
      setIsLoading(false)
    }
  }, [user, authLoading])

  const fetchConnectors = async () => {
    try {
      const response = await apiClient.get("/api/connectors")
      if (response.ok) {
        const data = await response.json()
        setConnectors(data.connectors || [])
      }
    } catch (error) {
      console.error("Failed to fetch connectors:", error)
      toast({
        title: "Error",
        description: "Failed to load connectors",
        variant: "destructive",
      })
    } finally {
      setIsLoading(false)
      setRefreshing(false)
    }
  }

  const handleRefresh = () => {
    setRefreshing(true)
    fetchConnectors()
  }

  const handleAddConnector = async () => {
    if (!selectedConnectorType || !formData.displayName) {
      toast({
        title: "Validation Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      })
      return
    }

    setIsSubmitting(true)
    try {
      const response = await apiClient.post("/api/connectors", {
        connectorType: selectedConnectorType,
        displayName: formData.displayName,
        instanceUrl: formData.instanceUrl || undefined,
        config: {
          clientId: formData.clientId || undefined,
          clientSecret: formData.clientSecret || undefined,
        },
      })

      if (response.ok) {
        const data = await response.json()
        toast({
          title: "Connector Created",
          description: "Now connect your account via OAuth",
        })
        setAddDialogOpen(false)
        setSelectedConnectorType(null)
        setFormData({ displayName: "", instanceUrl: "", clientId: "", clientSecret: "" })
        fetchConnectors()

        if (data.connector?.id) {
          handleStartOAuth(data.connector.id)
        }
      } else {
        const error = await response.json()
        toast({
          title: "Error",
          description: error.error || "Failed to create connector",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to create connector",
        variant: "destructive",
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleStartOAuth = async (connectorId: number) => {
    try {
      const response = await apiClient.get(`/api/connectors/${connectorId}/auth-url`)
      if (response.ok) {
        const data = await response.json()
        window.location.href = data.authUrl
      } else {
        toast({
          title: "Error",
          description: "Failed to start OAuth flow",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to start OAuth flow",
        variant: "destructive",
      })
    }
  }

  const handleTestConnection = async (connectorId: number) => {
    setIsTesting(connectorId)
    try {
      const response = await apiClient.post(`/api/connectors/${connectorId}/test`)
      const data = await response.json()
      
      if (response.ok && data.success) {
        toast({
          title: "Connection Successful",
          description: data.message || "Connector is working properly",
        })
      } else {
        toast({
          title: "Connection Failed",
          description: data.error || "Failed to connect",
          variant: "destructive",
        })
      }
      fetchConnectors()
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to test connection",
        variant: "destructive",
      })
    } finally {
      setIsTesting(null)
    }
  }

  const handleDeleteConnector = async () => {
    if (!selectedConnector) return

    try {
      const response = await apiClient.delete(`/api/connectors/${selectedConnector.id}`)
      if (response.ok) {
        toast({
          title: "Connector Deleted",
          description: "The connector has been removed",
        })
        fetchConnectors()
      } else {
        toast({
          title: "Error",
          description: "Failed to delete connector",
          variant: "destructive",
        })
      }
    } catch (error) {
      toast({
        title: "Error",
        description: "Failed to delete connector",
        variant: "destructive",
      })
    } finally {
      setDeleteDialogOpen(false)
      setSelectedConnector(null)
    }
  }

  if (authLoading || isLoading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500" />
        </div>
      </AppLayout>
    )
  }

  if (!user) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center min-h-[60vh]">
          <Card className="p-8 text-center">
            <p className="text-muted-foreground">Please sign in to manage integrations</p>
            <Button className="mt-4" onClick={() => router.push("/auth/signin")}>
              Sign In
            </Button>
          </Card>
        </div>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <PageHeader
        icon={Link2}
        title="Integrations"
        description="Connect external systems to import process data automatically"
      />

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-2">
          <Badge variant="outline" className="text-sm">
            {connectors.length} Connector{connectors.length !== 1 ? "s" : ""}
          </Badge>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={refreshing}>
            <RefreshCw className={`h-4 w-4 mr-2 ${refreshing ? "animate-spin" : ""}`} />
            Refresh
          </Button>
          <Button size="sm" onClick={() => setAddDialogOpen(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Connector
          </Button>
        </div>
      </div>

      <Tabs defaultValue="connectors" className="space-y-6">
        <TabsList>
          <TabsTrigger value="connectors">Connected Systems</TabsTrigger>
          <TabsTrigger value="available">Available Connectors</TabsTrigger>
        </TabsList>

        <TabsContent value="connectors" className="space-y-4">
          {connectors.length === 0 ? (
            <Card className="p-12 text-center">
              <Link2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-semibold mb-2">No Connectors Configured</h3>
              <p className="text-muted-foreground mb-4">
                Connect your first system to start importing process data
              </p>
              <Button onClick={() => setAddDialogOpen(true)}>
                <Plus className="h-4 w-4 mr-2" />
                Add Your First Connector
              </Button>
            </Card>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {connectors.map((connector) => {
                const connectorType = connectorTypes.find((t) => t.id === connector.connectorType)
                const Icon = connectorType?.icon || Link2

                return (
                  <Card key={connector.id} className="relative">
                    <CardHeader className="pb-3">
                      <div className="flex items-start justify-between">
                        <div className="flex items-center gap-3">
                          <div className={`p-2 rounded-lg ${connectorType?.bgColor || "bg-gray-100"}`}>
                            <Icon className={`h-5 w-5 ${connectorType?.color || "text-gray-500"}`} />
                          </div>
                          <div>
                            <CardTitle className="text-base">{connector.displayName}</CardTitle>
                            <CardDescription className="text-xs">
                              {connectorType?.name || connector.connectorType}
                            </CardDescription>
                          </div>
                        </div>
                        {getStatusBadge(connector.status, connector.health?.status)}
                      </div>
                    </CardHeader>
                    <CardContent className="space-y-4">
                      <div className="flex items-center justify-between text-sm">
                        <div className="flex items-center gap-2 text-muted-foreground">
                          {getHealthIcon(connector.health?.status)}
                          <span>
                            {connector.health?.lastCheckedAt
                              ? `Checked ${new Date(connector.health.lastCheckedAt).toLocaleDateString()}`
                              : "Not checked yet"}
                          </span>
                        </div>
                        {connector.health?.responseTimeMs && (
                          <span className="text-xs text-muted-foreground">
                            {connector.health.responseTimeMs}ms
                          </span>
                        )}
                      </div>

                      {connector.instanceUrl && (
                        <div className="text-xs text-muted-foreground truncate">
                          {connector.instanceUrl}
                        </div>
                      )}

                      {connector.health?.errorMessage && (
                        <div className="text-xs text-red-500 bg-red-50 dark:bg-red-950/20 p-2 rounded">
                          {connector.health.errorMessage}
                        </div>
                      )}

                      <div className="flex items-center gap-2 pt-2 border-t">
                        {!connector.hasOAuth && connector.status !== "active" && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleStartOAuth(connector.id)}
                          >
                            <ExternalLink className="h-3 w-3 mr-1" />
                            Connect
                          </Button>
                        )}
                        {connector.hasOAuth && (
                          <Button
                            variant="outline"
                            size="sm"
                            className="flex-1"
                            onClick={() => handleTestConnection(connector.id)}
                            disabled={isTesting === connector.id}
                          >
                            {isTesting === connector.id ? (
                              <RefreshCw className="h-3 w-3 mr-1 animate-spin" />
                            ) : (
                              <Play className="h-3 w-3 mr-1" />
                            )}
                            Test
                          </Button>
                        )}
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => {
                            setSelectedConnector(connector)
                            setDeleteDialogOpen(true)
                          }}
                        >
                          <Trash2 className="h-3 w-3 text-red-500" />
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          )}
        </TabsContent>

        <TabsContent value="available" className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {connectorTypes.map((type) => (
              <Card
                key={type.id}
                className={`cursor-pointer transition-all hover:shadow-md ${
                  type.comingSoon ? "opacity-60" : ""
                }`}
                onClick={() => {
                  if (!type.comingSoon) {
                    setSelectedConnectorType(type.id)
                    setFormData({ ...formData, displayName: type.name })
                    setAddDialogOpen(true)
                  }
                }}
              >
                <CardHeader>
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${type.bgColor}`}>
                      <type.icon className={`h-6 w-6 ${type.color}`} />
                    </div>
                    <div>
                      <CardTitle className="text-lg flex items-center gap-2">
                        {type.name}
                        {type.comingSoon && (
                          <Badge variant="secondary" className="text-xs">
                            Coming Soon
                          </Badge>
                        )}
                      </CardTitle>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-sm text-muted-foreground">{type.description}</p>
                </CardContent>
              </Card>
            ))}
          </div>
        </TabsContent>
      </Tabs>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>
              {selectedConnectorType
                ? `Add ${connectorTypes.find((t) => t.id === selectedConnectorType)?.name} Connector`
                : "Add Connector"}
            </DialogTitle>
            <DialogDescription>
              {selectedConnectorType
                ? "Configure your connector settings, then authenticate via OAuth"
                : "Select a connector type to get started"}
            </DialogDescription>
          </DialogHeader>

          {!selectedConnectorType ? (
            <div className="grid gap-3 py-4">
              {connectorTypes
                .filter((t) => !t.comingSoon)
                .map((type) => (
                  <Button
                    key={type.id}
                    variant="outline"
                    className="justify-start h-auto p-4"
                    onClick={() => {
                      setSelectedConnectorType(type.id)
                      setFormData({ ...formData, displayName: type.name })
                    }}
                  >
                    <div className={`p-2 rounded-lg ${type.bgColor} mr-3`}>
                      <type.icon className={`h-5 w-5 ${type.color}`} />
                    </div>
                    <div className="text-left">
                      <div className="font-medium">{type.name}</div>
                      <div className="text-xs text-muted-foreground">{type.description}</div>
                    </div>
                  </Button>
                ))}
            </div>
          ) : (
            <div className="space-y-4 py-4">
              <div className="space-y-2">
                <Label htmlFor="displayName">Display Name *</Label>
                <Input
                  id="displayName"
                  value={formData.displayName}
                  onChange={(e) => setFormData({ ...formData, displayName: e.target.value })}
                  placeholder="My Salesforce Instance"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="instanceUrl">Instance URL</Label>
                <Input
                  id="instanceUrl"
                  value={formData.instanceUrl}
                  onChange={(e) => setFormData({ ...formData, instanceUrl: e.target.value })}
                  placeholder={
                    selectedConnectorType === "salesforce"
                      ? "https://yourcompany.my.salesforce.com"
                      : "https://yourinstance.service-now.com"
                  }
                />
                <p className="text-xs text-muted-foreground">
                  Leave blank to use default OAuth endpoints
                </p>
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientId">Client ID (Optional)</Label>
                <Input
                  id="clientId"
                  value={formData.clientId}
                  onChange={(e) => setFormData({ ...formData, clientId: e.target.value })}
                  placeholder="Your OAuth app client ID"
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="clientSecret">Client Secret (Optional)</Label>
                <Input
                  id="clientSecret"
                  type="password"
                  value={formData.clientSecret}
                  onChange={(e) => setFormData({ ...formData, clientSecret: e.target.value })}
                  placeholder="Your OAuth app client secret"
                />
                <p className="text-xs text-muted-foreground">
                  If not provided, platform credentials will be used
                </p>
              </div>
            </div>
          )}

          <DialogFooter>
            {selectedConnectorType && (
              <Button
                variant="outline"
                onClick={() => {
                  setSelectedConnectorType(null)
                  setFormData({ displayName: "", instanceUrl: "", clientId: "", clientSecret: "" })
                }}
              >
                Back
              </Button>
            )}
            <Button
              onClick={handleAddConnector}
              disabled={isSubmitting || !selectedConnectorType || !formData.displayName}
            >
              {isSubmitting ? (
                <>
                  <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                  Creating...
                </>
              ) : (
                "Create & Connect"
              )}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Connector</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete "{selectedConnector?.displayName}"? This will remove all
              associated credentials and cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDeleteConnector}
              className="bg-red-500 hover:bg-red-600"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </AppLayout>
  )
}
