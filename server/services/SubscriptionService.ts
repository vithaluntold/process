import { db } from '../storage';
import {
  subscriptionPlans,
  organizationSubscriptions,
  subscriptionUsage,
  invoices,
  payments,
  organizations,
} from '@/shared/schema';
import { eq, and, desc, sql, gte, lte } from 'drizzle-orm';

export class SubscriptionService {
  async createSubscription(data: {
    organizationId: number;
    planId: number;
    billingCycle: 'monthly' | 'yearly';
    seats?: number;
    paymentGateway?: string;
    gatewaySubscriptionId?: string;
  }) {
    const [plan] = await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.id, data.planId));

    if (!plan) {
      throw new Error('Subscription plan not found');
    }

    const now = new Date();
    const periodEnd = new Date(now);
    if (data.billingCycle === 'monthly') {
      periodEnd.setMonth(periodEnd.getMonth() + 1);
    } else {
      periodEnd.setFullYear(periodEnd.getFullYear() + 1);
    }

    const [subscription] = await db.insert(organizationSubscriptions).values({
      organizationId: data.organizationId,
      planId: data.planId,
      status: 'active',
      billingCycle: data.billingCycle,
      seats: data.seats || 1,
      seatsUsed: 0,
      currentPeriodStart: now,
      currentPeriodEnd: periodEnd,
      paymentGateway: data.paymentGateway,
      gatewaySubscriptionId: data.gatewaySubscriptionId,
      metadata: {},
    }).returning();

    return subscription;
  }

  async getSubscription(organizationId: number) {
    const [subscription] = await db
      .select({
        subscription: organizationSubscriptions,
        plan: subscriptionPlans,
      })
      .from(organizationSubscriptions)
      .leftJoin(subscriptionPlans, eq(organizationSubscriptions.planId, subscriptionPlans.id))
      .where(eq(organizationSubscriptions.organizationId, organizationId));

    if (!subscription) {
      return null;
    }

    const [usage] = await db
      .select()
      .from(subscriptionUsage)
      .where(eq(subscriptionUsage.subscriptionId, subscription.subscription.id))
      .orderBy(desc(subscriptionUsage.periodStart))
      .limit(1);

    return {
      ...subscription.subscription,
      plan: subscription.plan,
      currentUsage: usage || null,
    };
  }

  async updateSubscription(
    organizationId: number,
    updates: Partial<{
      planId: number;
      status: string;
      seats: number;
      cancelAtPeriodEnd: boolean;
    }>
  ) {
    const [updated] = await db
      .update(organizationSubscriptions)
      .set({
        ...updates,
        updatedAt: new Date(),
      })
      .where(eq(organizationSubscriptions.organizationId, organizationId))
      .returning();

    return updated;
  }

  async cancelSubscription(organizationId: number, immediate: boolean = false) {
    if (immediate) {
      await db
        .update(organizationSubscriptions)
        .set({
          status: 'cancelled',
          updatedAt: new Date(),
        })
        .where(eq(organizationSubscriptions.organizationId, organizationId));
    } else {
      await db
        .update(organizationSubscriptions)
        .set({
          cancelAtPeriodEnd: true,
          updatedAt: new Date(),
        })
        .where(eq(organizationSubscriptions.organizationId, organizationId));
    }
  }

  async recordUsage(data: {
    subscriptionId: number;
    metricName: string;
    metricValue: number;
    periodStart: Date;
    periodEnd: Date;
  }) {
    const [usage] = await db.insert(subscriptionUsage).values({
      subscriptionId: data.subscriptionId,
      metricName: data.metricName,
      metricValue: data.metricValue,
      periodStart: data.periodStart,
      periodEnd: data.periodEnd,
    }).returning();

    return usage;
  }

  async getUsageStats(subscriptionId: number, metricName?: string) {
    const conditions = [eq(subscriptionUsage.subscriptionId, subscriptionId)];
    if (metricName) {
      conditions.push(eq(subscriptionUsage.metricName, metricName));
    }

    return await db
      .select()
      .from(subscriptionUsage)
      .where(and(...conditions))
      .orderBy(desc(subscriptionUsage.periodStart))
      .limit(30);
  }

  async checkSeatsAvailable(organizationId: number): Promise<boolean> {
    const [subscription] = await db
      .select()
      .from(organizationSubscriptions)
      .where(eq(organizationSubscriptions.organizationId, organizationId));

    if (!subscription) {
      return false;
    }

    return subscription.seatsUsed < subscription.seats;
  }

  async incrementSeatsUsed(organizationId: number) {
    await db
      .update(organizationSubscriptions)
      .set({
        seatsUsed: sql`${organizationSubscriptions.seatsUsed} + 1`,
        updatedAt: new Date(),
      })
      .where(eq(organizationSubscriptions.organizationId, organizationId));
  }

  async decrementSeatsUsed(organizationId: number) {
    await db
      .update(organizationSubscriptions)
      .set({
        seatsUsed: sql`GREATEST(${organizationSubscriptions.seatsUsed} - 1, 0)`,
        updatedAt: new Date(),
      })
      .where(eq(organizationSubscriptions.organizationId, organizationId));
  }

  async listPlans() {
    return await db
      .select()
      .from(subscriptionPlans)
      .where(eq(subscriptionPlans.isActive, true))
      .orderBy(subscriptionPlans.priceMonthly);
  }

  async createPlan(data: {
    name: string;
    description?: string;
    priceMonthly: number;
    priceYearly?: number;
    features?: any;
    limits?: any;
  }) {
    const [plan] = await db.insert(subscriptionPlans).values({
      name: data.name,
      description: data.description,
      priceMonthly: data.priceMonthly.toString(),
      priceYearly: data.priceYearly?.toString(),
      features: data.features || {},
      limits: data.limits || {},
      isActive: true,
    }).returning();

    return plan;
  }

  async createInvoice(data: {
    organizationId: number;
    subscriptionId?: number;
    amountSubtotal: number;
    amountTax?: number;
    currency?: string;
    dueDate?: Date;
    lineItems?: any[];
    paymentGateway?: string;
    gatewayInvoiceId?: string;
  }) {
    const invoiceNumber = await this.generateInvoiceNumber();
    const amountTax = data.amountTax || 0;
    const amountTotal = data.amountSubtotal + amountTax;

    const [invoice] = await db.insert(invoices).values({
      organizationId: data.organizationId,
      subscriptionId: data.subscriptionId,
      invoiceNumber,
      amountSubtotal: data.amountSubtotal.toString(),
      amountTax: amountTax.toString(),
      amountTotal: amountTotal.toString(),
      currency: data.currency || 'USD',
      status: 'draft',
      dueDate: data.dueDate,
      lineItems: data.lineItems || [],
      paymentGateway: data.paymentGateway,
      gatewayInvoiceId: data.gatewayInvoiceId,
      metadata: {},
    }).returning();

    return invoice;
  }

  async updateInvoiceStatus(invoiceId: number, status: string, paidAt?: Date) {
    const [updated] = await db
      .update(invoices)
      .set({
        status,
        paidAt,
        updatedAt: new Date(),
      })
      .where(eq(invoices.id, invoiceId))
      .returning();

    return updated;
  }

  async getInvoices(organizationId: number, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(invoices.organizationId, organizationId)];
    if (options?.status) {
      conditions.push(eq(invoices.status, options.status));
    }

    return await db
      .select()
      .from(invoices)
      .where(and(...conditions))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0)
      .orderBy(desc(invoices.createdAt));
  }

  async recordPayment(data: {
    organizationId: number;
    amount: number;
    currency?: string;
    paymentGateway: string;
    gatewayTransactionId?: string;
    paymentMethod?: string;
    description?: string;
    metadata?: any;
  }) {
    const [payment] = await db.insert(payments).values({
      organizationId: data.organizationId,
      amount: data.amount.toString(),
      currency: data.currency || 'USD',
      status: 'pending',
      paymentGateway: data.paymentGateway,
      gatewayTransactionId: data.gatewayTransactionId,
      paymentMethod: data.paymentMethod,
      description: data.description,
      metadata: data.metadata || {},
    }).returning();

    return payment;
  }

  async updatePaymentStatus(paymentId: number, status: string, paidAt?: Date) {
    const [updated] = await db
      .update(payments)
      .set({
        status,
        paidAt,
      })
      .where(eq(payments.id, paymentId))
      .returning();

    return updated;
  }

  async getPayments(organizationId: number, options?: {
    status?: string;
    limit?: number;
    offset?: number;
  }) {
    const conditions = [eq(payments.organizationId, organizationId)];
    if (options?.status) {
      conditions.push(eq(payments.status, options.status));
    }

    return await db
      .select()
      .from(payments)
      .where(and(...conditions))
      .limit(options?.limit || 50)
      .offset(options?.offset || 0)
      .orderBy(desc(payments.createdAt));
  }

  private async generateInvoiceNumber(): Promise<string> {
    const [result] = await db
      .select({ count: sql<number>`count(*)::int` })
      .from(invoices);

    const count = (result?.count || 0) + 1;
    const year = new Date().getFullYear();
    return `INV-${year}-${count.toString().padStart(6, '0')}`;
  }

  async getBillingHistory(organizationId: number) {
    const invoiceList = await this.getInvoices(organizationId, { limit: 12 });
    const paymentList = await this.getPayments(organizationId, { limit: 12 });

    return {
      invoices: invoiceList,
      payments: paymentList,
    };
  }

  async getSubscriptionMetrics(organizationId: number) {
    const subscription = await this.getSubscription(organizationId);
    
    if (!subscription) {
      return null;
    }

    const [paymentStats] = await db
      .select({
        totalPaid: sql<number>`COALESCE(SUM(CAST(${payments.amount} AS NUMERIC)), 0)`,
        successfulPayments: sql<number>`count(*) FILTER (WHERE ${payments.status} = 'succeeded')::int`,
        failedPayments: sql<number>`count(*) FILTER (WHERE ${payments.status} = 'failed')::int`,
      })
      .from(payments)
      .where(eq(payments.organizationId, organizationId));

    const [invoiceStats] = await db
      .select({
        totalInvoiced: sql<number>`COALESCE(SUM(CAST(${invoices.amountTotal} AS NUMERIC)), 0)`,
        paidInvoices: sql<number>`count(*) FILTER (WHERE ${invoices.status} = 'paid')::int`,
        unpaidInvoices: sql<number>`count(*) FILTER (WHERE ${invoices.status} IN ('draft', 'open'))::int`,
      })
      .from(invoices)
      .where(eq(invoices.organizationId, organizationId));

    return {
      subscription,
      payments: paymentStats,
      invoices: invoiceStats,
    };
  }
}

export const subscriptionService = new SubscriptionService();
