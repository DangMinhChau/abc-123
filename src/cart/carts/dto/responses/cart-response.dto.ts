import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { CartItemResponseDto } from 'src/cart/cart-items/dto/responses/cart-item-response.dto';
import { UserResponseDto } from 'src/user/users/dto';

export class CartResponseDto {
  @ApiProperty({
    description: 'Cart ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User who owns the cart',
    type: UserResponseDto,
  })
  @Expose()
  @Type(() => UserResponseDto)
  user: UserResponseDto;

  @ApiProperty({
    description: 'Cart items',
    type: [CartItemResponseDto],
  })
  @Expose()
  @Type(() => CartItemResponseDto)
  items: CartItemResponseDto[];

  @ApiProperty({
    description: 'Total number of items in cart',
    example: 3,
  })
  @Expose()
  itemCount: number;

  @ApiProperty({
    description: 'Total price of all items in cart',
    example: 899000,
  })
  @Expose()
  subtotal: number;

  @ApiProperty({
    description: 'Cart creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Cart last update timestamp',
    example: '2024-01-15T11:45:00Z',
  })
  @Expose()
  updatedAt: Date;
}
