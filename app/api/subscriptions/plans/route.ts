import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/server/services/SubscriptionService';

export async function GET(request: NextRequest) {
  try {
    const plans = await subscriptionService.listPlans();
    return NextResponse.json(plans);
  } catch (error) {
    console.error('List plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
