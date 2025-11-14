import type { 
  IPaymentGateway, 
  PaymentGatewayConfig,
  CreateSubscriptionParams,
  CreateSubscriptionResult,
  CreatePaymentParams,
  CreatePaymentResult,
  CancelSubscriptionParams,
  RefundPaymentParams,
  WebhookEvent,
  WebhookVerificationResult,
  PaymentStatus
} from './types';

export abstract class BasePaymentGateway implements IPaymentGateway {
  protected config: PaymentGatewayConfig;

  constructor(config: PaymentGatewayConfig) {
    this.config = config;
  }

  abstract createSubscription(params: CreateSubscriptionParams): Promise<CreateSubscriptionResult>;
  
  abstract cancelSubscription(params: CancelSubscriptionParams): Promise<void>;
  
  abstract createPayment(params: CreatePaymentParams): Promise<CreatePaymentResult>;
  
  abstract getPaymentStatus(paymentId: string): Promise<PaymentStatus>;
  
  abstract refundPayment(params: RefundPaymentParams): Promise<void>;
  
  abstract verifyWebhook(event: WebhookEvent): Promise<WebhookVerificationResult>;

  protected validateConfig(): void {
    if (!this.config.apiKey) {
      throw new Error(`${this.config.provider} API key is required`);
    }
    if (!this.config.apiSecret) {
      throw new Error(`${this.config.provider} API secret is required`);
    }
  }

  protected logError(message: string, error: any): void {
    console.error(`[${this.config.provider.toUpperCase()}] ${message}:`, error);
  }

  protected logInfo(message: string, data?: any): void {
    console.log(`[${this.config.provider.toUpperCase()}] ${message}`, data || '');
  }
}
