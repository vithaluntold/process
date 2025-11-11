"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Check, Plus, Trash2, Loader2, Eye, EyeOff, Activity, CheckCircle2, XCircle, Clock } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";

interface LLMProvider {
  id: string;
  name: string;
  models: string[];
  configured: boolean;
  builtin?: boolean;
  configuredAt?: string;
  label?: string;
}

interface HealthCheckResult {
  provider: string;
  status: "success" | "error";
  message: string;
  responseTime?: number;
}

export default function LLMProvidersSection() {
  const { toast } = useToast();
  const [providers, setProviders] = useState<LLMProvider[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedProvider, setSelectedProvider] = useState<string | null>(null);
  const [apiKey, setApiKey] = useState("");
  const [label, setLabel] = useState("");
  const [showApiKey, setShowApiKey] = useState(false);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [healthCheckResults, setHealthCheckResults] = useState<HealthCheckResult[]>([]);
  const [runningHealthCheck, setRunningHealthCheck] = useState(false);

  useEffect(() => {
    loadProviders();
  }, []);

  async function loadProviders() {
    try {
      const response = await fetch("/api/llm-providers");
      if (response.ok) {
        const data = await response.json();
        setProviders(data.providers);
      }
    } catch (error) {
      console.error("Error loading LLM providers:", error);
      toast({
        title: "Error",
        description: "Failed to load LLM providers",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  }

  async function handleSaveProvider() {
    if (!selectedProvider || !apiKey) {
      toast({
        title: "Error",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await fetch("/api/llm-providers", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
          apiKey,
          label,
        }),
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "LLM provider configured successfully",
        });
        setDialogOpen(false);
        setApiKey("");
        setLabel("");
        setSelectedProvider(null);
        await loadProviders();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to save LLM provider",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving LLM provider:", error);
      toast({
        title: "Error",
        description: "Failed to save LLM provider",
        variant: "destructive",
      });
    } finally {
      setSaving(false);
    }
  }

  async function handleDeleteProvider(providerId: string) {
    if (!confirm("Are you sure you want to delete this provider configuration?")) {
      return;
    }

    try {
      const response = await fetch(`/api/llm-providers?provider=${providerId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Provider configuration deleted successfully",
        });
        await loadProviders();
      } else {
        toast({
          title: "Error",
          description: "Failed to delete provider configuration",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error deleting provider:", error);
      toast({
        title: "Error",
        description: "Failed to delete provider configuration",
        variant: "destructive",
      });
    }
  }

  async function runHealthCheck() {
    setRunningHealthCheck(true);
    setHealthCheckResults([]);

    try {
      const response = await fetch("/api/llm-providers/health-check");
      if (response.ok) {
        const data = await response.json();
        setHealthCheckResults(data.results);
        
        const failedCount = data.results.filter((r: HealthCheckResult) => r.status === "error").length;
        const successCount = data.results.filter((r: HealthCheckResult) => r.status === "success").length;
        
        toast({
          title: "Health Check Complete",
          description: `${successCount} provider(s) healthy, ${failedCount} error(s)`,
          variant: failedCount > 0 ? "destructive" : "default",
        });
      } else {
        toast({
          title: "Error",
          description: "Failed to run health check",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error running health check:", error);
      toast({
        title: "Error",
        description: "Failed to run health check",
        variant: "destructive",
      });
    } finally {
      setRunningHealthCheck(false);
    }
  }

  if (loading) {
    return (
      <div className="flex justify-center p-8">
        <Loader2 className="h-8 w-8 animate-spin text-brand" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold tracking-tight flex items-center gap-2">
            <Brain className="h-6 w-6 text-brand" />
            LLM Provider Configuration
          </h2>
          <p className="text-muted-foreground">
            Configure AI providers for process insights, anomaly detection, and recommendations
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button 
            size="sm" 
            variant="outline"
            className="flex items-center gap-1"
            onClick={runHealthCheck}
            disabled={runningHealthCheck || providers.filter(p => p.configured).length === 0}
          >
            {runningHealthCheck ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Activity className="h-4 w-4" />
            )}
            Health Check
          </Button>
          <Button 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Provider
          </Button>
          {dialogOpen && (
          <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
            <DialogTrigger asChild>
              <div style={{ display: 'none' }} />
            </DialogTrigger>
            <DialogContent>
            <DialogHeader>
              <DialogTitle>Configure LLM Provider</DialogTitle>
              <DialogDescription>
                Add or update API key for an LLM provider
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="space-y-2">
                <Label htmlFor="provider">Provider</Label>
                <select
                  id="provider"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={selectedProvider || ""}
                  onChange={(e) => setSelectedProvider(e.target.value)}
                >
                  <option value="">Select a provider...</option>
                  {providers
                    .filter((p) => !p.builtin)
                    .map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                </select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="label">Label (Optional)</Label>
                <Input
                  id="label"
                  placeholder="e.g., Production, Development"
                  value={label}
                  onChange={(e) => setLabel(e.target.value)}
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="apiKey">API Key</Label>
                <div className="relative">
                  <Input
                    id="apiKey"
                    type={showApiKey ? "text" : "password"}
                    placeholder="Enter API key..."
                    value={apiKey}
                    onChange={(e) => setApiKey(e.target.value)}
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowApiKey(!showApiKey)}
                  >
                    {showApiKey ? (
                      <EyeOff className="h-4 w-4" />
                    ) : (
                      <Eye className="h-4 w-4" />
                    )}
                  </Button>
                </div>
                <p className="text-xs text-muted-foreground">
                  API keys are encrypted and stored securely
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => {
                  setDialogOpen(false);
                  setApiKey("");
                  setLabel("");
                  setSelectedProvider(null);
                }}
              >
                Cancel
              </Button>
              <Button onClick={handleSaveProvider} disabled={saving}>
                {saving ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Saving...
                  </>
                ) : (
                  "Save Configuration"
                )}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
          )}
        </div>
      </div>

      <div className="grid gap-4 md:grid-cols-2">
        {providers.map((provider) => (
          <Card key={provider.id} className="relative">
            <CardHeader>
              <div className="flex items-start justify-between">
                <div className="space-y-1">
                  <CardTitle className="text-lg flex items-center gap-2">
                    {provider.name}
                    {provider.configured && (
                      <Badge variant="default" className="ml-2">
                        <Check className="h-3 w-3 mr-1" />
                        Configured
                      </Badge>
                    )}
                    {provider.builtin && (
                      <Badge variant="secondary" className="ml-2">
                        Built-in
                      </Badge>
                    )}
                  </CardTitle>
                  <CardDescription>
                    Models: {provider.models.slice(0, 2).join(", ")}
                    {provider.models.length > 2 && ` +${provider.models.length - 2} more`}
                  </CardDescription>
                </div>
                {provider.configured && !provider.builtin && (
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDeleteProvider(provider.id)}
                    className="text-destructive hover:text-destructive"
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {provider.configured ? (
                <div className="space-y-2 text-sm text-muted-foreground">
                  {provider.label && <p>Label: {provider.label}</p>}
                  {provider.configuredAt && (
                    <p>Configured: {new Date(provider.configuredAt).toLocaleDateString()}</p>
                  )}
                  {!provider.builtin && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProvider(provider.id);
                        setLabel(provider.label || "");
                        setDialogOpen(true);
                      }}
                      className="mt-2"
                    >
                      Update API Key
                    </Button>
                  )}
                </div>
              ) : (
                <div className="space-y-2">
                  <p className="text-sm text-muted-foreground">
                    No API key configured. Add one to enable this provider.
                  </p>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedProvider(provider.id);
                      setDialogOpen(true);
                    }}
                  >
                    <Plus className="h-4 w-4 mr-2" />
                    Configure
                  </Button>
                </div>
              )}
            </CardContent>
          </Card>
        ))}
      </div>

      {healthCheckResults.length > 0 && (
        <div className="space-y-4">
          <h3 className="text-lg font-semibold flex items-center gap-2">
            <Activity className="h-5 w-5 text-brand" />
            Health Check Results
          </h3>
          <div className="grid gap-3 md:grid-cols-2">
            {healthCheckResults.map((result) => {
              const provider = providers.find(p => p.id === result.provider);
              return (
                <Alert
                  key={result.provider}
                  className={result.status === "success" ? "border-green-500/50 bg-green-500/5" : "border-destructive/50 bg-destructive/5"}
                >
                  <div className="flex items-start gap-3">
                    {result.status === "success" ? (
                      <CheckCircle2 className="h-5 w-5 text-green-500 mt-0.5" />
                    ) : (
                      <XCircle className="h-5 w-5 text-destructive mt-0.5" />
                    )}
                    <div className="flex-1 space-y-1">
                      <div className="flex items-center justify-between">
                        <p className="font-semibold">
                          {provider?.name || result.provider}
                        </p>
                        {result.responseTime && (
                          <Badge variant="outline" className="flex items-center gap-1">
                            <Clock className="h-3 w-3" />
                            {result.responseTime}ms
                          </Badge>
                        )}
                      </div>
                      <AlertDescription className="text-sm">
                        {result.message}
                      </AlertDescription>
                    </div>
                  </div>
                </Alert>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}
