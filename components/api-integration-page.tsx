"use client"

import { useState } from "react"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Badge } from "@/components/ui/badge"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import {
  Database,
  Cloud,
  LinkIcon,
  CheckCircle,
  XCircle,
  AlertCircle,
  Settings,
  RefreshCw,
  Plus,
  Trash2,
  Key,
} from "lucide-react"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"

const integrations = [
  {
    id: "sap",
    name: "SAP ERP",
    description: "Connect to SAP systems for real-time process data",
    icon: Database,
    status: "connected",
    lastSync: "2 hours ago",
    records: "1.2M",
    color: "bg-blue-500",
  },
  {
    id: "salesforce",
    name: "Salesforce",
    description: "Sync CRM data and customer processes",
    icon: Cloud,
    status: "connected",
    lastSync: "5 minutes ago",
    records: "850K",
    color: "bg-cyan-500",
  },
  {
    id: "servicenow",
    name: "ServiceNow",
    description: "Import IT service management processes",
    icon: LinkIcon,
    status: "error",
    lastSync: "1 day ago",
    records: "320K",
    color: "bg-red-500",
  },
  {
    id: "oracle",
    name: "Oracle Database",
    description: "Direct database connection for process mining",
    icon: Database,
    status: "disconnected",
    lastSync: "Never",
    records: "0",
    color: "bg-gray-400",
  },
  {
    id: "ms-dynamics",
    name: "Microsoft Dynamics",
    description: "Connect to Dynamics 365 for business processes",
    icon: Cloud,
    status: "connected",
    lastSync: "1 hour ago",
    records: "640K",
    color: "bg-green-500",
  },
  {
    id: "workday",
    name: "Workday",
    description: "Import HR and finance process data",
    icon: LinkIcon,
    status: "disconnected",
    lastSync: "Never",
    records: "0",
    color: "bg-gray-400",
  },
]

export default function ApiIntegrationPage() {
  const [selectedIntegration, setSelectedIntegration] = useState<string | null>(null)
  const [testingConnection, setTestingConnection] = useState(false)

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "connected":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />
      case "error":
        return <XCircle className="h-5 w-5 text-red-500" />
      case "disconnected":
        return <AlertCircle className="h-5 w-5 text-gray-400" />
      default:
        return <AlertCircle className="h-5 w-5 text-gray-400" />
    }
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "connected":
        return <Badge className="bg-emerald-500">Connected</Badge>
      case "error":
        return <Badge variant="destructive">Error</Badge>
      case "disconnected":
        return <Badge variant="outline">Disconnected</Badge>
      default:
        return <Badge variant="outline">Unknown</Badge>
    }
  }

  const handleTestConnection = () => {
    setTestingConnection(true)
    setTimeout(() => {
      setTestingConnection(false)
    }, 2000)
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">API Integrations</h1>
          <p className="text-muted-foreground">
            Connect external systems and data sources for comprehensive process mining.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" className="flex items-center gap-1 bg-transparent">
            <RefreshCw className="h-4 w-4" />
            Sync All
          </Button>
          <Button size="sm" className="bg-brand hover:bg-brand-dark text-white flex items-center gap-1">
            <Plus className="h-4 w-4" />
            Add Integration
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-4">
        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Connections</CardTitle>
            <LinkIcon className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">3</div>
            <p className="text-xs text-muted-foreground">of 6 configured</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Records</CardTitle>
            <Database className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">2.69M</div>
            <p className="text-xs text-muted-foreground">Synced records</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Last Sync</CardTitle>
            <RefreshCw className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">5m</div>
            <p className="text-xs text-muted-foreground">ago</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Health Status</CardTitle>
            <CheckCircle className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">83%</div>
            <p className="text-xs text-muted-foreground">Overall health</p>
          </CardContent>
        </Card>
      </div>

      <div className="grid gap-6 md:grid-cols-3">
        <Card className="md:col-span-2 border-brand/20">
          <CardHeader>
            <CardTitle>Available Integrations</CardTitle>
            <CardDescription>Connect and manage your data sources</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid gap-4">
              {integrations.map((integration) => (
                <div
                  key={integration.id}
                  className="flex items-center justify-between p-4 rounded-lg border border-brand/20 hover:bg-muted/50 cursor-pointer"
                  onClick={() => setSelectedIntegration(integration.id)}
                >
                  <div className="flex items-center gap-4">
                    <div className={`p-3 rounded-lg ${integration.color}`}>
                      <integration.icon className="h-6 w-6 text-white" />
                    </div>
                    <div>
                      <h3 className="font-medium">{integration.name}</h3>
                      <p className="text-sm text-muted-foreground">{integration.description}</p>
                      <div className="flex items-center gap-4 mt-2">
                        <span className="text-xs text-muted-foreground">Last sync: {integration.lastSync}</span>
                        <span className="text-xs text-muted-foreground">Records: {integration.records}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {getStatusIcon(integration.status)}
                    {getStatusBadge(integration.status)}
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>

        <Card className="border-brand/20">
          <CardHeader>
            <CardTitle>
              {selectedIntegration
                ? integrations.find((i) => i.id === selectedIntegration)?.name
                : "Integration Settings"}
            </CardTitle>
            <CardDescription>
              {selectedIntegration ? "Configure connection parameters" : "Select an integration to configure"}
            </CardDescription>
          </CardHeader>
          <CardContent>
            {selectedIntegration ? (
              <Tabs defaultValue="connection">
                <TabsList className="grid w-full grid-cols-2">
                  <TabsTrigger value="connection">Connection</TabsTrigger>
                  <TabsTrigger value="settings">Settings</TabsTrigger>
                </TabsList>
                <TabsContent value="connection" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="api-url">API Endpoint</Label>
                    <Input id="api-url" placeholder="https://api.example.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="api-key">API Key</Label>
                    <div className="relative">
                      <Input id="api-key" type="password" placeholder="Enter API key" />
                      <Key className="absolute right-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    </div>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="username">Username</Label>
                    <Input id="username" placeholder="Enter username" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="password">Password</Label>
                    <Input id="password" type="password" placeholder="Enter password" />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="ssl">Use SSL/TLS</Label>
                    <Switch id="ssl" defaultChecked />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button
                      variant="outline"
                      className="flex-1 bg-transparent"
                      onClick={handleTestConnection}
                      disabled={testingConnection}
                    >
                      {testingConnection ? (
                        <>
                          <RefreshCw className="mr-2 h-4 w-4 animate-spin" />
                          Testing...
                        </>
                      ) : (
                        "Test Connection"
                      )}
                    </Button>
                    <Button className="flex-1 bg-brand hover:bg-brand-dark">Save</Button>
                  </div>
                </TabsContent>
                <TabsContent value="settings" className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="sync-frequency">Sync Frequency</Label>
                    <Select defaultValue="15min">
                      <SelectTrigger>
                        <SelectValue placeholder="Select frequency" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="5min">Every 5 minutes</SelectItem>
                        <SelectItem value="15min">Every 15 minutes</SelectItem>
                        <SelectItem value="30min">Every 30 minutes</SelectItem>
                        <SelectItem value="1hour">Every hour</SelectItem>
                        <SelectItem value="manual">Manual only</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="auto-sync">Auto Sync</Label>
                    <Switch id="auto-sync" defaultChecked />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="notifications">Enable Notifications</Label>
                    <Switch id="notifications" defaultChecked />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="data-retention">Data Retention (days)</Label>
                    <Input id="data-retention" type="number" defaultValue="90" />
                  </div>
                  <div className="flex gap-2 pt-4">
                    <Button variant="outline" className="flex-1 bg-transparent">
                      <Trash2 className="mr-2 h-4 w-4" />
                      Remove
                    </Button>
                    <Button className="flex-1 bg-brand hover:bg-brand-dark">Save Settings</Button>
                  </div>
                </TabsContent>
              </Tabs>
            ) : (
              <div className="flex flex-col items-center justify-center py-8 text-center">
                <Settings className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-sm text-muted-foreground">
                  Select an integration from the list to configure its settings
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      <Card className="border-brand/20">
        <CardHeader>
          <CardTitle>Sync History</CardTitle>
          <CardDescription>Recent synchronization activities</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="rounded-md border">
            <div className="relative w-full overflow-auto">
              <table className="w-full caption-bottom text-sm">
                <thead>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <th className="h-12 px-4 text-left font-medium">Integration</th>
                    <th className="h-12 px-4 text-left font-medium">Status</th>
                    <th className="h-12 px-4 text-left font-medium">Records</th>
                    <th className="h-12 px-4 text-left font-medium">Duration</th>
                    <th className="h-12 px-4 text-left font-medium">Time</th>
                  </tr>
                </thead>
                <tbody>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">Salesforce</td>
                    <td className="p-4 align-middle">
                      <Badge className="bg-emerald-500">Success</Badge>
                    </td>
                    <td className="p-4 align-middle">1,250</td>
                    <td className="p-4 align-middle">2.3s</td>
                    <td className="p-4 align-middle">5 minutes ago</td>
                  </tr>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">SAP ERP</td>
                    <td className="p-4 align-middle">
                      <Badge className="bg-emerald-500">Success</Badge>
                    </td>
                    <td className="p-4 align-middle">3,420</td>
                    <td className="p-4 align-middle">5.1s</td>
                    <td className="p-4 align-middle">2 hours ago</td>
                  </tr>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">ServiceNow</td>
                    <td className="p-4 align-middle">
                      <Badge variant="destructive">Failed</Badge>
                    </td>
                    <td className="p-4 align-middle">0</td>
                    <td className="p-4 align-middle">-</td>
                    <td className="p-4 align-middle">1 day ago</td>
                  </tr>
                  <tr className="border-b transition-colors hover:bg-muted/50">
                    <td className="p-4 align-middle font-medium">Microsoft Dynamics</td>
                    <td className="p-4 align-middle">
                      <Badge className="bg-emerald-500">Success</Badge>
                    </td>
                    <td className="p-4 align-middle">890</td>
                    <td className="p-4 align-middle">1.8s</td>
                    <td className="p-4 align-middle">1 hour ago</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
