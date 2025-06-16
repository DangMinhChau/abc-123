import { ApiPropertyOptional } from '@nestjs/swagger';
import { Transform, Type } from 'class-transformer';
import {
  IsBoolean,
  IsEnum,
  IsInt,
  IsNumber,
  IsOptional,
  IsString,
  Max,
  Min,
} from 'class-validator';

export enum SortBy {
  NEWEST = 'newest',
  PRICE_ASC = 'price_asc',
  PRICE_DESC = 'price_desc',
  NAME_ASC = 'name_asc',
  NAME_DESC = 'name_desc',
  RELEVANCE = 'relevance',
}

export class ProductFilterDto {
  @ApiPropertyOptional({
    description: 'Search term',
    example: 'áo polo',
  })
  @IsOptional()
  @IsString()
  search?: string;

  @ApiPropertyOptional({
    description: 'Page number',
    example: 1,
    minimum: 1,
    default: 1,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  page?: number = 1;

  @ApiPropertyOptional({
    description: 'Items per page',
    example: 20,
    minimum: 1,
    maximum: 100,
    default: 20,
  })
  @IsOptional()
  @Type(() => Number)
  @IsInt()
  @Min(1)
  @Max(100)
  limit?: number = 20;

  @ApiPropertyOptional({
    description: 'Category slug',
    example: 'ao-thun',
  })
  @IsOptional()
  @IsString()
  category?: string;
  @ApiPropertyOptional({
    description: 'Material slugs (multiple values supported)',
    example: 'cotton,polyester,silk',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    return [];
  })
  @IsString({ each: true })
  material?: string | string[];

  @ApiPropertyOptional({
    description: 'Style slugs (multiple values supported)',
    example: 'casual,formal,sport',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    return [];
  })
  @IsString({ each: true })
  style?: string | string[];

  @ApiPropertyOptional({
    description: 'Collection slugs (multiple values supported)',
    example: 'summer-2024,winter-2024',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    return [];
  })
  @IsString({ each: true })
  collection?: string | string[];

  @ApiPropertyOptional({
    description: 'Tag slugs (multiple values supported)',
    example: 'trending,sale,new-arrival',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    return [];
  })
  @IsString({ each: true })
  tag?: string | string[];

  @ApiPropertyOptional({
    description: 'Minimum price',
    example: 100000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMin?: number;

  @ApiPropertyOptional({
    description: 'Maximum price',
    example: 1000000,
    minimum: 0,
  })
  @IsOptional()
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  priceMax?: number;
  @ApiPropertyOptional({
    description: 'Size names (multiple values supported)',
    example: 'M,L,XL',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim())
        .filter((v) => v.length > 0);
    }
    if (Array.isArray(value)) {
      return value.map((v) => String(v).trim()).filter((v) => v.length > 0);
    }
    return [];
  })
  @IsString({ each: true })
  size?: string | string[];

  @ApiPropertyOptional({
    description: 'Color codes (multiple values supported)',
    example: 'RED,BLUE,GREEN',
    type: String,
  })
  @IsOptional()
  @Transform(({ value }) => {
    if (typeof value === 'string') {
      return value
        .split(',')
        .map((v) => v.trim().toUpperCase())
        .filter((v) => v.length > 0);
    }
    if (Array.isArray(value)) {
      return value
        .map((v) => String(v).trim().toUpperCase())
        .filter((v) => v.length > 0);
    }
    return [];
  })
  @IsString({ each: true })
  color?: string | string[];
  @ApiPropertyOptional({
    description: 'Sort by field',
    example: 'createdAt',
    enum: ['createdAt', 'basePrice', 'name'],
  })
  @IsOptional()
  @IsString()
  sortBy?: string;
  @ApiPropertyOptional({
    description: 'Sort order',
    example: 'DESC',
    enum: ['ASC', 'DESC'],
  })
  @IsOptional()
  @IsString()
  @IsEnum(['ASC', 'DESC'])
  sortOrder?: 'ASC' | 'DESC';

  @ApiPropertyOptional({
    description: 'Sort by (legacy field for backward compatibility)',
    enum: SortBy,
    default: SortBy.NEWEST,
  })
  @IsOptional()
  @IsEnum(SortBy)
  sort?: SortBy = SortBy.NEWEST;

  @ApiPropertyOptional({
    description: 'Filter only products in stock',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  inStock?: boolean;

  @ApiPropertyOptional({
    description: 'Filter only active products',
    example: true,
  })
  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => {
    if (value === 'true') return true;
    if (value === 'false') return false;
    return value as boolean;
  })
  isActive?: boolean = true;
}
