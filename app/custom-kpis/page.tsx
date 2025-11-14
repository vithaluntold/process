"use client";

import { useState, useEffect } from "react";
import AppLayout from "@/components/app-layout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Target, TrendingUp, AlertTriangle, Trash2, Plus } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface CustomKPI {
  id: number;
  name: string;
  description: string | null;
  metric: string;
  calculation: string;
  currentValue: number | null;
  threshold: number | null;
  processId: number | null;
}

export default function CustomKPIsPage() {
  const [kpis, setKpis] = useState<CustomKPI[]>([]);
  const [processes, setProcesses] = useState<any[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    formula: "",
    processId: "",
    threshold: "",
  });

  useEffect(() => {
    loadKPIs();
    loadProcesses();
  }, []);

  async function loadKPIs() {
    try {
      const res = await fetch("/api/custom-kpis");
      if (res.ok) {
        const data = await res.json();
        setKpis(data);
      }
    } catch (error) {
      console.error("Failed to load KPIs:", error);
    }
  }

  async function loadProcesses() {
    try {
      const res = await fetch("/api/processes");
      if (res.ok) {
        const data = await res.json();
        setProcesses(data.processes || []);
      }
    } catch (error) {
      console.error("Failed to load processes:", error);
      setProcesses([]);
    }
  }

  async function createKPI() {
    if (!formData.name || !formData.formula) {
      toast.error("Please fill in required fields");
      return;
    }

    try {
      const res = await apiClient.post("/api/custom-kpis", {
        name: formData.name,
        description: formData.description || null,
        formula: formData.formula,
        processId: formData.processId ? parseInt(formData.processId) : null,
        threshold: formData.threshold ? parseFloat(formData.threshold) : null,
      });

      if (res.ok) {
        toast.success("KPI created successfully!");
        setDialogOpen(false);
        setFormData({
          name: "",
          description: "",
          formula: "",
          processId: "",
          threshold: "",
        });
        loadKPIs();
      } else {
        toast.error("Failed to create KPI");
      }
    } catch (error) {
      console.error("Failed to create KPI:", error);
      toast.error("Failed to create KPI");
    }
  }

  async function deleteKPI(kpiId: number) {
    try {
      const res = await apiClient.delete("/api/custom-kpis", { kpiId });

      if (res.ok) {
        toast.success("KPI deleted");
        loadKPIs();
      } else {
        toast.error("Failed to delete KPI");
      }
    } catch (error) {
      console.error("Failed to delete KPI:", error);
      toast.error("Failed to delete KPI");
    }
  }

  function getKPIStatus(kpi: CustomKPI) {
    if (!kpi.currentValue || !kpi.threshold) return "neutral";
    
    if (kpi.currentValue > kpi.threshold) return "danger";
    if (kpi.currentValue > kpi.threshold * 0.9) return "warning";
    
    return "success";
  }

  return (
    <AppLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Custom KPI Builder</h1>
            <p className="text-muted-foreground mt-2">
              Define and track custom key performance indicators
            </p>
          </div>
          
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Create KPI
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Create Custom KPI</DialogTitle>
                <DialogDescription>
                  Define a new key performance indicator for your processes
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">KPI Name *</Label>
                  <Input
                    id="name"
                    placeholder="e.g., Average Resolution Time"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    placeholder="What does this KPI measure?"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="formula">Formula/Calculation *</Label>
                  <Input
                    id="formula"
                    placeholder="e.g., SUM(duration) / COUNT(cases)"
                    value={formData.formula}
                    onChange={(e) => setFormData({ ...formData, formula: e.target.value })}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="process">Process (Optional)</Label>
                  <Select value={formData.processId} onValueChange={(value) => setFormData({ ...formData, processId: value })}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select a process" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All processes</SelectItem>
                      {processes.map((process) => (
                        <SelectItem key={process.id} value={process.id.toString()}>
                          {process.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="threshold">Alert Threshold</Label>
                  <Input
                    id="threshold"
                    type="number"
                    placeholder="e.g., 100"
                    value={formData.threshold}
                    onChange={(e) => setFormData({ ...formData, threshold: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Alert will trigger when current value exceeds this threshold
                  </p>
                </div>

                <Button onClick={createKPI} className="w-full">
                  Create KPI
                </Button>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {kpis.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Target className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h3 className="text-lg font-medium mb-2">No Custom KPIs</h3>
              <p className="text-muted-foreground mb-4">
                Create your first custom KPI to start tracking performance metrics
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
            {kpis.map((kpi) => {
              const status = getKPIStatus(kpi);
              return (
                <Card key={kpi.id}>
                  <CardHeader>
                    <div className="flex items-start justify-between">
                      <div>
                        <CardTitle className="text-lg">{kpi.name}</CardTitle>
                        {kpi.description && (
                          <CardDescription className="mt-1">
                            {kpi.description}
                          </CardDescription>
                        )}
                      </div>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => deleteKPI(kpi.id)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div className="flex items-center justify-between">
                      <span className="text-sm text-muted-foreground">Current Value</span>
                      <span className={`text-2xl font-bold ${
                        status === "success" ? "text-green-600" :
                        status === "warning" ? "text-yellow-600" :
                        status === "danger" ? "text-red-600" :
                        ""
                      }`}>
                        {kpi.currentValue ?? "N/A"}
                      </span>
                    </div>

                    {kpi.threshold && (
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground flex items-center gap-1">
                          <AlertTriangle className="h-3 w-3" />
                          Threshold
                        </span>
                        <span>{kpi.threshold}</span>
                      </div>
                    )}

                    <div className="pt-2 border-t text-xs text-muted-foreground">
                      <strong>Metric:</strong> {kpi.metric}
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
