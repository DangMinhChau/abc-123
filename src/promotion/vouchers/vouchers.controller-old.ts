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
import { VouchersService, VoucherQueryDto } from './vouchers.service';
import { CreateVoucherDto } from './dto/create-voucher.dto';
import { UpdateVoucherDto } from './dto/update-voucher.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles, ResponseMessage } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';

@Controller('vouchers')
export class VouchersController {
  constructor(private readonly vouchersService: VouchersService) {}

  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.CREATED)
  @ResponseMessage('Voucher created successfully')
  async create(@Body() createVoucherDto: CreateVoucherDto) {
    return this.vouchersService.create(createVoucherDto);
  }

  @Get()
  @ResponseMessage('Vouchers retrieved successfully')
  async findAll(@Query() query: VoucherQueryDto) {
    return this.vouchersService.findAll(query);
  }

  @Get('active')
  @ResponseMessage('Lấy voucher đang hoạt động thành công')
  async getActiveVouchers() {
    return this.vouchersService.getActiveVouchers();
  }

  @Get('statistics')
  @ResponseMessage('Lấy thống kê voucher thành công')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getStatistics() {
    return this.vouchersService.getVoucherStatistics();
  }

  @Get('validate/:code')
  @ResponseMessage('Voucher validation completed')
  async validateVoucher(
    @Param('code') code: string,
    @Query('orderTotal') orderTotal: number,
  ) {
    return this.vouchersService.validateVoucher(code, orderTotal);
  }

  @Post('apply')
  @ResponseMessage('Áp dụng voucher thành công')
  async applyVoucher(@Body() body: { code: string; orderTotal: number }) {
    return this.vouchersService.applyVoucher(body.code, body.orderTotal);
  }

  @Get('code/:code')
  @ResponseMessage('Lấy voucher theo mã thành công')
  async findByCode(@Param('code') code: string) {
    return this.vouchersService.findByCode(code);
  }

  @Get(':id')
  @ResponseMessage('Lấy thông tin voucher thành công')
  async findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.vouchersService.findOne(id);
  }

  @Patch(':id')
  @ResponseMessage('Cập nhật voucher thành công')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateVoucherDto: UpdateVoucherDto,
  ) {
    return this.vouchersService.update(id, updateVoucherDto);
  }

  @Patch(':id/toggle-status')
  @ResponseMessage('Thay đổi trạng thái voucher thành công')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async toggleStatus(@Param('id', ParseUUIDPipe) id: string) {
    return this.vouchersService.toggleStatus(id);
  }

  @Delete(':id')
  @ResponseMessage('Xóa voucher thành công')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @HttpCode(HttpStatus.NO_CONTENT)
  async remove(@Param('id', ParseUUIDPipe) id: string) {
    return this.vouchersService.remove(id);
  }
}
