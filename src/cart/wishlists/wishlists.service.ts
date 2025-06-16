import {
  Injectable,
  NotFoundException,
  BadRequestException,
  ConflictException,
  Inject,
  forwardRef,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { CreateWishlistDto } from './dto/create-wishlist.dto';
import { UpdateWishlistDto } from './dto/update-wishlist.dto';
import { AddToWishlistDto } from './dto/add-to-wishlist.dto';
import { MoveToCartDto } from './dto/move-to-cart.dto';
import { Wishlist } from './entities/wishlist.entity';
import { User } from 'src/user/users/entities/user.entity';
import { CartItemsService } from '../cart-items/cart-items.service';
import { ProductsService } from 'src/product/products/products.service';

@Injectable()
export class WishlistsService {
  constructor(
    @InjectRepository(Wishlist)
    private readonly wishlistRepository: Repository<Wishlist>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => CartItemsService))
    private readonly cartItemsService: CartItemsService,
    private readonly productsService: ProductsService,
  ) {}

  async create(createWishlistDto: CreateWishlistDto): Promise<Wishlist> {
    const { userId, productId } = createWishlistDto;

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Use ProductsService for better product validation
    try {
      const productInfo =
        await this.productsService.getProductBasicInfo(productId);
      if (!productInfo.isActive) {
        throw new BadRequestException('Product is not active');
      }
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw new NotFoundException('Product not found');
      }
      throw error;
    } // Check if item already exists in wishlist
    const existingWishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (existingWishlistItem) {
      throw new ConflictException('Product already in wishlist');
    }

    // Create new wishlist item using entity references (no need for separate product query)
    const wishlistItem = this.wishlistRepository.create({
      user: { id: userId },
      product: { id: productId },
    });

    return await this.wishlistRepository.save(wishlistItem);
  }

  async addToWishlist(
    userId: string,
    addToWishlistDto: AddToWishlistDto,
  ): Promise<Wishlist> {
    return this.create({
      userId,
      productId: addToWishlistDto.productId,
    });
  }

  async findAll(): Promise<Wishlist[]> {
    return await this.wishlistRepository.find({
      relations: [
        'user',
        'product',
        'product.images',
        'product.variants',
        'product.variants.color',
        'product.variants.size',
      ],
    });
  }

  async findByUserId(userId: string): Promise<Wishlist[]> {
    return await this.wishlistRepository.find({
      where: { user: { id: userId } },
      relations: [
        'product',
        'product.images',
        'product.variants',
        'product.variants.color',
        'product.variants.size',
        'product.category',
        'product.collections',
        'product.tags',
      ],
      order: { createdAt: 'DESC' },
    });
  }

  async findOne(id: string): Promise<Wishlist> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { id },
      relations: [
        'user',
        'product',
        'product.images',
        'product.variants',
        'product.variants.color',
        'product.variants.size',
      ],
    });

    if (!wishlistItem) {
      throw new NotFoundException(`Wishlist item with ID ${id} not found`);
    }

    return wishlistItem;
  }

  async update(
    id: string,
    updateWishlistDto: UpdateWishlistDto,
  ): Promise<Wishlist> {
    const wishlistItem = await this.findOne(id);

    Object.assign(wishlistItem, updateWishlistDto);

    return await this.wishlistRepository.save(wishlistItem);
  }

  async remove(id: string): Promise<void> {
    const wishlistItem = await this.findOne(id);
    await this.wishlistRepository.remove(wishlistItem);
  }

  async removeFromWishlist(userId: string, productId: string): Promise<void> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    await this.wishlistRepository.remove(wishlistItem);
  }

  async clearWishlist(userId: string): Promise<void> {
    await this.wishlistRepository.delete({ user: { id: userId } });
  }

  async isInWishlist(userId: string, productId: string): Promise<boolean> {
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    return !!wishlistItem;
  }

  async getWishlistCount(userId: string): Promise<number> {
    return await this.wishlistRepository.count({
      where: { user: { id: userId } },
    });
  }
  async moveToCart(
    userId: string,
    moveToCartDto: MoveToCartDto,
  ): Promise<{ success: boolean; message: string }> {
    const { productId, variantId, quantity = 1 } = moveToCartDto;

    // Check if product is in wishlist
    const wishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
      relations: ['product'],
    });

    if (!wishlistItem) {
      throw new NotFoundException('Product not found in wishlist');
    }

    // Use ProductsService to get product with variants for validation
    const productWithVariants =
      await this.productsService.getProductWithVariants(productId);

    let targetVariantId = variantId;

    // If no specific variant provided, use the first available variant
    if (!targetVariantId && productWithVariants.variants?.length > 0) {
      const availableVariant = productWithVariants.variants.find(
        (v) => v.stockQuantity > 0,
      );
      if (availableVariant) {
        targetVariantId = availableVariant.id;
      }
    }
    if (!targetVariantId) {
      throw new BadRequestException(
        'No variant specified and no available variants found',
      );
    }

    // Use ProductsService to validate variant availability
    const availability = await this.productsService.checkProductAvailability(
      productId,
      targetVariantId,
      quantity,
    );

    if (!availability.available) {
      throw new BadRequestException(
        availability.message || 'Insufficient stock',
      );
    }

    try {
      // Add to cart
      await this.cartItemsService.addToCart(userId, targetVariantId, quantity);

      // Remove from wishlist
      await this.wishlistRepository.remove(wishlistItem);

      return {
        success: true,
        message: 'Product moved to cart successfully',
      };
    } catch (error: unknown) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new BadRequestException(
        `Failed to move product to cart: ${errorMessage}`,
      );
    }
  }

  async toggleWishlist(
    userId: string,
    productId: string,
  ): Promise<{ inWishlist: boolean; message: string }> {
    const existingWishlistItem = await this.wishlistRepository.findOne({
      where: { user: { id: userId }, product: { id: productId } },
    });

    if (existingWishlistItem) {
      // Remove from wishlist
      await this.wishlistRepository.remove(existingWishlistItem);
      return {
        inWishlist: false,
        message: 'Product removed from wishlist',
      };
    } else {
      // Add to wishlist
      await this.addToWishlist(userId, { productId });
      return {
        inWishlist: true,
        message: 'Product added to wishlist',
      };
    }
  }
}
