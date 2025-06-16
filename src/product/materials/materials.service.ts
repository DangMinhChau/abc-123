import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from './entities/material.entity';

@Injectable()
export class MaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  /**
   * Get all active materials (Public)
   */
  async findActive(): Promise<Material[]> {
    return this.materialRepository.find({
      where: { isActive: true },
      order: { name: 'ASC' },
    });
  }

  /**
   * Get material by slug (Public)
   */
  async findBySlug(slug: string): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { slug, isActive: true },
    });

    if (!material) {
      throw new NotFoundException(`Material with slug ${slug} not found`);
    }

    return material;
  }
}
