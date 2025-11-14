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

export class PayUGateway extends BasePaymentGateway {
  private readonly baseUrl: string;

  constructor(config: PaymentGatewayConfig) {
    super(config);
    this.validateConfig();
    this.baseUrl = config.sandbox 
      ? 'https://test.payu.in' 
      : 'https://secure.payu.in';
  }

  async createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult> {
    try {
      this.logInfo('Creating subscription', { planId: params.planId, customerId: params.customerId });

      const subscriptionData = {
        key: this.config.apiKey,
        txnid: `sub_${Date.now()}`,
        amount: params.amount,
        productinfo: `Subscription - ${params.planId}`,
        firstname: params.customerName.split(' ')[0],
        email: params.customerEmail,
        phone: '0000000000',
        surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        furl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        udf1: params.customerId,
        udf2: params.planId,
        udf3: params.billingCycle,
        hash: ''
      };

      subscriptionData.hash = this.generateHash(subscriptionData);

      return {
        subscriptionId: subscriptionData.txnid,
        status: 'pending',
        paymentUrl: `${this.baseUrl}/_payment`,
        nextBillingDate: new Date(Date.now() + (params.billingCycle === 'monthly' ? 30 : 365) * 24 * 60 * 60 * 1000)
      };
    } catch (error) {
      this.logError('Failed to create subscription', error);
      throw new Error(`PayU subscription creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async cancelSubscription(params: CancelSubscriptionParams): Promise<void> {
    try {
      this.logInfo('Cancelling subscription', { subscriptionId: params.subscriptionId });
      this.logInfo('Subscription marked for cancellation - requires manual processing in PayU dashboard');
    } catch (error) {
      this.logError('Failed to cancel subscription', error);
      throw new Error(`PayU subscription cancellation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult> {
    try {
      this.logInfo('Creating payment', { orderId: params.orderId, amount: params.amount });

      const paymentData = {
        key: this.config.apiKey,
        txnid: params.orderId,
        amount: params.amount,
        productinfo: params.description || 'Payment',
        firstname: 'Customer',
        email: params.customerEmail,
        phone: '0000000000',
        surl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        furl: `${process.env.NEXT_PUBLIC_APP_URL}/api/payments/webhook`,
        udf1: params.customerId,
        hash: ''
      };

      paymentData.hash = this.generateHash(paymentData);

      return {
        paymentId: params.orderId,
        orderId: params.orderId,
        status: 'pending',
        paymentUrl: `${this.baseUrl}/_payment`,
        amount: params.amount,
        currency: params.currency
      };
    } catch (error) {
      this.logError('Failed to create payment', error);
      throw new Error(`PayU payment creation failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async getPaymentStatus(paymentId: string): Promise<PaymentStatus> {
    try {
      const response = await this.verifyPayment(paymentId);
      return this.mapPayUStatus(response.status);
    } catch (error) {
      this.logError('Failed to get payment status', error);
      return 'pending';
    }
  }

  async refundPayment(params: RefundPaymentParams): Promise<void> {
    try {
      this.logInfo('Processing refund', { paymentId: params.paymentId });

      const refundData = {
        key: this.config.apiKey,
        command: 'cancel_refund_transaction',
        var1: params.paymentId,
        var2: params.amount?.toString() || '',
        hash: ''
      };

      const hashString = `${this.config.apiKey}|${refundData.command}|${refundData.var1}|${this.config.apiSecret}`;
      refundData.hash = crypto.createHash('sha512').update(hashString).digest('hex');

      await fetch(`${this.baseUrl}/merchant/postservice?form=2`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(refundData as any).toString()
      });

      this.logInfo('Refund request submitted');
    } catch (error) {
      this.logError('Failed to process refund', error);
      throw new Error(`PayU refund failed: ${error instanceof Error ? error.message : 'Unknown error'}`);
    }
  }

  async verifyWebhook(event: WebhookEvent): Promise<WebhookVerificationResult> {
    try {
      const payload = event.payload;
      const receivedHash = payload.hash;

      const hashString = `${this.config.apiSecret}|${payload.status}|||||||||||${payload.email}|${payload.firstname}|${payload.productinfo}|${payload.amount}|${payload.txnid}|${this.config.apiKey}`;
      const calculatedHash = crypto.createHash('sha512').update(hashString).digest('hex');

      const isValid = receivedHash === calculatedHash;

      if (isValid) {
        return {
          isValid: true,
          event: 'payment_status',
          data: payload
        };
      }

      return { isValid: false };
    } catch (error) {
      this.logError('Webhook verification failed', error);
      return { isValid: false };
    }
  }

  private async verifyPayment(txnId: string): Promise<any> {
    const command = 'verify_payment';
    const hashString = `${this.config.apiKey}|${command}|${txnId}|${this.config.apiSecret}`;
    const hash = crypto.createHash('sha512').update(hashString).digest('hex');

    const response = await fetch(`${this.baseUrl}/merchant/postservice.php?form=2`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
      body: new URLSearchParams({
        key: this.config.apiKey,
        command,
        var1: txnId,
        hash
      }).toString()
    });

    return response.json();
  }

  private generateHash(data: any): string {
    const hashString = `${this.config.apiKey}|${data.txnid}|${data.amount}|${data.productinfo}|${data.firstname}|${data.email}|${data.udf1 || ''}|${data.udf2 || ''}|${data.udf3 || ''}|${data.udf4 || ''}|${data.udf5 || ''}||||||${this.config.apiSecret}`;
    return crypto.createHash('sha512').update(hashString).digest('hex');
  }

  private mapPayUStatus(status: string): PaymentStatus {
    const statusMap: Record<string, PaymentStatus> = {
      'success': 'completed',
      'pending': 'pending',
      'failed': 'failed',
      'refunded': 'refunded',
      'cancelled': 'failed'
    };

    return statusMap[status?.toLowerCase()] || 'pending';
  }
}
