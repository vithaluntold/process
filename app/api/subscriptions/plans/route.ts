import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/server/services/SubscriptionService';

export async function GET(request: NextRequest) {
  try {
    const dbPlans = await subscriptionService.listPlans();
    
    // Transform database plans into frontend format for both monthly and yearly
    const plans = [];
    
    for (const plan of dbPlans) {
      // Monthly plan
      plans.push({
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price: plan.monthlyPrice / 100, // Convert cents to dollars
        billingCycle: 'monthly',
        maxSeats: plan.tier === 'free' ? 5 : plan.tier === 'pro' ? 25 : 999,
        maxTicketsPerMonth: plan.tier === 'free' ? 100 : plan.tier === 'pro' ? 1000 : 999999,
        features: plan.features || [],
        description: `Perfect for ${plan.tier} teams`
      });
      
      // Yearly plan
      plans.push({
        id: plan.id,
        name: plan.name,
        tier: plan.tier,
        price: (plan.yearlyPrice || 0) / 100, // Convert cents to dollars
        billingCycle: 'yearly',
        maxSeats: plan.tier === 'free' ? 5 : plan.tier === 'pro' ? 25 : 999,
        maxTicketsPerMonth: plan.tier === 'free' ? 100 : plan.tier === 'pro' ? 1000 : 999999,
        features: plan.features || [],
        description: `Perfect for ${plan.tier} teams`
      });
    }
    
    return NextResponse.json({ plans });
  } catch (error) {
    console.error('List plans error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch subscription plans' },
      { status: 500 }
    );
  }
}
