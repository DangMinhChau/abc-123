import { IsString, IsEmail, IsOptional, IsArray } from 'class-validator';

export class SendMailDto {
  @IsEmail({}, { each: true })
  to: string | string[];

  @IsString()
  subject: string;

  @IsOptional()
  @IsString()
  text?: string;

  @IsOptional()
  @IsString()
  html?: string;

  @IsOptional()
  @IsArray()
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

export class SendWelcomeEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  userName: string;
}

export class SendPasswordResetEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  userName: string;

  @IsString()
  resetToken: string;
}

export class OrderItemDto {
  @IsString()
  name: string;

  @IsString()
  quantity: number;

  @IsString()
  price: number;
}

export class SendOrderConfirmationEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  orderNumber: string;

  @IsString()
  customerName: string;

  @IsArray()
  items: OrderItemDto[];

  @IsString()
  total: number;

  @IsString()
  shippingAddress: string;
}

export class SendOrderStatusUpdateEmailDto {
  @IsEmail()
  to: string;

  @IsString()
  orderNumber: string;

  @IsString()
  customerName: string;

  @IsString()
  status: string;

  @IsOptional()
  @IsString()
  trackingNumber?: string;
}
