import { IsNotEmpty, IsString, IsNumber, IsOptional, IsEmail, IsArray, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class OrderItemDto {
  @IsNotEmpty()
  @IsString()
  variantId: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderDto {
  // Customer info (for both guest and user)
  @IsNotEmpty()
  @IsString()
  customerName: string;

  @IsNotEmpty()
  @IsEmail()
  customerEmail: string;

  @IsNotEmpty()
  @IsString()
  customerPhone: string;

  // Shipping address
  @IsNotEmpty()
  @IsString()
  recipientName: string;

  @IsNotEmpty()
  @IsString()
  recipientPhone: string;

  @IsNotEmpty()
  @IsString()
  streetAddress: string;

  @IsNotEmpty()
  @IsString()
  ward: string;

  @IsNotEmpty()
  @IsString()
  district: string;

  @IsNotEmpty()
  @IsString()
  province: string;

  @IsNotEmpty()
  @IsString()
  wardCode: string;

  @IsNotEmpty()
  @IsNumber()
  districtId: number;

  @IsNotEmpty()
  @IsNumber()
  provinceId: number;

  @IsOptional()
  @IsString()
  notes?: string;

  // Order items
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => OrderItemDto)
  items: OrderItemDto[];

  // Payment method
  @IsNotEmpty()
  @IsString()
  paymentMethod: 'paypal' | 'cod';

  // Voucher (optional)
  @IsOptional()
  @IsString()
  voucherCode?: string;

  // User ID (optional, for logged-in users)
  @IsOptional()
  @IsString()
  userId?: string;
}

export class PayPalCreateOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;
}

export class PayPalCaptureOrderDto {
  @IsNotEmpty()
  @IsString()
  orderId: string;

  @IsNotEmpty()
  @IsString()
  paypalOrderId: string;
}

export class ValidateVoucherDto {
  @IsNotEmpty()
  @IsString()
  voucherCode: string;

  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  orderTotal: number;

  @IsOptional()
  @IsString()
  userId?: string;
}
