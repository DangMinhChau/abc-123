import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CartItemResponseDto } from '../../../cart-items/dto/responses/cart-item-response.dto';

export class CartItemsSummaryResponseDto {
  @ApiProperty({
    description: 'Cart items',
    type: [CartItemResponseDto],
  })
  @Expose()
  @Type(() => CartItemResponseDto)
  items: CartItemResponseDto[];

  @ApiProperty({
    description: 'Total number of items',
    example: 5,
  })
  @Expose()
  totalItems: number;

  @ApiProperty({
    description: 'Total amount in VND',
    example: 1299000,
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({
    description: 'Number of unique products',
    example: 3,
  })
  @Expose()
  uniqueProducts: number;

  @ApiProperty({
    description: 'Items count by category',
    example: {
      Áo: 2,
      Quần: 3,
    },
  })
  @Expose()
  itemsByCategory: Record<string, number>;
}
