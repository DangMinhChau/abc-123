import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as paypal from '@paypal/checkout-server-sdk';

export interface PayPalConfig {
  clientId: string;
  clientSecret: string;
  environment: 'sandbox' | 'live';
}

export interface CreatePayPalOrderParams {
  orderId: string;
  amount: number;
  currency?: string;
  description?: string;
}

export interface PayPalOrderResponse {
  paypalOrderId: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

export interface CapturePayPalOrderParams {
  paypalOrderId: string;
}

export interface PayPalCaptureResponse {
  orderId: string;
  status: string;
  captureId: string;
  amount: number;
  currency: string;
  createTime: string;
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private client: paypal.core.PayPalHttpClient;

  constructor(private readonly configService: ConfigService) {
    this.initializeClient();
  }

  private initializeClient(): void {
    const config = this.getConfig();

    let environment:
      | paypal.core.SandboxEnvironment
      | paypal.core.LiveEnvironment;

    if (config.environment === 'live') {
      environment = new paypal.core.LiveEnvironment(
        config.clientId,
        config.clientSecret,
      );
    } else {
      environment = new paypal.core.SandboxEnvironment(
        config.clientId,
        config.clientSecret,
      );
    }

    this.client = new paypal.core.PayPalHttpClient(environment);
    this.logger.log(
      `PayPal client initialized for ${config.environment} environment`,
    );
  }

  private getConfig(): PayPalConfig {
    const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
    const clientSecret = this.configService.get<string>('PAYPAL_CLIENT_SECRET');
    const environment = this.configService.get<string>(
      'PAYPAL_ENVIRONMENT',
      'sandbox',
    ) as 'sandbox' | 'live';

    if (!clientId || !clientSecret) {
      throw new Error('PayPal credentials are not configured');
    }

    return {
      clientId,
      clientSecret,
      environment,
    };
  }

  async createOrder(
    params: CreatePayPalOrderParams,
  ): Promise<PayPalOrderResponse> {
    try {
      const request = new paypal.orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.orderId,
            amount: {
              currency_code: params.currency || 'VND',
              value: params.amount.toFixed(0), // VND doesn't use decimal places
            },
            description: params.description || `Order ${params.orderId}`,
          },
        ],
        application_context: {
          brand_name: "Men's Fashion Store",
          landing_page: 'NO_PREFERENCE',
          user_action: 'PAY_NOW',
          return_url: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/checkout/success`,
          cancel_url: `${this.configService.get('FRONTEND_URL', 'http://localhost:3000')}/checkout/cancel`,
        },
      });

      const response = await this.client.execute(request);
      const order = response.result;

      this.logger.log(
        `Created PayPal order: ${order.id} for internal order: ${params.orderId}`,
      );

      return {
        paypalOrderId: order.id,
        status: order.status,
        links: order.links,
      };
    } catch (error) {
      this.logger.error('Error creating PayPal order:', error);
      throw new BadRequestException('Failed to create PayPal order');
    }
  }

  async captureOrder(
    params: CapturePayPalOrderParams,
  ): Promise<PayPalCaptureResponse> {
    try {
      const request = new paypal.orders.OrdersCaptureRequest(
        params.paypalOrderId,
      );
      request.requestBody({});

      const response = await this.client.execute(request);
      const capture = response.result;

      this.logger.log(`Captured PayPal order: ${params.paypalOrderId}`);

      // Extract capture details
      const captureUnit = capture.purchase_units[0].payments.captures[0];

      return {
        orderId: capture.purchase_units[0].reference_id,
        status: capture.status,
        captureId: captureUnit.id,
        amount: parseFloat(captureUnit.amount.value),
        currency: captureUnit.amount.currency_code,
        createTime: captureUnit.create_time,
      };
    } catch (error) {
      this.logger.error('Error capturing PayPal order:', error);
      throw new BadRequestException('Failed to capture PayPal payment');
    }
  }

  async getOrderDetails(paypalOrderId: string): Promise<any> {
    try {
      const request = new paypal.orders.OrdersGetRequest(paypalOrderId);
      const response = await this.client.execute(request);
      return response.result;
    } catch (error) {
      this.logger.error('Error getting PayPal order details:', error);
      throw new BadRequestException('Failed to get PayPal order details');
    }
  }

  async refundCapture(
    captureId: string,
    amount?: number,
    currency?: string,
  ): Promise<any> {
    try {
      const request = new paypal.payments.CapturesRefundRequest(captureId);

      if (amount && currency) {
        request.requestBody({
          amount: {
            value: amount.toFixed(2),
            currency_code: currency,
          },
        });
      }

      const response = await this.client.execute(request);
      this.logger.log(`Refunded PayPal capture: ${captureId}`);
      return response.result;
    } catch (error) {
      this.logger.error('Error refunding PayPal capture:', error);
      throw new BadRequestException('Failed to refund PayPal payment');
    }
  }
}
