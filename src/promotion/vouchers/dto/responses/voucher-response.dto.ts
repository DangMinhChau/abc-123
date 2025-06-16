import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class VoucherResponseDto {
  @ApiProperty({
    description: 'Voucher ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Voucher code (unique)',
    example: 'SUMMER2024',
  })
  @Expose()
  code: string;

  @ApiProperty({
    description: 'Voucher description',
    example: 'Giảm giá 20% cho bộ sưu tập mùa hè',
  })
  @Expose()
  description: string;

  @ApiProperty({
    description: 'Discount type',
    enum: ['amount', 'percent'],
    example: 'percent',
  })
  @Expose()
  discountType: string;

  @ApiProperty({
    description: 'Discount value (amount or percentage)',
    example: 20,
  })
  @Expose()
  discountValue: number;

  @ApiProperty({
    description: 'Minimum order value',
    example: 500000,
    required: false,
  })
  @Expose()
  minOrderValue?: number;

  @ApiProperty({
    description: 'Maximum discount amount',
    example: 100000,
    required: false,
  })
  @Expose()
  maxDiscountAmount?: number;

  @ApiProperty({
    description: 'Usage limit',
    example: 100,
    required: false,
  })
  @Expose()
  usageLimit?: number;

  @ApiProperty({
    description: 'Used count',
    example: 15,
  })
  @Expose()
  usedCount: number;

  @ApiProperty({
    description: 'Is active status',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Start date',
    example: '2024-06-01T00:00:00.000Z',
  })
  @Expose()
  startDate: Date;

  @ApiProperty({
    description: 'End date',
    example: '2024-08-31T23:59:59.000Z',
  })
  @Expose()
  endDate: Date;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last updated date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
