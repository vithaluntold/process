'use client';

import { useState, useEffect } from 'react';
import AppLayout from '@/components/app-layout';
import { PageHeader } from '@/components/page-header';
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Progress } from '@/components/ui/progress';
import { Check, CreditCard, Download, Users, Zap } from 'lucide-react';
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
}

interface Subscription {
  id: number;
  plan: Plan;
  status: string;
  billingCycle: string;
  seats: number;
  seatsUsed: number;
  currentPeriodStart: string;
  currentPeriodEnd: string;
  cancelAtPeriodEnd: boolean;
}

interface Invoice {
  id: number;
  invoiceNumber: string;
  amountTotal: number;
  currency: string;
  status: string;
  dueDate: string;
  paidAt?: string;
  createdAt: string;
}

export default function SubscriptionPage() {
  const [subscription, setSubscription] = useState<Subscription | null>(null);
  const [plans, setPlans] = useState<Plan[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadSubscription();
    loadPlans();
    loadInvoices();
  }, []);

  const loadSubscription = async () => {
    try {
      const response = await fetch('/api/subscriptions');
      if (!response.ok) throw new Error('Failed to load subscription');
      const data = await response.json();
      setSubscription(data.subscription || null);
    } catch (error) {
      console.error('Failed to load subscription:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadPlans = async () => {
    try {
      const response = await fetch('/api/subscriptions/plans');
      if (!response.ok) throw new Error('Failed to load plans');
      const data = await response.json();
      setPlans(data.plans || []);
    } catch (error) {
      console.error('Failed to load plans:', error);
    }
  };

  const loadInvoices = async () => {
    try {
      const response = await fetch('/api/billing/invoices');
      if (!response.ok) throw new Error('Failed to load invoices');
      const data = await response.json();
      setInvoices(data.invoices || []);
    } catch (error) {
      console.error('Failed to load invoices:', error);
    }
  };

  const handleUpgrade = async (planId: number) => {
    try {
      const response = await apiClient.post('/api/subscriptions', { planId, billingCycle: 'monthly' });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to upgrade plan');
      }

      toast.success('Plan upgraded successfully');
      loadSubscription();
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Failed to upgrade plan');
    }
  };

  const seatUsagePercentage = subscription 
    ? (subscription.seatsUsed / subscription.seats) * 100 
    : 0;

  return (
    <AppLayout>
      <div className="flex flex-col gap-6 p-4 md:p-6">
        <PageHeader 
          icon={CreditCard} 
          title="Subscription & Billing" 
          description="Manage your subscription and billing" 
          gradient="from-cyan-500 to-blue-600" 
        />

      {loading ? (
        <div className="text-center py-8 text-muted-foreground">Loading subscription...</div>
      ) : subscription ? (
        <>
          <div className="grid gap-4 md:grid-cols-3">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Current Plan</CardTitle>
                <Zap className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">{subscription.plan.name}</div>
                <p className="text-xs text-muted-foreground">
                  ${subscription.plan.price}/{subscription.billingCycle}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Seat Usage</CardTitle>
                <Users className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <div className="text-2xl font-bold">
                  {subscription.seatsUsed} / {subscription.seats}
                </div>
                <Progress value={seatUsagePercentage} className="mt-2" />
              </CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Billing Status</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" />
              </CardHeader>
              <CardContent>
                <Badge className={subscription.status === 'active' ? 'bg-green-500' : 'bg-yellow-500'}>
                  {subscription.status}
                </Badge>
                <p className="text-xs text-muted-foreground mt-2">
                  Renews {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                </p>
              </CardContent>
            </Card>
          </div>

          <Card>
            <CardHeader>
              <CardTitle>Current Subscription</CardTitle>
              <CardDescription>Your active subscription details</CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Plan</p>
                  <p className="font-medium">{subscription.plan.name}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Billing Cycle</p>
                  <p className="font-medium capitalize">{subscription.billingCycle}</p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Current Period</p>
                  <p className="font-medium">
                    {new Date(subscription.currentPeriodStart).toLocaleDateString()} - {new Date(subscription.currentPeriodEnd).toLocaleDateString()}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Max Tickets/Month</p>
                  <p className="font-medium">{subscription.plan.maxTicketsPerMonth}</p>
                </div>
              </div>
              <div>
                <p className="text-sm text-muted-foreground mb-2">Features</p>
                <ul className="grid grid-cols-2 gap-2">
                  {subscription.plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-center gap-2">
                      <Check className="h-4 w-4 text-green-500" />
                      <span className="text-sm">{feature}</span>
                    </li>
                  ))}
                </ul>
              </div>
            </CardContent>
            <CardFooter className="flex justify-between">
              <Button variant="outline">Change Plan</Button>
              <Button variant="destructive" disabled={subscription.cancelAtPeriodEnd}>
                {subscription.cancelAtPeriodEnd ? 'Cancellation Scheduled' : 'Cancel Subscription'}
              </Button>
            </CardFooter>
          </Card>
        </>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>No Active Subscription</CardTitle>
            <CardDescription>Choose a plan to get started</CardDescription>
          </CardHeader>
          <CardContent>
            <p className="text-muted-foreground">You don't have an active subscription. Please select a plan below.</p>
          </CardContent>
        </Card>
      )}

      <div>
        <h2 className="text-2xl font-bold mb-4">Available Plans</h2>
        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card key={plan.id} className={subscription?.plan.id === plan.id ? 'border-primary' : ''}>
              <CardHeader>
                <CardTitle>{plan.name}</CardTitle>
                <CardDescription>
                  <span className="text-3xl font-bold">${plan.price}</span>
                  <span className="text-muted-foreground">/{plan.billingCycle}</span>
                </CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="space-y-2">
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">Up to {plan.maxSeats} seats</span>
                  </li>
                  <li className="flex items-center gap-2">
                    <Check className="h-4 w-4 text-green-500" />
                    <span className="text-sm">{plan.maxTicketsPerMonth} tickets/month</span>
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
                {subscription?.plan.id === plan.id ? (
                  <Button className="w-full" disabled>Current Plan</Button>
                ) : (
                  <Button 
                    className="w-full" 
                    onClick={() => handleUpgrade(plan.id)}
                    variant={subscription ? 'outline' : 'default'}
                  >
                    {subscription ? 'Switch to this plan' : 'Get Started'}
                  </Button>
                )}
              </CardFooter>
            </Card>
          ))}
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Billing History</CardTitle>
          <CardDescription>Your past invoices and payments</CardDescription>
        </CardHeader>
        <CardContent>
          {invoices.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">No invoices yet</div>
          ) : (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Invoice</TableHead>
                  <TableHead>Amount</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Due Date</TableHead>
                  <TableHead>Paid Date</TableHead>
                  <TableHead>Actions</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {invoices.map((invoice) => (
                  <TableRow key={invoice.id}>
                    <TableCell className="font-mono">{invoice.invoiceNumber}</TableCell>
                    <TableCell>
                      ${(invoice.amountTotal / 100).toFixed(2)} {invoice.currency.toUpperCase()}
                    </TableCell>
                    <TableCell>
                      <Badge className={invoice.status === 'paid' ? 'bg-green-500' : 'bg-yellow-500'}>
                        {invoice.status}
                      </Badge>
                    </TableCell>
                    <TableCell>{new Date(invoice.dueDate).toLocaleDateString()}</TableCell>
                    <TableCell>
                      {invoice.paidAt ? new Date(invoice.paidAt).toLocaleDateString() : '-'}
                    </TableCell>
                    <TableCell>
                      <Button variant="ghost" size="sm">
                        <Download className="h-4 w-4 mr-1" />
                        Download
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
