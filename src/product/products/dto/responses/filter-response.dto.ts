import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';

export class FilterColorItem {
  @ApiProperty({
    description: 'Color code',
    example: 'RED',
  })
  @Expose()
  code: string;

  @ApiProperty({
    description: 'Color name',
    example: 'Đỏ',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Hex color code',
    example: '#FF0000',
  })
  @Expose()
  hexCode: string;

  @ApiProperty({
    description: 'Number of products with this color',
    example: 15,
  })
  @Expose()
  productCount: number;
}

export class FilterSizeItem {
  @ApiProperty({
    description: 'Size name',
    example: 'M',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Number of products with this size',
    example: 25,
  })
  @Expose()
  productCount: number;
}

export class FilterSlugItem {
  @ApiProperty({
    description: 'Item slug',
    example: 'cotton',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Item name',
    example: 'Cotton',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Number of products with this item',
    example: 30,
  })
  @Expose()
  productCount: number;
}

export class PriceRangeResponse {
  @ApiProperty({
    description: 'Minimum price',
    example: 100000,
  })
  @Expose()
  minPrice: number;

  @ApiProperty({
    description: 'Maximum price',
    example: 2000000,
  })
  @Expose()
  maxPrice: number;

  @ApiProperty({
    description: 'Category slug used for filtering',
    example: 'ao-thun',
    required: false,
  })
  @Expose()
  categorySlug?: string;
}

export class FilterResponse {
  @ApiProperty({
    description: 'Available category filters',
    type: [FilterSlugItem],
  })
  @Expose()
  categories: FilterSlugItem[];

  @ApiProperty({
    description: 'Available color filters',
    type: [FilterColorItem],
  })
  @Expose()
  colors: FilterColorItem[];

  @ApiProperty({
    description: 'Available size filters',
    type: [FilterSizeItem],
  })
  @Expose()
  sizes: FilterSizeItem[];

  @ApiProperty({
    description: 'Available material filters',
    type: [FilterSlugItem],
  })
  @Expose()
  materials: FilterSlugItem[];

  @ApiProperty({
    description: 'Available collection filters',
    type: [FilterSlugItem],
  })
  @Expose()
  collections: FilterSlugItem[];

  @ApiProperty({
    description: 'Available style filters',
    type: [FilterSlugItem],
  })
  @Expose()
  styles: FilterSlugItem[];
  @ApiProperty({
    description: 'Available tag filters',
    type: [FilterSlugItem],
  })
  @Expose()
  tags: FilterSlugItem[];

  @ApiProperty({
    description: 'Price range for products',
    type: PriceRangeResponse,
  })
  @Expose()
  @Type(() => PriceRangeResponse)
  priceRange: PriceRangeResponse;
}
