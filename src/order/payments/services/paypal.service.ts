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

// PayPal supported currencies
const SUPPORTED_CURRENCIES = [
  'USD',
  'EUR',
  'GBP',
  'JPY',
  'CAD',
  'AUD',
  'CHF',
  'HKD',
  'SGD',
  'SEK',
  'DKK',
  'PLN',
  'NOK',
  'HUF',
  'CZK',
  'ILS',
  'MXN',
  'BRL',
  'MYR',
  'PHP',
  'TWD',
  'THB',
  'TRY',
];

// Exchange rate VND to USD (should be from a real exchange rate API in production)
const VND_TO_USD_RATE = 0.000041; // 1 VND = 0.000041 USD (approximate)

// PayPal minimum amounts per currency
const PAYPAL_MIN_AMOUNTS = {
  USD: 0.5, // $0.50 minimum
  EUR: 0.5,
  GBP: 0.3,
  JPY: 50,
};

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
  private convertCurrencyForPayPal(
    amount: number,
    currency: string,
  ): { amount: number; currency: string } {
    // If currency is not supported by PayPal, convert to USD
    if (!SUPPORTED_CURRENCIES.includes(currency.toUpperCase())) {
      this.logger.warn(
        `Currency ${currency} not supported by PayPal, converting to USD`,
      );

      if (currency.toUpperCase() === 'VND') {
        const usdAmount = Math.round(amount * VND_TO_USD_RATE * 100) / 100; // Round to 2 decimal places
        this.logger.log(`Converting ${amount} VND to ${usdAmount} USD`);

        // Check minimum amount for USD
        if (usdAmount < PAYPAL_MIN_AMOUNTS.USD) {
          this.logger.warn(
            `Converted amount ${usdAmount} USD is below minimum ${PAYPAL_MIN_AMOUNTS.USD} USD`,
          );
          // Use minimum amount but log the issue
          return { amount: PAYPAL_MIN_AMOUNTS.USD, currency: 'USD' };
        }

        return { amount: usdAmount, currency: 'USD' };
      }

      // For other unsupported currencies, default to USD with a basic conversion
      const usdAmount = Math.round(amount * 0.000041 * 100) / 100;
      this.logger.warn(
        `Unknown currency ${currency}, converting ${amount} to ${usdAmount} USD using default rate`,
      );

      // Check minimum amount
      if (usdAmount < PAYPAL_MIN_AMOUNTS.USD) {
        return { amount: PAYPAL_MIN_AMOUNTS.USD, currency: 'USD' };
      }

      return { amount: usdAmount, currency: 'USD' };
    }

    return { amount, currency };
  }
  async createOrder(
    params: CreatePayPalOrderParams,
  ): Promise<PayPalOrderResponse> {
    try {
      this.logger.log(
        `Creating PayPal order for internal order: ${params.orderId}`,
      );
      this.logger.log(
        `Original amount: ${params.amount} ${params.currency || 'VND'}`,
      );

      // Convert currency if needed
      const { amount: convertedAmount, currency: paypalCurrency } =
        this.convertCurrencyForPayPal(params.amount, params.currency || 'VND');

      this.logger.log(`PayPal amount: ${convertedAmount} ${paypalCurrency}`);
      const request = new (paypal as any).orders.OrdersCreateRequest();
      request.prefer('return=representation');
      request.requestBody({
        intent: 'CAPTURE',
        purchase_units: [
          {
            reference_id: params.orderId,
            amount: {
              currency_code: paypalCurrency,
              value:
                paypalCurrency === 'USD'
                  ? convertedAmount.toFixed(2)
                  : convertedAmount.toFixed(0),
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

      this.logger.log('Sending request to PayPal API...');
      const response = await this.client.execute(request);
      const order = response.result;

      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`✅ PayPal order created successfully: ${order.id}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`PayPal order status: ${order.status}`);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.log(`PayPal order links:`, order.links);

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        paypalOrderId: order.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        status: order.status,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        links: order.links,
      };
    } catch (error) {
      this.logger.error('❌ Error creating PayPal order:');
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Error name:', error.name);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      this.logger.error('Error message:', error.message);

      // Log detailed PayPal API error if available
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.statusCode) {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
        this.logger.error('PayPal API status code:', error.statusCode);
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.details) {
        this.logger.error(
          'PayPal API error details:',
          JSON.stringify(error.details, null, 2),
        );
      }
      // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access
      if (error.result) {
        this.logger.error(
          'PayPal API error result:',
          JSON.stringify(error.result, null, 2),
        );
      }

      // Log the full error for debugging
      this.logger.error('Full error object:', error);

      throw new BadRequestException(
        `Failed to create PayPal order: ${error.message}`,
      );
    }
  }

  async captureOrder(
    params: CapturePayPalOrderParams,
  ): Promise<PayPalCaptureResponse> {
    try {
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-call
      const request = new (paypal as any).orders.OrdersCaptureRequest(
        params.paypalOrderId,
      );
      // eslint-disable-next-line @typescript-eslint/no-unsafe-call, @typescript-eslint/no-unsafe-member-access
      request.requestBody({});

      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment
      const response = await this.client.execute(request);
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const capture = response.result;

      this.logger.log(`Captured PayPal order: ${params.paypalOrderId}`);

      // Extract capture details
      // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
      const captureUnit = capture.purchase_units[0].payments.captures[0];

      return {
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        orderId: capture.purchase_units[0].reference_id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        status: capture.status,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        captureId: captureUnit.id,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-member-access, @typescript-eslint/no-unsafe-argument
        amount: parseFloat(captureUnit.amount.value),
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
        currency: captureUnit.amount.currency_code,
        // eslint-disable-next-line @typescript-eslint/no-unsafe-assignment, @typescript-eslint/no-unsafe-member-access
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
