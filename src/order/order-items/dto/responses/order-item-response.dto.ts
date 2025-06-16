import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OrderItemResponseDto {
  @ApiProperty({
    description: 'Order item ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Order ID',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  orderId: string;

  @ApiProperty({
    description: 'Product variant ID',
    example: '550e8400-e29b-41d4-a716-446655440002',
  })
  @Expose()
  variantId: string;

  @ApiProperty({
    description: 'Quantity ordered',
    example: 2,
  })
  @Expose()
  quantity: number;

  @ApiProperty({
    description: 'Unit price at time of order',
    example: 299000,
  })
  @Expose()
  unitPrice: number;

  @ApiProperty({
    description: 'Product name at time of order',
    example: 'Áo Thun Basic Cotton',
  })
  @Expose()
  productName: string;

  @ApiProperty({
    description: 'Variant SKU at time of order',
    example: 'AT-001-RED-M',
  })
  @Expose()
  variantSku: string;

  @ApiProperty({
    description: 'Color name at time of order',
    example: 'Đỏ',
  })
  @Expose()
  colorName: string;

  @ApiProperty({
    description: 'Size name at time of order',
    example: 'M',
  })
  @Expose()
  sizeName: string;

  @ApiProperty({
    description: 'Order item creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Order item last update timestamp',
    example: '2024-01-15T11:45:00Z',
  })
  @Expose()
  updatedAt: Date;
}
