"use client";

import { useState, useEffect } from "react";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  Filter, 
  Share2, 
  Network, 
  CheckCircle2, 
  TrendingUp, 
  Zap, 
  Lightbulb,
  Download,
  RefreshCw,
  AlertCircle
} from "lucide-react";
import { toast } from "sonner";
import { Badge } from "@/components/ui/badge";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import dynamic from "next/dynamic";

const ProcessFlowchart = dynamic(() => import("@/components/process-flowchart"), {
  ssr: false,
  loading: () => <div className="h-96 flex items-center justify-center">Loading visualization...</div>,
});

interface Process {
  id: number;
  name: string;
  description: string | null;
}

export default function ProcessAnalysisDashboard() {
  const [activeTab, setActiveTab] = useState("discovery");
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [filterOpen, setFilterOpen] = useState(false);
  const [shareOpen, setShareOpen] = useState(false);

  // Analysis data states
  const [discoveryData, setDiscoveryData] = useState<any>(null);
  const [conformanceData, setConformanceData] = useState<any>(null);
  const [performanceData, setPerformanceData] = useState<any>(null);
  const [automationData, setAutomationData] = useState<any>(null);
  const [predictiveData, setPredictiveData] = useState<any>(null);

  // Loading states for each tab
  const [loadingDiscovery, setLoadingDiscovery] = useState(false);
  const [loadingConformance, setLoadingConformance] = useState(false);
  const [loadingPerformance, setLoadingPerformance] = useState(false);
  const [loadingAutomation, setLoadingAutomation] = useState(false);
  const [loadingPredictive, setLoadingPredictive] = useState(false);

  // Filter states
  const [dateRange, setDateRange] = useState("all");
  const [minConfidence, setMinConfidence] = useState("0");

  useEffect(() => {
    loadProcesses();
    
    // Read query parameters for shared links
    const params = new URLSearchParams(window.location.search);
    const processParam = params.get("process");
    const tabParam = params.get("tab");
    
    if (processParam) {
      setSelectedProcessId(processParam);
    }
    
    if (tabParam) {
      setActiveTab(tabParam);
    }
  }, []);

  useEffect(() => {
    if (selectedProcessId) {
      loadDataForCurrentTab();
    }
  }, [selectedProcessId, activeTab]);

  async function loadProcesses() {
    try {
      const response = await fetch("/api/processes");
      if (!response.ok) throw new Error("Failed to load processes");
      const data = await response.json();
      const processList = data.processes || [];
      setProcesses(processList);
      
      // Only set default process if no process is already selected (e.g., from query params)
      // Use functional form to get current value, avoiding stale closure
      if (processList.length > 0) {
        setSelectedProcessId((prev) => prev || processList[0].id.toString());
      }
    } catch (error) {
      toast.error("Failed to load processes");
      setProcesses([]);
    } finally {
      setLoading(false);
    }
  }

  async function loadDataForCurrentTab() {
    if (!selectedProcessId) return;

    switch (activeTab) {
      case "discovery":
        await loadProcessDiscovery();
        break;
      case "conformance":
        await loadConformanceChecking();
        break;
      case "performance":
        await loadPerformanceAnalytics();
        break;
      case "automation":
        await loadAutomationOpportunities();
        break;
      case "predictive":
        await loadPredictiveAnalytics();
        break;
    }
  }

  function buildFilterParams() {
    const params: any = {};
    
    if (dateRange !== "all") {
      params.dateRange = dateRange;
    }
    
    if (minConfidence !== "0") {
      params.minConfidence = parseFloat(minConfidence) / 100;
    }
    
    return params;
  }

  async function loadProcessDiscovery() {
    setLoadingDiscovery(true);
    try {
      const filters = buildFilterParams();
      const response = await fetch(`/api/processes/${selectedProcessId}/discover`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) throw new Error("Failed to discover process");
      
      const data = await response.json();
      setDiscoveryData(data);
      toast.success("Process model discovered successfully");
    } catch (error) {
      console.error("Discovery error:", error);
      toast.error("Failed to discover process model");
      setDiscoveryData(null);
    } finally {
      setLoadingDiscovery(false);
    }
  }

  async function loadConformanceChecking() {
    setLoadingConformance(true);
    try {
      const filters = buildFilterParams();
      const response = await fetch(`/api/processes/${selectedProcessId}/check-conformance`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) throw new Error("Failed to load conformance data");
      
      const data = await response.json();
      setConformanceData(data);
    } catch (error) {
      console.error("Conformance error:", error);
      toast.error("Failed to load conformance checking results");
      setConformanceData(null);
    } finally {
      setLoadingConformance(false);
    }
  }

  async function loadPerformanceAnalytics() {
    setLoadingPerformance(true);
    try {
      const filters = buildFilterParams();
      const response = await fetch(`/api/processes/${selectedProcessId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) throw new Error("Failed to load analytics");
      
      const data = await response.json();
      setPerformanceData(data);
    } catch (error) {
      console.error("Analytics error:", error);
      toast.error("Failed to load performance analytics");
      setPerformanceData(null);
    } finally {
      setLoadingPerformance(false);
    }
  }

  async function loadAutomationOpportunities() {
    setLoadingAutomation(true);
    try {
      const filters = buildFilterParams();
      // Use the analyze endpoint which includes automation opportunities
      const response = await fetch(`/api/processes/${selectedProcessId}/analyze`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) throw new Error("Failed to load automation opportunities");
      
      const data = await response.json();
      setAutomationData(data.automationOpportunities || data);
    } catch (error) {
      console.error("Automation error:", error);
      toast.error("Failed to load automation opportunities");
      setAutomationData(null);
    } finally {
      setLoadingAutomation(false);
    }
  }

  async function loadPredictiveAnalytics() {
    setLoadingPredictive(true);
    try {
      const filters = buildFilterParams();
      const response = await fetch(`/api/processes/${selectedProcessId}/detect-anomalies`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(filters),
      });
      
      if (!response.ok) throw new Error("Failed to load predictive analytics");
      
      const data = await response.json();
      setPredictiveData(data);
    } catch (error) {
      console.error("Predictive error:", error);
      toast.error("Failed to load predictive analytics");
      setPredictiveData(null);
    } finally {
      setLoadingPredictive(false);
    }
  }

  async function handleExport(format: string) {
    if (!selectedProcessId) return;

    try {
      const response = await fetch(`/api/processes/${selectedProcessId}/export`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          format,
          analysisType: activeTab,
          includeVisualizations: true,
        }),
      });

      if (!response.ok) throw new Error("Export failed");

      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `process-analysis-${activeTab}.${format}`;
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);

      toast.success(`Exported as ${format.toUpperCase()}`);
      setShareOpen(false);
    } catch (error) {
      toast.error("Export failed");
    }
  }

  async function handleShare(method: string) {
    if (method === "email") {
      // Generate mailto link with report details
      const subject = encodeURIComponent(`EPI-Q Process Analysis - ${activeTab}`);
      const body = encodeURIComponent(
        `I'd like to share this process analysis report with you.\n\n` +
        `Process: ${processes.find(p => p.id.toString() === selectedProcessId)?.name}\n` +
        `Analysis Type: ${activeTab}\n\n` +
        `View the full report in EPI-Q.`
      );
      window.location.href = `mailto:?subject=${subject}&body=${body}`;
      toast.success("Email client opened");
    } else if (method === "link") {
      // Copy current URL to clipboard
      const url = `${window.location.origin}/process-analysis?process=${selectedProcessId}&tab=${activeTab}`;
      try {
        await navigator.clipboard.writeText(url);
        toast.success("Link copied to clipboard");
      } catch (error) {
        // Fallback for browsers that don't support clipboard API
        const textArea = document.createElement("textarea");
        textArea.value = url;
        textArea.style.position = "fixed";
        textArea.style.left = "-999999px";
        document.body.appendChild(textArea);
        textArea.focus();
        textArea.select();
        try {
          document.execCommand("copy");
          toast.success("Link copied to clipboard");
        } catch (err) {
          toast.error("Failed to copy link");
        }
        document.body.removeChild(textArea);
      }
    }
    setShareOpen(false);
  }

  function applyFilters() {
    toast.success("Filters applied");
    setFilterOpen(false);
    loadDataForCurrentTab();
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-96">
        <RefreshCw className="h-8 w-8 animate-spin text-brand" />
        <span className="ml-3 text-muted-foreground">Loading processes...</span>
      </div>
    );
  }

  if (processes.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-96 text-center">
        <div className="rounded-full bg-brand/10 p-8 mb-4">
          <AlertCircle className="h-16 w-16 text-brand" />
        </div>
        <h3 className="text-xl font-semibold mb-2">No Processes Available</h3>
        <p className="text-muted-foreground max-w-md">
          Upload event log data to start analyzing your processes
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Header with Process Selector */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Process Analysis</h1>
          <p className="text-muted-foreground">Comprehensive analysis across all dimensions</p>
        </div>
        <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
          <SelectTrigger className="w-[300px]">
            <SelectValue placeholder="Select a process" />
          </SelectTrigger>
          <SelectContent>
            {processes.map((process) => (
              <SelectItem key={process.id} value={process.id.toString()}>
                {process.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Navigation Tabs with Filter and Share */}
      <div className="border-b">
        <div className="flex items-center justify-between">
          <Tabs value={activeTab} onValueChange={setActiveTab} className="flex-1">
            <TabsList className="h-12 bg-transparent border-none">
              <TabsTrigger 
                value="discovery"
                className="data-[state=active]:bg-brand data-[state=active]:text-white rounded-md px-4"
              >
                <Network className="h-4 w-4 mr-2" />
                Process Discovery
              </TabsTrigger>
              <TabsTrigger 
                value="conformance"
                className="data-[state=active]:bg-brand data-[state=active]:text-white rounded-md px-4"
              >
                <CheckCircle2 className="h-4 w-4 mr-2" />
                Conformance Checking
              </TabsTrigger>
              <TabsTrigger 
                value="performance"
                className="data-[state=active]:bg-brand data-[state=active]:text-white rounded-md px-4"
              >
                <TrendingUp className="h-4 w-4 mr-2" />
                Performance Analytics
              </TabsTrigger>
              <TabsTrigger 
                value="automation"
                className="data-[state=active]:bg-brand data-[state=active]:text-white rounded-md px-4"
              >
                <Zap className="h-4 w-4 mr-2" />
                Automation Opportunities
              </TabsTrigger>
              <TabsTrigger 
                value="predictive"
                className="data-[state=active]:bg-brand data-[state=active]:text-white rounded-md px-4"
              >
                <Lightbulb className="h-4 w-4 mr-2" />
                Predictive Analytics
              </TabsTrigger>
            </TabsList>
          </Tabs>

          <div className="flex items-center gap-2 ml-4">
            {/* Filter Button */}
            <Dialog open={filterOpen} onOpenChange={setFilterOpen}>
              <DialogTrigger asChild>
                <Button variant="outline" size="sm">
                  <Filter className="h-4 w-4 mr-2" />
                  Filter
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Filter Analysis</DialogTitle>
                  <DialogDescription>
                    Apply filters to refine your analysis results
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4 py-4">
                  <div className="space-y-2">
                    <Label htmlFor="date-range">Date Range</Label>
                    <Select value={dateRange} onValueChange={setDateRange}>
                      <SelectTrigger id="date-range">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="all">All Time</SelectItem>
                        <SelectItem value="7d">Last 7 Days</SelectItem>
                        <SelectItem value="30d">Last 30 Days</SelectItem>
                        <SelectItem value="90d">Last 90 Days</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="confidence">Minimum Confidence (%)</Label>
                    <Input
                      id="confidence"
                      type="number"
                      min="0"
                      max="100"
                      value={minConfidence}
                      onChange={(e) => setMinConfidence(e.target.value)}
                    />
                  </div>
                </div>
                <div className="flex justify-end gap-2">
                  <Button variant="outline" onClick={() => setFilterOpen(false)}>
                    Cancel
                  </Button>
                  <Button onClick={applyFilters}>
                    Apply Filters
                  </Button>
                </div>
              </DialogContent>
            </Dialog>

            {/* Share Button */}
            <DropdownMenu open={shareOpen} onOpenChange={setShareOpen}>
              <DropdownMenuTrigger asChild>
                <Button variant="outline" size="sm">
                  <Share2 className="h-4 w-4 mr-2" />
                  Share
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56">
                <DropdownMenuLabel>Export As</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleExport("pdf")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PDF
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("xlsx")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as Excel
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleExport("pptx")}>
                  <Download className="h-4 w-4 mr-2" />
                  Export as PowerPoint
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuLabel>Share</DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={() => handleShare("email")}>
                  Share via Email
                </DropdownMenuItem>
                <DropdownMenuItem onClick={() => handleShare("link")}>
                  Copy Shareable Link
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </div>
      </div>

      {/* Tab Content */}
      <Tabs value={activeTab} className="space-y-4">
        {/* Process Discovery Tab */}
        <TabsContent value="discovery" className="space-y-4">
          {loadingDiscovery ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-brand mr-3" />
                <span className="text-muted-foreground">Discovering process model...</span>
              </CardContent>
            </Card>
          ) : discoveryData?.model ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Activities</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{discoveryData.model.activities.length}</div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Transitions</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{discoveryData.model.transitions.length}</div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Process Variants</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {discoveryData.model.metadata?.variantCount || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Process Model Visualization</CardTitle>
                  <CardDescription>
                    Discovered using Alpha Miner algorithm
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <ProcessFlowchart 
                    activities={discoveryData.model.activities}
                    transitions={discoveryData.model.transitions}
                    startActivities={discoveryData.model.startActivities}
                    endActivities={discoveryData.model.endActivities}
                  />
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Network className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Select a process to discover its model
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Conformance Checking Tab */}
        <TabsContent value="conformance" className="space-y-4">
          {loadingConformance ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-brand mr-3" />
                <span className="text-muted-foreground">Checking conformance...</span>
              </CardContent>
            </Card>
          ) : conformanceData ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Fitness Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {conformanceData.fitnessScore ? `${(conformanceData.fitnessScore * 100).toFixed(1)}%` : "N/A"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Deviations</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{conformanceData.deviationCount || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Conformant Cases</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {conformanceData.conformantCases || 0}/{conformanceData.totalCases || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Conformance Analysis Results</CardTitle>
                  <CardDescription>
                    Token-based replay conformance checking
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {conformanceData.deviations?.map((deviation: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{deviation.type}</p>
                          <p className="text-sm text-muted-foreground">{deviation.description}</p>
                        </div>
                        <Badge variant={deviation.severity === "high" ? "destructive" : "secondary"}>
                          {deviation.count} cases
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <CheckCircle2 className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Conformance checking results will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Performance Analytics Tab */}
        <TabsContent value="performance" className="space-y-4">
          {loadingPerformance ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-brand mr-3" />
                <span className="text-muted-foreground">Analyzing performance...</span>
              </CardContent>
            </Card>
          ) : performanceData ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceData.avgCycleTime ? `${performanceData.avgCycleTime}h` : "N/A"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Throughput</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {performanceData.throughput || 0}/day
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Bottlenecks</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{performanceData.bottleneckCount || 0}</div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Performance Metrics</CardTitle>
                  <CardDescription>
                    Key performance indicators for the selected process
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-4">
                    {performanceData.metrics?.map((metric: any, index: number) => (
                      <div key={index} className="flex items-center justify-between">
                        <span className="text-sm font-medium">{metric.name}</span>
                        <span className="text-sm text-muted-foreground">{metric.value}</span>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <TrendingUp className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Performance analytics will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Automation Opportunities Tab */}
        <TabsContent value="automation" className="space-y-4">
          {loadingAutomation ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-brand mr-3" />
                <span className="text-muted-foreground">Finding automation opportunities...</span>
              </CardContent>
            </Card>
          ) : automationData ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Opportunities Found</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{automationData.opportunities?.length || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Potential Savings</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {automationData.totalSavings || 0}h/month
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">High Priority</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {automationData.highPriorityCount || 0}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Automation Opportunities</CardTitle>
                  <CardDescription>
                    Ranked by impact and feasibility
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {automationData.opportunities?.map((opp: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{opp.taskName}</p>
                          <p className="text-sm text-muted-foreground">{opp.recommendation}</p>
                        </div>
                        <div className="text-right">
                          <Badge variant="secondary">{opp.potential}%</Badge>
                          <p className="text-xs text-muted-foreground mt-1">{opp.savings}h saved</p>
                        </div>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Zap className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Automation opportunities will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>

        {/* Predictive Analytics Tab */}
        <TabsContent value="predictive" className="space-y-4">
          {loadingPredictive ? (
            <Card>
              <CardContent className="flex items-center justify-center py-16">
                <RefreshCw className="h-8 w-8 animate-spin text-brand mr-3" />
                <span className="text-muted-foreground">Running predictive analysis...</span>
              </CardContent>
            </Card>
          ) : predictiveData ? (
            <>
              <div className="grid grid-cols-3 gap-4">
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Forecast Accuracy</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {predictiveData.accuracy ? `${(predictiveData.accuracy * 100).toFixed(1)}%` : "N/A"}
                    </div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Anomalies Detected</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">{predictiveData.anomalyCount || 0}</div>
                  </CardContent>
                </Card>
                <Card className="border-brand/20">
                  <CardHeader className="pb-2">
                    <CardTitle className="text-sm font-medium">Risk Score</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="text-2xl font-bold">
                      {predictiveData.riskScore || "Low"}
                    </div>
                  </CardContent>
                </Card>
              </div>

              <Card>
                <CardHeader>
                  <CardTitle>Predictive Insights</CardTitle>
                  <CardDescription>
                    AI-powered forecasts and anomaly detection
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="space-y-2">
                    {predictiveData.predictions?.map((pred: any, index: number) => (
                      <div key={index} className="flex items-center justify-between p-3 border rounded-lg">
                        <div>
                          <p className="font-medium">{pred.metric}</p>
                          <p className="text-sm text-muted-foreground">{pred.forecast}</p>
                        </div>
                        <Badge variant={pred.trend === "up" ? "default" : "destructive"}>
                          {pred.confidence}% confidence
                        </Badge>
                      </div>
                    ))}
                  </div>
                </CardContent>
              </Card>
            </>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-16 text-center">
                <Lightbulb className="h-12 w-12 text-muted-foreground mb-4" />
                <p className="text-muted-foreground">
                  Predictive analytics will appear here
                </p>
              </CardContent>
            </Card>
          )}
        </TabsContent>
      </Tabs>
    </div>
  );
}
