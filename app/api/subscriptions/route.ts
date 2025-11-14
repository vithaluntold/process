import { NextRequest, NextResponse } from 'next/server';
import { getCurrentUser } from '@/lib/server-auth';
import { subscriptionService } from '@/server/services/SubscriptionService';
import { z } from 'zod';
import { withApiGuards } from '@/lib/api-guards';
import { API_WRITE_LIMIT } from '@/lib/rate-limiter';

const createSubscriptionSchema = z.object({
  planId: z.number(),
  billingCycle: z.enum(['monthly', 'yearly']),
  seats: z.number().min(1).optional(),
});

export async function POST(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization' },
        { status: 403 }
      );
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only admins can create subscriptions' },
        { status: 403 }
      );
    }

    const guardError = withApiGuards(request, 'subscription-create', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const data = createSubscriptionSchema.parse(body);

    const subscription = await subscriptionService.createSubscription({
      organizationId: user.organizationId,
      ...data,
    });

    return NextResponse.json(subscription, { status: 201 });
  } catch (error) {
    console.error('Create subscription error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    if (error instanceof Error && error.message === 'Subscription plan not found') {
      return NextResponse.json({ error: error.message }, { status: 404 });
    }
    return NextResponse.json(
      { error: 'Failed to create subscription' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User does not belong to any organization' },
        { status: 404 }
      );
    }

    const subscription = await subscriptionService.getSubscription(user.organizationId);

    return NextResponse.json({ subscription: subscription || null });
  } catch (error) {
    console.error('Get subscription error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription' },
      { status: 500 }
    );
  }
}

const updateSubscriptionSchema = z.object({
  planId: z.number().optional(),
  seats: z.number().min(1).optional(),
  cancelAtPeriodEnd: z.boolean().optional(),
});

export async function PATCH(request: NextRequest) {
  try {
    const user = await getCurrentUser();
    if (!user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!user.organizationId) {
      return NextResponse.json(
        { error: 'User must belong to an organization' },
        { status: 403 }
      );
    }

    if (user.role !== 'admin' && user.role !== 'super_admin') {
      return NextResponse.json(
        { error: 'Only admins can update subscriptions' },
        { status: 403 }
      );
    }

    const guardError = withApiGuards(request, 'subscription-update', API_WRITE_LIMIT, user.id);
    if (guardError) return guardError;

    const body = await request.json();
    const updates = updateSubscriptionSchema.parse(body);

    const subscription = await subscriptionService.updateSubscription(
      user.organizationId,
      updates
    );

    return NextResponse.json(subscription);
  } catch (error) {
    console.error('Update subscription error:', error);
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.errors },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: 'Failed to update subscription' },
      { status: 500 }
    );
  }
}
