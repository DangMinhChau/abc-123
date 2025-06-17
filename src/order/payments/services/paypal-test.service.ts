import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class PayPalTestService {
  private readonly logger = new Logger(PayPalTestService.name);

  constructor(private readonly configService: ConfigService) {}

  async testBasicSetup(): Promise<any> {
    try {
      this.logger.log('Testing basic PayPal setup...');

      // Test environment variables
      const clientId = this.configService.get<string>('PAYPAL_CLIENT_ID');
      const clientSecret = this.configService.get<string>(
        'PAYPAL_CLIENT_SECRET',
      );
      const environment = this.configService.get<string>(
        'PAYPAL_ENVIRONMENT',
        'sandbox',
      );

      this.logger.log(`PayPal Environment: ${environment}`);
      this.logger.log(
        `PayPal Client ID: ${clientId ? clientId.substring(0, 10) + '...' : 'NOT_SET'}`,
      );
      this.logger.log(
        `PayPal Client Secret: ${clientSecret ? 'SET' : 'NOT_SET'}`,
      );

      if (!clientId || !clientSecret) {
        throw new Error('PayPal credentials not configured');
      }

      // Test PayPal SDK import
      let paypalSDK;
      try {
        paypalSDK = require('@paypal/checkout-server-sdk');
        this.logger.log('✅ PayPal SDK imported successfully');
      } catch (error) {
        this.logger.error('❌ Failed to import PayPal SDK:', error);
        throw new Error('PayPal SDK import failed');
      }

      // Test PayPal client initialization
      try {
        const env =
          environment === 'live'
            ? new paypalSDK.core.LiveEnvironment(clientId, clientSecret)
            : new paypalSDK.core.SandboxEnvironment(clientId, clientSecret);

        const client = new paypalSDK.core.PayPalHttpClient(env);
        this.logger.log('✅ PayPal client initialized successfully');

        return {
          success: true,
          environment,
          hasCredentials: true,
          sdkImported: true,
          clientInitialized: true,
        };
      } catch (error) {
        this.logger.error('❌ Failed to initialize PayPal client:', error);
        throw error;
      }
    } catch (error) {
      this.logger.error('❌ PayPal test failed:', error);
      return {
        success: false,
        error: error.message,
      };
    }
  }
}
