"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Activity, AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";

interface ProcessInstance {
  id: number;
  caseId: string;
  status: string;
  currentActivity: string;
  startTime: string;
  duration: number | null;
  slaStatus: string;
}

interface Alert {
  id: number;
  type: string;
  severity: string;
  message: string;
  status: string;
  createdAt: string;
}

interface HealthScore {
  healthScore: number;
  performanceScore: number;
  complianceScore: number;
  efficiencyScore: number;
}

export default function MonitoringPage() {
  const [instances, setInstances] = useState<ProcessInstance[]>([]);
  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [healthScore, setHealthScore] = useState<HealthScore | null>(null);
  const [selectedProcessId, setSelectedProcessId] = useState<number | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadMonitoringData();
    const interval = setInterval(loadMonitoringData, 30000);
    return () => clearInterval(interval);
  }, [selectedProcessId]);

  async function loadMonitoringData() {
    try {
      const instancesRes = await fetch(
        selectedProcessId 
          ? `/api/monitoring/instances?processId=${selectedProcessId}`
          : `/api/monitoring/instances`
      );
      if (instancesRes.ok) {
        const data = await instancesRes.json();
        setInstances(data.map((item: any) => item.process_instances));
      }

      const alertsRes = await fetch("/api/monitoring/alerts?status=active");
      if (alertsRes.ok) {
        const data = await alertsRes.json();
        setAlerts(data);
      }

      if (selectedProcessId) {
        const healthRes = await fetch(`/api/monitoring/health?processId=${selectedProcessId}`);
        if (healthRes.ok) {
          const data = await healthRes.json();
          setHealthScore(data);
        }
      }
    } catch (error) {
      console.error("Failed to load monitoring data:", error);
    } finally {
      setLoading(false);
    }
  }

  const runningInstances = instances.filter(i => i.status === "running").length;
  const completedInstances = instances.filter(i => i.status === "completed").length;
  const atRiskInstances = instances.filter(i => i.slaStatus === "at_risk").length;

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Real-Time Process Monitoring</h1>
          <p className="text-muted-foreground mt-2">
            Monitor live process instances, alerts, and health metrics in real-time
          </p>
        </div>

        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Running Instances</CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{runningInstances}</div>
              <p className="text-xs text-muted-foreground">Active process cases</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Completed Today</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{completedInstances}</div>
              <p className="text-xs text-muted-foreground">Successfully completed</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active Alerts</CardTitle>
              <AlertTriangle className="h-4 w-4 text-orange-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{alerts.length}</div>
              <p className="text-xs text-muted-foreground">Requires attention</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Health Score</CardTitle>
              <TrendingUp className="h-4 w-4 text-brand" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {healthScore ? `${healthScore.healthScore}%` : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">Overall process health</p>
            </CardContent>
          </Card>
        </div>

        <Tabs defaultValue="instances" className="space-y-4">
          <TabsList>
            <TabsTrigger value="instances">Active Instances</TabsTrigger>
            <TabsTrigger value="alerts">Alerts</TabsTrigger>
            <TabsTrigger value="health">Health Metrics</TabsTrigger>
          </TabsList>

          <TabsContent value="instances" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Running Process Instances</CardTitle>
                <CardDescription>
                  Real-time view of all active process cases
                </CardDescription>
              </CardHeader>
              <CardContent>
                {loading ? (
                  <div className="text-center py-8">Loading instances...</div>
                ) : instances.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active instances found. Upload event logs to start monitoring.
                  </div>
                ) : (
                  <div className="space-y-3">
                    {instances.slice(0, 10).map((instance) => (
                      <div
                        key={instance.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">Case {instance.caseId}</span>
                            <Badge
                              variant={
                                instance.status === "running" ? "default" : "secondary"
                              }
                            >
                              {instance.status}
                            </Badge>
                            <Badge
                              variant={
                                instance.slaStatus === "on_track"
                                  ? "secondary"
                                  : "destructive"
                              }
                            >
                              {instance.slaStatus}
                            </Badge>
                          </div>
                          <p className="text-sm text-muted-foreground">
                            Current: {instance.currentActivity}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 text-sm text-muted-foreground">
                          <Clock className="h-4 w-4" />
                          <span>
                            {instance.duration 
                              ? `${Math.floor(instance.duration / 60)}m ${instance.duration % 60}s`
                              : "In progress"}
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="alerts" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Active Alerts</CardTitle>
                <CardDescription>
                  Notifications about process anomalies and issues
                </CardDescription>
              </CardHeader>
              <CardContent>
                {alerts.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No active alerts. Your processes are running smoothly!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {alerts.map((alert) => (
                      <div
                        key={alert.id}
                        className="flex items-start justify-between p-4 border rounded-lg"
                      >
                        <div className="space-y-1 flex-1">
                          <div className="flex items-center gap-2">
                            <Badge
                              variant={
                                alert.severity === "critical"
                                  ? "destructive"
                                  : alert.severity === "high"
                                  ? "default"
                                  : "secondary"
                              }
                            >
                              {alert.severity}
                            </Badge>
                            <span className="font-medium">{alert.type}</span>
                          </div>
                          <p className="text-sm text-muted-foreground">{alert.message}</p>
                          <p className="text-xs text-muted-foreground">
                            {new Date(alert.createdAt).toLocaleString()}
                          </p>
                        </div>
                        <Button variant="outline" size="sm">
                          Resolve
                        </Button>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="health" className="space-y-4">
            <Card>
              <CardHeader>
                <CardTitle>Process Health Metrics</CardTitle>
                <CardDescription>
                  Overall health and performance indicators
                </CardDescription>
              </CardHeader>
              <CardContent>
                {!healthScore ? (
                  <div className="text-center py-8 text-muted-foreground">
                    Select a process to view health metrics
                  </div>
                ) : (
                  <div className="space-y-4">
                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Overall Health</span>
                        <span className="text-sm font-bold">{healthScore.healthScore}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-brand"
                          style={{ width: `${healthScore.healthScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Performance</span>
                        <span className="text-sm font-bold">{healthScore.performanceScore}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-green-600"
                          style={{ width: `${healthScore.performanceScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Compliance</span>
                        <span className="text-sm font-bold">{healthScore.complianceScore}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-blue-600"
                          style={{ width: `${healthScore.complianceScore}%` }}
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <div className="flex items-center justify-between">
                        <span className="text-sm font-medium">Efficiency</span>
                        <span className="text-sm font-bold">{healthScore.efficiencyScore}%</span>
                      </div>
                      <div className="h-2 bg-secondary rounded-full overflow-hidden">
                        <div
                          className="h-full bg-purple-600"
                          style={{ width: `${healthScore.efficiencyScore}%` }}
                        />
                      </div>
                    </div>
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
