import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';

export class PaymentResponseDto {
  @ApiProperty({
    description: 'Payment ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  @Expose()
  id: string;
  @ApiProperty({
    description: 'Payment method',
    enum: PaymentMethod,
    example: PaymentMethod.PAYPAL,
  })
  @Expose()
  method: PaymentMethod;

  @ApiProperty({
    description: 'Payment amount',
    example: 599000,
  })
  @Expose()
  amount: number;

  @ApiProperty({
    description: 'Payment status',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  @Expose()
  status: PaymentStatus;

  @ApiProperty({
    description: 'Transaction ID',
    example: 'TXN123456789',
    nullable: true,
  })
  @Expose()
  transactionId?: string;

  @ApiProperty({
    description: 'Payment timestamp',
    example: '2024-06-10T10:30:00.000Z',
  })
  @Expose()
  paidAt?: Date;

  @ApiProperty({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174001',
  })
  @Expose()
  orderId: string;

  @ApiProperty({
    description: 'Payment creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Payment last update timestamp',
    example: '2024-01-15T11:45:00Z',
  })
  @Expose()
  updatedAt: Date;
}
