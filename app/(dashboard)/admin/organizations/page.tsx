'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { Building2, Users, Search, Plus, Eye } from 'lucide-react';
import { toast } from 'sonner';

interface Organization {
  id: number;
  name: string;
  slug: string;
  domain?: string;
  industry?: string;
  size?: string;
  status: string;
  billingEmail?: string;
  createdAt: string;
  subscription?: {
    planName: string;
    status: string;
    seats: number;
    seatsUsed: number;
  };
  userCount: number;
}

export default function AdminOrganizationsPage() {
  const [organizations, setOrganizations] = useState<Organization[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState('');
  const [newOrgDialogOpen, setNewOrgDialogOpen] = useState(false);
  const [newOrgData, setNewOrgData] = useState({
    name: '',
    slug: '',
    domain: '',
    industry: '',
    size: 'small',
    billingEmail: ''
  });

  useEffect(() => {
    loadOrganizations();
  }, []);

  const loadOrganizations = async () => {
    try {
      const response = await fetch('/api/organizations');
      if (!response.ok) throw new Error('Failed to load organizations');
      const data = await response.json();
      setOrganizations(data.organizations || []);
    } catch (error) {
      toast.error('Failed to load organizations');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const handleCreateOrganization = async () => {
    try {
      const response = await fetch('/api/organizations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(newOrgData)
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to create organization');
      }

      toast.success('Organization created successfully');
      setNewOrgDialogOpen(false);
      setNewOrgData({
        name: '',
        slug: '',
        domain: '',
        industry: '',
        size: 'small',
        billingEmail: ''
      });
      loadOrganizations();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to create organization');
    }
  };

  const filteredOrganizations = organizations.filter(org =>
    org.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.slug.toLowerCase().includes(searchTerm.toLowerCase()) ||
    org.domain?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      active: 'bg-green-500',
      trial: 'bg-blue-500',
      suspended: 'bg-orange-500',
      canceled: 'bg-red-500'
    };
    return colors[status] || 'bg-gray-500';
  };

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          icon={Building2}
          title="Organizations"
          description="Platform-wide organization management (Super Admin only)"
          gradient="from-cyan-500 to-blue-600"
        />

        <div className="flex justify-end items-center">
        <Dialog open={newOrgDialogOpen} onOpenChange={setNewOrgDialogOpen}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="mr-2 h-4 w-4" />
              New Organization
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Create New Organization</DialogTitle>
              <DialogDescription>
                Add a new organization to the platform
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name *</Label>
                  <Input
                    id="name"
                    value={newOrgData.name}
                    onChange={(e) => setNewOrgData({ ...newOrgData, name: e.target.value })}
                    placeholder="Acme Corporation"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="slug">Slug *</Label>
                  <Input
                    id="slug"
                    value={newOrgData.slug}
                    onChange={(e) => setNewOrgData({ ...newOrgData, slug: e.target.value })}
                    placeholder="acme-corp"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="domain">Domain</Label>
                  <Input
                    id="domain"
                    value={newOrgData.domain}
                    onChange={(e) => setNewOrgData({ ...newOrgData, domain: e.target.value })}
                    placeholder="acme.com"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="billingEmail">Billing Email</Label>
                  <Input
                    id="billingEmail"
                    type="email"
                    value={newOrgData.billingEmail}
                    onChange={(e) => setNewOrgData({ ...newOrgData, billingEmail: e.target.value })}
                    placeholder="billing@acme.com"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="industry">Industry</Label>
                  <Input
                    id="industry"
                    value={newOrgData.industry}
                    onChange={(e) => setNewOrgData({ ...newOrgData, industry: e.target.value })}
                    placeholder="Technology"
                  />
                </div>
                <div className="space-y-2">
                  <Label htmlFor="size">Company Size</Label>
                  <Select value={newOrgData.size} onValueChange={(value) => setNewOrgData({ ...newOrgData, size: value })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="small">Small (1-50)</SelectItem>
                      <SelectItem value="medium">Medium (51-200)</SelectItem>
                      <SelectItem value="large">Large (201-1000)</SelectItem>
                      <SelectItem value="enterprise">Enterprise (1000+)</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div className="flex justify-end space-x-2 pt-4">
                <Button variant="outline" onClick={() => setNewOrgDialogOpen(false)}>
                  Cancel
                </Button>
                <Button onClick={handleCreateOrganization} disabled={!newOrgData.name || !newOrgData.slug}>
                  Create Organization
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>

      <div className="grid gap-4 md:grid-cols-3">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{organizations.length}</div>
            <p className="text-xs text-muted-foreground">
              Active: {organizations.filter(o => o.status === 'active').length}
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Total Users</CardTitle>
            <Users className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.reduce((sum, org) => sum + (org.userCount || 0), 0)}
            </div>
            <p className="text-xs text-muted-foreground">
              Across all organizations
            </p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Trial Organizations</CardTitle>
            <Building2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              {organizations.filter(o => o.status === 'trial').length}
            </div>
            <p className="text-xs text-muted-foreground">
              Need attention
            </p>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>All Organizations</CardTitle>
              <CardDescription>Manage organizations across the platform</CardDescription>
            </div>
            <div className="relative w-64">
              <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search organizations..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-8"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="text-center py-8 text-muted-foreground">Loading organizations...</div>
          ) : filteredOrganizations.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No organizations found</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Organization</TableHead>
                  <TableHead>Domain</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Subscription</TableHead>
                  <TableHead>Users</TableHead>
                  <TableHead>Created</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredOrganizations.map((org) => (
                  <TableRow key={org.id}>
                    <TableCell>
                      <div>
                        <div className="font-medium">{org.name}</div>
                        <div className="text-sm text-muted-foreground">{org.slug}</div>
                      </div>
                    </TableCell>
                    <TableCell>{org.domain || '-'}</TableCell>
                    <TableCell>
                      <Badge className={getStatusColor(org.status)}>
                        {org.status}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      {org.subscription ? (
                        <div>
                          <div className="font-medium">{org.subscription.planName}</div>
                          <div className="text-sm text-muted-foreground">
                            {org.subscription.seatsUsed}/{org.subscription.seats} seats
                          </div>
                        </div>
                      ) : (
                        '-'
                      )}
                    </TableCell>
                    <TableCell>{org.userCount || 0}</TableCell>
                    <TableCell>{new Date(org.createdAt).toLocaleDateString()}</TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}
        </CardContent>
      </Card>
      </div>
    </AppLayout>
  );
}
