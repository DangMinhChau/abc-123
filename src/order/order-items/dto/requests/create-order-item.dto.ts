import { IsNotEmpty, IsNumber, IsUUID, Min } from 'class-validator';
import { ApiProperty } from '@nestjs/swagger';

export class CreateOrderItemDto {
  @ApiProperty({
    description: 'Product variant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsNotEmpty()
  @IsUUID()
  variantId: string;

  @ApiProperty({
    description: 'Quantity of the product variant',
    example: 2,
    minimum: 1,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(1)
  quantity: number;

  @ApiProperty({
    description: 'Price per unit at time of order',
    example: 250000,
    minimum: 0,
  })
  @IsNotEmpty()
  @IsNumber()
  @Min(0)
  pricePerUnit: number;
}
