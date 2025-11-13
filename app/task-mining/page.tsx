"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, TrendingUp, Zap, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { ApiKeyManager } from "@/components/api-key-manager";
import { PageHeader } from "@/components/page-header";

interface TaskSession {
  id: number;
  sessionName: string | null;
  startTime: string;
  endTime: string | null;
  duration: number | null;
  deviceType: string | null;
  osType: string | null;
  status: string;
}

interface TaskPattern {
  id: number;
  patternName: string;
  description: string | null;
  frequency: number;
  avgDuration: number | null;
  automationPotential: number;
  timeSavingsEstimate: number | null;
  status: string;
  automations?: any[];
}

interface TaskAutomation {
  id: number;
  name: string;
  description: string | null;
  automationType: string;
  estimatedSavings: number | null;
  status: string;
}

interface TaskMiningStats {
  activeSessions: number;
  totalActivities: number;
  totalPatterns: number;
  estimatedSavings: number;
}

interface TopApplication {
  applicationName: string;
  category: string | null;
  totalTime: number;
  totalInteractions: number;
  avgProductivity: number | null;
}

export default function TaskMiningPage() {
  const [sessions, setSessions] = useState<TaskSession[]>([]);
  const [patterns, setPatterns] = useState<TaskPattern[]>([]);
  const [automations, setAutomations] = useState<TaskAutomation[]>([]);
  const [stats, setStats] = useState<TaskMiningStats | null>(null);
  const [topApps, setTopApps] = useState<TopApplication[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    fetchData();
  }, []);

  async function fetchData() {
    setLoading(true);
    try {
      const [sessionsRes, patternsRes, automationsRes, statsRes] = await Promise.all([
        fetch("/api/task-mining/sessions"),
        fetch("/api/task-mining/patterns"),
        fetch("/api/task-mining/automations"),
        fetch("/api/task-mining/stats"),
      ]);

      if (sessionsRes.ok) {
        const data = await sessionsRes.json();
        setSessions(data.sessions || []);
      }

      if (patternsRes.ok) {
        const data = await patternsRes.json();
        setPatterns(data.patterns || []);
      }

      if (automationsRes.ok) {
        const data = await automationsRes.json();
        setAutomations(data.automations || []);
      }

      if (statsRes.ok) {
        const data = await statsRes.json();
        setStats(data.stats);
        setTopApps(data.topApplications || []);
      }
    } catch (error) {
      console.error("Error fetching task mining data:", error);
      toast.error("Failed to load task mining data");
    } finally {
      setLoading(false);
    }
  }

  async function handleRefresh() {
    setRefreshing(true);
    try {
      await fetchData();
      toast.success("Data refreshed successfully");
    } finally {
      setRefreshing(false);
    }
  }

  function handleExportReport() {
    const reportData = {
      stats,
      sessions,
      patterns,
      automations,
      topApplications: topApps,
      exportedAt: new Date().toISOString(),
    };
    
    const blob = new Blob([JSON.stringify(reportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `task-mining-report-${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
    toast.success("Report exported successfully");
  }

  function handleSettings() {
    toast.info("Task Mining settings coming soon");
  }

  function handleFilter() {
    toast.info("Advanced filtering coming soon");
  }

  function handleStartRecording() {
    toast.info("Please download and install the Desktop Agent to start recording tasks");
  }

  function handleViewDetails(automationId: number) {
    toast.info(`Viewing details for automation #${automationId}`);
  }

  async function handleApproveAutomation(automationId: number) {
    try {
      const response = await fetch(`/api/task-mining/automations/${automationId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "approved" }),
      });

      if (response.ok) {
        toast.success("Automation approved successfully");
        await fetchData();
      } else {
        toast.error("Failed to approve automation");
      }
    } catch (error) {
      console.error("Error approving automation:", error);
      toast.error("Failed to approve automation");
    }
  }

  function formatDuration(seconds: number | null): string {
    if (!seconds) return "N/A";
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}m ${secs}s`;
  }

  function formatTime(milliseconds: number): string {
    const mins = Math.floor(milliseconds / 60000);
    const hrs = Math.floor(mins / 60);
    if (hrs > 0) return `${hrs}h ${mins % 60}m`;
    return `${mins}m`;
  }

  if (loading) {
    return (
      <AppLayout>
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading task mining data...</p>
          </div>
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
      <div className="flex items-center justify-between">
        <PageHeader
          icon={Activity}
          title="Task Mining"
          description="Capture, analyze, and automate repetitive desktop tasks"
          gradient="from-violet-500 to-purple-600"
          badge={<span className="text-xs bg-gradient-to-r from-violet-500 to-purple-500 text-white px-2 py-1 rounded-full font-medium">NEW</span>}
        />
        <div className="flex items-center gap-2">
          <Button variant="outline" size="sm" onClick={handleExportReport}>
            Export Report
          </Button>
          <Button variant="outline" size="sm" onClick={handleSettings}>
            Settings
          </Button>
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4">
        <Card className="border-brand/20 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Active Sessions</CardTitle>
            <Activity className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently recording</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Activities</CardTitle>
            <Clock className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.totalActivities ? stats.totalActivities.toLocaleString() : "0"}
            </div>
            <p className="text-xs text-muted-foreground mt-1">Actions captured</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Patterns Found</CardTitle>
            <TrendingUp className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats?.totalPatterns || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Repetitive tasks</p>
          </CardContent>
        </Card>

        <Card className="border-brand/20 hover-lift">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Time Savings</CardTitle>
            <Zap className="h-4 w-4 text-brand" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {stats?.estimatedSavings ? stats.estimatedSavings.toFixed(0) : 0}h
            </div>
            <p className="text-xs text-muted-foreground mt-1">Potential monthly</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patterns" className="space-y-6">
        <div className="flex items-center">
          <TabsList className="bg-brand/10">
            <TabsTrigger value="patterns" className="data-[state=active]:bg-brand data-[state=active]:text-white">
              Task Patterns
            </TabsTrigger>
            <TabsTrigger value="automations" className="data-[state=active]:bg-brand data-[state=active]:text-white">
              Automation Opportunities
            </TabsTrigger>
            <TabsTrigger value="sessions" className="data-[state=active]:bg-brand data-[state=active]:text-white">
              Recording Sessions
            </TabsTrigger>
            <TabsTrigger value="applications" className="data-[state=active]:bg-brand data-[state=active]:text-white">
              Application Usage
            </TabsTrigger>
            <TabsTrigger value="agent" className="data-[state=active]:bg-brand data-[state=active]:text-white">
              <span className="flex items-center gap-2">
                Desktop Agent
                <Badge variant="secondary" className="ml-1">NEW</Badge>
              </span>
            </TabsTrigger>
          </TabsList>
          <div className="ml-auto flex items-center gap-2">
            <Button variant="outline" size="sm" onClick={handleFilter}>
              Filter
            </Button>
            <Button 
              variant="outline" 
              size="sm" 
              onClick={handleRefresh}
              disabled={refreshing}
            >
              {refreshing ? "Refreshing..." : "Refresh"}
            </Button>
          </div>
        </div>

        <TabsContent value="patterns" className="space-y-4 border-none p-0">
          {patterns.length === 0 ? (
            <Card className="border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="rounded-full bg-brand/10 p-6 w-fit mx-auto mb-4">
                    <TrendingUp className="h-12 w-12 text-brand" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">No Patterns Detected Yet</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start recording your tasks to identify repetitive patterns and discover automation opportunities
                  </p>
                  <Button 
                    className="bg-brand hover:bg-brand/90 text-white"
                    onClick={handleStartRecording}
                  >
                    Start Recording
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {patterns.map((pattern) => (
                <Card key={pattern.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl">{pattern.patternName}</CardTitle>
                        <CardDescription>{pattern.description}</CardDescription>
                      </div>
                      <Badge
                        variant={
                          pattern.automationPotential >= 0.8
                            ? "default"
                            : pattern.automationPotential >= 0.5
                            ? "secondary"
                            : "outline"
                        }
                      >
                        {(pattern.automationPotential * 100).toFixed(0)}% Automatable
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid grid-cols-3 gap-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Frequency</p>
                        <p className="font-semibold">{pattern.frequency} times</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Avg Duration</p>
                        <p className="font-semibold">{formatDuration(pattern.avgDuration)}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Time Savings</p>
                        <p className="font-semibold text-green-600">
                          {pattern.timeSavingsEstimate || 0}min/week
                        </p>
                      </div>
                    </div>
                    {pattern.automations && pattern.automations.length > 0 && (
                      <div className="mt-4 pt-4 border-t">
                        <p className="text-sm text-muted-foreground mb-2">
                          {pattern.automations.length} automation(s) recommended
                        </p>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="automations" className="space-y-4 border-none p-0">
          {automations.length === 0 ? (
            <Card className="border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="rounded-full bg-brand/10 p-6 w-fit mx-auto mb-4">
                    <Zap className="h-12 w-12 text-brand" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">No Automation Recommendations</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Identify task patterns first to receive AI-powered automation suggestions
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {automations.map((automation) => (
                <Card key={automation.id} className="hover:shadow-lg transition-shadow">
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-xl flex items-center gap-2">
                          {automation.name}
                          {automation.status === "implemented" && (
                            <CheckCircle2 className="h-5 w-5 text-green-600" />
                          )}
                        </CardTitle>
                        <CardDescription>{automation.description}</CardDescription>
                      </div>
                      <Badge variant="outline" className="capitalize">
                        {automation.automationType}
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-muted-foreground">Estimated Savings</p>
                        <p className="text-2xl font-bold text-green-600">
                          {automation.estimatedSavings || 0}min/week
                        </p>
                      </div>
                      <div className="flex gap-2">
                        <Button 
                          variant="outline" 
                          size="sm"
                          onClick={() => handleViewDetails(automation.id)}
                        >
                          View Details
                        </Button>
                        {automation.status === "recommended" && (
                          <Button 
                            size="sm"
                            onClick={() => handleApproveAutomation(automation.id)}
                            className="bg-brand hover:bg-brand/90 text-white"
                          >
                            Approve
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4 border-none p-0">
          {sessions.length === 0 ? (
            <Card className="border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="rounded-full bg-brand/10 p-6 w-fit mx-auto mb-4">
                    <Activity className="h-12 w-12 text-brand" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">No Recording Sessions</h3>
                  <p className="text-muted-foreground mb-6 max-w-md mx-auto">
                    Start capturing your desktop activities to analyze workflows and identify improvement opportunities
                  </p>
                  <Button 
                    className="bg-brand hover:bg-brand/90 text-white"
                    onClick={handleStartRecording}
                  >
                    New Recording Session
                  </Button>
                </div>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {sessions.slice(0, 10).map((session) => (
                <Card key={session.id} className="hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="flex items-center justify-between">
                      <div className="flex-1">
                        <h3 className="font-semibold text-lg">
                          {session.sessionName || `Session #${session.id}`}
                        </h3>
                        <p className="text-sm text-muted-foreground">
                          {new Date(session.startTime).toLocaleString()}
                        </p>
                        <div className="flex gap-4 mt-2">
                          <span className="text-sm">
                            {session.deviceType} • {session.osType}
                          </span>
                          {session.duration && (
                            <span className="text-sm">
                              Duration: {formatDuration(session.duration)}
                            </span>
                          )}
                        </div>
                      </div>
                      <Badge variant={session.status === "completed" ? "default" : "secondary"}>
                        {session.status}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="applications" className="space-y-4 border-none p-0">
          {topApps.length === 0 ? (
            <Card className="border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <div className="rounded-full bg-brand/10 p-6 w-fit mx-auto mb-4">
                    <BarChart3 className="h-12 w-12 text-brand" />
                  </div>
                  <h3 className="font-semibold text-xl mb-2">No Application Data</h3>
                  <p className="text-muted-foreground max-w-md mx-auto">
                    Application usage statistics will appear after recording sessions
                  </p>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card>
              <CardHeader>
                <CardTitle>Top Applications by Time</CardTitle>
                <CardDescription>Most frequently used applications across all sessions</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {topApps.map((app, index) => (
                    <div key={index} className="flex items-center justify-between">
                      <div className="flex items-center gap-4 flex-1">
                        <div className="text-2xl font-bold text-muted-foreground">
                          #{index + 1}
                        </div>
                        <div className="flex-1">
                          <p className="font-semibold">{app.applicationName}</p>
                          <p className="text-sm text-muted-foreground">{app.category}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-semibold">{formatTime(app.totalTime * 1000)}</p>
                        <p className="text-sm text-muted-foreground">
                          {app.totalInteractions.toLocaleString()} actions
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        <TabsContent value="agent" className="space-y-4 border-none p-0">
          <Card className="border-brand/20 bg-gradient-to-br from-brand/5 to-transparent">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Activity className="h-5 w-5 text-brand" />
                EPI-Q Desktop Agent
              </CardTitle>
              <CardDescription>
                Install our desktop application to automatically capture keystrokes, mouse events, and application usage for comprehensive task mining
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="space-y-4">
                <div>
                  <h4 className="font-semibold mb-3 text-lg">Features</h4>
                  <div className="grid md:grid-cols-2 gap-3">
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Keyboard Activity Tracking</p>
                        <p className="text-sm text-muted-foreground">Captures typing patterns and shortcuts</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Application Monitoring</p>
                        <p className="text-sm text-muted-foreground">Tracks active apps and window switches</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">Screenshot Capture</p>
                        <p className="text-sm text-muted-foreground">Optional periodic screenshots (configurable)</p>
                      </div>
                    </div>
                    <div className="flex items-start gap-2">
                      <CheckCircle2 className="h-5 w-5 text-brand mt-0.5 flex-shrink-0" />
                      <div>
                        <p className="font-medium">AES-256 Encryption</p>
                        <p className="text-sm text-muted-foreground">All data encrypted before transmission</p>
                      </div>
                    </div>
                  </div>
                </div>

                <div className="bg-muted/50 rounded-lg p-4 space-y-3">
                  <h4 className="font-semibold flex items-center gap-2">
                    <AlertCircle className="h-4 w-4 text-brand" />
                    Privacy & Security
                  </h4>
                  <ul className="text-sm space-y-2 text-muted-foreground">
                    <li>• Full control to pause/resume tracking anytime</li>
                    <li>• User consent required before tracking begins</li>
                    <li>• Sensitive information can be automatically blurred</li>
                    <li>• Data stored locally until successfully transmitted</li>
                    <li>• GDPR compliant with complete audit trail</li>
                  </ul>
                </div>

                <div>
                  <h4 className="font-semibold mb-3">Setup Instructions</h4>
                  <ol className="space-y-3 text-sm">
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold">1</span>
                      <div>
                        <p className="font-medium">Generate API Key (see below)</p>
                        <p className="text-muted-foreground">Create a secure API key for desktop agent authentication</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold">2</span>
                      <div>
                        <p className="font-medium">Download the Desktop Agent</p>
                        <p className="text-muted-foreground">Available for Windows, macOS, and Linux</p>
                        <div className="mt-2 flex gap-2">
                          <Button variant="outline" size="sm" disabled>
                            Download for Windows
                          </Button>
                          <Button variant="outline" size="sm" disabled>
                            Download for macOS
                          </Button>
                          <Button variant="outline" size="sm" disabled>
                            Download for Linux
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground mt-2">
                          Note: Desktop agent is currently in development. Check desktop-agent/ folder for source code and build instructions.
                        </p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold">3</span>
                      <div>
                        <p className="font-medium">Configure the Agent</p>
                        <p className="text-muted-foreground">Enter your platform URL and generated API key</p>
                        <div className="mt-2 bg-muted rounded-md p-3 font-mono text-xs space-y-1">
                          <div><span className="text-muted-foreground">Platform URL:</span> {typeof window !== 'undefined' ? window.location.origin : 'http://localhost:5000'}</div>
                          <div><span className="text-muted-foreground">API Key:</span> epix_••••••••••••••••••••••••</div>
                          <div><span className="text-muted-foreground">Encryption Key:</span> (optional, for encrypted transmission)</div>
                        </div>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold">4</span>
                      <div>
                        <p className="font-medium">Grant Privacy Consent</p>
                        <p className="text-muted-foreground">Review and accept the privacy policy to enable tracking</p>
                      </div>
                    </li>
                    <li className="flex gap-3">
                      <span className="flex-shrink-0 w-6 h-6 rounded-full bg-brand/10 text-brand flex items-center justify-center font-semibold">5</span>
                      <div>
                        <p className="font-medium">Start Tracking</p>
                        <p className="text-muted-foreground">Agent runs in system tray with real-time activity capture</p>
                      </div>
                    </li>
                  </ol>
                </div>

                <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Activity className="h-4 w-4" />
                    How It Works
                  </h4>
                  <p className="text-sm text-muted-foreground mb-3">
                    The desktop agent captures your computer activities and sends encrypted data to this platform for analysis:
                  </p>
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand"></div>
                      <span>Desktop Agent → Captures activities (keyboard, mouse, apps)</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand"></div>
                      <span>Encryption → AES-256 encryption applied</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand"></div>
                      <span>Transmission → Secure HTTPS to platform API</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand"></div>
                      <span>Analysis → AI detects patterns & automation opportunities</span>
                    </div>
                    <div className="flex items-center gap-2">
                      <div className="w-2 h-2 rounded-full bg-brand"></div>
                      <span>Insights → View results in Task Mining dashboard</span>
                    </div>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>

          <ApiKeyManager />

          <Card>
            <CardHeader>
              <CardTitle>Build Instructions (Developers)</CardTitle>
              <CardDescription>For developers who want to build the desktop agent from source</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="bg-muted rounded-md p-4 font-mono text-sm space-y-2">
                <div className="text-muted-foreground"># Navigate to desktop agent folder</div>
                <div>cd desktop-agent</div>
                <div className="text-muted-foreground mt-3"># Install dependencies</div>
                <div>npm install</div>
                <div className="text-muted-foreground mt-3"># Build and run locally</div>
                <div>npm run build && npm start</div>
                <div className="text-muted-foreground mt-3"># Package for distribution</div>
                <div>npm run package:win   # Windows</div>
                <div>npm run package:mac   # macOS</div>
                <div>npm run package:linux # Linux</div>
              </div>
              <p className="text-sm text-muted-foreground mt-4">
                The packaged installers will be available in the <code className="bg-muted px-1 py-0.5 rounded">desktop-agent/release/</code> folder.
              </p>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
      </div>
    </AppLayout>
  );
}
