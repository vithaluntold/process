import type { Express } from 'express';
import { organizationService } from '../services/OrganizationService';
import { z } from 'zod';

const createOrganizationSchema = z.object({
  name: z.string().min(2).max(100),
  industry: z.string().optional(),
  size: z.string().optional(),
  billingEmail: z.string().email().optional(),
  website: z.string().url().optional(),
});

const updateOrganizationSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  logoUrl: z.string().url().optional(),
  website: z.string().url().optional(),
  industry: z.string().optional(),
  size: z.string().optional(),
  billingEmail: z.string().email().optional(),
  metadata: z.any().optional(),
});

const addUserSchema = z.object({
  email: z.string().email(),
  role: z.enum(['admin', 'employee']),
});

export function registerOrganizationRoutes(app: Express) {
  app.post('/api/organizations', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const data = createOrganizationSchema.parse(req.body);

      const organization = await organizationService.createOrganization({
        ...data,
        createdByUserId: req.user.id,
      });

      res.status(201).json(organization);
    } catch (error) {
      console.error('Create organization error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create organization' });
    }
  });

  app.get('/api/organizations', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can list all organizations' });
      }

      const organizations = await organizationService.listAllOrganizations({
        search: req.query.search as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      });

      res.json(organizations);
    } catch (error) {
      console.error('List organizations error:', error);
      res.status(500).json({ error: 'Failed to fetch organizations' });
    }
  });

  app.get('/api/organizations/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ error: 'Invalid organization ID' });
      }

      const hasAccess = await organizationService.checkUserOrganizationAccess(
        req.user.id,
        organizationId
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const organization = await organizationService.getOrganization(organizationId);

      res.json(organization);
    } catch (error) {
      console.error('Get organization error:', error);
      if (error instanceof Error && error.message === 'Organization not found') {
        return res.status(404).json({ error: 'Organization not found' });
      }
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  });

  app.patch('/api/organizations/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ error: 'Invalid organization ID' });
      }

      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can update organizations' });
      }

      const hasAccess = await organizationService.checkUserOrganizationAccess(
        req.user.id,
        organizationId
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const updates = updateOrganizationSchema.parse(req.body);

      const organization = await organizationService.updateOrganization(organizationId, updates);

      res.json(organization);
    } catch (error) {
      console.error('Update organization error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update organization' });
    }
  });

  app.delete('/api/organizations/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can delete organizations' });
      }

      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ error: 'Invalid organization ID' });
      }

      await organizationService.deleteOrganization(organizationId);

      res.status(204).send();
    } catch (error) {
      console.error('Delete organization error:', error);
      res.status(500).json({ error: 'Failed to delete organization' });
    }
  });

  app.get('/api/organizations/:id/users', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ error: 'Invalid organization ID' });
      }

      const hasAccess = await organizationService.checkUserOrganizationAccess(
        req.user.id,
        organizationId
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const users = await organizationService.getOrganizationUsers(organizationId);

      res.json(users);
    } catch (error) {
      console.error('Get organization users error:', error);
      res.status(500).json({ error: 'Failed to fetch users' });
    }
  });

  app.post('/api/organizations/:id/users', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const organizationId = parseInt(req.params.id);
      if (isNaN(organizationId)) {
        return res.status(400).json({ error: 'Invalid organization ID' });
      }

      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can add users' });
      }

      const hasAccess = await organizationService.checkUserOrganizationAccess(
        req.user.id,
        organizationId
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      const data = addUserSchema.parse(req.body);

      const user = await organizationService.addUserToOrganization({
        ...data,
        organizationId,
        invitedBy: req.user.id,
      });

      res.status(201).json(user);
    } catch (error) {
      console.error('Add user error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      if (error instanceof Error && error.message.includes('already belongs')) {
        return res.status(409).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to add user' });
    }
  });

  app.delete('/api/organizations/:id/users/:userId', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const organizationId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);

      if (isNaN(organizationId) || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      if (req.user.role !== 'super_admin' && req.user.role !== 'admin') {
        return res.status(403).json({ error: 'Only admins can remove users' });
      }

      const hasAccess = await organizationService.checkUserOrganizationAccess(
        req.user.id,
        organizationId
      );

      if (!hasAccess) {
        return res.status(403).json({ error: 'Access denied' });
      }

      await organizationService.removeUserFromOrganization(userId, organizationId);

      res.status(204).send();
    } catch (error) {
      console.error('Remove user error:', error);
      if (error instanceof Error && error.message === 'User not found in this organization') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to remove user' });
    }
  });

  app.get('/api/my-organization', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(404).json({ error: 'User does not belong to any organization' });
      }

      const organization = await organizationService.getOrganization(req.user.organizationId);

      res.json(organization);
    } catch (error) {
      console.error('Get my organization error:', error);
      res.status(500).json({ error: 'Failed to fetch organization' });
    }
  });
}
