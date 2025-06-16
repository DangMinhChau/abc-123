import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class WishlistResponseDto {
  @ApiProperty({
    description: 'Wishlist ID',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'User ID who owns the wishlist',
    example: '550e8400-e29b-41d4-a716-446655440001',
  })
  @Expose()
  userId: string;

  @ApiProperty({
    description: 'Wishlist name',
    example: 'My Favorites',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Total number of items in wishlist',
    example: 5,
  })
  @Expose()
  totalItems: number;

  @ApiProperty({
    description: 'Whether this is the default wishlist',
    example: true,
  })
  @Expose()
  isDefault: boolean;

  @ApiProperty({
    description: 'Wishlist creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Wishlist last update timestamp',
    example: '2024-01-15T11:45:00Z',
  })
  @Expose()
  updatedAt: Date;
}
