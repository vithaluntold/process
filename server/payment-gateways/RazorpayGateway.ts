import { BasePaymentGateway } from './BasePaymentGateway';
import type {
  CreateSubscriptionParams,
  CreateSubscriptionResult,
  CreatePaymentParams,
  CreatePaymentResult,
  CancelSubscriptionParams,
  RefundPaymentParams,
  WebhookEvent,
  WebhookVerificationResult,
  PaymentStatus,
  PaymentGatewayConfig
} from './types';
import crypto from 'crypto';

export class RazorpayGateway extends BasePaymentGateway {
  private readonly baseUrl: string;

  constructor(config: PaymentGatewayConfig) {
    super(config);
    this.validateConfig();
    this.baseUrl = config.sandbox 
      ? 'https://api.razorpay.com/v1' 
      : 'https://api.razorpay.com/v1';
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> {
    try {
      this.logInfo('Creating subscription', { planId: params.planId, customerId: params.customerId });

      const subscriptionData = {
        plan_id: params.planId,
        customer_notify: 1,
        quantity: 1,
        total_count: params.billingCycle === 'yearly' ? 12 : 120,
        notes: {
          customer_id: params.customerId,
          customer_email: params.customerEmail,
          ...params.metadata
        }
      };

      const response = await this.makeRequest('/subscriptions', 'POST', subscriptionData);

      return {
        subscriptionId: response.id,
        status: this.mapRazorpayStatus(response.status),
        paymentUrl: response.short_url,
        nextBillingDate: response.charge_at ? new Date(response.charge_at * 1000) : undefined
      };
    } catch (error) {
      this.logError('Failed to create subscription', error);
      throw new Error(`Razorpay subscription creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    try {
      this.logInfo('Cancelling subscription', { subscriptionId: params.subscriptionId });

      await this.makeRequest(`/subscriptions/${params.subscriptionId}/cancel`, 'POST', {
        cancel_at_cycle_end: 0
      });

      this.logInfo('Subscription cancelled successfully');
    } catch (error) {
      this.logError('Failed to cancel subscription', error);
      throw new Error(`Razorpay subscription cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    try {
      this.logInfo('Creating payment', { orderId: params.orderId, amount: params.amount });

      const orderData = {
        amount: params.amount * 100,
        currency: params.currency.toUpperCase(),
        receipt: params.orderId,
        notes: {
          customer_id: params.customerId,
          customer_email: params.customerEmail,
          description: params.description,
          ...params.metadata
        }
      };

      const response = await this.makeRequest('/orders', 'POST', orderData);

      return {
        paymentId: response.id,
        orderId: response.receipt,
        status: this.mapRazorpayStatus(response.status),
        amount: response.amount / 100,
        currency: response.currency
      };
    } catch (error) {
      this.logError('Failed to create payment', error);
      throw new Error(`Razorpay payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.makeRequest(`/orders/${paymentId}`, 'GET');
      return this.mapRazorpayStatus(response.status);
    } catch (error) {
      this.logError('Failed to get payment status', error);
      throw new Error(`Razorpay payment status check failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async refundPayment(params: RefundPaymentParams): Promise<void> {
    try {
      this.logInfo('Processing refund', { paymentId: params.paymentId });

      const refundData: any = {
        payment_id: params.paymentId
      };

      if (params.amount) {
        refundData.amount = params.amount * 100;
      }

      if (params.reason) {
        refundData.notes = { reason: params.reason };
      }

      await this.makeRequest('/refunds', 'POST', refundData);
      this.logInfo('Refund processed successfully');
    } catch (error) {
      this.logError('Failed to process refund', error);
      throw new Error(`Razorpay refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyWebhook(event: WebhookEvent): Promise<WebhookVerificationResult> {
    try {
      if (!this.config.webhookSecret || !event.signature) {
        return { isValid: false };
      }

      const expectedSignature = crypto
        .createHmac('sha256', this.config.webhookSecret)
        .update(JSON.stringify(event.payload))
        .digest('hex');

      const isValid = expectedSignature === event.signature;

      if (isValid) {
        return {
          isValid: true,
          event: event.payload.event,
          data: event.payload.payload
        };
      }

      return { isValid: false };
    } catch (error) {
      this.logError('Webhook verification failed', error);
      return { isValid: false };
    }
  }

  private async makeRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const auth = Buffer.from(`${this.config.apiKey}:${this.config.apiSecret}`).toString('base64');

    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Basic ${auth}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ error: { description: 'Unknown error' } }));
      throw new Error(error.error?.description || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private mapRazorpayStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'created': 'pending',
      'attempted': 'processing',
      'paid': 'completed',
      'active': 'completed',
      'cancelled': 'failed',
      'completed': 'completed',
      'expired': 'failed',
      'refunded': 'refunded'
    };

    return statusMap[status.toLowerCase()] || 'pending';
  }
}
