'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Check, X, Zap, Building2, Rocket, DollarSign } from 'lucide-react';
import { toast } from 'sonner';
import { apiClient } from '@/lib/api-client';

interface Plan {
  id: number;
  name: string;
  tier: string;
  price: number;
  billingCycle: string;
  maxSeats: number;
  maxTicketsPerMonth: number;
  features: string[];
  description: string;
}

export default function PricingPage() {
  const [plans, setPlans] = useState<Plan[]>([]);
  const [billingCycle, setBillingCycle] = useState<'monthly' | 'yearly'>('monthly');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadPlans();
  }, []);

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans', { credentials: 'include' });
      if (!response.ok) throw new Error('Failed to load plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSelectPlan = async (planId: number) => {
    try {
      const response = await apiClient.post('/api/subscriptions', { planId, billingCycle });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to select plan');
      }

      const data = await response.json();
      toast.success('Plan selected successfully');
      
      window.location.href = '/subscription';
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to select plan');
    }
  };

  const filteredPlans = plans.filter(p => p.billingCycle === billingCycle);

  const tierIcons: Record<string, any> = {
    free: Zap,
    elite: Building2,
    pro: Rocket,
    enterprise: Building2
  };

  const tierColors: Record<string, string> = {
    free: 'text-blue-500',
    elite: 'text-green-500',
    pro: 'text-purple-500',
    enterprise: 'text-orange-500'
  };

  const allFeatures = [
    { name: 'Process Discovery', free: true, elite: true, pro: true, enterprise: true },
    { name: 'Basic Analytics', free: true, elite: true, pro: true, enterprise: true },
    { name: 'Community Support', free: true, elite: false, pro: false, enterprise: false },
    { name: 'Advanced Analytics', free: false, elite: true, pro: true, enterprise: true },
    { name: 'API Access', free: false, elite: true, pro: true, enterprise: true },
    { name: 'Email Support', free: false, elite: true, pro: true, enterprise: true },
    { name: 'Custom Reports', free: false, elite: true, pro: true, enterprise: true },
    { name: 'Unlimited Processes', free: false, elite: false, pro: true, enterprise: true },
    { name: 'Priority Support', free: false, elite: false, pro: true, enterprise: true },
    { name: 'Custom Integrations', free: false, elite: false, pro: true, enterprise: true },
    { name: 'Dedicated Support', free: false, elite: false, pro: false, enterprise: true },
    { name: 'SLA Guarantee', free: false, elite: false, pro: false, enterprise: true },
    { name: 'Custom AI Models', free: false, elite: false, pro: false, enterprise: true },
    { name: 'On-Premise Option', free: false, elite: false, pro: false, enterprise: true },
    { name: 'SSO/SAML', free: false, elite: false, pro: false, enterprise: true }
  ];

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader
          icon={DollarSign}
          title="Pricing Plans"
          description="Select the perfect plan for your organization"
          gradient="from-cyan-500 to-blue-600"
        />

        <div className="flex justify-center">
          <Tabs value={billingCycle} onValueChange={(v) => setBillingCycle(v as 'monthly' | 'yearly')} className="w-fit">
            <TabsList>
              <TabsTrigger value="monthly">Monthly</TabsTrigger>
              <TabsTrigger value="yearly">
                Yearly
                <Badge className="ml-2 bg-green-500">Save 20%</Badge>
              </TabsTrigger>
            </TabsList>
          </Tabs>
        </div>

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading plans...</div>
      ) : (
        <>
          <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4 max-w-7xl mx-auto">
            {filteredPlans.map((plan) => {
              const Icon = tierIcons[plan.tier] || Zap;
              const iconColor = tierColors[plan.tier] || 'text-blue-500';
              const isPopular = plan.tier === 'pro';

              return (
                <Card 
                  key={plan.id} 
                  className={`relative ${isPopular ? 'border-primary shadow-lg scale-105' : ''}`}
                >
                  {isPopular && (
                    <div className="absolute -top-4 left-1/2 transform -translate-x-1/2">
                      <Badge className="bg-primary">Most Popular</Badge>
                    </div>
                  )}
                  <CardHeader>
                    <div className={`w-12 h-12 rounded-lg bg-muted flex items-center justify-center mb-4 ${iconColor}`}>
                      <Icon className="h-6 w-6" />
                    </div>
                    <CardTitle className="text-2xl">{plan.name}</CardTitle>
                    <CardDescription>{plan.description || `Perfect for ${plan.tier} teams`}</CardDescription>
                    <div className="pt-4">
                      {plan.tier === 'enterprise' ? (
                        <div>
                          <span className="text-3xl font-bold">Contact Sales</span>
                          <p className="text-sm text-muted-foreground mt-2">Custom pricing for 1000+ users</p>
                        </div>
                      ) : (
                        <>
                          <span className="text-4xl font-bold">
                            ${plan.price}
                          </span>
                          <span className="text-muted-foreground">/{billingCycle === 'monthly' ? 'mo' : 'yr'}</span>
                        </>
                      )}
                    </div>
                  </CardHeader>
                  <CardContent>
                    <ul className="space-y-3">
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm">Up to <strong>{plan.maxSeats}</strong> seats</span>
                      </li>
                      <li className="flex items-center gap-2">
                        <Check className="h-4 w-4 text-green-500" />
                        <span className="text-sm"><strong>{plan.maxTicketsPerMonth}</strong> tickets/month</span>
                      </li>
                      {plan.features.map((feature, idx) => (
                        <li key={idx} className="flex items-center gap-2">
                          <Check className="h-4 w-4 text-green-500" />
                          <span className="text-sm">{feature}</span>
                        </li>
                      ))}
                    </ul>
                  </CardContent>
                  <CardFooter>
                    <Button 
                      className="w-full" 
                      variant={isPopular ? 'default' : 'outline'}
                      onClick={() => {
                        if (plan.tier === 'enterprise') {
                          window.location.href = 'mailto:sales@epi-q.com?subject=Enterprise Plan Inquiry';
                        } else {
                          handleSelectPlan(plan.id);
                        }
                      }}
                    >
                      {plan.tier === 'free' ? 'Get Started Free' : plan.tier === 'enterprise' ? 'Contact Sales' : 'Start Trial'}
                    </Button>
                  </CardFooter>
                </Card>
              );
            })}
          </div>

          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl font-bold text-center mb-8">Feature Comparison</h2>
            <Card>
              <CardContent className="p-0">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="border-b">
                        <th className="text-left p-4 font-semibold">Features</th>
                        <th className="text-center p-4 font-semibold">Free</th>
                        <th className="text-center p-4 font-semibold">Elite</th>
                        <th className="text-center p-4 font-semibold">Pro</th>
                        <th className="text-center p-4 font-semibold">Enterprise</th>
                      </tr>
                    </thead>
                    <tbody>
                      {allFeatures.map((feature, idx) => (
                        <tr key={idx} className="border-b last:border-0">
                          <td className="p-4">{feature.name}</td>
                          <td className="text-center p-4">
                            {feature.free ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.elite ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.pro ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                          <td className="text-center p-4">
                            {feature.enterprise ? (
                              <Check className="h-5 w-5 text-green-500 mx-auto" />
                            ) : (
                              <X className="h-5 w-5 text-muted-foreground mx-auto" />
                            )}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </CardContent>
            </Card>
          </div>
        </>
      )}
      </div>
    </AppLayout>
  );
}
