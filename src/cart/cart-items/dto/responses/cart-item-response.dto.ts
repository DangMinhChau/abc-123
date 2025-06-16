import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { VariantResponseDto } from 'src/product/variants/dto';

export class CartItemResponseDto {
  @ApiProperty({
    description: 'Cart item ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Cart information',
    type: 'object',
    properties: {
      id: { type: 'string', description: 'Cart ID' },
    },
  })
  @Expose()
  cart: {
    id: string;
  };

  @ApiProperty({
    description: 'Product variant information',
    type: VariantResponseDto,
  })
  @Expose()
  @Type(() => VariantResponseDto)
  variant: VariantResponseDto;

  @ApiProperty({
    description: 'Quantity of the item',
    example: 2,
  })
  @Expose()
  quantity: number;

  @ApiProperty({
    description: 'Total price for this item (quantity * variant price)',
    example: 598000,
  })
  @Expose()
  itemTotal: number;

  @ApiProperty({
    description: 'Cart item creation date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Cart item last update date',
    example: '2024-01-01T00:00:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
