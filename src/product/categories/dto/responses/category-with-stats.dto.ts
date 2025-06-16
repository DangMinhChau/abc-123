import { ApiProperty } from '@nestjs/swagger';
import { CategoryResponseDto } from './category-response.dto';

export class CategoryWithStatsDto extends CategoryResponseDto {
  @ApiProperty({
    description: 'Number of products in this category',
    example: 25,
    minimum: 0,
  })
  productCount: number;

  @ApiProperty({
    description: 'Number of active subcategories',
    example: 3,
    minimum: 0,
  })
  childrenCount: number;

  @ApiProperty({
    description: 'Number of sizes available for this category',
    example: 5,
    minimum: 0,
  })
  sizeCount: number;
}
