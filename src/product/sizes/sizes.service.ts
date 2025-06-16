import { Injectable } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Size } from './entities/size.entity';

@Injectable()
export class SizesService {
  constructor(
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
  ) {}

  /**
   * Get all active sizes (Public)
   */
  async findActive(): Promise<Size[]> {
    return this.sizeRepository.find({
      where: { isActive: true },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }

  /**
   * Get active sizes by category slug (Public)
   */
  async findActiveByCategorySlug(categorySlug: string): Promise<Size[]> {
    return this.sizeRepository.find({
      where: {
        category: { slug: categorySlug },
        isActive: true,
      },
      relations: ['category'],
      order: { name: 'ASC' },
    });
  }
}
