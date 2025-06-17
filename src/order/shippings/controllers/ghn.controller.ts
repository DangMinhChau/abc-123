import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { GhnService } from '../services/ghn.service';

@Controller('ghn')
export class GhnController {
  constructor(private readonly ghnService: GhnService) {}

  @Get('provinces')
  async getProvinces() {
    return this.ghnService.getProvinces();
  }
  @Post('districts')
  async getDistricts(@Body('province_id') provinceId: number) {
    return this.ghnService.getDistricts(provinceId);
  }

  @Post('wards')
  async getWards(@Body('district_id') districtId: number) {
    return this.ghnService.getWards(districtId);
  }
  @Post('shipping-fee')
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
  ) {
    // Provide default values for required fields
    const params = {
      to_district_id: calculateShippingDto.to_district_id,
      to_ward_code: calculateShippingDto.to_ward_code,
      weight: calculateShippingDto.weight,
      length: calculateShippingDto.length || 20, // Default 20cm
      width: calculateShippingDto.width || 15, // Default 15cm
      height: calculateShippingDto.height || 10, // Default 10cm
    };
    return this.ghnService.calculateShippingFee(params);
  }
  @Get('services')
  async getAvailableServices(@Query('to_district') toDistrictId: number) {
    return this.ghnService.getAvailableServices({
      to_district: toDistrictId,
    });
  }
}
