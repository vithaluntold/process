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

export class PayoneerGateway extends BasePaymentGateway {
  private readonly baseUrl: string;

  constructor(config: PaymentGatewayConfig) {
    super(config);
    this.validateConfig();
    this.baseUrl = config.sandbox 
      ? 'https://api.sandbox.payoneer.com' 
      : 'https://api.payoneer.com';
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> {
    try {
      this.logInfo('Creating subscription', { planId: params.planId, customerId: params.customerId });

      const subscriptionData = {
        programId: this.config.apiKey,
        paymentId: `sub_${Date.now()}`,
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        billingPeriod: params.billingCycle === 'monthly' ? 'MONTHLY' : 'YEARLY',
        description: `Subscription - ${params.planId}`,
        metadata: params.metadata
      };

      const response = await this.makeRequest('/v2/programs/charge', 'POST', subscriptionData);

      return {
        subscriptionId: response.paymentId,
        status: this.mapPayoneerStatus(response.status),
        paymentUrl: response.redirectUrl,
        nextBillingDate: new Date(Date.now() + (params.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      this.logError('Failed to create subscription', error);
      throw new Error(`Payoneer subscription creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    try {
      this.logInfo('Cancelling subscription', { subscriptionId: params.subscriptionId });

      await this.makeRequest(`/v2/programs/${params.subscriptionId}/cancel`, 'POST', {
        reason: params.reason || 'Customer requested cancellation'
      });

      this.logInfo('Subscription cancelled successfully');
    } catch (error) {
      this.logError('Failed to cancel subscription', error);
      throw new Error(`Payoneer subscription cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    try {
      this.logInfo('Creating payment', { orderId: params.orderId, amount: params.amount });

      const paymentData = {
        programId: this.config.apiKey,
        paymentId: params.orderId,
        amount: params.amount,
        currency: params.currency.toUpperCase(),
        customerId: params.customerId,
        customerEmail: params.customerEmail,
        description: params.description || 'Payment',
        metadata: params.metadata
      };

      const response = await this.makeRequest('/v2/programs/charge', 'POST', paymentData);

      return {
        paymentId: response.paymentId,
        orderId: params.orderId,
        status: this.mapPayoneerStatus(response.status),
        paymentUrl: response.redirectUrl,
        amount: params.amount,
        currency: params.currency
      };
    } catch (error) {
      this.logError('Failed to create payment', error);
      throw new Error(`Payoneer payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.makeRequest(`/v2/programs/payments/${paymentId}`, 'GET');
      return this.mapPayoneerStatus(response.status);
    } catch (error) {
      this.logError('Failed to get payment status', error);
      return 'pending';
    }
  }

  async refundPayment(params: RefundPaymentParams): Promise<void> {
    try {
      this.logInfo('Processing refund', { paymentId: params.paymentId });

      const refundData: any = {
        paymentId: params.paymentId
      };

      if (params.amount) {
        refundData.amount = params.amount;
      }

      if (params.reason) {
        refundData.reason = params.reason;
      }

      await this.makeRequest('/v2/programs/refund', 'POST', refundData);
      this.logInfo('Refund processed successfully');
    } catch (error) {
      this.logError('Failed to process refund', error);
      throw new Error(`Payoneer refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
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
          event: event.payload.eventType,
          data: event.payload.data
        };
      }

      return { isValid: false };
    } catch (error) {
      this.logError('Webhook verification failed', error);
      return { isValid: false };
    }
  }

  private async makeRequest(endpoint: string, method: string, data?: any): Promise<any> {
    const response = await fetch(`${this.baseUrl}${endpoint}`, {
      method,
      headers: {
        'Authorization': `Bearer ${this.config.apiSecret}`,
        'Content-Type': 'application/json'
      },
      body: data ? JSON.stringify(data) : undefined
    });

    if (!response.ok) {
      const error = await response.json().catch(() => ({ message: 'Unknown error' }));
      throw new Error(error.message || `HTTP ${response.status}`);
    }

    return response.json();
  }

  private mapPayoneerStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'pending': 'pending',
      'processing': 'processing',
      'completed': 'completed',
      'success': 'completed',
      'failed': 'failed',
      'refunded': 'refunded',
      'cancelled': 'failed'
    };

    return statusMap[status?.toLowerCase()] || 'pending';
  }
}
