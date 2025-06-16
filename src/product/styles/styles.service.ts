import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Style } from './entities/style.entity';

@Injectable()
export class StylesService {
  constructor(
    @InjectRepository(Style)
    private readonly styleRepository: Repository<Style>,
  ) {}

  /**
   * Get all active styles for public consumption
   */
  async findActive(): Promise<Style[]> {
    return this.styleRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Find style by slug for public consumption
   */
  async findBySlug(slug: string): Promise<Style> {
    const style = await this.styleRepository.findOne({
      where: { slug, isActive: true },
    });
    if (!style) {
      throw new NotFoundException(`Style with slug ${slug} not found`);
    }
    return style;
  }
}
