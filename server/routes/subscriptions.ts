import type { Express } from 'express';
import { subscriptionService } from '../services/SubscriptionService';
import { organizationService } from '../services/OrganizationService';
import { z } from 'zod';

const createSubscriptionSchema = z.object({
  planId: z.number(),
  billingCycle: z.enum(['monthly', 'yearly']),
  seats: z.number().min(1).optional(),
});

const updateSubscriptionSchema = z.object({
  planId: z.number().optional(),
  seats: z.number().min(1).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

const createPlanSchema = z.object({
  name: z.string().min(2).max(50),
  description: z.string().optional(),
  priceMonthly: z.number().min(0),
  priceYearly: z.number().min(0).optional(),
  features: z.any().optional(),
  limits: z.any().optional(),
});

export function registerSubscriptionRoutes(app: Express) {
  app.get('/api/subscription/plans', async (req, res) => {
    try {
      const plans = await subscriptionService.listPlans();
      res.json(plans);
    } catch (error) {
      console.error('List plans error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription plans' });
    }
  });

  app.post('/api/subscription/plans', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only super admins can create plans' });
      }

      const data = createPlanSchema.parse(req.body);

      const plan = await subscriptionService.createPlan(data);

      res.status(201).json(plan);
    } catch (error) {
      console.error('Create plan error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to create plan' });
    }
  });

  app.post('/api/subscription', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only admins can create subscriptions' });
      }

      const data = createSubscriptionSchema.parse(req.body);

      const subscription = await subscriptionService.createSubscription({
        organizationId: req.user.organizationId,
        ...data,
      });

      res.status(201).json(subscription);
    } catch (error) {
      console.error('Create subscription error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      if (error instanceof Error && error.message === 'Subscription plan not found') {
        return res.status(404).json({ error: error.message });
      }
      res.status(500).json({ error: 'Failed to create subscription' });
    }
  });

  app.get('/api/subscription', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(404).json({ error: 'User does not belong to any organization' });
      }

      const subscription = await subscriptionService.getSubscription(req.user.organizationId);

      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      res.json(subscription);
    } catch (error) {
      console.error('Get subscription error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription' });
    }
  });

  app.patch('/api/subscription', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only admins can update subscriptions' });
      }

      const updates = updateSubscriptionSchema.parse(req.body);

      const subscription = await subscriptionService.updateSubscription(
        req.user.organizationId,
        updates
      );

      res.json(subscription);
    } catch (error) {
      console.error('Update subscription error:', error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ error: 'Invalid request data', details: error.errors });
      }
      res.status(500).json({ error: 'Failed to update subscription' });
    }
  });

  app.post('/api/subscription/cancel', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(403).json({ error: 'User must belong to an organization' });
      }

      if (req.user.role !== 'admin' && req.user.role !== 'super_admin') {
        return res.status(403).json({ error: 'Only admins can cancel subscriptions' });
      }

      const { immediate } = req.body;

      await subscriptionService.cancelSubscription(req.user.organizationId, immediate || false);

      res.json({ success: true, message: immediate ? 'Subscription cancelled immediately' : 'Subscription will be cancelled at period end' });
    } catch (error) {
      console.error('Cancel subscription error:', error);
      res.status(500).json({ error: 'Failed to cancel subscription' });
    }
  });

  app.get('/api/subscription/usage', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(404).json({ error: 'User does not belong to any organization' });
      }

      const subscription = await subscriptionService.getSubscription(req.user.organizationId);

      if (!subscription) {
        return res.status(404).json({ error: 'No active subscription found' });
      }

      const metricName = req.query.metric as string | undefined;
      const usage = await subscriptionService.getUsageStats(subscription.id, metricName);

      res.json(usage);
    } catch (error) {
      console.error('Get usage stats error:', error);
      res.status(500).json({ error: 'Failed to fetch usage stats' });
    }
  });

  app.get('/api/subscription/metrics', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(404).json({ error: 'User does not belong to any organization' });
      }

      const metrics = await subscriptionService.getSubscriptionMetrics(req.user.organizationId);

      if (!metrics) {
        return res.status(404).json({ error: 'No subscription found' });
      }

      res.json(metrics);
    } catch (error) {
      console.error('Get subscription metrics error:', error);
      res.status(500).json({ error: 'Failed to fetch subscription metrics' });
    }
  });

  app.get('/api/billing/invoices', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(404).json({ error: 'User does not belong to any organization' });
      }

      const invoices = await subscriptionService.getInvoices(req.user.organizationId, {
        status: req.query.status as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      });

      res.json(invoices);
    } catch (error) {
      console.error('Get invoices error:', error);
      res.status(500).json({ error: 'Failed to fetch invoices' });
    }
  });

  app.get('/api/billing/payments', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(404).json({ error: 'User does not belong to any organization' });
      }

      const payments = await subscriptionService.getPayments(req.user.organizationId, {
        status: req.query.status as string | undefined,
        limit: req.query.limit ? parseInt(req.query.limit as string) : undefined,
        offset: req.query.offset ? parseInt(req.query.offset as string) : undefined,
      });

      res.json(payments);
    } catch (error) {
      console.error('Get payments error:', error);
      res.status(500).json({ error: 'Failed to fetch payments' });
    }
  });

  app.get('/api/billing/history', async (req, res) => {
    try {
      if (!req.user) {
        return res.status(401).json({ error: 'Unauthorized' });
      }

      if (!req.user.organizationId) {
        return res.status(404).json({ error: 'User does not belong to any organization' });
      }

      const history = await subscriptionService.getBillingHistory(req.user.organizationId);

      res.json(history);
    } catch (error) {
      console.error('Get billing history error:', error);
      res.status(500).json({ error: 'Failed to fetch billing history' });
    }
  });
}
