import type { IPaymentGateway, PaymentGatewayProvider, PaymentGatewayConfig } from './types';
import { RazorpayGateway } from './RazorpayGateway';
import { PayUGateway } from './PayUGateway';
import { PayoneerGateway } from './PayoneerGateway';

export class PaymentGatewayFactory {
  static create(provider: PaymentGatewayProvider, config: Omit<PaymentGatewayConfig, 'provider'>): IPaymentGateway {
    const fullConfig: PaymentGatewayConfig = {
      ...config,
      provider
    };

    switch (provider) {
      case 'razorpay':
        return new RazorpayGateway(fullConfig);
      
      case 'payu':
        return new PayUGateway(fullConfig);
      
      case 'payoneer':
        return new PayoneerGateway(fullConfig);
      
      default:
        throw new Error(`Unsupported payment gateway: ${provider}`);
    }
  }

  static createFromEnv(): IPaymentGateway {
    const provider = (process.env.PAYMENT_GATEWAY_PROVIDER || 'razorpay') as PaymentGatewayProvider;
    
    const config = {
      apiKey: process.env.PAYMENT_GATEWAY_API_KEY || '',
      apiSecret: process.env.PAYMENT_GATEWAY_API_SECRET || '',
      webhookSecret: process.env.PAYMENT_GATEWAY_WEBHOOK_SECRET,
      sandbox: process.env.PAYMENT_GATEWAY_SANDBOX === 'true'
    };

    if (!config.apiKey || !config.apiSecret) {
      throw new Error(`Payment gateway credentials not configured for ${provider}`);
    }

    return this.create(provider, config);
  }
}
