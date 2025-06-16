import { ApiProperty } from '@nestjs/swagger';
import { PaymentMethod } from 'src/common/constants/payment-method.enum';
import { PaymentStatus } from 'src/common/constants/payment-status.enum';

export class PaymentDto {
  @ApiProperty({
    description: 'ID của thanh toán',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;
  @ApiProperty({
    description: 'Phương thức thanh toán',
    enum: PaymentMethod,
    example: PaymentMethod.PAYPAL,
  })
  method: PaymentMethod;

  @ApiProperty({
    description: 'Số tiền thanh toán',
    example: 599000,
  })
  amount: number;

  @ApiProperty({
    description: 'Trạng thái thanh toán',
    enum: PaymentStatus,
    example: PaymentStatus.PAID,
  })
  status: PaymentStatus;

  @ApiProperty({
    description: 'Mã giao dịch',
    example: 'TXN123456789',
    nullable: true,
  })
  transactionId?: string;

  @ApiProperty({
    description: 'Thời gian thanh toán',
    example: '2024-06-10T10:30:00.000Z',
    nullable: true,
  })
  paidAt?: Date;
  @ApiProperty({
    description: 'Ghi chú thanh toán',
    example: 'Thanh toán qua PayPal thành công',
    nullable: true,
  })
  note?: string;

  @ApiProperty({
    description: 'Thông tin đơn hàng',
    type: 'object',
    properties: {
      id: { type: 'string', example: '123e4567-e89b-12d3-a456-426614174001' },
      orderNumber: { type: 'string', example: 'ORD-20250610-001' },
      totalPrice: { type: 'number', example: 599000 },
    },
  })
  order: {
    id: string;
    orderNumber: string;
    totalPrice: number;
  };

  @ApiProperty({
    description: 'Thời gian tạo',
    example: '2024-06-10T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Thời gian cập nhật',
    example: '2024-06-10T10:30:00.000Z',
  })
  updatedAt: Date;
}

export class PaymentUrlDto {
  @ApiProperty({
    description: 'URL thanh toán',
    example: 'https://www.paypal.com/checkoutnow?token=...',
  })
  paymentUrl: string;

  @ApiProperty({
    description: 'ID của thanh toán',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  paymentId: string;

  @ApiProperty({
    description: 'Mã giao dịch',
    example: 'TXN123456789',
  })
  transactionId: string;
}

export class PaymentStatisticsDto {
  @ApiProperty({
    description: 'Tổng số thanh toán',
    example: 150,
  })
  totalPayments: number;

  @ApiProperty({
    description: 'Tổng doanh thu',
    example: 89850000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Số thanh toán thành công',
    example: 142,
  })
  successfulPayments: number;

  @ApiProperty({
    description: 'Số thanh toán thất bại',
    example: 8,
  })
  failedPayments: number;

  @ApiProperty({
    description: 'Tỷ lệ thành công (%)',
    example: 94.67,
  })
  successRate: number;
  @ApiProperty({
    description: 'Thống kê theo phương thức thanh toán',
    // type: 'object',
    example: {
      [PaymentMethod.PAYPAL]: 85,
      [PaymentMethod.COD]: 57,
      [PaymentMethod.CREDIT_CARD]: 8,
    },
  })
  methodBreakdown: Record<PaymentMethod, number>;
}
