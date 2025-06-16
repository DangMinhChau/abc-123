import { IsUUID, IsInt, Min } from 'class-validator';
import { Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class AddToCartDto {
  @ApiProperty({
    description: 'Product variant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @Expose()
  variantId: string;

  @ApiProperty({
    description: 'Quantity to add',
    example: 2,
  })
  @IsInt()
  @Min(1)
  @Expose()
  quantity: number;
}
