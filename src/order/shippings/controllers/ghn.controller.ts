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
    },
  ): Promise<BaseResponseDto<any>> {
    // Provide default values for required fields
    const params = {
      to_district_id: calculateShippingDto.to_district_id,
      to_ward_code: calculateShippingDto.to_ward_code,
      weight: calculateShippingDto.weight,
      length: calculateShippingDto.length || 20, // Default 20cm
      width: calculateShippingDto.width || 15, // Default 15cm
      height: calculateShippingDto.height || 10, // Default 10cm
    };
    const data = await this.ghnService.calculateShippingFee(params);
    return {
      message: 'Shipping fee calculated successfully',
      data,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('services')
  @ApiOperation({ summary: 'Get available services' })
  async getAvailableServices(
    @Query('to_district') toDistrictId: number,
  ): Promise<BaseResponseDto<any>> {
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
  }
}
