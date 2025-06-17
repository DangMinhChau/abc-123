import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

export class ShippingResponseDto {
  @ApiProperty({
    description: 'Shipping ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  orderId: string;

  @ApiProperty({
    description: 'Shipping method',
    example: 'standard',
  })
  @Expose()
  method: string;

  @ApiProperty({
    description: 'Shipping status',
    example: 'shipped',
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Shipping address',
    example: '123 Main St, City, Country',
  })
  @Expose()
  address: string;

  @ApiProperty({
    description: 'Recipient name',
    example: 'John Doe',
  })
  @Expose()
  recipientName: string;

  @ApiProperty({
    description: 'Recipient phone number',
    example: '+84901234567',
  })
  @Expose()
  recipientPhone: string;

  @ApiProperty({
    description: 'Shipping cost in VND',
    example: 30000,
  })
  @Expose()
  cost: number;

  @ApiProperty({
    description: 'Tracking number',
    example: 'VN123456789',
    required: false,
  })
  @Expose()
  trackingNumber?: string;

  @ApiProperty({
    description: 'Estimated delivery date',
    example: '2024-01-15',
    required: false,
  })
  @Expose()
  estimatedDeliveryDate?: string;

  @ApiProperty({
    description: 'Actual delivery date',
    example: '2024-01-14T10:30:00.000Z',
    required: false,
  })
  @Expose()
  @Type(() => Date)
  actualDeliveryDate?: Date;

  @ApiProperty({
    description: 'Special delivery instructions',
    example: 'Leave at front door',
    required: false,
  })
  @Expose()
  instructions?: string;

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  @Type(() => Date)
  updatedAt: Date;

  // Hide sensitive internal fields
  @Exclude()
  version: number;

  constructor(partial: Partial<ShippingResponseDto>) {
    Object.assign(this, partial);
  }
}
