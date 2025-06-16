import {
  IsOptional,
  IsInt,
  Min,
  Max,
  IsString,
  IsEnum,
  IsBoolean,
  IsUUID,
} from 'class-validator';
import { Transform, Type } from 'class-transformer';
import { ApiProperty } from '@nestjs/swagger';

export class ProductQueryDto {
  @ApiProperty({
    description: 'Page number for pagination',
    example: 1,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;
  @ApiProperty({
    description: 'Number of items per page',
    example: 10,
    required: false,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(1000)
  limit?: number = 10;

  @ApiProperty({
    description: 'Search term for product name or description',
    required: false,
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiProperty({
    description: 'Filter by category ID',
    required: false,
  })
  @IsOptional()
  @IsUUID()
  categoryId?: string;
  @ApiProperty({
    description: 'Filter by active status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  isActive?: boolean;

  @ApiProperty({
    description: 'Filter by featured status',
    required: false,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  isFeatured?: boolean;

  @ApiProperty({
    description: 'Sort field',
    enum: ['name', 'price', 'createdAt', 'updatedAt'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['name', 'price', 'createdAt', 'updatedAt'])
  sortBy?: 'name' | 'price' | 'createdAt' | 'updatedAt' = 'createdAt';
  @ApiProperty({
    description: 'Sort order',
    enum: ['ASC', 'DESC'],
    required: false,
  })
  @IsOptional()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC' = 'DESC';

  @ApiProperty({
    description: 'Filter by color IDs (comma-separated)',
    required: false,
    example: 'uuid1,uuid2',
  })
  @IsOptional()
  @IsString()
  colorIds?: string;

  @ApiProperty({
    description: 'Filter by size IDs (comma-separated)',
    required: false,
    example: 'uuid1,uuid2',
  })
  @IsOptional()
  @IsString()
  sizeIds?: string;

  @ApiProperty({
    description: 'Filter by material IDs (comma-separated)',
    required: false,
    example: 'uuid1,uuid2',
  })
  @IsOptional()
  @IsString()
  materialIds?: string;

  @ApiProperty({
    description: 'Filter by style IDs (comma-separated)',
    required: false,
    example: 'uuid1,uuid2',
  })
  @IsOptional()
  @IsString()
  styleIds?: string;

  @ApiProperty({
    description: 'Filter by collection IDs (comma-separated)',
    required: false,
    example: 'uuid1,uuid2',
  })
  @IsOptional()
  @IsString()
  collectionIds?: string;

  @ApiProperty({
    description: 'Filter by tag IDs (comma-separated)',
    required: false,
    example: 'uuid1,uuid2',
  })
  @IsOptional()
  @IsString()
  tagIds?: string;
  @ApiProperty({
    description: 'Filter by minimum price',
    required: false,
    example: 100000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minPrice?: number;

  @ApiProperty({
    description: 'Filter by maximum price',
    required: false,
    example: 1000000,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  maxPrice?: number;

  @ApiProperty({
    description: 'Filter by minimum stock quantity (based on variants)',
    required: false,
    example: 10,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(0)
  minStock?: number;
}
