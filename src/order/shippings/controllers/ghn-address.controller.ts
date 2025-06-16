import {
  Controller,
  Get,
  Query,
  ParseIntPipe,
  UseGuards,
  UseFilters,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import { Throttle } from '@nestjs/throttler';
import { GHNService } from '../services/ghn.service';
import { JwtAuthGuard } from 'src/common/guards';
import { OrderExceptionFilter } from '../../filters/order-exception.filter';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

@Controller('shipping/address')
@ApiTags('GHN Address')
@ApiExtraModels(BaseResponseDto)
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@UseFilters(OrderExceptionFilter)
export class GHNAddressController {
  constructor(private readonly ghnService: GHNService) {}
  @Get('provinces')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Get all provinces from GHN' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'array' },
          },
        },
      ],
    },
  })
  async getProvinces() {
    const response = await this.ghnService.getProvinces();
    return response.data;
  }
  @Get('districts')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Get districts by province ID from GHN' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'array' },
          },
        },
      ],
    },
  })
  async getDistricts(@Query('province_id', ParseIntPipe) provinceId: number) {
    const response = await this.ghnService.getDistricts(provinceId);
    return response.data;
  }
  @Get('wards')
  @Throttle({ default: { limit: 100, ttl: 60000 } })
  @ApiOperation({ summary: 'Get wards by district ID from GHN' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'array' },
          },
        },
      ],
    },
  })
  async getWards(@Query('district_id', ParseIntPipe) districtId: number) {
    const response = await this.ghnService.getWards(districtId);
    return response.data;
  }
  @Get('services')
  @Throttle({ default: { limit: 50, ttl: 60000 } })
  @ApiOperation({ summary: 'Get available shipping services for district' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'array' },
          },
        },
      ],
    },
  })
  async getServices(@Query('to_district', ParseIntPipe) toDistrict: number) {
    const fromDistrict = parseInt(process.env.GHN_FROM_DISTRICT_ID || '1454');
    const response = await this.ghnService.getServices(
      fromDistrict,
      toDistrict,
    );
    return response.data;
  }
  @Get('calculate-fee')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  @ApiOperation({ summary: 'Calculate shipping fee between addresses' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  async calculateFee(
    @Query('to_district_id', ParseIntPipe) toDistrictId: number,
    @Query('to_ward_code') toWardCode: string,
    @Query('weight', ParseIntPipe) weight: number,
    @Query('service_id', ParseIntPipe) serviceId: number,
    @Query('insurance_value') insuranceValue?: number,
    @Query('cod_amount') codAmount?: number,
  ) {
    const fromDistrictId = parseInt(process.env.GHN_FROM_DISTRICT_ID || '1454');
    const fromWardCode = process.env.GHN_FROM_WARD_CODE || '21211';

    const response = await this.ghnService.calculateFee({
      from_district_id: fromDistrictId,
      from_ward_code: fromWardCode,
      to_district_id: toDistrictId,
      to_ward_code: toWardCode,
      height: 10,
      length: 20,
      width: 15,
      weight: weight,
      insurance_value: insuranceValue ? parseInt(insuranceValue.toString()) : 0,
      cod_amount: codAmount ? parseInt(codAmount.toString()) : 0,
      service_id: serviceId,
      service_type_id: 2,
    });

    return response.data;
  }
  @Get('validate')
  @Throttle({ default: { limit: 20, ttl: 60000 } })
  @ApiOperation({ summary: 'Validate address with GHN system' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  async validateAddress(
    @Query('province_id', ParseIntPipe) provinceId: number,
    @Query('district_id', ParseIntPipe) districtId: number,
    @Query('ward_code') wardCode: string,
  ) {
    const isValid = await this.ghnService.validateAddress(
      provinceId.toString(),
      districtId.toString(),
      wardCode,
    );
    return { valid: isValid };
  }
}
