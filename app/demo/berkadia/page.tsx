"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Upload, Database, CheckCircle, AlertCircle, TrendingUp, DollarSign, Clock, Target } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import Link from "next/link";
import Papa from "papaparse";
import { BerkadiaExecutiveDashboard } from "@/components/berkadia-executive-dashboard";
import { EmailWorkflowParser } from "@/components/email-workflow-parser";
import { UnifiedProcessMap } from "@/components/unified-process-map";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";

export default function BerkadiaDemo() {
  const [selectedProcess, setSelectedProcess] = useState<number | null>(null);
  const [importing, setImporting] = useState(false);
  const [importStatus, setImportStatus] = useState<{
    salesforce?: boolean;
    excel?: boolean;
    mainframe?: boolean;
  }>({});
  const [error, setError] = useState<string | null>(null);
  const [stats, setStats] = useState<{
    totalEvents?: number;
    avgCycleTime?: number;
    automation?: number;
    savings?: number;
  }>({});

  const handleImportDemo = async () => {
    if (!selectedProcess) {
      setError("Please select a process first");
      return;
    }

    setImporting(true);
    setError(null);
    const newStatus = { salesforce: false, excel: false, mainframe: false };

    try {
      const systems = [
        { name: "salesforce", file: "/demo-data/berkadia/salesforce-leads.csv", type: "salesforce" as const },
        { name: "excel", file: "/demo-data/berkadia/excel-underwriting.csv", type: "excel" as const },
        { name: "mainframe", file: "/demo-data/berkadia/mainframe-servicing.csv", type: "mainframe" as const },
      ];

      let totalImported = 0;

      for (const system of systems) {
        const response = await fetch(system.file);
        const csvText = await response.text();

        const parsed = Papa.parse(csvText, {
          header: true,
          skipEmptyLines: true,
        });

        const mapping = system.type === "salesforce"
          ? { caseId: "Lead_ID", activity: "Activity", timestamp: "Timestamp", resource: "User", status: "Status" }
          : system.type === "excel"
          ? { caseId: "Loan_ID", activity: "Activity", timestamp: "Timestamp", resource: "User", status: "Status" }
          : { caseId: "Loan_ID", activity: "Activity", timestamp: "Timestamp", resource: "User", status: "Status" };

        const importResponse = await fetch("/api/integrations/csv-adapter", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            data: parsed.data,
            processId: selectedProcess,
            sourceSystem: system.type,
            mapping,
          }),
        });

        if (importResponse.ok) {
          const result = await importResponse.json();
          totalImported += result.imported || 0;
          newStatus[system.name as keyof typeof newStatus] = true;
          setImportStatus({ ...newStatus });
        }
      }

      setStats({
        totalEvents: totalImported,
        avgCycleTime: 18.5,
        automation: 42,
        savings: 2400000,
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to import demo data");
    } finally {
      setImporting(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold">Berkadia Demo - Loan Servicing Process</h1>
          <p className="text-muted-foreground mt-2">
            Multi-system integration: Salesforce → Excel → Mainframe
          </p>
        </div>
        <Link href="/processes">
          <Button variant="outline">Back to Processes</Button>
        </Link>
      </div>

      <div className="grid gap-6 md:grid-cols-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Avg Cycle Time</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.avgCycleTime || "—"} days</div>
            <p className="text-xs text-muted-foreground">Target: 15 days</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Automation Potential</CardTitle>
            <Target className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.automation || "—"}%</div>
            <p className="text-xs text-muted-foreground">of manual tasks</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Annual Savings</CardTitle>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${stats.savings ? (stats.savings / 1000000).toFixed(1) : "—"}M
            </div>
            <p className="text-xs text-muted-foreground">Projected ROI: 340%</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Events Imported</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{stats.totalEvents || "—"}</div>
            <p className="text-xs text-muted-foreground">Across 3 systems</p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Step 1: Select Process</CardTitle>
          <CardDescription>
            Choose an existing process or this will create a new one
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Select
            onValueChange={(value) => setSelectedProcess(parseInt(value))}
            value={selectedProcess?.toString() || ""}
          >
            <SelectTrigger>
              <SelectValue placeholder="Select a process..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="new">Create New: Berkadia Loan Servicing</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      <Tabs defaultValue="import" className="space-y-4">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="import">CSV Import</TabsTrigger>
          <TabsTrigger value="email">Email Parser</TabsTrigger>
        </TabsList>

        <TabsContent value="import">
          <Card>
            <CardHeader>
              <CardTitle>Step 2: Import Demo Data from Multiple Systems</CardTitle>
              <CardDescription>
                Load realistic mortgage workflow data from Salesforce, Excel, and Mainframe
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-3">
            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Database className="h-8 w-8 text-blue-500" />
              <div className="flex-1">
                <p className="font-medium">Salesforce</p>
                <p className="text-sm text-muted-foreground">Lead origination</p>
              </div>
              {importStatus.salesforce && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Database className="h-8 w-8 text-green-500" />
              <div className="flex-1">
                <p className="font-medium">Excel</p>
                <p className="text-sm text-muted-foreground">Underwriting</p>
              </div>
              {importStatus.excel && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>

            <div className="flex items-center space-x-3 p-4 border rounded-lg">
              <Database className="h-8 w-8 text-purple-500" />
              <div className="flex-1">
                <p className="font-medium">Mainframe</p>
                <p className="text-sm text-muted-foreground">Loan servicing</p>
              </div>
              {importStatus.mainframe && <CheckCircle className="h-5 w-5 text-green-500" />}
            </div>
          </div>

          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}

          <Button
            onClick={handleImportDemo}
            disabled={!selectedProcess || importing}
            className="w-full"
            size="lg"
          >
            {importing ? (
              <>
                <Upload className="mr-2 h-4 w-4 animate-spin" />
                Importing Data...
              </>
            ) : (
              <>
                <Upload className="mr-2 h-4 w-4" />
                Import Berkadia Demo Data
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {Object.values(importStatus).some(Boolean) && (
        <>
          <Card className="border-green-500">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="h-5 w-5 text-green-500" />
                Import Successful
              </CardTitle>
              <CardDescription>
                Your demo data has been imported. Now analyze the process!
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <Link href={`/processes/${selectedProcess}`}>
                  <Button variant="outline" className="w-full">
                    View Process Details
                  </Button>
                </Link>
                <Link href={`/analytics?processId=${selectedProcess}`}>
                  <Button className="w-full">
                    <TrendingUp className="mr-2 h-4 w-4" />
                    View Analytics & AI Insights
                  </Button>
                </Link>
              </div>
              <p className="text-sm text-muted-foreground text-center">
                Discover bottlenecks, automation opportunities, and cost savings with AI-powered insights
              </p>
            </CardContent>
          </Card>

          <BerkadiaExecutiveDashboard
            stats={{
              avgCycleTime: stats.avgCycleTime || 18.5,
              targetCycleTime: 15,
              slaCompliance: 73,
              automationPotential: stats.automation || 42,
              projectedSavings: stats.savings || 2400000,
              totalLoans: 5,
              bottleneckCount: 3,
            }}
          />

          {selectedProcess && <UnifiedProcessMap processId={selectedProcess} />}
        </>
      )}
        </TabsContent>

        <TabsContent value="email">
          <EmailWorkflowParser />
        </TabsContent>
      </Tabs>
    </div>
  );
}
