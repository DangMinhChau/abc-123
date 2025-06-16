import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class FilterItemResponseDto {
  @ApiProperty({
    description: 'Item slug/code',
    example: 'polo',
  })
  @Expose()
  slug?: string;

  @ApiProperty({
    description: 'Item code',
    example: 'RED',
  })
  @Expose()
  code?: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Đỏ',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Hex color code (for colors)',
    example: '#FF0000',
    required: false,
  })
  @Expose()
  hexCode?: string;

  @ApiProperty({
    description: 'Number of products with this filter',
    example: 15,
  })
  @Expose()
  productCount: number;
}

export class ProductFiltersResponseDto {
  @ApiProperty({
    description: 'Available category filters',
    type: [FilterItemResponseDto],
  })
  @Expose()
  categories: FilterItemResponseDto[];

  @ApiProperty({
    description: 'Available color filters',
    type: [FilterItemResponseDto],
  })
  @Expose()
  colors: FilterItemResponseDto[];

  @ApiProperty({
    description: 'Available size filters',
    type: [FilterItemResponseDto],
  })
  @Expose()
  sizes: FilterItemResponseDto[];

  @ApiProperty({
    description: 'Available material filters',
    type: [FilterItemResponseDto],
  })
  @Expose()
  materials: FilterItemResponseDto[];

  @ApiProperty({
    description: 'Available collection filters',
    type: [FilterItemResponseDto],
  })
  @Expose()
  collections: FilterItemResponseDto[];

  @ApiProperty({
    description: 'Available style filters',
    type: [FilterItemResponseDto],
  })
  @Expose()
  styles: FilterItemResponseDto[];

  @ApiProperty({
    description: 'Available tag filters',
    type: [FilterItemResponseDto],
  })
  @Expose()
  tags: FilterItemResponseDto[];

  @ApiProperty({
    description: 'Price range',
    example: { min: 100000, max: 5000000 },
  })
  @Expose()
  priceRange: {
    min: number;
    max: number;
  };
}
