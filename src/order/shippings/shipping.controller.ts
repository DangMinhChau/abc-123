import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
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
import { ShippingService } from './shipping.service';
import {
  CreateShippingDto,
  UpdateShippingDto,
  CalculateShippingFeeDto,
  ShippingResponseDto,
} from './dto';
import {
  AddressValidationDto,
  UpdateStatusDto,
} from './dto/shipping-response.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { OrderExceptionFilter } from '../filters/order-exception.filter';

@ApiTags('Shipping')
@ApiExtraModels(ShippingResponseDto, BaseResponseDto)
@ApiBearerAuth()
@Controller('shipping')
@UseGuards(JwtAuthGuard)
@UseFilters(OrderExceptionFilter)
export class ShippingController {
  constructor(private readonly shippingService: ShippingService) {}

  @Post()
  @ApiOperation({ summary: 'Create shipping' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ShippingResponseDto) },
          },
        },
      ],
    },
  })
  create(@Body() createShippingDto: CreateShippingDto) {
    return this.shippingService.create(createShippingDto);
  }
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all shipping records (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ShippingResponseDto) },
            },
          },
        },
      ],
    },
  })
  findAll() {
    return this.shippingService.findAll();
  }
  @Get(':id')
  @ApiOperation({ summary: 'Get shipping by ID' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ShippingResponseDto) },
          },
        },
      ],
    },
  })
  findOne(@Param('id') id: string) {
    return this.shippingService.findOne(id);
  }
  @Get('order/:orderId/tracking')
  @ApiOperation({ summary: 'Get order tracking information' })
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
  async getOrderTracking(@Param('orderId') orderId: string) {
    return await this.shippingService.getTrackingByOrderId(orderId);
  }
  @Get(':id/tracking')
  @ApiOperation({ summary: 'Get shipping tracking by shipping ID' })
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
  async getTracking(@Param('id') id: string) {
    return await this.shippingService.getTrackingInfo(id);
  }
  @Post('calculate-fee')
  @ApiOperation({ summary: 'Calculate shipping fee' })
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
  async calculateFee(@Body() shippingFeeDto: CalculateShippingFeeDto) {
    return await this.shippingService.calculateShippingFee(
      shippingFeeDto.toDistrictId,
      shippingFeeDto.toWardCode,
      shippingFeeDto.weight,
      shippingFeeDto.insuranceValue,
      shippingFeeDto.codAmount,
      shippingFeeDto.serviceId,
    );
  }
  @Get('services/:districtId')
  @ApiOperation({ summary: 'Get available shipping services for district' })
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
  async getAvailableServices(
    @Param('districtId', ParseIntPipe) districtId: number,
  ) {
    const services =
      await this.shippingService.getAvailableServices(districtId);
    return services.data;
  }
  @Post('validate-address')
  @ApiOperation({ summary: 'Validate shipping address' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'boolean' },
          },
        },
      ],
    },
  })
  async validateAddress(@Body() addressDto: AddressValidationDto) {
    return await this.shippingService.validateAddress(
      addressDto.provinceId,
      addressDto.districtId,
      addressDto.wardCode,
    );
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update shipping information' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ShippingResponseDto) },
          },
        },
      ],
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateShippingDto: UpdateShippingDto,
  ) {
    return this.shippingService.update(id, updateShippingDto);
  }
  @Patch(':id/status')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update shipping status (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ShippingResponseDto) },
          },
        },
      ],
    },
  })
  async updateStatus(
    @Param('id') id: string,
    @Body() statusDto: UpdateStatusDto,
  ) {
    return await this.shippingService.updateStatus(id, statusDto.status);
  }
  @Post(':id/cancel')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Cancel shipping (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ShippingResponseDto) },
          },
        },
      ],
    },
  })
  async cancel(@Param('id') id: string) {
    return await this.shippingService.cancelShipping(id);
  }
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete shipping record (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  remove(@Param('id') id: string) {
    return this.shippingService.remove(id);
  }
}
