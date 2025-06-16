import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class VoucherDto {
  @ApiProperty({
    description: 'Voucher ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Voucher code (unique)',
    example: 'SUMMER2024',
  })
  code: string;

  @ApiProperty({
    description: 'Voucher name',
    example: 'Khuyến mãi mùa hè',
  })
  name: string;

  @ApiProperty({
    description: 'Voucher description',
    example: 'Giảm giá 20% cho bộ sưu tập mùa hè',
    required: false,
  })
  description?: string;

  @ApiProperty({
    description: 'Discount type',
    enum: ['PERCENTAGE', 'FIXED_AMOUNT'],
    example: 'PERCENTAGE',
  })
  discountType: string;

  @ApiProperty({
    description: 'Discount value',
    example: 20,
  })
  discountValue: number;

  @ApiProperty({
    description: 'Minimum order value',
    example: 500000,
    required: false,
  })
  minOrderValue?: number;

  @ApiProperty({
    description: 'Maximum discount amount',
    example: 100000,
    required: false,
  })
  maxDiscountAmount?: number;

  @ApiProperty({
    description: 'Usage limit',
    example: 100,
    required: false,
  })
  usageLimit?: number;

  @ApiProperty({
    description: 'Used count',
    example: 15,
  })
  usedCount: number;

  @ApiProperty({
    description: 'Is active status',
    example: true,
  })
  isActive: boolean;

  @ApiProperty({
    description: 'Start date',
    example: '2024-06-01T00:00:00.000Z',
  })
  startDate: Date;

  @ApiProperty({
    description: 'End date',
    example: '2024-08-31T23:59:59.000Z',
  })
  endDate: Date;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last updated date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class VoucherValidationDto {
  @ApiProperty({
    description: 'Is voucher valid',
    example: true,
  })
  isValid: boolean;

  @ApiProperty({
    description: 'Voucher information',
    type: VoucherDto,
    required: false,
  })
  voucher?: VoucherDto;

  @ApiProperty({
    description: 'Discount amount',
    example: 100000,
    required: false,
  })
  discountAmount?: number;

  @ApiProperty({
    description: 'Final amount after discount',
    example: 900000,
    required: false,
  })
  finalAmount?: number;

  @ApiProperty({
    description: 'Validation failure reason',
    example: 'Voucher đã hết hạn sử dụng',
    required: false,
  })
  reason?: string;
}

export class VoucherApplyDto {
  @ApiProperty({
    description: 'Applied voucher',
    type: VoucherDto,
  })
  voucher: VoucherDto;

  @ApiProperty({
    description: 'Original order amount',
    example: 1000000,
  })
  originalAmount: number;

  @ApiProperty({
    description: 'Discount amount',
    example: 100000,
  })
  discountAmount: number;

  @ApiProperty({
    description: 'Final amount after discount',
    example: 900000,
  })
  finalAmount: number;

  @ApiProperty({
    description: 'Total savings',
    example: 100000,
  })
  savings: number;
}

export class VoucherStatisticsDto {
  @ApiProperty({
    description: 'Total vouchers count',
    example: 25,
  })
  totalVouchers: number;

  @ApiProperty({
    description: 'Active vouchers count',
    example: 15,
  })
  activeVouchers: number;

  @ApiProperty({
    description: 'Expired vouchers count',
    example: 8,
  })
  expiredVouchers: number;

  @ApiProperty({
    description: 'Inactive vouchers count',
    example: 2,
  })
  inactiveVouchers: number;

  @ApiProperty({
    description: 'Total usage count',
    example: 150,
  })
  totalUsage: number;

  @ApiProperty({
    description: 'Total discount amount given',
    example: 5000000,
  })
  totalDiscountAmount: number;
  @ApiPropertyOptional({
    description: 'Most used voucher',
    type: 'object',
    additionalProperties: false,
    properties: {
      code: { type: 'string', example: 'SUMMER2024' },
      name: { type: 'string', example: 'Khuyến mãi mùa hè' },
      usedCount: { type: 'number', example: 45 },
    },
  })
  mostUsedVoucher?: {
    code: string;
    name: string;
    usedCount: number;
  };
}
