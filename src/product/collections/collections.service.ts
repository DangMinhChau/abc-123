import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Collection } from './entities/collection.entity';
import { Product } from '../products/entities/product.entity';
import { CollectionQueryDto } from './dto';

@Injectable()
export class CollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
  ) {}

  /**
   * Get all active collections for public consumption with pagination and filtering
   */
  async findAll(queryDto: CollectionQueryDto = {}): Promise<{
    collections: Collection[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    // Force isActive = true for public API
    const modifiedQuery = { ...queryDto, isActive: true };
    return this.findAllWithQuery(modifiedQuery);
  }

  /**
   * Shared method for finding collections with query (can be used by admin service too)
   */
  async findAllWithQuery(queryDto: CollectionQueryDto = {}): Promise<{
    collections: Collection[];
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
      year,
      season,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder =
      this.collectionRepository.createQueryBuilder('collection');

    // Apply active filter if provided
    if (isActive !== undefined) {
      queryBuilder.andWhere('collection.isActive = :isActive', { isActive });
    }

    // Apply search if provided
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(collection.name) LIKE :search OR LOWER(collection.description) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // Apply year filter if provided
    if (year !== undefined) {
      queryBuilder.andWhere('collection.year = :year', { year });
    }

    // Apply season filter if provided
    if (season) {
      queryBuilder.andWhere('LOWER(collection.season) LIKE :season', {
        season: `%${season.toLowerCase()}%`,
      });
    }

    // Apply sorting
    const validSortFields = [
      'name',
      'year',
      'season',
      'createdAt',
      'updatedAt',
    ];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'createdAt';
    queryBuilder.orderBy(`collection.${sortField}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [collections, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      collections,
      page,
      limit,
      total,
      totalPages,
    };
  }

  /**
   * Find collection by slug for public consumption
   */
  async findBySlug(slug: string): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { slug, isActive: true },
      relations: ['products'],
    });
    if (!collection) {
      throw new NotFoundException(`Collection with slug ${slug} not found`);
    }
    return collection;
  }

  /**
   * Get products by collection slug with pagination and filtering
   */
  async getProductsBySlug(
    slug: string,
    page: number = 1,
    limit: number = 12,
    sortBy: string = 'name',
    sortOrder: 'ASC' | 'DESC' = 'ASC',
  ): Promise<{
    data: Product[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    // First verify that the collection exists and is active
    const collection = await this.collectionRepository.findOne({
      where: { slug, isActive: true },
      select: ['id'],
    });

    if (!collection) {
      throw new NotFoundException(`Collection with slug ${slug} not found`);
    }

    // Build query for products in this collection
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .innerJoin('product.collections', 'collection')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.color', 'color')
      .leftJoinAndSelect('variants.size', 'size')
      .where('collection.id = :collectionId', { collectionId: collection.id })
      .andWhere('product.isActive = :isActive', { isActive: true });

    // Apply sorting
    const validSortFields = ['name', 'basePrice', 'createdAt'];
    const sortField = validSortFields.includes(sortBy) ? sortBy : 'name';
    queryBuilder.orderBy(`product.${sortField}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [products, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      data: products,
      page,
      limit,
      total,
      totalPages,
    };
  }
}
