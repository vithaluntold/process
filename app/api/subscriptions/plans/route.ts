import { NextRequest, NextResponse } from 'next/server';
import { subscriptionService } from '@/server/services/SubscriptionService';

export async function GET(request: NextRequest) {
  try {
    const dbPlans = await subscriptionService.listPlans();
    
    // Define the correct tier order
    const tierOrder: Record<string, number> = {
      'free': 1,
      'elite': 2,
      'pro': 3,
      'enterprise': 4
    };
    
    // Sort plans by tier order (Free → Elite → Pro → Enterprise)
    const sortedPlans = dbPlans.sort((a, b) => {
      const orderA = tierOrder[a.tier] || 999;
      const orderB = tierOrder[b.tier] || 999;
      return orderA - orderB;
    });
    
    // Transform database plans into frontend format for both monthly and yearly
    const plans = [];
    
    for (const plan of sortedPlans) {
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
