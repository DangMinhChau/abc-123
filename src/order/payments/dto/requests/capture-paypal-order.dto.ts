import { IsString } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CapturePayPalOrderDto {
  @ApiProperty({
    description: 'PayPal order ID',
    example: 'PAYPAL_ORDER_ID_123',
  })
  @IsString()
  paypalOrderId: string;

  @ApiProperty({
    description: 'PayPal payer ID',
    example: 'PAYER_ID_123',
  })
  @IsString()
  payerId: string;

  @ApiProperty({
    description: 'Internal order ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsString()
  orderId: string;
}
