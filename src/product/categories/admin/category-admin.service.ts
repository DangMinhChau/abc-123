import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Category } from '../entities/category.entity';
import { Product } from '../../products/entities/product.entity';
import { CreateCategoryDto } from '../dto/requests/create-category.dto';
import { UpdateCategoryDto } from '../dto/requests/update-category.dto';
import { CategoryQueryDto } from '../dto/requests/category-query.dto';

@Injectable()
export class CategoryAdminService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get all categories with pagination (including inactive) - Admin only
   */
  async findAll(queryDto: CategoryQueryDto = {}): Promise<{
    categories: Category[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .leftJoinAndSelect('category.children', 'children');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(category.name) LIKE :search OR LOWER(category.description) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // Apply active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('category.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`category.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [categories, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      categories,
      page,
      limit,
      total,
      totalPages,
    };
  }

  /**
   * Find category by ID (for admin operations)
   */
  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id },
      relations: ['parent', 'children', 'sizes'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${id}' not found`);
    }

    return category;
  }

  /**
   * Create new category - Admin only
   */
  async create(createCategoryDto: CreateCategoryDto): Promise<Category> {
    const category = this.categoryRepository.create(createCategoryDto);

    if (createCategoryDto.parentId) {
      const parent = await this.findById(createCategoryDto.parentId);
      category.parent = parent;
    }

    return this.categoryRepository.save(category);
  }

  /**
   * Update category - Admin only
   */
  async update(
    id: string,
    updateCategoryDto: UpdateCategoryDto,
  ): Promise<Category> {
    const category = await this.findById(id);

    // Check if trying to set parent to itself or a descendant
    if (updateCategoryDto.parentId) {
      if (updateCategoryDto.parentId === id) {
        throw new BadRequestException('Category cannot be its own parent');
      }

      const isDescendant = await this.isAncestorOf(
        id,
        updateCategoryDto.parentId,
      );
      if (isDescendant) {
        throw new BadRequestException(
          'Cannot set a descendant category as parent',
        );
      }

      const parent = await this.findById(updateCategoryDto.parentId);
      category.parent = parent;
    }

    this.categoryRepository.merge(category, updateCategoryDto);
    return this.categoryRepository.save(category);
  }

  /**
   * Soft delete category - Admin only
   */
  async remove(id: string): Promise<void> {
    const category = await this.findById(id);

    if (category.children?.length) {
      throw new BadRequestException('Cannot delete category with children');
    }

    await this.categoryRepository.softRemove(category);
  }

  /**
   * Get children categories by parent ID - Admin only
   */
  async getChildrenById(id: string): Promise<Category[]> {
    const category = await this.findById(id);
    return category.children || [];
  }

  /**
   * Get parent category by child ID - Admin only
   */
  async getParentById(id: string): Promise<Category | null> {
    const category = await this.findById(id);
    return category.parent || null;
  }
  /**
   * Get all products for a category - Admin only (placeholder)
   */
  async getProductsById(
    id: string,
    page: number = 1,
    limit: number = 10,
  ): Promise<any[]> {
    // Validate category exists
    await this.findById(id);

    try {
      // Get products that belong to this category or its subcategories
      const qb = this.productRepository
        .createQueryBuilder('product')
        .leftJoinAndSelect('product.category', 'category')
        .leftJoinAndSelect('product.image', 'image')
        .leftJoinAndSelect('product.variants', 'variants')
        .where('category.id = :id', { id })
        .orWhere('category.parentId = :id', { id })
        .orderBy('product.createdAt', 'DESC')
        .skip((page - 1) * limit)
        .take(limit);

      const products = await qb.getMany();

      // Transform products to include necessary fields
      return products.map((product) => ({
        id: product.id,
        name: product.name,
        slug: product.slug,
        basePrice: product.basePrice,
        discountPercent: product.discountPercent,
        actualPrice: product.calculateActualPrice(),
        isActive: product.isActive,
        stockQuantity:
          product.variants?.reduce(
            (sum, variant) => sum + (variant.stockQuantity || 0),
            0,
          ) || 0,
        image: product.image
          ? {
              id: product.image.id,
              imageUrl: product.image.imageUrl,
              altText: product.image.altText,
            }
          : null,
        category: {
          id: product.category?.id,
          name: product.category?.name,
        },
        averageRating: product.averageRating,
        totalReviews: product.totalReviews,
        createdAt: product.createdAt,
        updatedAt: product.updatedAt,
      }));
    } catch (error) {
      console.error(`Error fetching products for category ${id}:`, error);
      return [];
    }
  }

  /**
   * Find categories by parent ID
   */
  async findByParentId(parentId: string): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { parent: { id: parentId } },
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Find categories that have children (parent categories)
   */
  async findParentCategories(): Promise<Category[]> {
    return this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.children', 'children')
      .where('children.id IS NOT NULL')
      .getMany();
  }

  /**
   * Count products in a category
   */
  async getProductCount(categoryId: string): Promise<number> {
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
      relations: ['products'],
    });

    if (!category) {
      throw new NotFoundException(`Category with ID '${categoryId}' not found`);
    }

    return category.products?.length || 0;
  }

  /**
   * Check if a category is ancestor of another category
   */
  async isAncestorOf(
    ancestorId: string,
    descendantId: string,
  ): Promise<boolean> {
    const breadcrumb = await this.getBreadcrumbPath(descendantId);
    return breadcrumb.some((category) => category.id === ancestorId);
  }

  /**
   * Get breadcrumb path from child category to root
   */
  private async getBreadcrumbPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentCategory: Category | null = await this.findById(categoryId);

    while (currentCategory) {
      path.unshift(currentCategory);

      if (currentCategory.parent) {
        currentCategory = await this.categoryRepository.findOne({
          where: { id: currentCategory.parent.id },
          relations: ['parent'],
        });
      } else {
        currentCategory = null;
      }
    }

    return path;
  }
}
