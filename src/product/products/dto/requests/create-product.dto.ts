import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateProductDto {
  @ApiProperty({
    description: 'Product name',
    example: 'Áo thun nam cổ tròn',
    maxLength: 255,
  })
  @IsString()
  @IsNotEmpty()
  readonly name: string;

  @ApiPropertyOptional({
    description: 'Product description',
    example:
      'Áo thun nam chất liệu cotton 100%, thoáng mát, thấm hút mồ hôi tốt',
  })
  @IsOptional()
  @IsString()
  readonly description?: string;

  @ApiProperty({
    description: 'Base price of the product in VND',
    example: 299000,
    minimum: 0,
  })
  @IsNumber()
  readonly basePrice: number;

  @ApiPropertyOptional({
    description: 'Discount percentage (0-99%)',
    example: 10,
    minimum: 0,
    maximum: 99,
  })
  @IsOptional()
  @IsNumber()
  @Min(0)
  @Max(99)
  discountPercent?: number;
  @ApiProperty({
    description: 'Base SKU for the product',
    example: 'AT001',
    maxLength: 20,
  })
  @IsString()
  @IsNotEmpty()
  @MaxLength(20)
  readonly baseSku: string;

  @ApiProperty({
    description: 'Category ID for the product',
    example: 'uuid-category-id',
  })
  @IsString()
  readonly categoryId: string;

  @ApiPropertyOptional({
    description: 'Array of collection IDs',
    example: ['uuid-collection-1', 'uuid-collection-2'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  readonly collectionIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of style IDs',
    example: ['uuid-style-1', 'uuid-style-2'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  readonly styleIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of material IDs',
    example: ['uuid-material-1', 'uuid-material-2'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  readonly materialIds?: string[];

  @ApiPropertyOptional({
    description: 'Array of tag IDs',
    example: ['uuid-tag-1', 'uuid-tag-2'],
    type: [String],
  })
  @IsOptional()
  @IsString({ each: true })
  readonly tagIds?: string[];

  @IsOptional()
  @ApiPropertyOptional({
    description: 'Product image',
    type: 'string',
    format: 'binary',
  })
  image?: Express.Multer.File;

  @ApiPropertyOptional({
    description: 'Whether the product is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  readonly isActive?: boolean;
}
