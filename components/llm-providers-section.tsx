"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Brain, Check, Plus, Trash2, Loader2, Eye, EyeOff, Activity, CheckCircle2, XCircle, Clock, Search } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { apiClient } from "@/lib/api-client";
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
  const [providerSearchQuery, setProviderSearchQuery] = useState("");
  const [validating, setValidating] = useState(false);
  const [validationStatus, setValidationStatus] = useState<"idle" | "success" | "error">("idle");
  const [validationMessage, setValidationMessage] = useState("");
  const [addCustomProviderDialogOpen, setAddCustomProviderDialogOpen] = useState(false);
  const [customProviderName, setCustomProviderName] = useState("");
  const [customProviderBaseUrl, setCustomProviderBaseUrl] = useState("");
  const [customProviderModels, setCustomProviderModels] = useState("");
  const [savingCustomProvider, setSavingCustomProvider] = useState(false);

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

  async function validateApiKey() {
    if (!selectedProvider || !apiKey) {
      return;
    }

    setValidating(true);
    setValidationStatus("idle");
    setValidationMessage("");

    try {
      const response = await apiClient.post("/api/llm-providers/validate", {
        provider: selectedProvider,
        apiKey,
      });

      const data = await response.json();

      if (data.valid) {
        setValidationStatus("success");
        setValidationMessage(data.message || "API key verified successfully");
        toast({
          title: "Success",
          description: data.message || "API key verified successfully",
        });
      } else {
        setValidationStatus("error");
        setValidationMessage(data.message || "Invalid API key. Please check and try again.");
        toast({
          title: "Invalid API Key",
          description: data.message || "Invalid API key. Please check and try again.",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error validating API key:", error);
      setValidationStatus("error");
      setValidationMessage("Failed to validate API key. Please try again.");
      toast({
        title: "Validation Error",
        description: "Failed to validate API key. Please try again.",
        variant: "destructive",
      });
    } finally {
      setValidating(false);
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

    // Only proceed if validation was successful
    if (validationStatus !== "success") {
      toast({
        title: "Error",
        description: "Please validate the API key before saving",
        variant: "destructive",
      });
      return;
    }

    setSaving(true);
    try {
      const response = await apiClient.post("/api/llm-providers", {
        provider: selectedProvider,
        apiKey,
        label,
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
        setValidationStatus("idle");
        setValidationMessage("");
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

  async function handleSaveCustomProvider() {
    if (!customProviderName || !customProviderBaseUrl) {
      toast({
        title: "Error",
        description: "Provider name and base URL are required",
        variant: "destructive",
      });
      return;
    }

    setSavingCustomProvider(true);
    try {
      const modelsArray = customProviderModels
        .split(",")
        .map((m) => m.trim())
        .filter((m) => m.length > 0);

      const response = await apiClient.post("/api/llm-providers", {
        name: customProviderName,
        baseUrl: customProviderBaseUrl,
        models: modelsArray.length > 0 ? modelsArray : ["default-model"],
        compatibilityType: "openai_compatible",
      });

      if (response.ok) {
        toast({
          title: "Success",
          description: "Custom provider added successfully",
        });
        setAddCustomProviderDialogOpen(false);
        setCustomProviderName("");
        setCustomProviderBaseUrl("");
        setCustomProviderModels("");
        await loadProviders();
      } else {
        const data = await response.json();
        toast({
          title: "Error",
          description: data.error || "Failed to add custom provider",
          variant: "destructive",
        });
      }
    } catch (error) {
      console.error("Error saving custom provider:", error);
      toast({
        title: "Error",
        description: "Failed to add custom provider",
        variant: "destructive",
      });
    } finally {
      setSavingCustomProvider(false);
    }
  }

  async function handleDeleteProvider(providerId: string) {
    if (!confirm("Are you sure you want to delete this provider configuration?")) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/llm-providers?provider=${providerId}`);

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
            variant="outline"
            className="flex items-center gap-1"
            onClick={() => setAddCustomProviderDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Add Custom Provider
          </Button>
          <Button 
            size="sm" 
            className="flex items-center gap-1"
            onClick={() => setDialogOpen(true)}
          >
            <Plus className="h-4 w-4" />
            Configure API Key
          </Button>
          {addCustomProviderDialogOpen && (
            <Dialog open={addCustomProviderDialogOpen} onOpenChange={setAddCustomProviderDialogOpen}>
              <DialogTrigger asChild>
                <div style={{ display: 'none' }} />
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle>Add Custom LLM Provider</DialogTitle>
                  <DialogDescription>
                    Add a new OpenAI-compatible LLM provider (Claude, Gemini, Cohere, etc.)
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div className="space-y-2">
                    <Label htmlFor="customProviderName">Provider Name *</Label>
                    <Input
                      id="customProviderName"
                      placeholder="e.g., Anthropic Claude, Google Gemini"
                      value={customProviderName}
                      onChange={(e) => setCustomProviderName(e.target.value)}
                    />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customProviderBaseUrl">Base URL *</Label>
                    <Input
                      id="customProviderBaseUrl"
                      placeholder="e.g., https://api.anthropic.com/v1"
                      value={customProviderBaseUrl}
                      onChange={(e) => setCustomProviderBaseUrl(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      The API base URL (without /models or /chat/completions)
                    </p>
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="customProviderModels">Models (Optional)</Label>
                    <Input
                      id="customProviderModels"
                      placeholder="e.g., claude-3-5-sonnet, claude-3-opus"
                      value={customProviderModels}
                      onChange={(e) => setCustomProviderModels(e.target.value)}
                    />
                    <p className="text-xs text-muted-foreground">
                      Comma-separated list of model IDs
                    </p>
                  </div>
                  <Alert>
                    <Brain className="h-4 w-4" />
                    <AlertDescription className="text-sm">
                      This provider will be available to all users in your organization. Configure your API key after adding the provider.
                    </AlertDescription>
                  </Alert>
                </div>
                <DialogFooter>
                  <Button
                    variant="outline"
                    onClick={() => {
                      setAddCustomProviderDialogOpen(false);
                      setCustomProviderName("");
                      setCustomProviderBaseUrl("");
                      setCustomProviderModels("");
                    }}
                  >
                    Cancel
                  </Button>
                  <Button onClick={handleSaveCustomProvider} disabled={savingCustomProvider}>
                    {savingCustomProvider ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Adding...
                      </>
                    ) : (
                      "Add Provider"
                    )}
                  </Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          )}
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
                <div className="relative">
                  <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search providers..."
                    value={providerSearchQuery}
                    onChange={(e) => setProviderSearchQuery(e.target.value)}
                    className="pl-9 mb-2"
                  />
                </div>
                <select
                  id="provider"
                  className="w-full px-3 py-2 rounded-md border border-input bg-background text-sm"
                  value={selectedProvider || ""}
                  onChange={(e) => {
                    setSelectedProvider(e.target.value);
                    setValidationStatus("idle");
                    setValidationMessage("");
                  }}
                >
                  <option value="">Select a provider...</option>
                  {providers
                    .filter((p) => !p.builtin)
                    .filter((p) => 
                      p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()) ||
                      p.id.toLowerCase().includes(providerSearchQuery.toLowerCase())
                    )
                    .map((provider) => (
                      <option key={provider.id} value={provider.id}>
                        {provider.name}
                      </option>
                    ))}
                </select>
                {providerSearchQuery && providers.filter((p) => !p.builtin && 
                  (p.name.toLowerCase().includes(providerSearchQuery.toLowerCase()) ||
                   p.id.toLowerCase().includes(providerSearchQuery.toLowerCase()))
                ).length === 0 && (
                  <p className="text-sm text-muted-foreground mt-1">
                    No providers found matching "{providerSearchQuery}"
                  </p>
                )}
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
                    onChange={(e) => {
                      setApiKey(e.target.value);
                      setValidationStatus("idle");
                      setValidationMessage("");
                    }}
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
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={validateApiKey}
                    disabled={!selectedProvider || !apiKey || validating}
                    className="mt-1"
                  >
                    {validating ? (
                      <>
                        <Loader2 className="mr-2 h-3 w-3 animate-spin" />
                        Validating...
                      </>
                    ) : (
                      <>
                        <CheckCircle2 className="mr-2 h-3 w-3" />
                        Validate API Key
                      </>
                    )}
                  </Button>
                  {validationStatus === "success" && (
                    <Badge variant="default" className="bg-green-500">
                      <Check className="h-3 w-3 mr-1" />
                      Verified
                    </Badge>
                  )}
                  {validationStatus === "error" && (
                    <Badge variant="destructive">
                      <XCircle className="h-3 w-3 mr-1" />
                      Invalid
                    </Badge>
                  )}
                </div>
                {validationMessage && (
                  <Alert className={validationStatus === "success" ? "border-green-500 bg-green-500/10" : "border-destructive bg-destructive/10"}>
                    {validationStatus === "success" ? (
                      <CheckCircle2 className="h-4 w-4 text-green-500" />
                    ) : (
                      <XCircle className="h-4 w-4 text-destructive" />
                    )}
                    <AlertDescription className="text-sm">
                      {validationMessage}
                    </AlertDescription>
                  </Alert>
                )}
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
              <Button 
                onClick={handleSaveProvider} 
                disabled={saving || validationStatus !== "success"}
              >
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
