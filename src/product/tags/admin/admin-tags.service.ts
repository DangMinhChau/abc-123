import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from '../entities/tag.entity';
import { CreateTagDto, UpdateTagDto, TagQueryDto } from '../dto';

@Injectable()
export class AdminTagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Get all tags with pagination and filtering (Admin)
   */
  async findAll(queryDto: TagQueryDto = {}): Promise<{
    tags: Tag[];
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

    const queryBuilder = this.tagRepository.createQueryBuilder('tag');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere('LOWER(tag.name) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    // Apply active filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('tag.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`tag.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [tags, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      tags,
      page,
      limit,
      total,
      totalPages,
    };
  }

  /**
   * Find tag by ID (Admin)
   */
  async findOne(id: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { id },
    });
    if (!tag) {
      throw new NotFoundException(`Tag with ID ${id} not found`);
    }
    return tag;
  }

  /**
   * Create new tag (Admin)
   */
  async create(createTagDto: CreateTagDto): Promise<Tag> {
    const tag = this.tagRepository.create(createTagDto);
    return this.tagRepository.save(tag);
  }

  /**
   * Update tag (Admin)
   */
  async update(id: string, updateTagDto: UpdateTagDto): Promise<Tag> {
    const tag = await this.findOne(id);
    this.tagRepository.merge(tag, updateTagDto);
    return this.tagRepository.save(tag);
  }

  /**
   * Toggle active status (Admin)
   */
  async toggleActive(id: string): Promise<Tag> {
    const tag = await this.findOne(id);
    tag.isActive = !tag.isActive;
    return this.tagRepository.save(tag);
  }

  /**
   * Soft delete tag (Admin)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify tag exists
    await this.tagRepository.softDelete(id);
  }
}
