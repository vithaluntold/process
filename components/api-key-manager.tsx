"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Key, Copy, Trash2, CheckCircle, AlertCircle, Eye, EyeOff } from "lucide-react";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

interface ApiKey {
  id: number;
  label: string;
  keyPrefix: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  status: string;
}

interface NewKeyResult {
  apiKey: string;
  encryptionKey: string;
  record: ApiKey;
}

export function ApiKeyManager() {
  const [apiKeys, setApiKeys] = useState<ApiKey[]>([]);
  const [loading, setLoading] = useState(true);
  const [generating, setGenerating] = useState(false);
  const [newKeyLabel, setNewKeyLabel] = useState("");
  const [expiryDays, setExpiryDays] = useState("365");
  const [showNewKeyDialog, setShowNewKeyDialog] = useState(false);
  const [newKeyData, setNewKeyData] = useState<NewKeyResult | null>(null);
  const [revokeKeyId, setRevokeKeyId] = useState<number | null>(null);
  const [showApiKey, setShowApiKey] = useState(false);
  const [showEncryptionKey, setShowEncryptionKey] = useState(false);

  useEffect(() => {
    fetchApiKeys();
  }, []);

  async function fetchApiKeys() {
    setLoading(true);
    try {
      const response = await fetch("/api/task-mining/api-keys");
      if (response.ok) {
        const data = await response.json();
        setApiKeys(data.keys || []);
      }
    } catch (error) {
      console.error("Error fetching API keys:", error);
      toast.error("Failed to load API keys");
    } finally {
      setLoading(false);
    }
  }

  async function generateApiKey() {
    if (!newKeyLabel.trim()) {
      toast.error("Please enter a label for the API key");
      return;
    }

    setGenerating(true);
    try {
      const response = await fetch("/api/task-mining/api-keys", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label: newKeyLabel,
          expiresInDays: parseInt(expiryDays) || 365,
        }),
      });

      if (response.ok) {
        const data = await response.json();
        setNewKeyData(data);
        setShowNewKeyDialog(true);
        setNewKeyLabel("");
        setExpiryDays("365");
        await fetchApiKeys();
        toast.success("API key generated successfully");
      } else {
        const error = await response.json();
        toast.error(error.error || "Failed to generate API key");
      }
    } catch (error) {
      console.error("Error generating API key:", error);
      toast.error("Failed to generate API key");
    } finally {
      setGenerating(false);
    }
  }

  async function revokeApiKey(keyId: number) {
    try {
      const response = await fetch(`/api/task-mining/api-keys?keyId=${keyId}`, {
        method: "DELETE",
      });

      if (response.ok) {
        toast.success("API key revoked successfully");
        await fetchApiKeys();
      } else {
        toast.error("Failed to revoke API key");
      }
    } catch (error) {
      console.error("Error revoking API key:", error);
      toast.error("Failed to revoke API key");
    } finally {
      setRevokeKeyId(null);
    }
  }

  function copyToClipboard(text: string, label: string) {
    navigator.clipboard.writeText(text);
    toast.success(`${label} copied to clipboard`);
  }

  function formatDate(dateString: string | null) {
    if (!dateString) return "Never";
    return new Date(dateString).toLocaleDateString();
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <CardTitle>Generate New API Key</CardTitle>
          <CardDescription>
            Create a new API key for the Desktop Agent. The key will be shown only once.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="key-label">Key Label</Label>
              <Input
                id="key-label"
                placeholder="e.g., My Laptop, Work PC"
                value={newKeyLabel}
                onChange={(e) => setNewKeyLabel(e.target.value)}
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="expiry-days">Expires In (days)</Label>
              <Input
                id="expiry-days"
                type="number"
                placeholder="365"
                value={expiryDays}
                onChange={(e) => setExpiryDays(e.target.value)}
              />
            </div>
          </div>

          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <strong>Important:</strong> Make sure MASTER_ENCRYPTION_KEY environment variable is set before generating keys.
              See DESKTOP_AGENT_SETUP.md for setup instructions.
            </AlertDescription>
          </Alert>

          <Button onClick={generateApiKey} disabled={generating || !newKeyLabel.trim()}>
            <Key className="mr-2 h-4 w-4" />
            {generating ? "Generating..." : "Generate API Key"}
          </Button>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Your API Keys</CardTitle>
          <CardDescription>
            Manage your Desktop Agent API keys. Active keys can transmit activity data.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {loading ? (
            <p className="text-muted-foreground">Loading API keys...</p>
          ) : apiKeys.length === 0 ? (
            <p className="text-muted-foreground">No API keys generated yet.</p>
          ) : (
            <div className="space-y-3">
              {apiKeys.map((key) => (
                <div
                  key={key.id}
                  className="flex items-center justify-between p-4 border rounded-lg"
                >
                  <div className="flex-1">
                    <div className="flex items-center gap-2">
                      <p className="font-medium">{key.label}</p>
                      <Badge variant={key.status === "active" ? "default" : "secondary"}>
                        {key.status}
                      </Badge>
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      Key: {key.keyPrefix}••••••••••••
                    </p>
                    <div className="flex gap-4 text-xs text-muted-foreground mt-2">
                      <span>Created: {formatDate(key.createdAt)}</span>
                      <span>Last used: {formatDate(key.lastUsedAt)}</span>
                      {key.expiresAt && <span>Expires: {formatDate(key.expiresAt)}</span>}
                    </div>
                  </div>
                  <Button
                    variant="destructive"
                    size="sm"
                    onClick={() => setRevokeKeyId(key.id)}
                    disabled={key.status === "revoked"}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      <Dialog open={showNewKeyDialog} onOpenChange={setShowNewKeyDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <CheckCircle className="h-5 w-5 text-green-500" />
              API Key Generated Successfully
            </DialogTitle>
            <DialogDescription>
              Save these credentials now. They will not be shown again.
            </DialogDescription>
          </DialogHeader>

          {newKeyData && (
            <div className="space-y-4">
              <Alert variant="destructive">
                <AlertCircle className="h-4 w-4" />
                <AlertDescription>
                  <strong>Warning:</strong> Copy both keys now. You won't be able to see them again.
                </AlertDescription>
              </Alert>

              <div className="space-y-3">
                <div className="space-y-2">
                  <Label>API Key</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={newKeyData.apiKey}
                        type={showApiKey ? "text" : "password"}
                        readOnly
                        className="pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowApiKey(!showApiKey)}
                      >
                        {showApiKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(newKeyData.apiKey, "API Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>

                <div className="space-y-2">
                  <Label>Encryption Key (Optional - for encrypted data transmission)</Label>
                  <div className="flex gap-2">
                    <div className="relative flex-1">
                      <Input
                        value={newKeyData.encryptionKey}
                        type={showEncryptionKey ? "text" : "password"}
                        readOnly
                        className="pr-10"
                      />
                      <Button
                        variant="ghost"
                        size="sm"
                        className="absolute right-1 top-1/2 -translate-y-1/2"
                        onClick={() => setShowEncryptionKey(!showEncryptionKey)}
                      >
                        {showEncryptionKey ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                      </Button>
                    </div>
                    <Button
                      variant="outline"
                      onClick={() => copyToClipboard(newKeyData.encryptionKey, "Encryption Key")}
                    >
                      <Copy className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              <div className="bg-muted p-4 rounded-lg">
                <p className="text-sm font-medium mb-2">Next Steps:</p>
                <ol className="text-sm text-muted-foreground space-y-1 list-decimal list-inside">
                  <li>Copy both keys above</li>
                  <li>Open your Desktop Agent settings</li>
                  <li>Paste the API Key in the authentication field</li>
                  <li>Optionally paste the Encryption Key for secure transmission</li>
                  <li>Save and start the agent</li>
                </ol>
              </div>

              <Button onClick={() => setShowNewKeyDialog(false)} className="w-full">
                I've Saved the Keys
              </Button>
            </div>
          )}
        </DialogContent>
      </Dialog>

      <AlertDialog open={revokeKeyId !== null} onOpenChange={() => setRevokeKeyId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke API Key?</AlertDialogTitle>
            <AlertDialogDescription>
              This will immediately stop this API key from working. The Desktop Agent using this key
              will no longer be able to send activity data.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={() => revokeKeyId && revokeApiKey(revokeKeyId)}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Revoke Key
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
