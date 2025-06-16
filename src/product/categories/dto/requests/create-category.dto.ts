import {
  IsString,
  IsOptional,
  IsBoolean,
  MinLength,
  MaxLength,
} from 'class-validator';
import { ApiProperty, ApiPropertyOptional } from '@nestjs/swagger';

export class CreateCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Áo thun',
    minLength: 2,
    maxLength: 100,
  })
  @IsString()
  @MinLength(2)
  @MaxLength(100)
  readonly name: string;

  @ApiPropertyOptional({
    description: 'Parent category ID (for subcategories)',
    example: 'uuid-parent-category-id',
  })
  @IsOptional()
  @IsString()
  readonly parentId?: string;

  @ApiPropertyOptional({
    description: 'Category description',
    example: 'T-shirts and casual tops',
  })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiPropertyOptional({
    description: 'Whether the category is active',
    example: true,
    default: true,
  })
  @IsOptional()
  @IsBoolean()
  isActive?: boolean;
}
