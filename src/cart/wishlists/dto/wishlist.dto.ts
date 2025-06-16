import { ApiProperty } from '@nestjs/swagger';

class WishlistUserDto {
  @ApiProperty({
    description: 'User ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Username',
    example: 'user123',
  })
  username: string;

  @ApiProperty({
    description: 'User email',
    example: 'user@example.com',
  })
  email?: string;
}

class WishlistProductCategoryDto {
  @ApiProperty({
    description: 'Category name',
    example: 'Áo thun',
  })
  name: string;
}

class WishlistVariantColorDto {
  @ApiProperty({
    description: 'Color name',
    example: 'Đỏ',
  })
  name: string;
}

class WishlistVariantSizeDto {
  @ApiProperty({
    description: 'Size name',
    example: 'M',
  })
  name: string;
}

class WishlistVariantDto {
  @ApiProperty({
    description: 'Variant ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Variant price',
    example: 199000,
  })
  price: number;

  @ApiProperty({
    description: 'Stock quantity',
    example: 10,
  })
  stockQuantity: number;

  @ApiProperty({
    description: 'Variant color',
    type: WishlistVariantColorDto,
  })
  color: WishlistVariantColorDto;

  @ApiProperty({
    description: 'Variant size',
    type: WishlistVariantSizeDto,
  })
  size: WishlistVariantSizeDto;
}

class WishlistProductDto {
  @ApiProperty({
    description: 'Product ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'Product name',
    example: 'Áo thun nam cao cấp',
  })
  name: string;

  @ApiProperty({
    description: 'Product slug',
    example: 'ao-thun-nam-cao-cap',
  })
  slug: string;

  @ApiProperty({
    description: 'Base price',
    example: 299000,
  })
  basePrice: number;

  @ApiProperty({
    description: 'Sale price',
    example: 199000,
    nullable: true,
  })
  salePrice?: number;

  @ApiProperty({
    description: 'Product images',
    type: [String],
    example: [
      'https://example.com/image1.jpg',
      'https://example.com/image2.jpg',
    ],
  })
  images: string[];

  @ApiProperty({
    description: 'Product category',
    type: WishlistProductCategoryDto,
    required: false,
  })
  category?: WishlistProductCategoryDto;

  @ApiProperty({
    description: 'Product variants',
    type: [WishlistVariantDto],
    required: false,
  })
  variants?: WishlistVariantDto[];
}

export class WishlistDto {
  @ApiProperty({
    description: 'Wishlist item ID',
    example: '123e4567-e89b-12d3-a456-426614174000',
  })
  id: string;

  @ApiProperty({
    description: 'User information',
    type: WishlistUserDto,
    required: false,
  })
  user?: WishlistUserDto;

  @ApiProperty({
    description: 'Product information',
    type: WishlistProductDto,
  })
  product: WishlistProductDto;

  @ApiProperty({
    description: 'When the item was added to wishlist',
    example: '2024-06-10T00:00:00.000Z',
  })
  createdAt: Date;

  @ApiProperty({
    description: 'When the wishlist item was last updated',
    example: '2024-06-10T00:00:00.000Z',
  })
  updatedAt: Date;
}

export class WishlistToggleDto {
  @ApiProperty({
    description: 'Whether the product is in wishlist',
    example: true,
  })
  inWishlist: boolean;

  @ApiProperty({
    description: 'Action message',
    example: 'Product added to wishlist',
  })
  message: string;
}

export class WishlistCountDto {
  @ApiProperty({
    description: 'Total number of items in wishlist',
    example: 5,
  })
  count: number;
}

export class WishlistMoveToCartDto {
  @ApiProperty({
    description: 'Success status',
    example: true,
  })
  success: boolean;

  @ApiProperty({
    description: 'Move to cart message',
    example: 'Product moved to cart successfully',
  })
  message: string;
}
