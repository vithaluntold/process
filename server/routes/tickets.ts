import type { Express } from 'express';
import { ticketService } from '../services/TicketService';
import { organizationService } from '../services/OrganizationService';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(3).max(200),
  description: z.string().min(10),
  categoryId: z.number().optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']),
  assigneeId: z.number().optional(),
  tags: z.array(z.string()).optional(),
});

const updateTicketSchema = z.object({
  subject: z.string().min(3).max(200).optional(),
  description: z.string().min(10).optional(),
  status: z.enum(['open', 'in_progress', 'waiting', 'resolved', 'closed']).optional(),
  priority: z.enum(['low', 'medium', 'high', 'critical']).optional(),
  assigneeId: z.number().optional(),
  categoryId: z.number().optional(),
  resolution: z.string().optional(),
  tags: z.array(z.string()).optional(),
});

const addMessageSchema = z.object({
  body: z.string().min(1),
  visibility: z.enum(['public', 'internal']).optional(),
});

const listTicketsSchema = z.object({
  status: z.string().optional(),
  priority: z.string().optional(),
  categoryId: z.number().optional(),
  assigneeId: z.number().optional(),
  requesterId: z.number().optional(),
  limit: z.number().min(1).max(100).optional(),
  offset: z.number().min(0).optional(),
});

export function registerTicketRoutes(app: Express) {
  app.post('/api/tickets', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const data = createTicketSchema.parse(req.body);

      const ticket = await ticketService.createTicket({
        organizationId: req.user.organizationId,
        requesterId: req.user.id,
        ...data,
      });

      res.status(201).json(ticket);
    } catch (error) {
      console.error('Create ticket error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create ticket' });
    }
  });

  app.get('/api/tickets', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const filters = {
        status: req.query.status as string | undefined,
        priority: req.query.priority as string | undefined,
        categoryId: req.query.categoryId ? parseInt(req.query.categoryId as string) : undefined,
        assigneeId: req.query.assigneeId ? parseInt(req.query.assigneeId as string) : undefined,
        requesterId: req.query.requesterId ? parseInt(req.query.requesterId as string) : undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      };

      const tickets = await ticketService.listTickets(req.user.organizationId, filters);

      res.json(tickets);
    } catch (error) {
      console.error('List tickets error:', error);
      res.status(500).json({ error: 'Failed to fetch tickets' });
    }
  });

  app.get('/api/tickets/stats', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const stats = await ticketService.getTicketStats(req.user.organizationId);

      res.json(stats);
    } catch (error) {
      console.error('Get ticket stats error:', error);
      res.status(500).json({ error: 'Failed to fetch ticket stats' });
    }
  });

  app.get('/api/tickets/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket ID' });
      }

      const ticket = await ticketService.getTicket(ticketId, req.user.organizationId);

      res.json(ticket);
    } catch (error) {
      console.error('Get ticket error:', error);
      if (error instanceof Error && error.message === 'Ticket not found') {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      res.status(500).json({ error: 'Failed to fetch ticket' });
    }
  });

  app.patch('/api/tickets/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket ID' });
      }

      const updates = updateTicketSchema.parse(req.body);

      const ticket = await ticketService.updateTicket(
        ticketId,
        req.user.organizationId,
        req.user.id,
        updates
      );

      res.json(ticket);
    } catch (error) {
      console.error('Update ticket error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      if (error instanceof Error && error.message === 'Ticket not found') {
        return res.status(404).json({ error: 'Ticket not found' });
      }
      res.status(500).json({ error: 'Failed to update ticket' });
    }
  });

  app.delete('/api/tickets/:id', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only admins can delete tickets' });
      }

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket ID' });
      }

      await ticketService.deleteTicket(ticketId, req.user.organizationId);

      res.status(204).send();
    } catch (error) {
      console.error('Delete ticket error:', error);
      res.status(500).json({ error: 'Failed to delete ticket' });
    }
  });

  app.post('/api/tickets/:id/messages', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket ID' });
      }

      const data = addMessageSchema.parse(req.body);

      const message = await ticketService.addMessage({
        ticketId,
        organizationId: req.user.organizationId,
        authorId: req.user.id,
        ...data,
      });

      res.status(201).json(message);
    } catch (error) {
      console.error('Add message error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to add message' });
    }
  });

  app.get('/api/tickets/:id/messages', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket ID' });
      }

      const messages = await ticketService.getTicketMessages(ticketId, req.user.organizationId);

      res.json(messages);
    } catch (error) {
      console.error('Get messages error:', error);
      res.status(500).json({ error: 'Failed to fetch messages' });
    }
  });

  app.post('/api/tickets/:id/watchers', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket ID' });
      }

      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ error: 'userId is required' });
      }

      await ticketService.addWatcher(ticketId, req.user.organizationId, userId);

      res.status(201).json({ success: true });
    } catch (error) {
      console.error('Add watcher error:', error);
      res.status(500).json({ error: 'Failed to add watcher' });
    }
  });

  app.delete('/api/tickets/:id/watchers/:userId', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const ticketId = parseInt(req.params.id);
      const userId = parseInt(req.params.userId);
      
      if (isNaN(ticketId) || isNaN(userId)) {
        return res.status(400).json({ error: 'Invalid ID' });
      }

      await ticketService.removeWatcher(ticketId, req.user.organizationId, userId);

      res.status(204).send();
    } catch (error) {
      console.error('Remove watcher error:', error);
      res.status(500).json({ error: 'Failed to remove watcher' });
    }
  });

  app.get('/api/tickets/:id/activity', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      const ticketId = parseInt(req.params.id);
      if (isNaN(ticketId)) {
        return res.status(400).json({ error: 'Invalid ticket ID' });
      }

      const activity = await ticketService.getTicketActivity(ticketId, req.user.organizationId);

      res.json(activity);
    } catch (error) {
      console.error('Get activity error:', error);
      res.status(500).json({ error: 'Failed to fetch activity' });
    }
  });

  app.get('/api/ticket-categories', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      const categories = await ticketService.listCategories();

      res.json(categories);
    } catch (error) {
      console.error('List categories error:', error);
      res.status(500).json({ error: 'Failed to fetch categories' });
    }
  });
}
