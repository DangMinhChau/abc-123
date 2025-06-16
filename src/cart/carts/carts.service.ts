import {
  Injectable,
  NotFoundException,
  forwardRef,
  Inject,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { plainToInstance } from 'class-transformer';
import { CreateCartDto, UpdateCartDto } from './dto/requests';
import {
  CartResponseDto,
  CartSummaryResponseDto,
  ShippingEstimateResponseDto,
} from './dto/responses';
import { Cart } from './entities/cart.entity';
import { User } from 'src/user/users/entities/user.entity';
import { CartItemsService } from '../cart-items/cart-items.service';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@Injectable()
export class CartsService {
  constructor(
    @InjectRepository(Cart)
    private readonly cartRepository: Repository<Cart>,
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @Inject(forwardRef(() => CartItemsService))
    private readonly cartItemsService: CartItemsService,
  ) {}
  async create(createCartDto: CreateCartDto): Promise<CartResponseDto> {
    const cart = await this.createCartEntity(createCartDto);
    return this.toCartResponseDto(cart);
  }

  // Internal method - returns Cart entity for service use
  async createCartEntity(createCartDto: CreateCartDto): Promise<Cart> {
    const { userId } = createCartDto;

    // Check if user exists
    const user = await this.userRepository.findOne({ where: { id: userId } });
    if (!user) {
      throw new NotFoundException('User not found');
    }

    // Check if user already has a cart
    const existingCart = await this.cartRepository.findOne({
      where: { user: { id: userId } },
      relations: ['items', 'items.variant', 'items.variant.product'],
    });

    if (existingCart) {
      return existingCart;
    }

    // Create new cart
    const cart = this.cartRepository.create({
      user,
      items: [],
    });

    return await this.cartRepository.save(cart);
  }
  async findAll(): Promise<PaginatedResponseDto<CartResponseDto>> {
    const carts = await this.cartRepository.find({
      relations: ['user', 'items', 'items.variant', 'items.variant.product'],
    });

    const cartDtos = carts.map((cart) => this.toCartResponseDto(cart));
    return {
      message: 'Carts retrieved successfully',
      data: cartDtos,
      meta: {
        total: cartDtos.length,
        page: 1,
        limit: cartDtos.length,
        totalPages: 1,
        timestamp: new Date().toISOString(),
      },
    };
  }
  async findOne(id: string): Promise<BaseResponseDto<CartResponseDto>> {
    const cart = await this.findCartEntity(id);

    return {
      message: 'Cart retrieved successfully',
      data: this.toCartResponseDto(cart),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // Internal method - returns Cart entity for service use
  async findCartEntity(id: string): Promise<Cart> {
    const cart = await this.cartRepository.findOne({
      where: { id },
      relations: [
        'user',
        'items',
        'items.variant',
        'items.variant.product',
        'items.variant.color',
        'items.variant.size',
        'items.variant.images',
      ],
    });

    if (!cart) {
      throw new NotFoundException(`Cart with ID ${id} not found`);
    }

    return cart;
  }
  async findByUserId(userId: string): Promise<Cart> {
    let cart = await this.cartRepository
      .createQueryBuilder('cart')
      .leftJoinAndSelect('cart.user', 'user')
      .leftJoinAndSelect('cart.items', 'items')
      .leftJoinAndSelect('items.variant', 'variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('variant.color', 'color')
      .leftJoinAndSelect('variant.size', 'size')
      .leftJoinAndSelect('variant.images', 'variantImages')
      .where('cart.user.id = :userId', { userId })
      .getOne();

    if (!cart) {
      cart = await this.createCartEntity({ userId });
    }

    return cart;
  }
  async update(id: string, updateCartDto: UpdateCartDto): Promise<Cart> {
    const cart = await this.findCartEntity(id);

    Object.assign(cart, updateCartDto);

    return await this.cartRepository.save(cart);
  }

  async clearCart(id: string): Promise<Cart> {
    const cart = await this.findCartEntity(id);

    cart.items = [];

    return await this.cartRepository.save(cart);
  }

  async clearCartByUserId(userId: string): Promise<Cart> {
    const cart = await this.findByUserId(userId);

    cart.items = [];

    return await this.cartRepository.save(cart);
  }

  // Alias for clearCartByUserId to match controller expectations
  async clearMyCart(userId: string): Promise<Cart> {
    return this.clearCartByUserId(userId);
  }

  // Alias for findByUserId to match controller expectations
  async getMyCart(userId: string): Promise<BaseResponseDto<CartResponseDto>> {
    const cart = await this.findByUserId(userId);
    return {
      message: 'Cart retrieved successfully',
      data: this.toCartResponseDto(cart),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async getShippingEstimate(
    userId: string,
    shippingAddress: any,
  ): Promise<BaseResponseDto<ShippingEstimateResponseDto>> {
    const estimate = await this.calculateShippingEstimate(
      userId,
      shippingAddress,
    );

    return {
      message: 'Shipping estimate calculated successfully',
      data: plainToInstance(ShippingEstimateResponseDto, estimate, {
        excludeExtraneousValues: true,
      }),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async remove(id: string): Promise<void> {
    const cart = await this.findCartEntity(id);
    await this.cartRepository.remove(cart);
  }

  async getCartSummary(
    userId: string,
  ): Promise<BaseResponseDto<CartSummaryResponseDto>> {
    const cart = await this.findByUserId(userId);
    return {
      message: 'Cart summary retrieved successfully',
      data: this.toCartSummaryResponseDto(cart),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  async mergeGuestCart(
    userId: string,
    guestCartItems: { variantId: string; quantity: number }[],
  ): Promise<Cart> {
    // Use CartItemsService to properly merge items
    const mergeResult = await this.cartItemsService.mergeGuestCartItems(
      userId,
      guestCartItems,
    );

    console.log('Merge guest cart result:', mergeResult);

    // Return updated cart
    return await this.findByUserId(userId);
  }
  getCartRecommendations(
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    userId: string,
  ): Promise<{
    frequentlyBoughtTogether: any[];
    similarProducts: any[];
    recentlyViewed: any[];
  }> {
    // This is a placeholder for recommendation logic
    // In a real implementation, you would analyze user behavior, purchase history, etc.

    return Promise.resolve({
      frequentlyBoughtTogether: [],
      similarProducts: [],
      recentlyViewed: [],
    });
  }
  async calculateShippingEstimate(
    userId: string,
    // eslint-disable-next-line @typescript-eslint/no-unused-vars
    shippingAddress?: any,
  ): Promise<{
    estimatedCost: number;
    estimatedDeliveryDays: number;
    availableShippingMethods: any[];
  }> {
    const cart = await this.findByUserId(userId);

    // Placeholder shipping calculation
    // In a real implementation, you would integrate with shipping providers

    const totalWeight = cart.items.reduce((weight, item) => {
      // Assume each item has a weight property
      return weight + item.quantity * 0.5; // 0.5kg per item as example
    }, 0);

    const baseCost = totalWeight * 2; // $2 per kg as example

    return {
      estimatedCost: baseCost,
      estimatedDeliveryDays: 3,
      availableShippingMethods: [
        { name: 'Standard', cost: baseCost, days: 5 },
        { name: 'Express', cost: baseCost * 1.5, days: 2 },
        { name: 'Overnight', cost: baseCost * 3, days: 1 },
      ],
    };
  }
  private toCartResponseDto(cart: Cart): CartResponseDto {
    console.log(
      'toCartResponseDto - Cart data:',
      JSON.stringify(cart, null, 2),
    );
    console.log('toCartResponseDto - Cart items:', cart.items);
    console.log(
      'toCartResponseDto - First item variant:',
      cart.items?.[0]?.variant,
    );

    const cartData = {
      ...cart,
      itemCount: cart.items?.length || 0,
      subtotal:
        cart.items?.reduce((total, item) => {
          const price = item.variant?.product?.discountPercent
            ? item.variant.product.basePrice *
              (1 - item.variant.product.discountPercent / 100)
            : item.variant?.product?.basePrice || 0;
          return total + price * item.quantity;
        }, 0) || 0,
    };

    const result = plainToInstance(CartResponseDto, cartData, {
      excludeExtraneousValues: true,
    });

    console.log('toCartResponseDto - Result:', JSON.stringify(result, null, 2));
    return result;
  }
  private toCartSummaryResponseDto(cart: Cart): CartSummaryResponseDto {
    const totalItems = cart.items?.length || 0;
    const totalAmount =
      cart.items?.reduce((total, item) => {
        const price = item.variant?.product?.discountPercent
          ? item.variant.product.basePrice *
            (1 - item.variant.product.discountPercent / 100)
          : item.variant?.product?.basePrice || 0;
        return total + price * item.quantity;
      }, 0) || 0;

    return plainToInstance(
      CartSummaryResponseDto,
      {
        totalItems,
        totalAmount,
        isEmpty: totalItems === 0,
        items: cart.items || [],
      },
      {
        excludeExtraneousValues: true,
      },
    );
  }

  // Public method to convert Cart entity to DTO for controller use
  public convertToCartResponseDto(cart: Cart): CartResponseDto {
    return this.toCartResponseDto(cart);
  }
}
