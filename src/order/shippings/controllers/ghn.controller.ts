import { Controller, Get, Post, Body, Query } from '@nestjs/common';
import { GhnService } from '../services/ghn.service';

@Controller('ghn')
export class GhnController {
  constructor(private readonly ghnService: GhnService) {}

  @Get('provinces')
  async getProvinces() {
    return this.ghnService.getProvinces();
  }

  @Get('districts')
  async getDistricts(@Query('province_id') provinceId: number) {
    return this.ghnService.getDistricts(provinceId);
  }

  @Get('wards')
  async getWards(@Query('district_id') districtId: number) {
    return this.ghnService.getWards(districtId);
  }

  @Post('shipping-fee')
  async calculateShippingFee(
    @Body() calculateShippingDto: {
      to_district_id: number;
      to_ward_code: string;
      weight: number;
      length?: number;
      width?: number;
      height?: number;
    },
  ) {
    return this.ghnService.calculateShippingFee(calculateShippingDto);
  }

  @Get('services')
  async getAvailableServices(@Query('to_district') toDistrictId: number) {
    return this.ghnService.getAvailableServices(toDistrictId);
  }
}
