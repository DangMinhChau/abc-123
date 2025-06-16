import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class OrderResponseDto {
  @ApiProperty({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Order number',
    example: 'ORD-2024-000001',
  })
  @Expose()
  orderNumber: string;

  @ApiProperty({
    description: 'Customer name',
    example: 'Nguyễn Văn A',
  })
  @Expose()
  customerName: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'customer@example.com',
  })
  @Expose()
  customerEmail: string;

  @ApiProperty({
    description: 'Customer phone number',
    example: '0987654321',
  })
  @Expose()
  customerPhone: string;

  @ApiProperty({
    description: 'Order status',
    enum: [
      'PENDING',
      'CONFIRMED',
      'PROCESSING',
      'SHIPPED',
      'DELIVERED',
      'CANCELLED',
    ],
    example: 'PENDING',
  })
  @Expose()
  status: string;

  @ApiProperty({
    description: 'Payment status',
    enum: ['PENDING', 'PAID', 'FAILED', 'REFUNDED'],
    example: 'PENDING',
  })
  @Expose()
  paymentStatus: string;

  @ApiProperty({
    description: 'Total amount',
    example: 1500000,
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({
    description: 'Shipping address',
    example: '123 Đường ABC, Quận 1, TP.HCM',
  })
  @Expose()
  shippingAddress: string;

  @ApiProperty({
    description: 'Order creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Order last update timestamp',
    example: '2024-01-15T11:45:00Z',
  })
  @Expose()
  updatedAt: Date;
}
