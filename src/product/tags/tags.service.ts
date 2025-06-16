import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Tag } from './entities/tag.entity';

@Injectable()
export class TagsService {
  constructor(
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
  ) {}

  /**
   * Get all active tags for public consumption
   */
  async findActive(): Promise<Tag[]> {
    return this.tagRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Find tag by slug for public consumption
   */
  async findBySlug(slug: string): Promise<Tag> {
    const tag = await this.tagRepository.findOne({
      where: { slug, isActive: true },
    });
    if (!tag) {
      throw new NotFoundException(`Tag with slug ${slug} not found`);
    }
    return tag;
  }
}
