import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsUUID, ArrayMinSize, IsOptional } from 'class-validator';

export class AddProductsToCollectionDto {
  @ApiProperty({
    description: 'Array of product IDs to add to collection',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product ID is required' })
  @IsUUID('4', { each: true, message: 'Each product ID must be a valid UUID' })
  productIds: string[];
}

export class RemoveProductsFromCollectionDto {
  @ApiProperty({
    description: 'Array of product IDs to remove from collection',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one product ID is required' })
  @IsUUID('4', { each: true, message: 'Each product ID must be a valid UUID' })
  productIds: string[];
}

export class BulkManageCollectionProductsDto {
  @ApiProperty({
    description: 'Array of product IDs to add to collection',
    example: ['uuid1', 'uuid2'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  addProductIds?: string[];

  @ApiProperty({
    description: 'Array of product IDs to remove from collection',
    example: ['uuid3', 'uuid4'],
    type: [String],
    required: false,
  })
  @IsOptional()
  @IsArray()
  @IsUUID('4', { each: true })
  removeProductIds?: string[];
}

export class CollectionProductsResponseDto {
  @ApiProperty({
    description: 'Number of products added',
    example: 2,
  })
  added: number;

  @ApiProperty({
    description: 'Number of products removed',
    example: 1,
  })
  removed: number;

  @ApiProperty({
    description: 'Array of product IDs that were successfully added',
    example: ['uuid1', 'uuid2'],
  })
  addedProductIds: string[];

  @ApiProperty({
    description: 'Array of product IDs that were successfully removed',
    example: ['uuid3'],
  })
  removedProductIds: string[];

  @ApiProperty({
    description: 'Array of product IDs that failed to process',
    example: ['uuid5'],
    required: false,
  })
  failedProductIds?: string[];
}

// =============================================================================
// MATERIALS MANAGEMENT
// =============================================================================

export class AddMaterialsToProductDto {
  @ApiProperty({
    description: 'Array of material IDs to add to product',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one material ID is required' })
  @IsUUID('4', { each: true, message: 'Each material ID must be a valid UUID' })
  materialIds: string[];
}

export class RemoveMaterialsFromProductDto {
  @ApiProperty({
    description: 'Array of material IDs to remove from product',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one material ID is required' })
  @IsUUID('4', { each: true, message: 'Each material ID must be a valid UUID' })
  materialIds: string[];
}

// =============================================================================
// STYLES MANAGEMENT
// =============================================================================

export class AddStylesToProductDto {
  @ApiProperty({
    description: 'Array of style IDs to add to product',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one style ID is required' })
  @IsUUID('4', { each: true, message: 'Each style ID must be a valid UUID' })
  styleIds: string[];
}

export class RemoveStylesFromProductDto {
  @ApiProperty({
    description: 'Array of style IDs to remove from product',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one style ID is required' })
  @IsUUID('4', { each: true, message: 'Each style ID must be a valid UUID' })
  styleIds: string[];
}

// =============================================================================
// TAGS MANAGEMENT
// =============================================================================

export class AddTagsToProductDto {
  @ApiProperty({
    description: 'Array of tag IDs to add to product',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one tag ID is required' })
  @IsUUID('4', { each: true, message: 'Each tag ID must be a valid UUID' })
  tagIds: string[];
}

export class RemoveTagsFromProductDto {
  @ApiProperty({
    description: 'Array of tag IDs to remove from product',
    example: ['uuid1', 'uuid2', 'uuid3'],
    type: [String],
  })
  @IsArray()
  @ArrayMinSize(1, { message: 'At least one tag ID is required' })
  @IsUUID('4', { each: true, message: 'Each tag ID must be a valid UUID' })
  tagIds: string[];
}

// =============================================================================
// BULK MANAGEMENT DTOs
// =============================================================================

export class BulkManageProductAttributesDto {
  @ApiProperty({
    description: 'Material operations',
    required: false,
  })
  @IsOptional()
  materials?: {
    add?: string[];
    remove?: string[];
  };

  @ApiProperty({
    description: 'Style operations',
    required: false,
  })
  @IsOptional()
  styles?: {
    add?: string[];
    remove?: string[];
  };

  @ApiProperty({
    description: 'Tag operations',
    required: false,
  })
  @IsOptional()
  tags?: {
    add?: string[];
    remove?: string[];
  };
}

// =============================================================================
// RESPONSE DTOs
// =============================================================================

export class ProductAttributesResponseDto {
  @ApiProperty({
    description: 'Number of items added',
    example: 2,
  })
  added: number;

  @ApiProperty({
    description: 'Number of items removed',
    example: 1,
  })
  removed: number;

  @ApiProperty({
    description: 'Array of IDs that were successfully added',
    example: ['uuid1', 'uuid2'],
  })
  addedIds: string[];

  @ApiProperty({
    description: 'Array of IDs that were successfully removed',
    example: ['uuid3'],
  })
  removedIds: string[];

  @ApiProperty({
    description: 'Array of IDs that failed to process',
    example: ['uuid5'],
    required: false,
  })
  failedIds?: string[];
}
