"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { FileText, Download, Trash2, FileSpreadsheet, FileJson } from "lucide-react";
import { toast } from "sonner";

interface Report {
  id: number;
  title: string;
  type: string;
  format: string;
  status: string;
  createdAt: string;
  metadata: any;
}

interface Process {
  id: number;
  name: string;
}

export default function ReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [processes, setProcesses] = useState<Process[]>([]);
  const [selectedProcessId, setSelectedProcessId] = useState("");
  const [reportTitle, setReportTitle] = useState("");
  const [reportType, setReportType] = useState("summary");
  const [reportFormat, setReportFormat] = useState("pdf");
  const [generating, setGenerating] = useState(false);

  useEffect(() => {
    loadReports();
    loadProcesses();
  }, []);

  async function loadReports() {
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data);
      }
    } catch (error) {
      console.error("Failed to load reports:", error);
    }
  }

  async function loadProcesses() {
    try {
      const res = await fetch("/api/processes");
      if (res.ok) {
        const data = await res.json();
        setProcesses(data);
      }
    } catch (error) {
      console.error("Failed to load processes:", error);
    }
  }

  async function generateReport() {
    if (!reportTitle) {
      toast.error("Please enter a report title");
      return;
    }

    setGenerating(true);
    try {
      const res = await fetch("/api/reports/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          processId: selectedProcessId ? parseInt(selectedProcessId) : null,
          title: reportTitle,
          type: reportType,
          format: reportFormat,
        }),
      });

      if (res.ok) {
        toast.success("Report generated successfully!");
        setReportTitle("");
        loadReports();
      } else {
        toast.error("Failed to generate report");
      }
    } catch (error) {
      console.error("Failed to generate report:", error);
      toast.error("Failed to generate report");
    } finally {
      setGenerating(false);
    }
  }

  async function deleteReport(reportId: number) {
    try {
      const res = await fetch("/api/reports", {
        method: "DELETE",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ reportId }),
      });

      if (res.ok) {
        toast.success("Report deleted");
        loadReports();
      } else {
        toast.error("Failed to delete report");
      }
    } catch (error) {
      console.error("Failed to delete report:", error);
      toast.error("Failed to delete report");
    }
  }

  async function exportData(format: string) {
    if (!selectedProcessId) {
      toast.error("Please select a process");
      return;
    }

    try {
      const res = await fetch(`/api/reports/export?processId=${selectedProcessId}&format=${format}`);
      
      if (res.ok) {
        const blob = await res.blob();
        const url = window.URL.createObjectURL(blob);
        const a = document.createElement("a");
        a.href = url;
        a.download = `export.${format}`;
        document.body.appendChild(a);
        a.click();
        window.URL.revokeObjectURL(url);
        document.body.removeChild(a);
        toast.success(`Exported as ${format.toUpperCase()}`);
      } else {
        toast.error("Failed to export data");
      }
    } catch (error) {
      console.error("Failed to export:", error);
      toast.error("Failed to export data");
    }
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">Reports & Exports</h1>
          <p className="text-muted-foreground mt-2">
            Generate comprehensive reports and export process data
          </p>
        </div>

        <Tabs defaultValue="generate" className="space-y-4">
          <TabsList>
            <TabsTrigger value="generate">Generate Report</TabsTrigger>
            <TabsTrigger value="history">Report History</TabsTrigger>
            <TabsTrigger value="export">Quick Export</TabsTrigger>
          </TabsList>

          <TabsContent value="generate">
            <Card>
              <CardHeader>
                <CardTitle>Generate New Report</CardTitle>
                <CardDescription>
                  Create custom reports with various formats and templates
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="title">Report Title</Label>
                  <Input
                    id="title"
                    placeholder="e.g., Monthly Process Performance Report"
                    value={reportTitle}
                    onChange={(e) => setReportTitle(e.target.value)}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process">Process (Optional)</Label>
                  <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
                    <SelectTrigger>
                      <SelectValue placeholder="All processes" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">All processes</SelectItem>
                      {processes.map((process) => (
                        <SelectItem key={process.id} value={process.id.toString()}>
                          {process.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="type">Report Type</Label>
                    <Select value={reportType} onValueChange={setReportType}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="summary">Executive Summary</SelectItem>
                        <SelectItem value="detailed">Detailed Analysis</SelectItem>
                        <SelectItem value="performance">Performance Metrics</SelectItem>
                        <SelectItem value="compliance">Compliance Report</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="format">Format</Label>
                    <Select value={reportFormat} onValueChange={setReportFormat}>
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="pdf">PDF Document</SelectItem>
                        <SelectItem value="excel">Excel Spreadsheet</SelectItem>
                        <SelectItem value="powerpoint">PowerPoint Presentation</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <Button onClick={generateReport} disabled={generating} className="w-full">
                  {generating ? "Generating..." : "Generate Report"}
                </Button>
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="history">
            <Card>
              <CardHeader>
                <CardTitle>Generated Reports</CardTitle>
                <CardDescription>View and download previously generated reports</CardDescription>
              </CardHeader>
              <CardContent>
                {reports.length === 0 ? (
                  <div className="text-center py-8 text-muted-foreground">
                    No reports generated yet. Create your first report!
                  </div>
                ) : (
                  <div className="space-y-3">
                    {reports.map((report) => (
                      <div
                        key={report.id}
                        className="flex items-center justify-between p-4 border rounded-lg"
                      >
                        <div className="flex items-center gap-4">
                          <FileText className="h-10 w-10 text-muted-foreground" />
                          <div>
                            <h3 className="font-medium">{report.title}</h3>
                            <div className="flex items-center gap-2 mt-1">
                              <Badge variant="secondary">{report.type}</Badge>
                              <Badge variant="outline">{report.format}</Badge>
                              <span className="text-xs text-muted-foreground">
                                {new Date(report.createdAt).toLocaleDateString()}
                              </span>
                            </div>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={async () => {
                              try {
                                const res = await fetch(`/api/reports/download/${report.id}`);
                                if (res.ok) {
                                  const blob = await res.blob();
                                  const url = window.URL.createObjectURL(blob);
                                  const a = document.createElement("a");
                                  a.href = url;
                                  a.download = `${report.title}.${report.format === 'excel' ? 'xlsx' : report.format === 'powerpoint' ? 'pptx' : 'pdf'}`;
                                  document.body.appendChild(a);
                                  a.click();
                                  window.URL.revokeObjectURL(url);
                                  document.body.removeChild(a);
                                  toast.success("Report downloaded!");
                                } else {
                                  toast.error("Failed to download report");
                                }
                              } catch (error) {
                                console.error("Download error:", error);
                                toast.error("Failed to download report");
                              }
                            }}
                          >
                            <Download className="h-4 w-4 mr-2" />
                            Download
                          </Button>
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteReport(report.id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>
          </TabsContent>

          <TabsContent value="export">
            <Card>
              <CardHeader>
                <CardTitle>Quick Data Export</CardTitle>
                <CardDescription>
                  Export raw process data in CSV or JSON format
                </CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label>Select Process</Label>
                  <Select value={selectedProcessId} onValueChange={setSelectedProcessId}>
                    <SelectTrigger>
                      <SelectValue placeholder="Choose a process" />
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

                <div className="grid grid-cols-2 gap-4">
                  <Button
                    variant="outline"
                    onClick={() => exportData("csv")}
                    disabled={!selectedProcessId}
                  >
                    <FileSpreadsheet className="h-4 w-4 mr-2" />
                    Export as CSV
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => exportData("json")}
                    disabled={!selectedProcessId}
                  >
                    <FileJson className="h-4 w-4 mr-2" />
                    Export as JSON
                  </Button>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </AppLayout>
  );
}
