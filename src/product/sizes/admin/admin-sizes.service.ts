import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Size } from '../entities/size.entity';
import { Category } from '../../categories/entities/category.entity';
import { CreateSizeDto, UpdateSizeDto, FilterSizeDto } from '../dto';

@Injectable()
export class AdminSizesService {
  constructor(
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
  ) {}

  /**
   * Get all sizes with filters (Admin)
   */
  async findAll(filterDto: FilterSizeDto): Promise<{
    sizes: Size[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      categoryId,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'ASC',
    } = filterDto;

    const queryBuilder = this.sizeRepository
      .createQueryBuilder('size')
      .leftJoinAndSelect('size.category', 'category');

    // Apply filters
    if (categoryId) {
      queryBuilder.andWhere('size.category.id = :categoryId', { categoryId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('size.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`size.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [sizes, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      sizes,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get all sizes by category ID (Admin)
   */
  async findAllByCategoryId(categoryId: string): Promise<Size[]> {
    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }

    return this.sizeRepository.find({
      where: { category: { id: categoryId } },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get size by ID (Admin)
   */
  async findOne(id: string): Promise<Size> {
    const size = await this.sizeRepository.findOne({
      where: { id },
      relations: ['category'],
    });

    if (!size) {
      throw new NotFoundException(`Size with id ${id} not found`);
    }

    return size;
  }

  /**
   * Create new size (Admin)
   */
  async create(createSizeDto: CreateSizeDto): Promise<Size> {
    const { categoryId, ...sizeData } = createSizeDto;

    // Verify category exists
    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });

    if (!category) {
      throw new NotFoundException(`Category with id ${categoryId} not found`);
    }

    const size = this.sizeRepository.create({
      ...sizeData,
      category,
    });

    return this.sizeRepository.save(size);
  }

  /**
   * Update size (Admin)
   */
  async update(id: string, updateSizeDto: UpdateSizeDto): Promise<Size> {
    const size = await this.findOne(id);
    const { categoryId, ...updateData } = updateSizeDto;

    // Update category if provided
    if (categoryId) {
      const category = await this.categoryRepository.findOne({
        where: { id: categoryId },
      });

      if (!category) {
        throw new NotFoundException(`Category with id ${categoryId} not found`);
      }

      size.category = category;
    }

    // Update other fields
    Object.assign(size, updateData);

    return this.sizeRepository.save(size);
  }

  /**
   * Toggle active status (Admin)
   */
  async toggleActive(id: string): Promise<Size> {
    const size = await this.findOne(id);
    size.isActive = !size.isActive;
    return this.sizeRepository.save(size);
  }

  /**
   * Soft delete size (Admin)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify size exists
    await this.sizeRepository.softDelete(id);
  }
}
