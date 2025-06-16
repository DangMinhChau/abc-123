import { ApiProperty } from '@nestjs/swagger';
import { Expose, Transform, Type } from 'class-transformer';
import { ImageResponseDto } from 'src/media/images/dto/response/image-response.dto';
import { ColorResponseDto } from 'src/product/colors/dto';
import { SizeResponseDto } from 'src/product/sizes/dto';

export class VariantResponseDto {
  @ApiProperty({
    description: 'Variant unique identifier',
    example: '550e8400-e29b-41d4-a716-446655440000',
  })
  @Expose()
  id: string;

  @ApiProperty({
    description: 'Variant SKU',
    example: 'SHIRT-RED-M-001',
  })
  @Expose()
  sku: string;

  @ApiProperty({
    description: 'Variant stock quantity',
    example: 100,
  })
  @Expose()
  stockQuantity: number;

  @ApiProperty({
    description: 'Whether variant is active',
    example: true,
  })
  @Expose()
  isActive: boolean;
  @ApiProperty({
    description: 'Product information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440001',
      name: 'Basic T-Shirt',
      basePrice: 100000,
      discountPercent: 0,
      slug: 'basic-t-shirt',
      images: [],
    },
  })
  @Expose()
  @Transform(({ obj }) => ({
    id: obj.product?.id,
    name: obj.product?.name,
    basePrice: obj.product?.basePrice,
    discountPercent: obj.product?.discountPercent || 0,
    slug: obj.product?.slug,
    images: obj.product?.images || [],
  }))
  product: {
    id: string;
    name: string;
    basePrice?: number;
    discountPercent?: number;
    slug?: string;
    images?: any[];
  };

  @ApiProperty({
    description: 'Color information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440002',
      name: 'Red',
      hexCode: '#FF0000',
    },
  })
  @Type(() => ColorResponseDto)
  @Expose()
  color: ColorResponseDto;

  @ApiProperty({
    description: 'Size information',
    example: {
      id: '550e8400-e29b-41d4-a716-446655440003',
      name: 'M',
    },
  })
  @Expose()
  @Type(() => SizeResponseDto)
  size: SizeResponseDto;
  @ApiProperty({
    description: 'List of images associated with the variant',
    type: [ImageResponseDto],
  })
  @Expose()
  @Type(() => ImageResponseDto)
  images?: ImageResponseDto[];

  @ApiProperty({
    description: 'Creation timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  createdAt: Date;

  @ApiProperty({
    description: 'Last update timestamp',
    example: '2024-01-15T10:30:00Z',
  })
  @Expose()
  updatedAt: Date;
}
