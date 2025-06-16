import { ApiProperty } from '@nestjs/swagger';
import { Expose, Type } from 'class-transformer';
import { VariantResponseDto } from 'src/product/variants/dto';
import { TagResponseDto } from 'src/product/tags/dto';
import { MaterialResponseDto } from 'src/product/materials/dto';
import { StyleResponseDto } from 'src/product/styles/dto';
import { IsOptional } from 'class-validator';
import { CollectionResponseDto } from 'src/product/collections/dto';
import { ImageResponseDto } from 'src/media/images/dto/response/image-response.dto';
import { CategoryResponseDto } from 'src/product/categories/dto';

export class ProductResponseDto {
  @ApiProperty({ description: 'Product ID' })
  @Expose()
  id: string;

  @ApiProperty({ description: 'Product name' })
  @Expose()
  name: string;

  @ApiProperty({ description: 'Product slug' })
  @Expose()
  slug: string;

  @ApiProperty({ description: 'Product description' })
  @Expose()
  description?: string;

  @ApiProperty({ description: 'Product SKU' })
  @Expose()
  baseSku: string;

  @ApiProperty({ description: 'Product base price' })
  @Expose()
  basePrice: number;
  @ApiProperty({ description: 'Product discount (percentage)' })
  @Expose()
  discountPercent?: number;

  @ApiProperty({ description: 'Is active' })
  @Expose()
  isActive: boolean;

  @ApiProperty({
    description: 'Product tags',
    type: [TagResponseDto],
  })
  @IsOptional()
  @Expose()
  @Type(() => TagResponseDto)
  tags?: TagResponseDto[];

  @ApiProperty({
    description: 'Product materials',
    type: [MaterialResponseDto],
  })
  @IsOptional()
  @Expose()
  @Type(() => MaterialResponseDto)
  materials?: MaterialResponseDto[];

  @ApiProperty({
    description: 'Product styles',
    type: [StyleResponseDto],
  })
  @IsOptional()
  @Expose()
  @Type(() => StyleResponseDto)
  styles?: StyleResponseDto[];

  @ApiProperty({
    description: 'Product images',
    type: [CollectionResponseDto],
  })
  @Expose()
  @Type(() => CollectionResponseDto)
  @IsOptional()
  collections?: CollectionResponseDto[];

  @ApiProperty({
    description: 'Product primary image',
    type: ImageResponseDto,
  })
  @Expose()
  @Type(() => ImageResponseDto)
  image?: ImageResponseDto;

  @ApiProperty({
    description: 'Product category',
    type: CategoryResponseDto,
  })
  @Expose()
  @Type(() => CategoryResponseDto)
  category?: CategoryResponseDto;

  @ApiProperty({
    description: 'Product variants',
    type: [VariantResponseDto],
  })
  @Expose()
  @Type(() => VariantResponseDto)
  variants?: VariantResponseDto[];

  @ApiProperty({ description: 'Created at' })
  @Expose()
  createdAt: string;

  @ApiProperty({ description: 'Updated at' })
  @Expose()
  updatedAt: string;
}
