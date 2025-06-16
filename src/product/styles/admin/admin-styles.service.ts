import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Style } from '../entities/style.entity';
import { CreateStyleDto, UpdateStyleDto, StyleQueryDto } from '../dto';

@Injectable()
export class AdminStylesService {
  constructor(
    @InjectRepository(Style)
    private readonly styleRepository: Repository<Style>,
  ) {}

  /**
   * Get all styles with pagination and filtering (Admin)
   */
  async findAll(queryDto: StyleQueryDto = {}): Promise<{
    styles: Style[];
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
    const queryBuilder = this.styleRepository.createQueryBuilder('style');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(LOWER(style.name) LIKE :search OR LOWER(style.description) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // Apply active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('style.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`style.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [styles, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      styles,
      page,
      limit,
      total,
      totalPages,
    };
  }

  /**
   * Find style by ID (Admin)
   */
  async findOne(id: string): Promise<Style> {
    const style = await this.styleRepository.findOne({
      where: { id },
    });
    if (!style) {
      throw new NotFoundException(`Style with ID ${id} not found`);
    }
    return style;
  }

  /**
   * Create new style (Admin)
   */
  async create(createStyleDto: CreateStyleDto): Promise<Style> {
    const style = this.styleRepository.create(createStyleDto);
    return this.styleRepository.save(style);
  }

  /**
   * Update style (Admin)
   */
  async update(id: string, updateStyleDto: UpdateStyleDto): Promise<Style> {
    const style = await this.findOne(id);
    this.styleRepository.merge(style, updateStyleDto);
    return this.styleRepository.save(style);
  }

  /**
   * Toggle active status (Admin)
   */
  async toggleActive(id: string): Promise<Style> {
    const style = await this.findOne(id);
    style.isActive = !style.isActive;
    return this.styleRepository.save(style);
  }

  /**
   * Soft delete style (Admin)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify style exists
    await this.styleRepository.softDelete(id);
  }
}
