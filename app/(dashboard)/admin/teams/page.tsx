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
import { Textarea } from "@/components/ui/textarea";
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Users, Plus, MoreVertical, Loader2, Edit, Trash2, UserPlus } from "lucide-react";
import { toast } from "sonner";
import { apiClient } from "@/lib/api-client";

interface Team {
  id: number;
  name: string;
  description: string | null;
  managerId: number | null;
  status: string;
  createdAt: string;
  managerFirstName: string | null;
  managerLastName: string | null;
  managerEmail: string | null;
}

interface User {
  id: number;
  firstName: string | null;
  lastName: string | null;
  email: string;
  role: string;
}

export default function TeamsPage() {
  const [teams, setTeams] = useState<Team[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingTeam, setEditingTeam] = useState<Team | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    managerId: "",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetchTeams();
    fetchUsers();
  }, []);

  const fetchTeams = async () => {
    try {
      const response = await fetch("/api/teams");
      if (!response.ok) throw new Error("Failed to fetch teams");
      const data = await response.json();
      setTeams(data.teams);
    } catch (error) {
      console.error("Error fetching teams:", error);
      toast.error("Failed to load teams");
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await fetch("/api/users");
      if (!response.ok) throw new Error("Failed to fetch users");
      const data = await response.json();
      setUsers(data.users || []);
    } catch (error) {
      console.error("Error fetching users:", error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);

    try {
      const payload = {
        name: formData.name,
        description: formData.description,
        managerId: formData.managerId ? parseInt(formData.managerId) : undefined,
      };

      const url = editingTeam ? `/api/teams/${editingTeam.id}` : "/api/teams";
      const method = editingTeam ? "PUT" : "POST";

      const response = method === "PUT" 
        ? await apiClient.put(url, payload)
        : await apiClient.post(url, payload);

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || "Failed to save team");
      }

      toast.success(editingTeam ? "Team updated successfully" : "Team created successfully");
      setDialogOpen(false);
      resetForm();
      fetchTeams();
    } catch (error: any) {
      console.error("Error saving team:", error);
      toast.error(error.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (teamId: number) => {
    if (!confirm("Are you sure you want to delete this team? This action cannot be undone.")) {
      return;
    }

    try {
      const response = await apiClient.delete(`/api/teams/${teamId}`);

      if (!response.ok) throw new Error("Failed to delete team");

      toast.success("Team deleted successfully");
      fetchTeams();
    } catch (error) {
      console.error("Error deleting team:", error);
      toast.error("Failed to delete team");
    }
  };

  const openEditDialog = (team: Team) => {
    setEditingTeam(team);
    setFormData({
      name: team.name,
      description: team.description || "",
      managerId: team.managerId?.toString() || "",
    });
    setDialogOpen(true);
  };

  const resetForm = () => {
    setFormData({ name: "", description: "", managerId: "" });
    setEditingTeam(null);
  };

  const handleDialogClose = (open: boolean) => {
    setDialogOpen(open);
    if (!open) {
      resetForm();
    }
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          icon={Users}
          title="Team Management"
          description="Create and manage teams in your organization"
          gradient="from-purple-500 to-pink-600"
        />

        <div className="flex justify-between items-center">
          <div>
            <p className="text-sm text-muted-foreground">
              {teams.length} {teams.length === 1 ? "team" : "teams"}
            </p>
          </div>

          <Dialog open={dialogOpen} onOpenChange={handleDialogClose}>
            <DialogTrigger asChild>
              <Button onClick={() => resetForm()}>
                <Plus className="mr-2 h-4 w-4" />
                Create Team
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[500px]">
              <DialogHeader>
                <DialogTitle>{editingTeam ? "Edit Team" : "Create New Team"}</DialogTitle>
                <DialogDescription>
                  {editingTeam
                    ? "Update team information and assign a manager."
                    : "Add a new team to your organization and assign a manager."}
                </DialogDescription>
              </DialogHeader>

              <form onSubmit={handleSubmit} className="space-y-4 mt-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Team Name *</Label>
                  <Input
                    id="name"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    placeholder="e.g., Engineering, Sales, Marketing"
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    placeholder="Describe the team's purpose and responsibilities"
                    rows={3}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="manager">Team Manager</Label>
                  <Select
                    value={formData.managerId}
                    onValueChange={(value) => setFormData({ ...formData, managerId: value })}
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Select a team manager" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="">No manager</SelectItem>
                      {users.map((user) => (
                        <SelectItem key={user.id} value={user.id.toString()}>
                          {user.firstName} {user.lastName} ({user.email})
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
                    {editingTeam ? "Update Team" : "Create Team"}
                  </Button>
                </div>
              </form>
            </DialogContent>
          </Dialog>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader2 className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : teams.length === 0 ? (
          <Card className="p-12 text-center">
            <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <h3 className="text-lg font-semibold mb-2">No teams yet</h3>
            <p className="text-muted-foreground mb-4">
              Create your first team to start organizing your organization.
            </p>
            <Button onClick={() => setDialogOpen(true)}>
              <Plus className="mr-2 h-4 w-4" />
              Create First Team
            </Button>
          </Card>
        ) : (
          <Card>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Team Name</TableHead>
                  <TableHead>Description</TableHead>
                  <TableHead>Manager</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="w-[50px]"></TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {teams.map((team) => (
                  <TableRow key={team.id}>
                    <TableCell className="font-medium">{team.name}</TableCell>
                    <TableCell className="text-muted-foreground max-w-md truncate">
                      {team.description || "No description"}
                    </TableCell>
                    <TableCell>
                      {team.managerFirstName ? (
                        <div>
                          <div className="font-medium">
                            {team.managerFirstName} {team.managerLastName}
                          </div>
                          <div className="text-xs text-muted-foreground">{team.managerEmail}</div>
                        </div>
                      ) : (
                        <span className="text-muted-foreground">No manager</span>
                      )}
                    </TableCell>
                    <TableCell>
                      <Badge variant={team.status === "active" ? "default" : "secondary"}>
                        {team.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" size="icon">
                            <MoreVertical className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuItem onClick={() => openEditDialog(team)}>
                            <Edit className="mr-2 h-4 w-4" />
                            Edit Team
                          </DropdownMenuItem>
                          <DropdownMenuItem
                            className="text-destructive"
                            onClick={() => handleDelete(team.id)}
                          >
                            <Trash2 className="mr-2 h-4 w-4" />
                            Delete Team
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </Card>
        )}
      </div>
    </AppLayout>
  );
}
