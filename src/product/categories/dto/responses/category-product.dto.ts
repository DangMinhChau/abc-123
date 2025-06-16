import { ApiProperty } from '@nestjs/swagger';
import { Expose } from 'class-transformer';

export class CategoryProductResponseDto {
  @ApiProperty({
    description: 'Product unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Áo thun nam cổ tròn',
  })
  @Expose()
  name: string;

  @ApiProperty({
    description: 'Product slug',
    example: 'ao-thun-nam-co-tron',
  })
  @Expose()
  slug: string;

  @ApiProperty({
    description: 'Product description',
    example: 'Áo thun nam chất liệu cotton 100%, thoáng mát',
    required: false,
  })
  @Expose()
  description?: string;

  @ApiProperty({
    description: 'Product base price',
    example: 299000,
  })
  @Expose()
  basePrice: number;

  @ApiProperty({
    description: 'Product discount percentage',
    example: 10,
    required: false,
  })
  @Expose()
  discountPercent?: number;

  @ApiProperty({
    description: 'Final price after discount',
    example: 269100,
  })
  @Expose()
  finalPrice: number;

  @ApiProperty({
    description: 'Main image URL',
    example:
      'https://res.cloudinary.com/example/image/upload/v1234567890/products/image.jpg',
    required: false,
  })
  @Expose()
  mainImageUrl?: string;

  @ApiProperty({
    description: 'Whether the product is active',
    example: true,
  })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Product creation timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Product last update timestamp',
    example: '2024-01-15T10:30:00.000Z',
  })
  @Expose()
  updatedAt: Date;
}
