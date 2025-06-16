import { IsArray, IsUUID, IsInt, Min, ValidateNested } from 'class-validator';
import { Type, Expose } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class BulkCartItemDto {
  @ApiProperty({
    description: 'Product variant ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @IsUUID()
  @Expose()
  variantId: string;

  @ApiProperty({
    description: 'Quantity of the item',
    example: 2,
    minimum: 1,
  })
  @IsInt()
  @Min(1)
  @Expose()
  quantity: number;
}

export class BulkAddToCartDto {
  @ApiProperty({
    description: 'Array of items to add to cart',
    type: [BulkCartItemDto],
  })
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => BulkCartItemDto)
  @Expose()
  items: BulkCartItemDto[];
}
