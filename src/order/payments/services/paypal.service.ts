import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

interface PayPalAccessTokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
}

interface PayPalOrderResponse {
  id: string;
  status: string;
  links: Array<{
    href: string;
    rel: string;
    method: string;
  }>;
}

interface PayPalCaptureResponse {
  id: string;
  status: string;
  payment_source?: any;
  purchase_units?: Array<{
    payments?: {
      captures?: Array<{
        id: string;
        status: string;
        amount: {
          currency_code: string;
          value: string;
        };
      }>;
    };
  }>;
}

@Injectable()
export class PayPalService {
  private readonly logger = new Logger(PayPalService.name);
  private readonly clientId: string;
  private readonly clientSecret: string;
  private readonly environment: string;
  private readonly baseUrl: string;
  constructor(private configService: ConfigService) {
    this.clientId = this.configService.get<string>('PAYPAL_CLIENT_ID') || '';
    this.clientSecret =
      this.configService.get<string>('PAYPAL_CLIENT_SECRET') || '';
    this.environment = this.configService.get<string>(
      'PAYPAL_ENVIRONMENT',
      'sandbox',
    );

    this.baseUrl =
      this.environment === 'live'
        ? 'https://api-m.paypal.com'
        : 'https://api-m.sandbox.paypal.com';

    if (!this.clientId || !this.clientSecret) {
      this.logger.warn(
        'PayPal credentials not configured. PayPal payments will not be available.',
      );
    }
  }

  async getAccessToken(): Promise<string> {
    if (!this.clientId || !this.clientSecret) {
      throw new BadRequestException('PayPal credentials not configured');
    }

    try {
      const auth = Buffer.from(
        `${this.clientId}:${this.clientSecret}`,
      ).toString('base64');

      const response = await fetch(`${this.baseUrl}/v1/oauth2/token`, {
        method: 'POST',
        headers: {
          Authorization: `Basic ${auth}`,
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: 'grant_type=client_credentials',
      });

      if (!response.ok) {
        throw new Error(`PayPal token request failed: ${response.statusText}`);
      }

      const data = (await response.json()) as PayPalAccessTokenResponse;
      return data.access_token;
    } catch (error) {
      this.logger.error('Failed to get PayPal access token', error);
      throw new BadRequestException('Failed to authenticate with PayPal');
    }
  }
  async createOrder(
    amount: number,
    currency: string = 'VND',
    orderId: string,
  ): Promise<PayPalOrderResponse> {
    try {
      const accessToken = await this.getAccessToken();

      // Handle VND currency conversion and formatting
      let formattedAmount: string;
      let paypalCurrency: string;

      if (currency === 'VND') {
        // Convert VND to USD for PayPal (1 USD ≈ 24,000 VND)
        const usdAmount = amount / 24000;
        formattedAmount = Math.max(0.01, usdAmount).toFixed(2); // PayPal minimum is $0.01
        paypalCurrency = 'USD';
        this.logger.log(`Converting VND ${amount} to USD ${formattedAmount}`);
      } else {
        formattedAmount = amount.toFixed(2);
        paypalCurrency = currency;
      }

      const orderData = {
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: orderId,
            amount: {
              currency_code: paypalCurrency,
              value: formattedAmount,
            },
            description: `Đơn hàng thời trang nam #${orderId}`,
            invoice_id: orderId,
          },
        ],
        application_context: {
          brand_name: 'Fashion Store Vietnam',
          landing_page: 'BILLING',
          user_action: 'PAY_NOW',
          shipping_preference: 'NO_SHIPPING', // We handle shipping separately
          return_url: `${this.configService.get('FRONTEND_URL')}/order-success`,
          cancel_url: `${this.configService.get('FRONTEND_URL')}/checkout`,
        },
      };

      const response = await fetch(`${this.baseUrl}/v2/checkout/orders`, {
        method: 'POST',
        headers: {
          Authorization: `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(orderData),
      });

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error('PayPal order creation failed', errorData);
        throw new Error(`PayPal order creation failed: ${response.statusText}`);
      }

      const paypalOrder = (await response.json()) as PayPalOrderResponse;
      this.logger.log(`PayPal order created: ${paypalOrder.id}`);

      return paypalOrder;
    } catch (error) {
      this.logger.error('Failed to create PayPal order', error);
      throw new BadRequestException('Failed to create PayPal order');
    }
  }

  async captureOrder(paypalOrderId: string): Promise<PayPalCaptureResponse> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}/capture`,
        {
          method: 'POST',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        const errorData = await response.text();
        this.logger.error('PayPal order capture failed', errorData);
        throw new Error(`PayPal order capture failed: ${response.statusText}`);
      }

      const captureData = (await response.json()) as PayPalCaptureResponse;
      this.logger.log(`PayPal order captured: ${captureData.id}`);

      return captureData;
    } catch (error) {
      this.logger.error('Failed to capture PayPal order', error);
      throw new BadRequestException('Failed to capture PayPal order');
    }
  }

  async getOrderDetails(paypalOrderId: string): Promise<any> {
    try {
      const accessToken = await this.getAccessToken();

      const response = await fetch(
        `${this.baseUrl}/v2/checkout/orders/${paypalOrderId}`,
        {
          method: 'GET',
          headers: {
            Authorization: `Bearer ${accessToken}`,
            'Content-Type': 'application/json',
          },
        },
      );

      if (!response.ok) {
        throw new Error(
          `PayPal order details request failed: ${response.statusText}`,
        );
      }

      return await response.json();
    } catch (error) {
      this.logger.error('Failed to get PayPal order details', error);
      throw new BadRequestException('Failed to get PayPal order details');
    }
  }

  isConfigured(): boolean {
    return !!(this.clientId && this.clientSecret);
  }
}
