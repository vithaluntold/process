"use client";

import { useState, useEffect } from "react";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Settings, Save, Loader2, CheckCircle2, AlertCircle, Info } from "lucide-react";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";

interface LLMProvider {
  id: string;
  name: string;
  available: boolean;
}

interface LLMSettings {
  currentProvider: string;
  availableProviders: LLMProvider[];
}

export default function SettingsPage() {
  const [settings, setSettings] = useState<LLMSettings | null>(null);
  const [selectedProvider, setSelectedProvider] = useState<string>("");
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saveStatus, setSaveStatus] = useState<"success" | "error" | null>(null);

  useEffect(() => {
    loadSettings();
  }, []);

  async function loadSettings() {
    try {
      const response = await fetch("/api/settings/llm");
      if (response.ok) {
        const data = await response.json();
        setSettings(data);
        setSelectedProvider(data.currentProvider);
      }
    } catch (error) {
      console.error("Error loading settings:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleSave() {
    if (!selectedProvider || selectedProvider === settings?.currentProvider) {
      return;
    }

    setSaving(true);
    setSaveStatus(null);

    try {
      const response = await fetch("/api/settings/llm", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          provider: selectedProvider,
        }),
      });

      if (response.ok) {
        setSaveStatus("success");
        await loadSettings();
        setTimeout(() => setSaveStatus(null), 3000);
      } else {
        setSaveStatus("error");
      }
    } catch (error) {
      console.error("Error saving settings:", error);
      setSaveStatus("error");
    } finally {
      setSaving(false);
    }
  }

  const hasUnsavedChanges = selectedProvider !== settings?.currentProvider;

  if (loading) {
    return (
      <div className="flex items-center justify-center h-[50vh]">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  return (
    <div className="p-4 md:p-6 lg:p-8 space-y-6">
      <div>
        <div className="flex items-center gap-2 mb-2">
          <Settings className="h-6 w-6" />
          <h1 className="text-3xl font-bold">Settings</h1>
        </div>
        <p className="text-muted-foreground">
          Configure your EPI-Q platform preferences
        </p>
      </div>

      <Card className="p-6">
        <div className="space-y-6">
          <div>
            <h2 className="text-xl font-semibold mb-2">AI & LLM Configuration</h2>
            <p className="text-sm text-muted-foreground">
              Select which AI provider to use for process insights, anomaly detection, and recommendations
            </p>
          </div>

          <Alert>
            <Info className="h-4 w-4" />
            <AlertDescription>
              <strong>Replit AI (Free)</strong> is enabled by default and requires no setup.
              To use other providers, you'll need to add their API keys as environment secrets.
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="llm-provider">AI Provider</Label>
            <Select
              value={selectedProvider}
              onValueChange={setSelectedProvider}
            >
              <SelectTrigger id="llm-provider" className="w-full max-w-md">
                <SelectValue placeholder="Select an AI provider" />
              </SelectTrigger>
              <SelectContent>
                {settings?.availableProviders.map((provider) => (
                  <SelectItem
                    key={provider.id}
                    value={provider.id}
                    disabled={!provider.available}
                  >
                    <div className="flex items-center justify-between gap-2">
                      <span>{provider.name}</span>
                      {provider.available ? (
                        <Badge variant="default" className="ml-2">
                          Available
                        </Badge>
                      ) : (
                        <Badge variant="secondary" className="ml-2">
                          Requires API Key
                        </Badge>
                      )}
                    </div>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="bg-muted p-4 rounded-lg space-y-2">
            <h3 className="font-medium text-sm">Provider Details</h3>
            <div className="text-sm text-muted-foreground space-y-1">
              <p>
                <strong>Replit AI:</strong> Free, no setup required. Uses GPT-4o models.
              </p>
              <p>
                <strong>OpenAI:</strong> Requires <code className="bg-background px-1 rounded">OPENAI_API_KEY</code> environment variable
              </p>
              <p>
                <strong>Anthropic:</strong> Requires <code className="bg-background px-1 rounded">ANTHROPIC_API_KEY</code> environment variable
              </p>
              <p>
                <strong>Google Gemini:</strong> Requires <code className="bg-background px-1 rounded">GOOGLE_AI_API_KEY</code> or <code className="bg-background px-1 rounded">GEMINI_API_KEY</code> environment variable
              </p>
              <p>
                <strong>Mistral AI:</strong> Requires <code className="bg-background px-1 rounded">MISTRAL_API_KEY</code> environment variable
              </p>
              <p>
                <strong>DeepSeek:</strong> Requires <code className="bg-background px-1 rounded">DEEPSEEK_API_KEY</code> environment variable
              </p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saving}
              className="min-w-[120px]"
            >
              {saving ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Save className="mr-2 h-4 w-4" />
                  Save Changes
                </>
              )}
            </Button>

            {saveStatus === "success" && (
              <div className="flex items-center text-green-600">
                <CheckCircle2 className="mr-2 h-4 w-4" />
                <span className="text-sm">Settings saved successfully</span>
              </div>
            )}

            {saveStatus === "error" && (
              <div className="flex items-center text-destructive">
                <AlertCircle className="mr-2 h-4 w-4" />
                <span className="text-sm">Failed to save settings</span>
              </div>
            )}
          </div>

          <Alert variant="default" className="border-blue-200 bg-blue-50 dark:bg-blue-950/20">
            <Info className="h-4 w-4 text-blue-600" />
            <AlertDescription className="text-blue-800 dark:text-blue-200">
              <strong>Security Note:</strong> API keys are stored as environment variables, not in the database.
              This ensures your keys remain secure and are never exposed to the frontend.
              Contact your administrator to add or update API keys.
            </AlertDescription>
          </Alert>
        </div>
      </Card>
    </div>
  );
}
