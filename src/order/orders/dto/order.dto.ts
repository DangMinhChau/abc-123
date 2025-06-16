import { ApiProperty } from '@nestjs/swagger';

export class OrderDto {
  @ApiProperty({
    description: 'Order ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Order number',
    example: 'ORD-2024-000001',
  })
  orderNumber: string;

  @ApiProperty({
    description: 'Customer information',
    example: {
      id: '123e4567-e89b-12d3-a456-426614174001',
      email: 'customer@example.com',
      fullName: 'Nguyễn Văn A',
    },
  })
  user: {
    id: string;
    email: string;
    fullName: string;
  };

  @ApiProperty({
    description: 'Customer name',
    example: 'Nguyễn Văn A',
  })
  customerName: string;

  @ApiProperty({
    description: 'Customer email',
    example: 'customer@example.com',
  })
  customerEmail: string;

  @ApiProperty({
    description: 'Customer phone',
    example: '+84123456789',
  })
  customerPhone: string;

  @ApiProperty({
    description: 'Shipping address',
    example: '123 Nguyễn Văn Linh, Phường Tân Phú, Quận 7, TP.HCM',
  })
  shippingAddress: string;

  @ApiProperty({
    description: 'Order items',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        id: { type: 'string' },
        productName: { type: 'string' },
        variantSku: { type: 'string' },
        quantity: { type: 'number' },
        unitPrice: { type: 'number' },
        colorName: { type: 'string' },
        sizeName: { type: 'string' },
      },
    },
  })
  items: Array<{
    id: string;
    productName: string;
    variantSku: string;
    quantity: number;
    unitPrice: number;
    colorName: string;
    sizeName: string;
  }>;

  @ApiProperty({
    description: 'Voucher information',
    required: false,
    example: {
      id: 'voucher-id',
      code: 'DISCOUNT10',
      name: 'Giảm giá 10%',
    },
  })
  voucher?: {
    id: string;
    code: string;
    name: string;
  };

  @ApiProperty({
    description: 'Subtotal amount',
    example: 500000,
  })
  subTotal: number;

  @ApiProperty({
    description: 'Shipping fee',
    example: 30000,
  })
  shippingFee: number;

  @ApiProperty({
    description: 'Discount amount',
    example: 50000,
  })
  discount: number;

  @ApiProperty({
    description: 'Total price',
    example: 480000,
  })
  totalPrice: number;

  @ApiProperty({
    description: 'Order status',
    example: 'pending',
    enum: [
      'pending',
      'confirmed',
      'processing',
      'shipped',
      'delivered',
      'cancelled',
      'returned',
    ],
  })
  status: string;

  @ApiProperty({
    description: 'Order notes',
    example: 'Giao hàng trong giờ hành chính',
    required: false,
  })
  note?: string;
  @ApiProperty({
    description: 'Payment information',
    required: false,
    example: {
      id: 'payment-id',
      method: 'paypal',
      status: 'completed',
      amount: 480000,
    },
  })
  payment?: {
    id: string;
    method: string;
    status: string;
    amount: number;
  };

  @ApiProperty({
    description: 'Shipping information',
    required: false,
    example: {
      id: 'shipping-id',
      trackingNumber: 'SH2024010100001',
      status: 'in_transit',
      shippingFee: 30000,
    },
  })
  shipping?: {
    id: string;
    trackingNumber: string;
    status: string;
    shippingFee: number;
  };

  @ApiProperty({
    description: 'Order date',
    example: '2024-01-01T00:00:00.000Z',
  })
  orderedAt: Date;

  @ApiProperty({
    description: 'Creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'Last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class OrderSummaryDto {
  @ApiProperty({
    description: 'Total orders',
    example: 1500,
  })
  totalOrders: number;

  @ApiProperty({
    description: 'Orders today',
    example: 45,
  })
  ordersToday: number;

  @ApiProperty({
    description: 'Total revenue',
    example: 150000000,
  })
  totalRevenue: number;

  @ApiProperty({
    description: 'Revenue today',
    example: 2500000,
  })
  revenueToday: number;

  @ApiProperty({
    description: 'Average order value',
    example: 350000,
  })
  averageOrderValue: number;

  @ApiProperty({
    description: 'Pending orders',
    example: 25,
  })
  pendingOrders: number;
}

export class OrderStatsDto {
  @ApiProperty({
    description: 'Order status distribution',
    example: {
      pending: 25,
      confirmed: 150,
      processing: 85,
      shipped: 200,
      delivered: 1000,
      cancelled: 35,
      returned: 5,
    },
  })
  statusDistribution: {
    pending: number;
    confirmed: number;
    processing: number;
    shipped: number;
    delivered: number;
    cancelled: number;
    returned: number;
  };

  @ApiProperty({
    description: 'Orders by month',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        month: { type: 'string' },
        count: { type: 'number' },
        revenue: { type: 'number' },
      },
    },
  })
  ordersByMonth: Array<{
    month: string;
    count: number;
    revenue: number;
  }>;

  @ApiProperty({
    description: 'Top selling products',
    type: 'array',
    items: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        productName: { type: 'string' },
        totalSold: { type: 'number' },
        revenue: { type: 'number' },
      },
    },
  })
  topProducts: Array<{
    productId: string;
    productName: string;
    totalSold: number;
    revenue: number;
  }>;
}
