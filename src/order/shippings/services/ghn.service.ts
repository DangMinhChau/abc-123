import { Injectable, HttpException, HttpStatus, Logger } from '@nestjs/common';
import { HttpService } from '@nestjs/axios';
import { ConfigService } from '@nestjs/config';
import { firstValueFrom } from 'rxjs';
import { CacheService } from './cache.service';
import {
  GHNCreateOrderRequest,
  GHNCreateOrderResponse,
  GHNTrackingResponse,
  GHNCalculateFeeRequest,
  GHNCalculateFeeResponse,
  GHNProvinceResponse,
  GHNDistrictResponse,
  GHNWardResponse,
  GHNServiceResponse,
} from '../interfaces/ghn.interface';

interface HttpError {
  response?: {
    data?: {
      code?: number;
      message?: string;
    };
    status?: number;
  };
  message?: string;
  stack?: string;
}

interface GHNBaseResponse {
  code: number;
  message: string;
  data?: any;
}

@Injectable()
export class GHNService {
  private readonly logger = new Logger(GHNService.name);
  private readonly baseUrl: string;
  private readonly token: string;
  private readonly shopId: string;
  constructor(
    private readonly httpService: HttpService,
    private readonly configService: ConfigService,
    private readonly cacheService: CacheService,
  ) {
    this.baseUrl =
      this.configService.get<string>('GHN_API_URL') ||
      'https://dev-online-gateway.ghn.vn/shiip/public-api';

    const token = this.configService.get<string>('GHN_TOKEN');
    const shopId = this.configService.get<string>('GHN_SHOP_ID');

    if (!token || !shopId) {
      this.logger.error('GHN_TOKEN and GHN_SHOP_ID must be configured');
      throw new Error('GHN configuration is incomplete');
    }

    this.token = token;
    this.shopId = shopId;

    // Validate additional required environment variables
    const fromDistrictId = this.configService.get<string>(
      'GHN_FROM_DISTRICT_ID',
    );
    const fromWardCode = this.configService.get<string>('GHN_FROM_WARD_CODE');
    const returnPhone = this.configService.get<string>('GHN_RETURN_PHONE');
    const returnAddress = this.configService.get<string>('GHN_RETURN_ADDRESS');

    if (!fromDistrictId || !fromWardCode || !returnPhone || !returnAddress) {
      this.logger.warn(
        'Some GHN configuration variables are missing. Using defaults. Please set: GHN_FROM_DISTRICT_ID, GHN_FROM_WARD_CODE, GHN_RETURN_PHONE, GHN_RETURN_ADDRESS',
      );
    }

    this.logger.log('GHN Service initialized successfully');
  }

  private getHeaders() {
    return {
      Token: this.token,
      ShopId: this.shopId,
      'Content-Type': 'application/json',
    };
  }

  private handleError(error: HttpError, context: string): never {
    const errorMessage =
      error.response?.data?.message || error.message || 'Unknown error';
    this.logger.error(`${context}: ${errorMessage}`, error.stack);
    throw new HttpException(
      `${context}: ${errorMessage}`,
      error.response?.status || HttpStatus.INTERNAL_SERVER_ERROR,
    );
  } /**
   * Create order in GHN system
   */
  async createOrder(
    orderData: GHNCreateOrderRequest,
  ): Promise<GHNCreateOrderResponse> {
    try {
      this.logger.log(
        `Creating GHN order for client order: ${orderData.client_order_code}`,
      );

      const response = await firstValueFrom(
        this.httpService.post<GHNCreateOrderResponse>(
          `${this.baseUrl}/v2/shipping-order/create`,
          orderData,
          { headers: this.getHeaders() },
        ),
      );

      const data: GHNCreateOrderResponse = response.data;
      if (data.code !== 200) {
        throw new HttpException(
          `GHN API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      this.logger.log(
        `GHN order created successfully: ${data.data.order_code}`,
      );
      return data;
    } catch (error) {
      this.handleError(error as HttpError, 'Failed to create GHN order');
    }
  }

  /**
   * Track order status
   */
  async trackOrder(orderCode: string): Promise<GHNTrackingResponse> {
    try {
      this.logger.log(`Tracking GHN order: ${orderCode}`);

      const response = await firstValueFrom(
        this.httpService.post<GHNTrackingResponse>(
          `${this.baseUrl}/v2/shipping-order/detail`,
          { order_code: orderCode },
          { headers: this.getHeaders() },
        ),
      );

      const data = response.data;
      if (data.code !== 200) {
        throw new HttpException(
          `GHN API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data;
    } catch (error) {
      this.handleError(error as HttpError, 'Failed to track GHN order');
    }
  }
  /**
   * Calculate shipping fee
   */
  async calculateFee(
    feeData: GHNCalculateFeeRequest,
  ): Promise<GHNCalculateFeeResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GHNCalculateFeeResponse>(
          `${this.baseUrl}/v2/shipping-order/fee`,
          feeData,
          { headers: this.getHeaders() },
        ),
      );

      const data: GHNCalculateFeeResponse = response.data;
      if (data.code !== 200) {
        throw new HttpException(
          `GHN API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data;
    } catch (error) {
      this.handleError(error as HttpError, 'Failed to calculate shipping fee');
    }
  }

  /**
   * Get available provinces
   */
  async getProvinces(): Promise<GHNProvinceResponse> {
    const cacheKey = 'ghn:provinces';
    const cached = this.cacheService.get<GHNProvinceResponse>(cacheKey);

    if (cached) {
      this.logger.debug('Returning cached provinces');
      return cached;
    }

    try {
      const response = await firstValueFrom(
        this.httpService.get<GHNProvinceResponse>(
          `${this.baseUrl}/master-data/province`,
          { headers: this.getHeaders() },
        ),
      );

      const data: GHNProvinceResponse = response.data;
      if (data.code !== 200) {
        throw new HttpException(
          `GHN API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      // Cache provinces for 1 hour (they don't change often)
      this.cacheService.set(cacheKey, data, 3600);
      return data;
    } catch (error) {
      this.handleError(error as HttpError, 'Failed to get provinces');
    }
  }
  /**
   * Get districts by province
   */
  async getDistricts(provinceId: number): Promise<GHNDistrictResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GHNDistrictResponse>(
          `${this.baseUrl}/master-data/district`,
          { province_id: provinceId },
          { headers: this.getHeaders() },
        ),
      );

      const data: GHNDistrictResponse = response.data;
      if (data.code !== 200) {
        throw new HttpException(
          `GHN API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data;
    } catch (error) {
      this.handleError(error as HttpError, 'Failed to get districts');
    }
  }
  /**
   * Get wards by district
   */
  async getWards(districtId: number): Promise<GHNWardResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GHNWardResponse>(
          `${this.baseUrl}/master-data/ward`,
          { district_id: districtId },
          { headers: this.getHeaders() },
        ),
      );

      const data: GHNWardResponse = response.data;
      if (data.code !== 200) {
        throw new HttpException(
          `GHN API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data;
    } catch (error) {
      this.handleError(error as HttpError, 'Failed to get wards');
    }
  }
  /**
   * Get available services
   */
  async getServices(
    fromDistrict: number,
    toDistrict: number,
  ): Promise<GHNServiceResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GHNServiceResponse>(
          `${this.baseUrl}/v2/shipping-order/available-services`,
          {
            shop_id: parseInt(this.shopId),
            from_district: fromDistrict,
            to_district: toDistrict,
          },
          { headers: this.getHeaders() },
        ),
      );

      const data: GHNServiceResponse = response.data;
      if (data.code !== 200) {
        throw new HttpException(
          `GHN API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data;
    } catch (error) {
      this.handleError(error as HttpError, 'Failed to get services');
    }
  }
  /**
   * Cancel order
   */
  async cancelOrder(orderCodes: string[]): Promise<GHNBaseResponse> {
    try {
      const response = await firstValueFrom(
        this.httpService.post<GHNBaseResponse>(
          `${this.baseUrl}/v2/shipping-order/cancel`,
          { order_codes: orderCodes },
          { headers: this.getHeaders() },
        ),
      );

      const data: GHNBaseResponse = response.data;
      if (data.code !== 200) {
        throw new HttpException(
          `GHN API Error: ${data.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }

      return data;
    } catch (error) {
      this.handleError(error as HttpError, 'Failed to cancel order');
    }
  }

  /**
   * Map GHN status to our shipping status
   */
  mapGHNStatusToShippingStatus(ghnStatus: string): string {
    const statusMap: { [key: string]: string } = {
      ready_to_pick: 'pending',
      picking: 'processing',
      cancel: 'cancelled',
      money_collect_picking: 'processing',
      picked: 'shipped',
      storing: 'shipped',
      transporting: 'shipped',
      sorting: 'shipped',
      delivering: 'out_for_delivery',
      money_collect_delivering: 'out_for_delivery',
      delivered: 'delivered',
      delivery_fail: 'failed',
      waiting_to_return: 'return_requested',
      return: 'returned',
      return_transporting: 'returning',
      return_sorting: 'returning',
      returning: 'returning',
      return_fail: 'return_failed',
      returned: 'returned',
      exception: 'failed',
      damage: 'damaged',
      lost: 'lost',
    };

    return statusMap[ghnStatus] || 'unknown';
  } /**
   * Validate address with GHN
   */
  async validateAddress(
    province: string,
    district: string,
    ward: string,
  ): Promise<boolean> {
    try {
      // First get provinces to find the province ID
      const provinces = await this.getProvinces();
      const provinceData = provinces.data.find(
        (p) => p.ProvinceName.toLowerCase() === province.toLowerCase(),
      );

      if (!provinceData) {
        return false;
      }

      // Get districts for the province
      const districts = await this.getDistricts(provinceData.ProvinceID);
      const districtData = districts.data.find(
        (d) => d.DistrictName.toLowerCase() === district.toLowerCase(),
      );

      if (!districtData) {
        return false;
      }

      // Get wards for the district
      const wards = await this.getWards(districtData.DistrictID);
      const wardData = wards.data.find(
        (w) => w.WardName.toLowerCase() === ward.toLowerCase(),
      );

      return !!wardData;
    } catch (error) {
      this.logger.error(
        `Failed to validate address: ${(error as HttpError).message || 'Unknown error'}`,
      );
      return false;
    }
  }

  /**
   * Validate GHN configuration
   */
  validateConfiguration(): void {
    const requiredEnvVars = [
      'GHN_TOKEN',
      'GHN_SHOP_ID',
      'GHN_FROM_DISTRICT_ID',
      'GHN_FROM_WARD_CODE',
      'GHN_RETURN_PHONE',
      'GHN_RETURN_ADDRESS',
    ];

    const missingVars = requiredEnvVars.filter(
      (varName) => !this.configService.get<string>(varName),
    );

    if (missingVars.length > 0) {
      this.logger.error(
        `Missing GHN configuration variables: ${missingVars.join(', ')}`,
      );
      throw new Error(
        `GHN configuration incomplete: missing ${missingVars.join(', ')}`,
      );
    }

    this.logger.log('GHN configuration validated successfully');
  }
}
