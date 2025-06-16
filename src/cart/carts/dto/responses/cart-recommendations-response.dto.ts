import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CartRecommendationsResponseDto {
  @ApiProperty({
    description: 'Products frequently bought together',
    type: 'array',
    items: { type: 'object' },
    example: [],
  })
  @Expose()
  frequentlyBoughtTogether: any[];

  @ApiProperty({
    description: 'Similar products based on cart items',
    type: 'array',
    items: { type: 'object' },
    example: [],
  })
  @Expose()
  similarProducts: any[];

  @ApiProperty({
    description: 'Recently viewed products',
    type: 'array',
    items: { type: 'object' },
    example: [],
  })
  @Expose()
  recentlyViewed: any[];
}
