import {
  Injectable,
  NotFoundException,
  BadRequestException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CartItem } from './entities/cart-item.entity';
import { Cart } from '../carts/entities/cart.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { User } from 'src/user/users/entities/user.entity';
import { CreateCartItemDto, UpdateCartItemDto } from './dto/requests';
import {
  CartItemResponseDto,
  CartValidationResponseDto,
} from './dto/responses';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { ProductsService } from 'src/product/products/products.service';

@Injectable()
export class CartItemsService {
  constructor(
    @InjectRepository(CartItem)
    private readonly cartItemRepository: Repository<CartItem>,
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    private readonly productsService: ProductsService,
  ) {}
  async create(
    createCartItemDto: CreateCartItemDto,
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    const cartItem = await this.createCartItemEntity(createCartItemDto);
    return {
      message: 'Cart item created successfully',
      data: this.toCartItemResponseDto(cartItem),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Internal method for creating cart item entity
  async createCartItemEntity(
    createCartItemDto: CreateCartItemDto,
  ): Promise<CartItem> {
    const { cartId, variantId, quantity } = createCartItemDto;

    // Validate cart exists
    const cart = await this.cartRepository.findOne({
      where: { id: cartId },
      relations: ['items'],
    });
    if (!cart) {
      throw new NotFoundException('Cart not found');
    }

    // Use productsService to validate variant and check availability
    const productData =
      await this.productsService.getProductFromVariant(variantId);

    const availability = await this.productsService.checkProductAvailability(
      productData.product.id,
      variantId,
      quantity,
    );

    if (!availability.available) {
      throw new BadRequestException(
        `Product "${productData.product.name}" is not available. ${availability.message}`,
      );
    }

    // Check if item already exists in cart
    const existingItem = await this.cartItemRepository.findOne({
      where: { cart: { id: cartId }, variant: { id: variantId } },
    });

    if (existingItem) {
      // Update quantity if item already exists
      const newQuantity = existingItem.quantity + quantity;

      // Check availability for new total quantity
      const newAvailability =
        await this.productsService.checkProductAvailability(
          productData.product.id,
          variantId,
          newQuantity,
        );

      if (!newAvailability.available) {
        throw new BadRequestException(
          `Cannot add ${quantity} more items. ${newAvailability.message}`,
        );
      }

      existingItem.quantity = newQuantity;
      return await this.cartItemRepository.save(existingItem);
    }

    // Create new cart item
    const cartItem = this.cartItemRepository.create({
      cart,
      variant: productData.variant,
      quantity,
    });

    return await this.cartItemRepository.save(cartItem);
  }
  async addToCart(
    userId: string,
    variantId: string,
    quantity: number,
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    const cartItem = await this.addToCartEntity(userId, variantId, quantity);
    return {
      message: 'Item added to cart successfully',
      data: this.toCartItemResponseDto(cartItem),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Internal method for adding to cart
  async addToCartEntity(
    userId: string,
    variantId: string,
    quantity: number,
  ): Promise<CartItem> {
    // Find or create user's cart
    let cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
    });
    if (!cart) {
      cart = await this.cartRepository.save(
        this.cartRepository.create({
          user: { id: userId } as Pick<User, 'id'>,
          items: [],
        }),
      );
    }
    return this.createCartItemEntity({
      cartId: cart.id,
      variantId,
      quantity,
    });
  }
  async findAll(): Promise<BaseResponseDto<CartItemResponseDto[]>> {
    const cartItems = await this.cartItemRepository.find({
      relations: [
        'cart',
        'variant',
        'variant.product',
        'variant.color',
        'variant.size',
      ],
    });

    return {
      message: 'Cart items retrieved successfully',
      data: cartItems.map((item) => this.toCartItemResponseDto(item)),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  async findOne(id: string): Promise<BaseResponseDto<CartItemResponseDto>> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id },
      relations: [
        'cart',
        'variant',
        'variant.product',
        'variant.color',
        'variant.size',
      ],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }

    return {
      message: 'Cart item retrieved successfully',
      data: this.toCartItemResponseDto(cartItem),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Internal method - returns CartItem entity for service use
  async findOneEntity(id: string): Promise<CartItem> {
    const cartItem = await this.cartItemRepository.findOne({
      where: { id },
      relations: [
        'cart',
        'variant',
        'variant.product',
        'variant.color',
        'variant.size',
      ],
    });

    if (!cartItem) {
      throw new NotFoundException(`Cart item with ID ${id} not found`);
    }

    return cartItem;
  }

  async findByCartId(cartId: string): Promise<CartItem[]> {
    return await this.cartItemRepository.find({
      where: { cart: { id: cartId } },
      relations: [
        'variant',
        'variant.product',
        'variant.color',
        'variant.size',
        'variant.images',
      ],
    });
  }
  async findByUserId(
    userId: string,
  ): Promise<BaseResponseDto<CartItemResponseDto[]>> {
    const cartItems = await this.cartItemRepository.find({
      where: { cart: { user: { id: userId } } },
      relations: [
        'variant',
        'variant.product',
        'variant.color',
        'variant.size',
        'variant.images',
      ],
    });

    return {
      message: 'User cart items retrieved successfully',
      data: cartItems.map((item) => this.toCartItemResponseDto(item)),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Internal method for getting cart items entity
  async findByUserIdEntity(userId: string): Promise<CartItem[]> {
    return await this.cartItemRepository.find({
      where: { cart: { user: { id: userId } } },
      relations: [
        'variant',
        'variant.product',
        'variant.color',
        'variant.size',
        'variant.images',
      ],
    });
  }
  async update(
    id: string,
    updateCartItemDto: UpdateCartItemDto,
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    const cartItem = await this.findOneEntity(id);
    const { quantity } = updateCartItemDto;

    if (quantity !== undefined) {
      // Use productsService to check stock availability
      const productData = await this.productsService.getProductFromVariant(
        cartItem.variant.id,
      );

      const availability = await this.productsService.checkProductAvailability(
        productData.product.id,
        cartItem.variant.id,
        quantity,
      );

      if (!availability.available) {
        throw new BadRequestException(
          `Cannot update quantity. ${availability.message}`,
        );
      }

      cartItem.quantity = quantity;
    }

    const updatedCartItem = await this.cartItemRepository.save(cartItem);

    return {
      message: 'Cart item updated successfully',
      data: this.toCartItemResponseDto(updatedCartItem),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  async updateQuantity(
    id: string,
    quantity: number,
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    const cartItem = await this.findOneEntity(id);

    if (quantity <= 0) {
      await this.cartItemRepository.remove(cartItem);
      return {
        message: 'Cart item removed successfully',
        data: this.toCartItemResponseDto(cartItem),
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }

    // Use productsService to check stock availability
    const productData = await this.productsService.getProductFromVariant(
      cartItem.variant.id,
    );

    const availability = await this.productsService.checkProductAvailability(
      productData.product.id,
      cartItem.variant.id,
      quantity,
    );

    if (!availability.available) {
      throw new BadRequestException(
        `Cannot update quantity. ${availability.message}`,
      );
    }

    cartItem.quantity = quantity;
    const updatedCartItem = await this.cartItemRepository.save(cartItem);

    return {
      message: 'Cart item quantity updated successfully',
      data: this.toCartItemResponseDto(updatedCartItem),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  async remove(id: string): Promise<void> {
    const cartItem = await this.findOneEntity(id);
    await this.cartItemRepository.remove(cartItem);
  }

  async removeFromCart(userId: string, variantId: string): Promise<void> {
    const cartItem = await this.cartItemRepository.findOne({
      where: {
        cart: { user: { id: userId } },
        variant: { id: variantId },
      },
    });

    if (!cartItem) {
      throw new NotFoundException('Cart item not found');
    }

    await this.cartItemRepository.remove(cartItem);
  }

  async clearCartItems(cartId: string): Promise<void> {
    await this.cartItemRepository.delete({ cart: { id: cartId } });
  }

  async clearMyCartItems(userId: string): Promise<void> {
    await this.cartItemRepository.delete({
      cart: { user: { id: userId } },
    });
  }
  async bulkAddToCart(
    userId: string,
    items: { variantId: string; quantity: number }[],
  ): Promise<BaseResponseDto<CartItemResponseDto[]>> {
    const results: CartItem[] = [];
    for (const item of items) {
      try {
        const cartItem = await this.addToCartEntity(
          userId,
          item.variantId,
          item.quantity,
        );
        results.push(cartItem);
      } catch (error) {
        // Continue with other items even if one fails
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        console.error(
          `Failed to add variant ${item.variantId} to cart:`,
          errorMessage,
        );
      }
    }

    return {
      message: `Bulk add to cart completed. ${results.length} items added successfully.`,
      data: results.map((item) => this.toCartItemResponseDto(item)),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Merge guest cart items with user's existing cart
   */
  async mergeGuestCartItems(
    userId: string,
    guestCartItems: { variantId: string; quantity: number }[],
  ): Promise<{
    success: boolean;
    merged: number;
    failed: number;
    details: {
      variantId: string;
      action: 'merged' | 'added' | 'failed';
      error?: string;
    }[];
  }> {
    const details: {
      variantId: string;
      action: 'merged' | 'added' | 'failed';
      error?: string;
    }[] = [];

    let merged = 0;
    let failed = 0; // Get user's current cart items
    const existingCartItems = await this.findByUserIdEntity(userId);

    for (const guestItem of guestCartItems) {
      try {
        // Check if item already exists in user's cart
        const existingItem = existingCartItems.find(
          (item) => item.variant.id === guestItem.variantId,
        );

        if (existingItem) {
          // Merge quantities
          const newQuantity = existingItem.quantity + guestItem.quantity;
          await this.update(existingItem.id, { quantity: newQuantity });
          details.push({
            variantId: guestItem.variantId,
            action: 'merged',
          });
          merged++;
        } else {
          // Add new item to cart
          await this.addToCart(userId, guestItem.variantId, guestItem.quantity);
          details.push({
            variantId: guestItem.variantId,
            action: 'added',
          });
          merged++;
        }
      } catch (error) {
        failed++;
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        details.push({
          variantId: guestItem.variantId,
          action: 'failed',
          error: errorMessage,
        });
        console.error(
          `Failed to merge guest cart item ${guestItem.variantId}:`,
          error,
        );
      }
    }

    return {
      success: failed === 0,
      merged,
      failed,
      details,
    };
  }
  async validateCartItems(
    userId: string,
  ): Promise<BaseResponseDto<CartValidationResponseDto>> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });
    if (!cart) {
      return {
        message: 'Cart validation completed',
        data: plainToInstance(
          CartValidationResponseDto,
          {
            valid: true,
            issues: [],
            summary: { totalValidItems: 0, totalInvalidItems: 0 },
          },
          { excludeExtraneousValues: true },
        ),
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    }

    const issues: {
      itemId: string;
      issue: string;
      variant?: any;
    }[] = [];
    let validItems = 0;

    for (const item of cart.items) {
      try {
        // Use productsService for comprehensive validation
        const productData = await this.productsService.getProductFromVariant(
          item.variant.id,
        );

        // Check product availability and stock
        const availability =
          await this.productsService.checkProductAvailability(
            productData.product.id,
            item.variant.id,
            item.quantity,
          );

        if (!availability.available) {
          issues.push({
            itemId: item.id,
            issue: availability.message || 'Product not available',
            variant: item.variant,
          });
          continue;
        }

        validItems++;
      } catch (error) {
        // Handle cases where variant or product no longer exists
        const errorMessage =
          error instanceof Error ? error.message : 'Unknown error';
        issues.push({
          itemId: item.id,
          issue: errorMessage,
          variant: item.variant,
        });
      }
    }
    return {
      message: 'Cart validation completed',
      data: plainToInstance(
        CartValidationResponseDto,
        {
          valid: issues.length === 0,
          issues,
          summary: {
            totalValidItems: validItems,
            totalInvalidItems: issues.length,
          },
        },
        { excludeExtraneousValues: true },
      ),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getCartItemsSummary(userId: string): Promise<{
    items: CartItem[];
    totalItems: number;
    totalAmount: number;
    uniqueProducts: number;
    itemsByCategory: Record<string, number>;
  }> {
    const cart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: [
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.product.category',
      ],
    });

    if (!cart || !cart.items || cart.items.length === 0) {
      return {
        items: [],
        totalItems: 0,
        totalAmount: 0,
        uniqueProducts: 0,
        itemsByCategory: {},
      };
    }

    const itemsByCategory: Record<string, number> = {};
    let totalAmount = 0;
    let totalItems = 0;

    for (const item of cart.items) {
      totalItems += item.quantity;
      totalAmount += item.calculateTotalPrice();

      const categoryName =
        item.variant.product.category?.name || 'Uncategorized';
      itemsByCategory[categoryName] =
        (itemsByCategory[categoryName] || 0) + item.quantity;
    }

    return {
      items: cart.items,
      totalItems,
      totalAmount,
      uniqueProducts: cart.items.length,
      itemsByCategory,
    };
  }

  private toCartItemResponseDto(cartItem: CartItem): CartItemResponseDto {
    return plainToInstance(CartItemResponseDto, cartItem, {
      excludeExtraneousValues: true,
    });
  }
}
