import {
  IsBoolean,
  IsNotEmpty,
  IsNumber,
  IsOptional,
  IsString,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateVariantDto {
  @ApiProperty({
    description: 'Product ID that this variant belongs to',
    example: 'uuid-product-id',
  })
  @IsString()
  @IsNotEmpty()
  productId: string;

  @ApiProperty({
    description: 'Color ID for this variant',
    example: 'uuid-color-id',
  })
  @IsString()
  @IsNotEmpty()
  colorId: string;

  @ApiProperty({
    description: 'Size ID for this variant',
    example: 'uuid-size-id',
  })
  @IsString()
  @IsNotEmpty()
  sizeId: string;

  @ApiPropertyOptional({
    description: 'Stock quantity for this variant',
    example: 100,
    minimum: 0,
    default: 0,
  })
  @IsOptional()
  @IsNumber()
  stockQuantity?: number;
  @ApiPropertyOptional({
    description: 'Whether this variant is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;

  @ApiPropertyOptional({
    description: 'Images for this variant',
    type: 'array',
    items: {
      type: 'string',
      format: 'binary',
    },
    required: false,
  })
  @IsOptional()
  images?: Express.Multer.File[];
}
