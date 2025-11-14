import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/server/storage';
import { paymentEvents, payments, organizationSubscriptions } from '@/shared/schema';
import { PaymentGatewayFactory } from '@/server/payment-gateways';
import { eq } from 'drizzle-orm';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const signature = request.headers.get('x-webhook-signature') || 
                     request.headers.get('x-razorpay-signature') ||
                     request.headers.get('x-payu-signature') ||
                     request.headers.get('x-payoneer-signature') || 
                     '';

    const paymentGateway = PaymentGatewayFactory.createFromEnv();

    const verification = await paymentGateway.verifyWebhook({
      event: body.event || body.eventType || 'payment_event',
      payload: body,
      signature
    });

    await db.insert(paymentEvents).values({
      paymentGateway: process.env.PAYMENT_GATEWAY_PROVIDER || 'razorpay',
      eventType: verification.event || 'unknown',
      eventId: `evt_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      payload: body,
      processed: verification.isValid,
      processedAt: verification.isValid ? new Date() : null
    });

    if (!verification.isValid) {
      console.error('Invalid webhook signature');
      return NextResponse.json({ error: 'Invalid signature' }, { status: 401 });
    }

    await processWebhookEvent(verification.event || '', verification.data || body);

    return NextResponse.json({ received: true });
  } catch (error) {
    console.error('Webhook processing error:', error);
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    );
  }
}

async function processWebhookEvent(event: string, data: any) {
  try {
    switch (event) {
      case 'payment.success':
      case 'payment_success':
      case 'payment.completed':
        await handlePaymentSuccess(data);
        break;

      case 'payment.failed':
      case 'payment_failed':
        await handlePaymentFailure(data);
        break;

      case 'subscription.activated':
      case 'subscription_activated':
        await handleSubscriptionActivated(data);
        break;

      case 'subscription.cancelled':
      case 'subscription_cancelled':
        await handleSubscriptionCancelled(data);
        break;

      case 'refund.processed':
      case 'refund_processed':
        await handleRefundProcessed(data);
        break;

      default:
        console.log('Unhandled webhook event:', event);
    }
  } catch (error) {
    console.error('Error processing webhook event:', error);
    throw error;
  }
}

async function handlePaymentSuccess(data: any) {
  const paymentId = data.id || data.payment_id || data.paymentId;

  await db.update(payments)
    .set({
      status: 'completed',
      paidAt: new Date(),
      gatewayTransactionId: paymentId
    })
    .where(eq(payments.id, paymentId));

  console.log('Payment success processed:', paymentId);
}

async function handlePaymentFailure(data: any) {
  const paymentId = data.id || data.payment_id || data.paymentId;

  await db.update(payments)
    .set({
      status: 'failed'
    })
    .where(eq(payments.id, paymentId));

  console.log('Payment failure processed:', paymentId);
}

async function handleSubscriptionActivated(data: any) {
  const subscriptionId = data.subscription_id || data.subscriptionId;

  await db.update(organizationSubscriptions)
    .set({
      status: 'active',
      currentPeriodStart: new Date(),
      currentPeriodEnd: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)
    })
    .where(eq(organizationSubscriptions.gatewaySubscriptionId, subscriptionId));

  console.log('Subscription activated:', subscriptionId);
}

async function handleSubscriptionCancelled(data: any) {
  const subscriptionId = data.subscription_id || data.subscriptionId;

  await db.update(organizationSubscriptions)
    .set({
      status: 'cancelled',
      cancelledAt: new Date()
    })
    .where(eq(organizationSubscriptions.gatewaySubscriptionId, subscriptionId));

  console.log('Subscription cancelled:', subscriptionId);
}

async function handleRefundProcessed(data: any) {
  const paymentId = data.payment_id || data.paymentId;

  await db.update(payments)
    .set({
      status: 'refunded'
    })
    .where(eq(payments.gatewayTransactionId, paymentId));

  console.log('Refund processed:', paymentId);
}
