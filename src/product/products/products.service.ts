import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from 'src/product/products/entities/product.entity';
import { Repository } from 'typeorm';
import { Material } from 'src/product/materials/entities/material.entity';
import { Style } from 'src/product/styles/entities/style.entity';
import { Tag } from 'src/product/tags/entities/tag.entity';
import { Category } from 'src/product/categories/entities/category.entity';
import { Collection } from 'src/product/collections/entities/collection.entity';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { ProductFilterService } from './services/product-filter.service';
import { ProductFilterDto } from './dto/requests/product-filter.dto';

@Injectable()
export class ProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Style)
    private readonly styleRepository: Repository<Style>,
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    private readonly productFilterService: ProductFilterService,
  ) {}

  /**
   * Get product by slug - Public only (only if active)
   */ async findBySlugPublic(slug: string): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: { slug, isActive: true }, // Force active only
        relations: [
          'category',
          'materials',
          'styles',
          'collections',
          'tags',
          'image',
          'variants',
          'variants.images',
          'variants.color',
          'variants.size',
        ],
        cache: 60000,
      });

      if (!product) {
        throw new NotFoundException(
          `Product with slug ${slug} not found or inactive`,
        );
      }
      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get product: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  /**
   * Get product for order operations
   */
  async getProductForOrder(
    productId: string,
    variantId?: string,
  ): Promise<{
    product: Product;
    variant?: ProductVariant;
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
      relations: ['variants'],
      cache: 30000,
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id ${productId} not found or inactive`,
      );
    }

    let variant: ProductVariant | undefined;
    if (variantId) {
      variant =
        (await this.variantRepository.findOne({
          where: { id: variantId, isActive: true },
          cache: 30000,
        })) || undefined;

      if (!variant) {
        throw new NotFoundException(
          `Variant with id ${variantId} not found or inactive`,
        );
      }
    }

    return {
      product,
      variant,
    };
  }

  /**
   * Check product availability and stock
   */
  async checkProductAvailability(
    productId: string,
    variantId?: string,
    quantity: number = 1,
  ): Promise<{
    available: boolean;
    stockQuantity: number;
    message?: string;
  }> {
    const productData = await this.getProductForOrder(productId, variantId);

    let stockQuantity: number;

    if (variantId && productData.variant) {
      // For variants, use variant stock
      stockQuantity = productData.variant.stockQuantity;
    } else if (!variantId) {
      // For products without variants, sum all variant stocks
      const variants = await this.variantRepository.find({
        where: { product: { id: productId }, isActive: true },
        select: ['stockQuantity'],
      });
      stockQuantity = variants.reduce(
        (total, variant) => total + variant.stockQuantity,
        0,
      );
    } else {
      stockQuantity = 0;
    }

    const available = stockQuantity >= quantity;

    return {
      available,
      stockQuantity,
      message: !available
        ? `Insufficient stock. Available: ${stockQuantity}, Requested: ${quantity}`
        : undefined,
    };
  }

  /**
   * Update product stock after order
   */
  async updateProductStock(
    productId: string,
    variantId: string | null,
    quantity: number,
  ): Promise<void> {
    if (variantId) {
      await this.variantRepository.decrement(
        { id: variantId },
        'stockQuantity',
        quantity,
      );
    } else {
      throw new Error(
        'Cannot update stock without variant ID. Stock is managed at variant level.',
      );
    }
  }

  /**
   * Restore product stock (increment back when payment fails/cancelled)
   */
  async restoreProductStock(
    productId: string,
    variantId: string | null,
    quantity: number,
  ): Promise<void> {
    if (variantId) {
      await this.variantRepository.increment(
        { id: variantId },
        'stockQuantity',
        quantity,
      );
    } else {
      throw new Error(
        'Cannot restore stock without variant ID. Stock is managed at variant level.',
      );
    }
  }

  /**
   * Get product basic info for cart/wishlist display
   */
  async getProductBasicInfo(productId: string): Promise<{
    id: string;
    name: string;
    slug: string;
    basePrice: number;
    isActive: boolean;
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      select: ['id', 'name', 'slug', 'basePrice', 'isActive'],
      cache: 60000, // Cache for 1 minute
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    return product;
  }

  /**
   * Get product with variants for cart operations
   */
  async getProductWithVariants(productId: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
      relations: [
        'variants',
        'variants.color',
        'variants.size',
        'variants.images',
      ],
      cache: 30000,
    });

    if (!product) {
      throw new NotFoundException(
        `Product with id ${productId} not found or inactive`,
      );
    }

    return product;
  }

  /**
   * Check if user can review this product (for review module integration)
   */
  async canReviewProduct(productId: string): Promise<boolean> {
    const product = await this.productRepository.findOne({
      where: { id: productId, isActive: true },
      select: ['id', 'isActive'],
      cache: 30000,
    });
    return !!product;
  }

  /**
   * Get product information from variant ID
   * Useful when you only have the variant ID from order items
   */
  async getProductFromVariant(variantId: string): Promise<{
    product: Product;
    variant: ProductVariant;
    finalPrice: number;
  }> {
    const variant = await this.variantRepository.findOne({
      where: { id: variantId, isActive: true },
      relations: ['product', 'color', 'size'],
      cache: 30000,
    });

    if (!variant) {
      throw new NotFoundException(
        `Variant with id ${variantId} not found or inactive`,
      );
    }

    if (!variant.product.isActive) {
      throw new NotFoundException(
        `Product for variant ${variantId} is inactive`,
      );
    } // Calculate final price including discount
    const discountPercent = variant.product.discountPercent || 0;
    const finalPrice = variant.product.basePrice * (1 - discountPercent / 100);

    return {
      product: variant.product,
      variant,
      finalPrice,
    };
  }

  // =============================================================================
  // PUBLIC METHODS (ONLY ACTIVE PRODUCTS)
  // =============================================================================

  /**
   * Get all active products with pagination and filtering - Public only
   */
  async findAllPublic(queryDto: ProductFilterDto): Promise<{
    data: Product[];
    meta: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    // Force isActive = true for public routes
    const publicQueryDto: ProductFilterDto = {
      ...queryDto,
      isActive: true, // Always filter to active products for public
    };

    return this.findAll(publicQueryDto);
  }

  /**
   * Get product by ID - Public only (only if active)
   */
  async findOnePublic(id: string): Promise<Product> {
    try {
      const product = await this.productRepository.findOne({
        where: { id, isActive: true }, // Force active only
        relations: [
          'category',
          'materials',
          'styles',
          'collections',
          'tags',
          'variants',
          'variants.size',
          'variants.color',
        ],
        cache: 60000,
      });

      if (!product) {
        throw new NotFoundException(
          `Product with id ${id} not found or inactive`,
        );
      }

      return product;
    } catch (error) {
      if (error instanceof NotFoundException) {
        throw error;
      }
      throw new BadRequestException(
        `Failed to get product: ${error instanceof Error ? error.message : String(error)}`,
      );
    }
  }

  // =============================================================================
  // FILTER AND SEARCH METHODS
  // =============================================================================

  /**
   * Get all products with pagination and filtering
   */
  async findAll(filterDto: ProductFilterDto): Promise<{
    data: Product[];
    meta: {
      page: number;
      limit: number;
      total: number;
    };
  }> {
    const startTime = Date.now();

    // Use the optimized search from ProductFilterService
    const page = filterDto.page || 1;
    const limit = Math.min(filterDto.limit || 20, 100); // Max 100 items per page

    // Use Promise.all for parallel execution
    const [products, total] = await Promise.all([
      this.productFilterService.searchProductsOptimized(filterDto, page, limit),
      this.productFilterService.getProductsCount(filterDto),
    ]);

    const endTime = Date.now();
    const executionTime = endTime - startTime;

    // Log performance for monitoring (in production, use proper logger)
    if (executionTime > 1000) {
      console.warn(
        `Slow query detected: ${executionTime}ms for filter:`,
        filterDto,
      );
    }

    return {
      data: products,
      meta: {
        page,
        limit,
        total,
      },
    };
  }

  /**
   * Update product rating statistics (for review module integration)
   */
  async updateProductRatingStats(
    productId: string,
    averageRating: number,
    totalReviews: number,
  ): Promise<void> {
    await this.productRepository.update(productId, {
      averageRating,
      totalReviews,
    });
  }

  /**
   * Get products on sale with pagination
   */
  async getSaleProducts(options: {
    page: number;
    limit: number;
    sort?: string;
  }): Promise<{
    products: Product[];
    totalItems: number;
    currentPage: number;
    totalPages: number;
    itemsPerPage: number;
  }> {
    const { page, limit, sort = 'discount_desc' } = options;

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.materials', 'materials')
      .leftJoinAndSelect('product.styles', 'styles')
      .leftJoinAndSelect('product.collections', 'collections')
      .leftJoinAndSelect('product.tags', 'tags')
      .leftJoinAndSelect('product.image', 'image')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.images', 'variantImages')
      .leftJoinAndSelect('variants.color', 'color')
      .leftJoinAndSelect('variants.size', 'size')
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.discountPercent > :discountPercent', {
        discountPercent: 0,
      });

    // Apply sorting
    switch (sort) {
      case 'discount_desc':
        queryBuilder.orderBy('product.discountPercent', 'DESC');
        break;
      case 'price_asc':
        queryBuilder.orderBy(
          'product.basePrice * (1 - product.discountPercent / 100)',
          'ASC',
        );
        break;
      case 'price_desc':
        queryBuilder.orderBy(
          'product.basePrice * (1 - product.discountPercent / 100)',
          'DESC',
        );
        break;
      case 'newest':
      default:
        queryBuilder.orderBy('product.createdAt', 'DESC');
        break;
    }

    // Add pagination
    const totalItems = await queryBuilder.getCount();
    const totalPages = Math.ceil(totalItems / limit);
    const offset = (page - 1) * limit;

    const products = await queryBuilder.skip(offset).take(limit).getMany();

    return {
      products,
      totalItems,
      currentPage: page,
      totalPages,
      itemsPerPage: limit,
    };
  }

  /**
   * Get sale statistics
   */
  async getSaleStatistics(): Promise<{
    totalSaleProducts: number;
    maxDiscountPercent: number;
    averageDiscountPercent: number;
    totalDiscountValue: number;
  }> {
    const stats = (await this.productRepository
      .createQueryBuilder('product')
      .select([
        'COUNT(product.id) as totalSaleProducts',
        'MAX(product.discountPercent) as maxDiscountPercent',
        'AVG(product.discountPercent) as averageDiscountPercent',
        'SUM(product.basePrice * product.discountPercent / 100) as totalDiscountValue',
      ])
      .where('product.isActive = :isActive', { isActive: true })
      .andWhere('product.discountPercent > :discountPercent', {
        discountPercent: 0,
      })
      .getRawOne()) as {
      totalSaleProducts: string | null;
      maxDiscountPercent: string | null;
      averageDiscountPercent: string | null;
      totalDiscountValue: string | null;
    } | null;
    return {
      totalSaleProducts: parseInt(stats?.totalSaleProducts || '0', 10),
      maxDiscountPercent: parseFloat(stats?.maxDiscountPercent || '0'),
      averageDiscountPercent: parseFloat(stats?.averageDiscountPercent || '0'),
      totalDiscountValue: parseFloat(stats?.totalDiscountValue || '0'),
    };
  }
}
