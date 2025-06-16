import { IsString, IsNotEmpty, IsNumber, Min } from 'class-validator';

export class OrderItemDto {
  @IsString()
  @IsNotEmpty()
  variantId: string;

  @IsNumber()
  @Min(1)
  quantity: number;

  @IsNumber()
  @Min(0)
  unitPrice: number;
}

export class CreateOrderItemDto extends OrderItemDto {
  @IsString()
  @IsNotEmpty()
  orderId: string;

  @IsString()
  @IsNotEmpty()
  productName: string;

  @IsString()
  @IsNotEmpty()
  variantSku: string;

  @IsString()
  @IsNotEmpty()
  colorName: string;

  @IsString()
  @IsNotEmpty()
  sizeName: string;
}
