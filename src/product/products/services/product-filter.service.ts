import { Injectable } from '@nestjs/common';
import { Repository, SelectQueryBuilder } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Product } from '../entities/product.entity';
import { ProductVariant } from '../../variants/entities/variant.entity';
import { Category } from '../../categories/entities/category.entity';
import { Color } from '../../colors/entities/color.entity';
import { Size } from '../../sizes/entities/size.entity';
import { Material } from '../../materials/entities/material.entity';
import { Collection } from '../../collections/entities/collection.entity';
import { Style } from '../../styles/entities/style.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { ProductFilterDto, SortBy } from '../dto';
import {
  FilterResponse,
  FilterColorItem,
  FilterSizeItem,
  FilterSlugItem,
  PriceRangeResponse,
} from '../dto/responses/filter-response.dto';

@Injectable()
export class ProductFilterService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(Style)
    private readonly styleRepository: Repository<Style>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Helper function to normalize filter values to arrays
   */
  private normalizeToArray(value: string | string[] | undefined): string[] {
    if (!value) return [];
    return Array.isArray(value) ? value : [value];
  }

  /**
   * Create base query with common joins and filters
   */
  private createBaseQuery(
    filters: ProductFilterDto,
  ): SelectQueryBuilder<Product> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.image', 'image')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.images', 'variantImages')
      .leftJoinAndSelect('variants.color', 'variantColor')
      .leftJoinAndSelect('variants.size', 'variantSize')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.materials', 'materials')
      .leftJoinAndSelect('product.collections', 'collections')
      .leftJoinAndSelect('product.styles', 'styles')
      .leftJoinAndSelect('product.tags', 'tags')
      .where('product.isActive = :isActive', { isActive: true });

    // Apply filters
    this.applyFilters(queryBuilder, filters);

    return queryBuilder;
  }

  /**
   * Apply all filters to the query
   */
  private applyFilters(
    queryBuilder: SelectQueryBuilder<Product>,
    filters: ProductFilterDto,
  ): void {
    // Category filter
    if (filters.category) {
      queryBuilder.andWhere('category.slug = :categorySlug', {
        categorySlug: filters.category,
      });
    }

    // Color filter
    if (filters.color && filters.color.length > 0) {
      const colorCodes = this.normalizeToArray(filters.color);
      queryBuilder.andWhere('variantColor.code IN (:...colorCodes)', {
        colorCodes,
      });
    }

    // Size filter
    if (filters.size && filters.size.length > 0) {
      const sizeNames = this.normalizeToArray(filters.size);
      queryBuilder.andWhere('variantSize.name IN (:...sizeNames)', {
        sizeNames,
      });
    }

    // Material filter
    if (filters.material && filters.material.length > 0) {
      const materialSlugs = this.normalizeToArray(filters.material);
      queryBuilder.andWhere('materials.slug IN (:...materialSlugs)', {
        materialSlugs,
      });
    }

    // Collection filter
    if (filters.collection && filters.collection.length > 0) {
      const collectionSlugs = this.normalizeToArray(filters.collection);
      queryBuilder.andWhere('collections.slug IN (:...collectionSlugs)', {
        collectionSlugs,
      });
    }

    // Style filter
    if (filters.style && filters.style.length > 0) {
      const styleSlugs = this.normalizeToArray(filters.style);
      queryBuilder.andWhere('styles.slug IN (:...styleSlugs)', { styleSlugs });
    }

    // Tag filter
    if (filters.tag && filters.tag.length > 0) {
      const tagSlugs = this.normalizeToArray(filters.tag);
      queryBuilder.andWhere('tags.slug IN (:...tagSlugs)', { tagSlugs });
    } // Price range filter - tính giá thực tế từ basePrice và discountPercent
    if (filters.priceMin !== undefined || filters.priceMax !== undefined) {
      if (filters.priceMin !== undefined) {
        queryBuilder.andWhere(
          'product.basePrice * (1 - IFNULL(product.discountPercent, 0) / 100) >= :priceMin',
          {
            priceMin: filters.priceMin,
          },
        );
      }
      if (filters.priceMax !== undefined) {
        queryBuilder.andWhere(
          'product.basePrice * (1 - IFNULL(product.discountPercent, 0) / 100) <= :priceMax',
          {
            priceMax: filters.priceMax,
          },
        );
      }
    } // Search filter (enhanced to include variant SKU)
    if (filters.search) {
      queryBuilder.andWhere(
        '(product.name LIKE :search OR product.description LIKE :search OR product.baseSku LIKE :search OR variants.sku LIKE :search)',
        { search: `%${filters.search}%` },
      );
    } // In stock filter
    if (filters.inStock) {
      queryBuilder.andWhere('variants.stockQuantity > 0');
    }
  } /**
   * Apply sorting to the query
   */
  private applySorting(
    queryBuilder: SelectQueryBuilder<Product>,
    filters: ProductFilterDto,
  ): void {
    const { sortBy, sortOrder, sort } = filters;

    // Use new sortBy/sortOrder if provided, fallback to legacy sort enum
    if (sortBy && sortOrder) {
      switch (sortBy) {
        case 'basePrice':
          queryBuilder.orderBy('product.basePrice', sortOrder);
          break;
        case 'name':
          queryBuilder.orderBy('product.name', sortOrder);
          break;
        case 'createdAt':
        default:
          queryBuilder.orderBy('product.createdAt', sortOrder);
          break;
      }
    } else {
      // Legacy sorting with sort enum
      const legacySortBy = sort || SortBy.NEWEST;
      switch (legacySortBy) {
        case SortBy.PRICE_ASC:
          queryBuilder.orderBy(
            'product.basePrice * (1 - COALESCE(product.discountPercent, 0) / 100)',
            'ASC',
          );
          break;
        case SortBy.PRICE_DESC:
          queryBuilder.orderBy(
            'product.basePrice * (1 - COALESCE(product.discountPercent, 0) / 100)',
            'DESC',
          );
          break;
        case SortBy.NAME_ASC:
          queryBuilder.orderBy('product.name', 'ASC');
          break;
        case SortBy.NAME_DESC:
          queryBuilder.orderBy('product.name', 'DESC');
          break;
        case SortBy.NEWEST:
        default:
          queryBuilder.orderBy('product.createdAt', 'DESC');
          break;
      }
    }
  }
  /**
   * Get filtered products with pagination (optimized version)
   */
  async searchProductsOptimized(
    filters: ProductFilterDto,
    page: number = 1,
    limit: number = 10,
  ): Promise<Product[]> {
    const queryBuilder = this.createBaseQuery(filters);
    this.applySorting(queryBuilder, filters);

    const offset = (page - 1) * limit;
    queryBuilder.skip(offset).take(limit);

    return queryBuilder.getMany();
  }

  /**
   * Get total count of products matching filters
   */
  async getProductsCount(filters: ProductFilterDto): Promise<number> {
    const queryBuilder = this.createBaseQuery(filters);
    return queryBuilder.getCount();
  }
  /**
   * Get available colors for filtering (only from active products with active variants)
   */ async getAvailableColors(): Promise<FilterColorItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.variants',
        'variants',
        'variants.isActive = :variantActive',
        { variantActive: true },
      )
      .innerJoin('variants.color', 'color', 'color.isActive = :colorActive', {
        colorActive: true,
      })
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'color.code AS color_code',
        'color.name AS color_name',
        'color.hexCode AS color_hexCode',
        'COUNT(DISTINCT product.id) AS productCount',
      ])
      .groupBy('color.id, color.name, color.hexCode, color.code')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      code: result.color_code,
      name: result.color_name,
      hexCode: result.color_hexCode,
      productCount: parseInt(result.productCount, 10),
    }));
  } /**
   * Get available sizes for filtering (only from active products with active variants)
   */
  async getAvailableSizes(): Promise<FilterSizeItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.variants',
        'variants',
        'variants.isActive = :variantActive',
        { variantActive: true },
      )
      .innerJoin('variants.size', 'size', 'size.isActive = :sizeActive', {
        sizeActive: true,
      })
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'size.name AS size_name',
        'COUNT(DISTINCT product.id) AS productCount',
      ])
      .groupBy('size.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      name: result.size_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }
  /**
   * Get available materials for filtering (only from active products)
   */
  async getAvailableMaterials(): Promise<FilterSlugItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.materials',
        'material',
        'material.isActive = :materialActive',
        { materialActive: true },
      )
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'material.slug',
        'material.name',
        'COUNT(DISTINCT product.id) as productCount',
      ])
      .groupBy('material.slug, material.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      slug: result.material_slug,
      name: result.material_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get available collections for filtering (only from active products)
   */
  async getAvailableCollections(): Promise<FilterSlugItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.collections',
        'collection',
        'collection.isActive = :collectionActive',
        { collectionActive: true },
      )
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'collection.slug',
        'collection.name',
        'COUNT(DISTINCT product.id) as productCount',
      ])
      .groupBy('collection.slug, collection.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      slug: result.collection_slug,
      name: result.collection_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get available styles for filtering (only from active products)
   */
  async getAvailableStyles(): Promise<FilterSlugItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.styles', 'style', 'style.isActive = :styleActive', {
        styleActive: true,
      })
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'style.slug',
        'style.name',
        'COUNT(DISTINCT product.id) as productCount',
      ])
      .groupBy('style.slug, style.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      slug: result.style_slug,
      name: result.style_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get available tags for filtering (only from active products)
   */
  async getAvailableTags(): Promise<FilterSlugItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.tags', 'tag')
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'tag.slug',
        'tag.name',
        'COUNT(DISTINCT product.id) as productCount',
      ])
      .groupBy('tag.slug, tag.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      slug: result.tag_slug,
      name: result.tag_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }
  /**
   * Get available categories for filtering
   */ async getAvailableCategories(): Promise<FilterSlugItem[]> {
    const results = await this.categoryRepository
      .createQueryBuilder('category')
      .leftJoin(
        'category.products',
        'product',
        'product.isActive = :productActive',
        { productActive: true },
      )
      .where('category.isActive = :categoryActive', { categoryActive: true })
      .select([
        'category.slug AS category_slug',
        'category.name AS category_name',
        'COUNT(DISTINCT product.id) AS productCount',
      ])
      .groupBy('category.slug, category.name')
      .orderBy('category.name', 'ASC')
      .getRawMany();

    return results.map((result: any) => {
      console.log('🐛 Raw category result:', result);
      return {
        slug: result.category_slug,
        name: result.category_name,
        productCount: parseInt(result.productCount, 10) || 0,
      };
    });
  } /**
   * Get price range data (optimized for MySQL) - tính từ basePrice và discountPercent của Product
   */
  async getPriceRangeData(): Promise<PriceRangeResponse> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'MIN(product.basePrice * (1 - IFNULL(product.discountPercent, 0) / 100)) as minPrice',
        'MAX(product.basePrice * (1 - IFNULL(product.discountPercent, 0) / 100)) as maxPrice',
      ])
      .getRawOne();

    return {
      minPrice: parseFloat(result?.minPrice) || 0,
      maxPrice: parseFloat(result?.maxPrice) || 0,
    };
  } /**
   * Get all filter options available
   */
  async getFilterOptions(): Promise<FilterResponse> {
    const [
      categories,
      colors,
      sizes,
      materials,
      collections,
      styles,
      tags,
      priceRange,
    ] = await Promise.all([
      this.getAvailableCategories(),
      this.getAvailableColors(),
      this.getAvailableSizes(),
      this.getAvailableMaterials(),
      this.getAvailableCollections(),
      this.getAvailableStyles(),
      this.getAvailableTags(),
      this.getPriceRangeData(),
    ]);

    return {
      categories,
      colors,
      sizes,
      materials,
      collections,
      styles,
      tags,
      priceRange,
    };
  }
  /**
   * Get filter options available for a specific category
   */
  async getFilterOptionsByCategory(
    categorySlug: string,
  ): Promise<FilterResponse> {
    const [
      categories,
      colors,
      sizes,
      materials,
      collections,
      styles,
      tags,
      priceRange,
    ] = await Promise.all([
      this.getAvailableCategories(), // Keep all categories available even when filtering by one category
      this.getAvailableColorsByCategory(categorySlug),
      this.getAvailableSizesByCategory(categorySlug),
      this.getAvailableMaterialsByCategory(categorySlug),
      this.getAvailableCollectionsByCategory(categorySlug),
      this.getAvailableStylesByCategory(categorySlug),
      this.getAvailableTagsByCategory(categorySlug),
      this.getPriceRangeDataByCategory(categorySlug),
    ]);

    return {
      categories,
      colors,
      sizes,
      materials,
      collections,
      styles,
      tags,
      priceRange,
    };
  }

  /**
   * Get available colors for filtering by category
   */
  async getAvailableColorsByCategory(
    categorySlug: string,
  ): Promise<FilterColorItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.category',
        'category',
        'category.slug = :categorySlug',
        { categorySlug },
      )
      .innerJoin(
        'product.variants',
        'variants',
        'variants.isActive = :variantActive',
        { variantActive: true },
      )
      .innerJoin('variants.color', 'color', 'color.isActive = :colorActive', {
        colorActive: true,
      })
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'color.code AS color_code',
        'color.name AS color_name',
        'color.hexCode AS color_hexCode',
        'COUNT(DISTINCT product.id) AS productCount',
      ])
      .groupBy('color.id, color.name, color.hexCode, color.code')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      code: result.color_code,
      name: result.color_name,
      hexCode: result.color_hexCode,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get available sizes for filtering by category
   */
  async getAvailableSizesByCategory(
    categorySlug: string,
  ): Promise<FilterSizeItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.category',
        'category',
        'category.slug = :categorySlug',
        { categorySlug },
      )
      .innerJoin(
        'product.variants',
        'variants',
        'variants.isActive = :variantActive',
        { variantActive: true },
      )
      .innerJoin('variants.size', 'size', 'size.isActive = :sizeActive', {
        sizeActive: true,
      })
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'size.name AS size_name',
        'COUNT(DISTINCT product.id) AS productCount',
      ])
      .groupBy('size.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      name: result.size_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get available materials for filtering by category
   */
  async getAvailableMaterialsByCategory(
    categorySlug: string,
  ): Promise<FilterSlugItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.category',
        'category',
        'category.slug = :categorySlug',
        { categorySlug },
      )
      .innerJoin(
        'product.materials',
        'material',
        'material.isActive = :materialActive',
        { materialActive: true },
      )
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'material.slug',
        'material.name',
        'COUNT(DISTINCT product.id) as productCount',
      ])
      .groupBy('material.slug, material.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      slug: result.material_slug,
      name: result.material_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get available collections for filtering by category
   */
  async getAvailableCollectionsByCategory(
    categorySlug: string,
  ): Promise<FilterSlugItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.category',
        'category',
        'category.slug = :categorySlug',
        { categorySlug },
      )
      .innerJoin(
        'product.collections',
        'collection',
        'collection.isActive = :collectionActive',
        { collectionActive: true },
      )
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'collection.slug',
        'collection.name',
        'COUNT(DISTINCT product.id) as productCount',
      ])
      .groupBy('collection.slug, collection.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      slug: result.collection_slug,
      name: result.collection_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get available styles for filtering by category
   */
  async getAvailableStylesByCategory(
    categorySlug: string,
  ): Promise<FilterSlugItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.category',
        'category',
        'category.slug = :categorySlug',
        { categorySlug },
      )
      .innerJoin('product.styles', 'style', 'style.isActive = :styleActive', {
        styleActive: true,
      })
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'style.slug',
        'style.name',
        'COUNT(DISTINCT product.id) as productCount',
      ])
      .groupBy('style.slug, style.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      slug: result.style_slug,
      name: result.style_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get available tags for filtering by category
   */
  async getAvailableTagsByCategory(
    categorySlug: string,
  ): Promise<FilterSlugItem[]> {
    const results = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.category',
        'category',
        'category.slug = :categorySlug',
        { categorySlug },
      )
      .innerJoin('product.tags', 'tag')
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'tag.slug',
        'tag.name',
        'COUNT(DISTINCT product.id) as productCount',
      ])
      .groupBy('tag.slug, tag.name')
      .distinct(true)
      .getRawMany();

    return results.map((result: any) => ({
      slug: result.tag_slug,
      name: result.tag_name,
      productCount: parseInt(result.productCount, 10),
    }));
  }

  /**
   * Get price range data by category
   */
  async getPriceRangeDataByCategory(
    categorySlug: string,
  ): Promise<PriceRangeResponse> {
    const result = await this.productRepository
      .createQueryBuilder('product')
      .innerJoin(
        'product.category',
        'category',
        'category.slug = :categorySlug',
        { categorySlug },
      )
      .where('product.isActive = :productActive', { productActive: true })
      .select([
        'MIN(product.basePrice * (1 - IFNULL(product.discountPercent, 0) / 100)) as minPrice',
        'MAX(product.basePrice * (1 - IFNULL(product.discountPercent, 0) / 100)) as maxPrice',
      ])
      .getRawOne();

    return {
      minPrice: parseFloat(result?.minPrice) || 0,
      maxPrice: parseFloat(result?.maxPrice) || 0,
    };
  }
}
