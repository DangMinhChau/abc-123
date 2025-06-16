import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { DataSource, Repository } from 'typeorm';
import { Category } from 'src/product/categories/entities/category.entity';
@Injectable()
export class CategoryClientService {
  constructor(
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    private readonly dataSource: DataSource,
  ) {}

  /**
   * Get all active categories
   */
  async findActiveCategories(): Promise<Category[]> {
    return this.categoryRepository.find({
      where: { isActive: true },
      relations: ['parent', 'children'],
      order: { name: 'ASC' },
    });
  }
  /**
   * Get category by slug (for public access)
   */
  async findBySlug(slug: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { slug, isActive: true },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(`Category with slug '${slug}' not found`);
    }

    return category;
  }

  /**
   * Get category by ID (for public access - only active categories)
   */
  async findById(id: string): Promise<Category> {
    const category = await this.categoryRepository.findOne({
      where: { id, isActive: true },
      relations: ['parent', 'children'],
    });

    if (!category) {
      throw new NotFoundException(
        `Category with ID '${id}' not found or inactive`,
      );
    }

    return category;
  }

  /**
   * Get active children categories by parent slug
   */
  async findChildrenBySlug(
    slug: string,
    activeOnly: boolean = true,
  ): Promise<Category[]> {
    const parentCategory = await this.findBySlug(slug);

    let children = parentCategory.children || [];
    if (activeOnly) {
      children = children.filter((child) => child.isActive);
    }

    return children;
  }

  /**
   * Get category tree structure (only active categories for public)
   */
  async getCategoryTree(activeOnly: boolean = true): Promise<Category[]> {
    const tree = await this.dataSource.manager
      .getTreeRepository(Category)
      .findTrees();

    if (!activeOnly) {
      return tree;
    } // Filter only active categories recursively
    const filterActiveCategories = (categories: Category[]): Category[] => {
      return categories
        .filter((category) => category.isActive)
        .map((category) => {
          if (category.children) {
            category.children = filterActiveCategories(category.children);
          }
          return category;
        });
    };

    return filterActiveCategories(tree);
  }

  /**
   * Search active categories by name
   */
  async searchCategories(
    query: string,
    limit: number = 10,
  ): Promise<Category[]> {
    if (!query || query.trim().length === 0) {
      return [];
    }

    const queryBuilder = this.categoryRepository
      .createQueryBuilder('category')
      .leftJoinAndSelect('category.parent', 'parent')
      .where('category.isActive = :isActive', { isActive: true })
      .andWhere(
        '(LOWER(category.name) LIKE :search OR LOWER(category.description) LIKE :search)',
        { search: `%${query.toLowerCase()}%` },
      )
      .orderBy('category.name', 'ASC')
      .limit(limit);

    return queryBuilder.getMany();
  }

  /**
   * Get breadcrumb path for a category by slug
   */
  async getBreadcrumbBySlug(slug: string): Promise<Category[]> {
    const category = await this.findBySlug(slug);
    return this.getBreadcrumbPath(category.id);
  }

  /**
   * Get breadcrumb path from child category to root
   */
  async getBreadcrumbPath(categoryId: string): Promise<Category[]> {
    const path: Category[] = [];
    let currentCategory: Category | null =
      await this.categoryRepository.findOne({
        where: { id: categoryId },
        relations: ['parent'],
      });

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
