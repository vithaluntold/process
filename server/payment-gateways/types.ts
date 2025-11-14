export type PaymentGatewayProvider = 'razorpay' | 'payu' | 'payoneer';

export type PaymentStatus = 'pending' | 'processing' | 'completed' | 'failed' | 'refunded';

export interface PaymentGatewayConfig {
  provider: PaymentGatewayProvider;
  apiKey: string;
  apiSecret: string;
  webhookSecret?: string;
  sandbox?: boolean;
}

export interface CreateSubscriptionParams {
  planId: string;
  customerId: string;
  customerEmail: string;
  customerName: string;
  amount: number;
  currency: string;
  billingCycle: 'monthly' | 'yearly';
  metadata?: Record<string, any>;
}

export interface CreateSubscriptionResult {
  subscriptionId: string;
  status: string;
  paymentUrl?: string;
  nextBillingDate?: Date;
}

export interface CreatePaymentParams {
  amount: number;
  currency: string;
  orderId: string;
  customerId: string;
  customerEmail: string;
  description?: string;
  metadata?: Record<string, any>;
}

export interface CreatePaymentResult {
  paymentId: string;
  orderId: string;
  status: PaymentStatus;
  paymentUrl?: string;
  amount: number;
  currency: string;
}

export interface CancelSubscriptionParams {
  subscriptionId: string;
  reason?: string;
}

export interface RefundPaymentParams {
  paymentId: string;
  amount?: number;
  reason?: string;
}

export interface WebhookEvent {
  event: string;
  payload: any;
  signature?: string;
}

export interface WebhookVerificationResult {
  isValid: boolean;
  event?: string;
  data?: any;
}

export interface IPaymentGateway {
  createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult>;
  
  cancelSubscription(params: CancelSubscriptionParams): Promise<void>;
  
  createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  
  getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  
  refundPayment(params: RefundPaymentParams): Promise<void>;
  
  verifyWebhook(event: WebhookEvent): Promise<WebhookVerificationResult>;
}
