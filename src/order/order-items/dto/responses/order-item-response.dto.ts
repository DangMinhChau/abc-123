import { ApiProperty } from '@nestjs/swagger';
import { Exclude, Expose, Type } from 'class-transformer';

export class OrderItemResponseDto {
  @ApiProperty({
    description: 'Order item ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Product variant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  variantId: string;

  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  orderId: string;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 2,
  })
  @Expose()
  quantity: number;

  @ApiProperty({
    description: 'Price per unit at time of order',
    example: 250000,
  })
  @Expose()
  pricePerUnit: number;

  @ApiProperty({
    description: 'Total price for this line item',
    example: 500000,
  })
  @Expose()
  totalPrice: number;

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

  constructor(partial: Partial<OrderItemResponseDto>) {
    Object.assign(this, partial);
  }
}
