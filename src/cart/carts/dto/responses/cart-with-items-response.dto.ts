import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CartResponseDto } from './cart-response.dto';
import { CartItemResponseDto } from '../../../cart-items/dto/responses/cart-item-response.dto';

export class CartWithItemsResponseDto extends CartResponseDto {
  @ApiProperty({
    description: 'Cart items with full details including product information',
    type: [CartItemResponseDto],
  })
  @Expose()
  @Type(() => CartItemResponseDto)
  declare items: CartItemResponseDto[];
}
