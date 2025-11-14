"use client";

import { useState, useEffect } from "react";
import { AppLayout } from "@/components/app-layout";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Mail, Plus, Loader2, Copy, Check, XCircle } from "lucide-react";
import { toast } from "sonner";
import { formatDistanceToNow } from "date-fns";

interface Invitation {
  id: number;
  email: string;
  role: string;
  teamId: number | null;
  status: string;
  expiresAt: string;
  acceptedAt: string | null;
  metadata: any;
  createdAt: string;
}

interface Team {
  id: number;
  name: string;
}

export default function InvitationsPage() {
  const [invitations, setInvitations] = useState<Invitation[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [formData, setFormData] = useState({
    email: "",
    role: "employee",
    teamId: "",
    firstName: "",
    lastName: "",
  });
  const [saving, setSaving] = useState(false);
  const [inviteUrl, setInviteUrl] = useState("");
  const [copiedId, setCopiedId] = useState<number | null>(null);

  useEffect(() => {
    fetchInvitations();
    fetchTeams();
  }, []);

  const fetchInvitations = async () => {
    try {
      const response = await fetch("/api/invitations");
      if (!response.ok) throw new Error("Failed to fetch invitations");
      const data = await response.json();
      setInvitations(data.invitations);
    } catch (error) {
      console.error("Error fetching invitations:", error);
      toast.error("Failed to load invitations");
    } finally {
      setLoading(false);
    }
  };

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data.teams || []);
    } catch (error) {
      console.error("Error fetching teams:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        email: formData.email,
        role: formData.role,
        teamId: formData.teamId ? parseInt(formData.teamId) : undefined,
        firstName: formData.firstName || undefined,
        lastName: formData.lastName || undefined,
      };

      const response = await fetch("/api/invitations", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to create invitation");
      }

      const result = await response.json();
      toast.success("Invitation sent successfully");
      setInviteUrl(result.inviteUrl);
      resetForm();
      fetchInvitations();
    } catch (error: any) {
      console.error("Error creating invitation:", error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleRevoke = async (invitationId: number) => {
    if (!confirm("Are you sure you want to revoke this invitation?")) {
      return;
    }

    try {
      const response = await fetch(`/api/invitations/${invitationId}`, {
        method: "DELETE",
      });

      if (!response.ok) throw new Error("Failed to revoke invitation");

      toast.success("Invitation revoked successfully");
      fetchInvitations();
    } catch (error) {
      console.error("Error revoking invitation:", error);
      toast.error("Failed to revoke invitation");
    }
  };

  const copyInviteUrl = (url: string, id: number) => {
    navigator.clipboard.writeText(url);
    setCopiedId(id);
    toast.success("Invite URL copied to clipboard");
    setTimeout(() => setCopiedId(null), 2000);
  };

  const resetForm = () => {
    setFormData({ email: "", role: "employee", teamId: "", firstName: "", lastName: "" });
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
      setInviteUrl("");
    }
  };

  const getStatusBadge = (status: string) => {
    const variants: Record<string, "default" | "secondary" | "destructive" | "outline"> = {
      pending: "default",
      accepted: "secondary",
      expired: "destructive",
      revoked: "outline",
    };
    return <Badge variant={variants[status] || "default"}>{status}</Badge>;
  };

  const filteredInvitations = (status: string) => {
    return invitations.filter((inv) => {
      if (status === "all") return true;
      return inv.status === status;
    });
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          icon={Mail}
          title="Employee Invitations"
          description="Invite employees to join your organization"
          gradient="from-indigo-500 to-purple-600"
        />

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {invitations.length} {invitations.length === 1 ? "invitation" : "invitations"}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="mr-2 h-4 w-4" />
                Send Invitation
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>Invite Employee</DialogTitle>
                <DialogDescription>
                  Send an invitation link to a new employee to join your organization.
                </DialogDescription>
              </DialogHeader>

              {inviteUrl ? (
                <div className="space-y-4 mt-4">
                  <div className="p-4 bg-muted rounded-lg">
                    <p className="text-sm font-medium mb-2">Invitation Link Generated</p>
                    <div className="flex items-center gap-2">
                      <Input value={inviteUrl} readOnly className="flex-1" />
                      <Button
                        size="icon"
                        variant="outline"
                        onClick={() => copyInviteUrl(inviteUrl, 0)}
                      >
                        {copiedId === 0 ? (
                          <Check className="h-4 w-4 text-green-600" />
                        ) : (
                          <Copy className="h-4 w-4" />
                        )}
                      </Button>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      Share this link with the invitee. It will expire in 7 days.
                    </p>
                  </div>
                  <Button onClick={() => handleDialogClose(false)} className="w-full">
                    Done
                  </Button>
                </div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                  <div className="space-y-2">
                    <Label htmlFor="email">Email Address *</Label>
                    <Input
                      id="email"
                      type="email"
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="employee@example.com"
                      required
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <div className="space-y-2">
                      <Label htmlFor="firstName">First Name</Label>
                      <Input
                        id="firstName"
                        value={formData.firstName}
                        onChange={(e) => setFormData({ ...formData, firstName: e.target.value })}
                        placeholder="John"
                      />
                    </div>

                    <div className="space-y-2">
                      <Label htmlFor="lastName">Last Name</Label>
                      <Input
                        id="lastName"
                        value={formData.lastName}
                        onChange={(e) => setFormData({ ...formData, lastName: e.target.value })}
                        placeholder="Doe"
                      />
                    </div>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="role">Role</Label>
                    <Select
                      value={formData.role}
                      onValueChange={(value) => setFormData({ ...formData, role: value })}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="employee">Employee</SelectItem>
                        <SelectItem value="admin">Admin</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="space-y-2">
                    <Label htmlFor="team">Assign to Team (Optional)</Label>
                    <Select
                      value={formData.teamId}
                      onValueChange={(value) => setFormData({ ...formData, teamId: value })}
                    >
                      <SelectTrigger>
                        <SelectValue placeholder="Select a team" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="">No team</SelectItem>
                        {teams.map((team) => (
                          <SelectItem key={team.id} value={team.id.toString()}>
                            {team.name}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  <div className="flex justify-end gap-2 mt-6">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => handleDialogClose(false)}
                      disabled={saving}
                    >
                      Cancel
                    </Button>
                    <Button type="submit" disabled={saving}>
                      {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                      Send Invitation
                    </Button>
                  </div>
                </form>
              )}
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <Tabs defaultValue="all">
            <TabsList>
              <TabsTrigger value="all">
                All ({invitations.length})
              </TabsTrigger>
              <TabsTrigger value="pending">
                Pending ({filteredInvitations("pending").length})
              </TabsTrigger>
              <TabsTrigger value="accepted">
                Accepted ({filteredInvitations("accepted").length})
              </TabsTrigger>
              <TabsTrigger value="expired">
                Expired ({filteredInvitations("expired").length})
              </TabsTrigger>
            </TabsList>

            {["all", "pending", "accepted", "expired"].map((status) => (
              <TabsContent key={status} value={status}>
                {filteredInvitations(status).length === 0 ? (
                  <Card className="p-12 text-center">
                    <Mail className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                    <h3 className="text-lg font-semibold mb-2">No {status} invitations</h3>
                    <p className="text-muted-foreground mb-4">
                      {status === "all"
                        ? "Send your first invitation to get started."
                        : `No invitations with ${status} status found.`}
                    </p>
                  </Card>
                ) : (
                  <Card>
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead>Email</TableHead>
                          <TableHead>Role</TableHead>
                          <TableHead>Status</TableHead>
                          <TableHead>Expires</TableHead>
                          <TableHead>Created</TableHead>
                          <TableHead className="w-[80px]"></TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {filteredInvitations(status).map((invitation) => (
                          <TableRow key={invitation.id}>
                            <TableCell className="font-medium">{invitation.email}</TableCell>
                            <TableCell>
                              <Badge variant="outline">{invitation.role}</Badge>
                            </TableCell>
                            <TableCell>{getStatusBadge(invitation.status)}</TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(invitation.expiresAt), {
                                addSuffix: true,
                              })}
                            </TableCell>
                            <TableCell className="text-sm text-muted-foreground">
                              {formatDistanceToNow(new Date(invitation.createdAt), {
                                addSuffix: true,
                              })}
                            </TableCell>
                            <TableCell>
                              {invitation.status === "pending" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRevoke(invitation.id)}
                                >
                                  <XCircle className="h-4 w-4 mr-1" />
                                  Revoke
                                </Button>
                              )}
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </Card>
                )}
              </TabsContent>
            ))}
          </Tabs>
        )}
      </div>
    </AppLayout>
  );
}
