import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import { VouchersService, VoucherQueryDto } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { VoucherResponseDto } from './dto/responses';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@ApiTags('Vouchers')
@ApiExtraModels(VoucherResponseDto, BaseResponseDto, PaginatedResponseDto)
@ApiBearerAuth()
@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create a new voucher (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(VoucherResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @Body() createVoucherDto: CreateVoucherDto,
  ): Promise<BaseResponseDto<VoucherResponseDto>> {
    const voucher = await this.vouchersService.create(createVoucherDto);
    return {
      message: 'Voucher created successfully',
      data: this.vouchersService.toVoucherResponseDto(voucher),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get()
  @ApiOperation({ summary: 'Get all vouchers with pagination' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(VoucherResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(@Query() query: VoucherQueryDto) {
    return this.vouchersService.findAllWithDto(query);
  }

  @Get('active')
  @ApiOperation({ summary: 'Get all active vouchers' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(VoucherResponseDto) },
            },
          },
        },
      ],
    },
  })
  async getActiveVouchers() {
    return this.vouchersService.getActiveVouchers();
  }

  @Get('statistics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics() {
    return this.vouchersService.getVoucherStatistics();
  }
  @Get('validate/:code')
  async validateVoucher(
    @Param('code') code: string,
    @Query('orderTotal') orderTotal: number,
  ) {
    return this.vouchersService.validateVoucher(code, orderTotal);
  }

  @Post('apply')
  async applyVoucher(@Body() body: { code: string; orderTotal: number }) {
    return this.vouchersService.applyVoucher(body.code, body.orderTotal);
  }

  @Get('code/:code')
  async findByCode(@Param('code') code: string) {
    return this.vouchersService.findByCode(code);
  }

  @Get(':id')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vouchersService.findOne(id);
  }

  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ) {
    return this.vouchersService.update(id, updateVoucherDto);
  }

  @Patch(':id/toggle-status')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.vouchersService.toggleStatus(id);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vouchersService.remove(id);
  }
}
