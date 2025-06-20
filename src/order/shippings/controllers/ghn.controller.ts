import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { ApiTags, ApiOperation } from '@nestjs/swagger';
import { GhnService } from '../services/ghn.service';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

@ApiTags('GHN')
@Controller('ghn')
export class GhnController {
  constructor(private readonly ghnService: GhnService) {}

  @Get('provinces')
  @ApiOperation({ summary: 'Get provinces from GHN' })
  async getProvinces(): Promise<BaseResponseDto<any[]>> {
    const data = await this.ghnService.getProvinces();
    return {
      message: 'Provinces retrieved successfully',
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('districts')
  @ApiOperation({ summary: 'Get districts from GHN by province ID' })
  async getDistricts(
    @Body('province_id') provinceId: number,
  ): Promise<BaseResponseDto<any[]>> {
    const data = await this.ghnService.getDistricts(provinceId);
    return {
      message: 'Districts retrieved successfully',
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('wards')
  @ApiOperation({ summary: 'Get wards from GHN by district ID' })
  async getWards(
    @Body('district_id') districtId: number,
  ): Promise<BaseResponseDto<any[]>> {
    const data = await this.ghnService.getWards(districtId);
    return {
      message: 'Wards retrieved successfully',
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Post('shipping-fee')
  @ApiOperation({ summary: 'Calculate shipping fee' })
  async calculateShippingFee(
    @Body()
    calculateShippingDto: {
      to_district_id: number;
      to_ward_code: string;
      weight: number;
      length?: number;
      width?: number;
      height?: number;
      service_id?: number;
    },
  ): Promise<BaseResponseDto<any>> {
    try {
      // Validate required fields
      if (!calculateShippingDto.to_district_id) {
        return {
          message: 'Missing to_district_id',
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            error: 'INVALID_DISTRICT_ID',
          },
        };
      }

      if (!calculateShippingDto.to_ward_code) {
        return {
          message: 'Missing to_ward_code',
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            error: 'INVALID_WARD_CODE',
          },
        };
      }

      if (!calculateShippingDto.weight || calculateShippingDto.weight <= 0) {
        return {
          message: 'Invalid weight',
          data: null,
          meta: {
            timestamp: new Date().toISOString(),
            error: 'INVALID_WEIGHT',
          },
        };
      } // Provide default values for required fields (mock values for products without physical dimensions)
      const params = {
        to_district_id: calculateShippingDto.to_district_id,
        to_ward_code: calculateShippingDto.to_ward_code,
        weight: calculateShippingDto.weight || 500, // Default 500g (reasonable for clothing)
        length: calculateShippingDto.length || 30, // Default 30cm
        width: calculateShippingDto.width || 20, // Default 20cm
        height: calculateShippingDto.height || 5, // Default 5cm (folded clothing)
        service_id: calculateShippingDto.service_id, // Optional service_id
      };

      console.log('Calculating shipping fee with params:', params);

      const data = await this.ghnService.calculateShippingFee(params);
      return {
        message: 'Shipping fee calculated successfully',
        data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Shipping fee calculation error:', error);
      const errorMessage =
        error instanceof Error
          ? error.message
          : 'Failed to calculate shipping fee';
      return {
        message: errorMessage,
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          error: 'SHIPPING_FEE_ERROR',
        },
      };
    }
  }
  @Get('test')
  @ApiOperation({ summary: 'Test GHN configuration' })
  async testGhnConfiguration(): Promise<BaseResponseDto<any>> {
    try {
      console.log('Testing GHN configuration...'); // Test with sample data for Ho Chi Minh City (realistic values for clothing)
      const testParams = {
        to_district_id: 1442, // Quan 1, TPHCM
        to_ward_code: '21211', // Phuong Ben Nghe
        weight: 500, // 500g (typical for a shirt)
        length: 30, // 30cm
        width: 20, // 20cm
        height: 5, // 5cm (folded clothing)
      };

      console.log('Test params:', testParams);
      const data = await this.ghnService.calculateShippingFee(testParams);

      return {
        message: 'GHN test successful',
        data: {
          testParams,
          result: data,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('GHN test error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        message: 'GHN test failed',
        data: {
          error: errorMessage,
        },
        meta: {
          timestamp: new Date().toISOString(),
          error: 'GHN_TEST_ERROR',
        },
      };
    }
  }
  @Get('services')
  @ApiOperation({ summary: 'Get available services' })
  async getAvailableServices(
    @Query('to_district') toDistrictId: number,
  ): Promise<BaseResponseDto<any>> {
    try {
      const data = await this.ghnService.getAvailableServices({
        to_district: toDistrictId,
      });
      return {
        message: 'Services retrieved successfully',
        data,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      console.error('Get services error:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Failed to get services';
      return {
        message: errorMessage,
        data: null,
        meta: {
          timestamp: new Date().toISOString(),
          error: 'GET_SERVICES_ERROR',
        },
      };
    }
  }
}
