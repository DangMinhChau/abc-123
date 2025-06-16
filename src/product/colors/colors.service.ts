import { Injectable, NotFoundException } from '@nestjs/common';
import { Repository, IsNull } from 'typeorm';
import { InjectRepository } from '@nestjs/typeorm';
import { Color } from 'src/product/colors/entities/color.entity';

@Injectable()
export class ColorsService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  /**
   * Get all active colors (Public)
   */
  async findActive(): Promise<Color[]> {
    return this.colorRepository.find({
      where: { isActive: true, deletedAt: IsNull() },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get color by code (Public)
   */
  async findByCode(code: string): Promise<Color> {
    const color = await this.colorRepository.findOne({
      where: { code: code.toUpperCase(), isActive: true, deletedAt: IsNull() },
    });
    if (!color) {
      throw new NotFoundException(`Color with code ${code} not found`);
    }
    return color;
  }
}
