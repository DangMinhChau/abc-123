import { Injectable, HttpException, HttpStatus } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface GHNProvince {
  ProvinceID: number;
  ProvinceName: string;
  CountryID: number;
  Code: string;
}

export interface GHNDistrict {
  DistrictID: number;
  ProvinceID: number;
  DistrictName: string;
  Code: string;
  Type: number;
  SupportType: number;
}

export interface GHNWard {
  WardCode: string;
  DistrictID: number;
  WardName: string;
}

export interface GHNShippingFee {
  total: number;
  service_fee: number;
  insurance_fee: number;
  pick_station_fee: number;
  coupon_value: number;
  r2s_fee: number;
}

export interface GHNService {
  service_id: number;
  service_type_id: number;
  short_name: string;
  name: string;
}

@Injectable()
export class GhnService {
  private readonly ghnApiUrl =
    'https://dev-online-gateway.ghn.vn/shiip/public-api';
  private readonly ghnToken: string;
  private readonly shopId: string;
  private readonly fromDistrictId: number;
  constructor(private configService: ConfigService) {
    this.ghnToken = this.configService.get<string>('GHN_TOKEN') || '';
    this.shopId = this.configService.get<string>('GHN_SHOP_ID') || '';

    // Ensure fromDistrictId is a number
    const fromDistrictIdStr = this.configService.get<string>(
      'GHN_FROM_DISTRICT_ID',
      '1442',
    );
    this.fromDistrictId = parseInt(fromDistrictIdStr, 10);

    console.log('GHN Configuration:');
    console.log('- Token:', this.ghnToken ? 'Available' : 'Missing');
    console.log('- Shop ID:', this.shopId ? 'Available' : 'Missing');
    console.log(
      '- From District ID:',
      this.fromDistrictId,
      '(type:',
      typeof this.fromDistrictId,
      ')',
    );

    if (!this.ghnToken || !this.shopId) {
      console.warn(
        'GHN configuration is missing. Please check your environment variables.',
      );
    }

    if (isNaN(this.fromDistrictId)) {
      console.warn(
        'GHN_FROM_DISTRICT_ID is not a valid number, using default 1442',
      );
      this.fromDistrictId = 1442;
    }
  }

  private getHeaders() {
    return {
      'Content-Type': 'application/json',
      Token: this.ghnToken,
      ShopId: this.shopId,
    };
  }

  async getProvinces(): Promise<GHNProvince[]> {
    try {
      console.log(
        'GHN Token:',
        this.ghnToken ? 'Token available' : 'Token missing',
      );
      console.log(
        'GHN Shop ID:',
        this.shopId ? 'Shop ID available' : 'Shop ID missing',
      );

      const response = await fetch(`${this.ghnApiUrl}/master-data/province`, {
        method: 'GET',
        headers: this.getHeaders(),
      });

      const result = await response.json();
      console.log('GHN Provinces Response:', result);

      if (result.code === 200) {
        return result.data;
      } else {
        throw new HttpException(
          `GHN API Error: ${result.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error('GHN Province Error:', error);
      throw new HttpException(
        'Failed to fetch provinces from GHN',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getDistricts(provinceId: number): Promise<GHNDistrict[]> {
    try {
      console.log('Getting districts for province ID:', provinceId);

      const response = await fetch(`${this.ghnApiUrl}/master-data/district`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          province_id: provinceId,
        }),
      });

      const result = await response.json();
      console.log('GHN Districts Response:', result);

      if (result.code === 200) {
        return result.data;
      } else {
        throw new HttpException(
          `GHN API Error: ${result.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error('GHN Districts Error:', error);
      throw new HttpException(
        'Failed to fetch districts from GHN',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getWards(districtId: number): Promise<GHNWard[]> {
    try {
      const response = await fetch(`${this.ghnApiUrl}/master-data/ward`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          district_id: districtId,
        }),
      });

      const result = await response.json();

      if (result.code === 200) {
        return result.data;
      } else {
        throw new HttpException(
          `GHN API Error: ${result.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(
        'Failed to fetch wards from GHN',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
  async calculateShippingFee(params: {
    to_district_id: number;
    to_ward_code: string;
    weight: number;
    length: number;
    width: number;
    height: number;
    service_id?: number;
  }): Promise<GHNShippingFee> {
    try {
      // Validate configuration
      if (!this.ghnToken || !this.shopId) {
        throw new HttpException(
          'GHN configuration is missing (token or shop ID)',
          HttpStatus.SERVICE_UNAVAILABLE,
        );
      }

      let serviceId = params.service_id;

      // If no service_id provided, get available services and use the first one
      if (!serviceId) {
        console.log('No service_id provided, fetching available services...');
        const availableServices = await this.getAvailableServices({
          to_district: params.to_district_id,
        });

        if (availableServices.length === 0) {
          throw new HttpException(
            'No shipping services available for this destination',
            HttpStatus.BAD_REQUEST,
          );
        }

        // Use the first available service (typically the standard service)
        serviceId = availableServices[0].service_id;
        console.log(
          `Using service_id: ${serviceId} (${availableServices[0].name})`,
        );
      }

      // Log request params for debugging
      console.log('GHN Shipping Fee Request Params:', {
        service_id: serviceId,
        from_district_id: Number(this.fromDistrictId),
        to_district_id: Number(params.to_district_id),
        to_ward_code: String(params.to_ward_code),
        height: Number(params.height),
        length: Number(params.length),
        weight: Number(params.weight),
        width: Number(params.width),
      });

      const requestBody = {
        service_id: serviceId, // Use specific service_id instead of service_type_id
        from_district_id: Number(this.fromDistrictId),
        to_district_id: Number(params.to_district_id),
        to_ward_code: String(params.to_ward_code),
        height: Number(params.height),
        length: Number(params.length),
        weight: Number(params.weight),
        width: Number(params.width),
      };

      const response = await fetch(`${this.ghnApiUrl}/v2/shipping-order/fee`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(requestBody),
      });

      const result = await response.json();
      console.log('GHN Shipping Fee Response:', result);

      if (result.code === 200) {
        return result.data;
      } else {
        console.error('GHN API Error:', result);
        throw new HttpException(
          `GHN API Error: ${result.message || 'Unknown error'}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      console.error('Calculate shipping fee error:', error);
      if (error instanceof HttpException) {
        throw error;
      }
      throw new HttpException(
        'Failed to calculate shipping fee',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getAvailableServices(params: {
    to_district: number;
    from_district?: number;
  }): Promise<GHNService[]> {
    try {
      const response = await fetch(
        `${this.ghnApiUrl}/v2/shipping-order/available-services`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            shop_id: parseInt(this.shopId),
            from_district: params.from_district || this.fromDistrictId,
            to_district: params.to_district,
          }),
        },
      );

      const result = await response.json();

      if (result.code === 200) {
        return result.data;
      } else {
        throw new HttpException(
          `GHN API Error: ${result.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(
        'Failed to fetch available services',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }

  async getLeadTime(params: {
    from_district_id?: number;
    to_district_id: number;
    to_ward_code: string;
    service_id: number;
  }) {
    try {
      const response = await fetch(
        `${this.ghnApiUrl}/v2/shipping-order/leadtime`,
        {
          method: 'POST',
          headers: this.getHeaders(),
          body: JSON.stringify({
            from_district_id: params.from_district_id || this.fromDistrictId,
            to_district_id: params.to_district_id,
            to_ward_code: params.to_ward_code,
            service_id: params.service_id,
          }),
        },
      );

      const result = await response.json();

      if (result.code === 200) {
        return result.data;
      } else {
        throw new HttpException(
          `GHN API Error: ${result.message}`,
          HttpStatus.BAD_REQUEST,
        );
      }
    } catch (error) {
      throw new HttpException(
        'Failed to get lead time',
        HttpStatus.INTERNAL_SERVER_ERROR,
      );
    }
  }
}
