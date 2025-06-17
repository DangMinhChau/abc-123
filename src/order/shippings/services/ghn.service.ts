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
    this.fromDistrictId = this.configService.get<number>(
      'GHN_FROM_DISTRICT_ID',
      1442,
    );

    if (!this.ghnToken || !this.shopId) {
      console.warn(
        'GHN configuration is missing. Please check your environment variables.',
      );
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
    service_type_id?: number;
  }): Promise<GHNShippingFee> {
    try {
      const response = await fetch(`${this.ghnApiUrl}/v2/shipping-order/fee`, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify({
          service_type_id: params.service_type_id || 2, // Standard service
          from_district_id: this.fromDistrictId,
          to_district_id: params.to_district_id,
          to_ward_code: params.to_ward_code,
          height: params.height,
          length: params.length,
          weight: params.weight,
          width: params.width,
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
