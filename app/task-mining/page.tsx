"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Activity, Clock, TrendingUp, Zap, CheckCircle2, AlertCircle, BarChart3 } from "lucide-react";
import { toast } from "sonner";

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
      <div className="container mx-auto p-8">
        <div className="flex items-center justify-center h-96">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto mb-4"></div>
            <p className="text-muted-foreground">Loading task mining data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto p-6 lg:p-8 space-y-6">
      <div>
        <h1 className="text-3xl font-bold mb-2">Task Mining</h1>
        <p className="text-muted-foreground">
          Capture, analyze, and automate repetitive desktop tasks
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Activity className="h-4 w-4 text-primary" />
              Active Sessions
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.activeSessions || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Currently recording</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Clock className="h-4 w-4 text-primary" />
              Total Activities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalActivities.toLocaleString() || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Actions captured</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <TrendingUp className="h-4 w-4 text-primary" />
              Patterns Found
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.totalPatterns || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">Repetitive tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium flex items-center gap-2">
              <Zap className="h-4 w-4 text-primary" />
              Time Savings
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-3xl font-bold">{stats?.estimatedSavings.toFixed(0) || 0}h</div>
            <p className="text-xs text-muted-foreground mt-1">Potential monthly</p>
          </CardContent>
        </Card>
      </div>

      <Tabs defaultValue="patterns" className="space-y-6">
        <TabsList>
          <TabsTrigger value="patterns">Task Patterns</TabsTrigger>
          <TabsTrigger value="automations">Automation Opportunities</TabsTrigger>
          <TabsTrigger value="sessions">Recording Sessions</TabsTrigger>
          <TabsTrigger value="applications">Application Usage</TabsTrigger>
        </TabsList>

        <TabsContent value="patterns" className="space-y-4">
          {patterns.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <TrendingUp className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Patterns Detected Yet</h3>
                  <p className="text-muted-foreground mb-4">
                    Start recording your tasks to identify repetitive patterns
                  </p>
                  <Button>Start Recording</Button>
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

        <TabsContent value="automations" className="space-y-4">
          {automations.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Zap className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Automation Recommendations</h3>
                  <p className="text-muted-foreground">
                    Identify task patterns first to receive automation suggestions
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
                        <Button variant="outline" size="sm">
                          View Details
                        </Button>
                        {automation.status === "recommended" && (
                          <Button size="sm">Approve</Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </TabsContent>

        <TabsContent value="sessions" className="space-y-4">
          {sessions.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Recording Sessions</h3>
                  <p className="text-muted-foreground mb-4">
                    Start capturing your desktop activities to analyze workflows
                  </p>
                  <Button>New Recording Session</Button>
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

        <TabsContent value="applications" className="space-y-4">
          {topApps.length === 0 ? (
            <Card>
              <CardContent className="pt-6">
                <div className="text-center py-12">
                  <BarChart3 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                  <h3 className="font-semibold text-lg mb-2">No Application Data</h3>
                  <p className="text-muted-foreground">
                    Application usage will appear after recording sessions
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
      </Tabs>
    </div>
  );
}
