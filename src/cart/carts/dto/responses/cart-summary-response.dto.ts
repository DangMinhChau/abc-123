import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CartItemResponseDto } from '../../../cart-items/dto/responses/cart-item-response.dto';

export class CartSummaryResponseDto {
  @ApiProperty({
    description: 'Total number of items in cart',
    example: 5,
  })
  @Expose()
  totalItems: number;

  @ApiProperty({
    description: 'Total amount of cart in VND',
    example: 1299000,
  })
  @Expose()
  totalAmount: number;

  @ApiProperty({
    description: 'Whether the cart is empty',
    example: false,
  })
  @Expose()
  isEmpty: boolean;

  @ApiProperty({
    description: 'Cart items with full details',
    type: [CartItemResponseDto],
  })
  @Expose()
  @Type(() => CartItemResponseDto)
  items: CartItemResponseDto[];
}
