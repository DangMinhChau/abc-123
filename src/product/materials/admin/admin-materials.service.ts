import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Material } from '../entities/material.entity';
import { CreateMaterialDto, UpdateMaterialDto, MaterialQueryDto } from '../dto';

@Injectable()
export class AdminMaterialsService {
  constructor(
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
  ) {}

  /**
   * Get all materials with filters (Admin)
   */
  async findAll(queryDto: MaterialQueryDto): Promise<{
    materials: Material[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    const queryBuilder = this.materialRepository.createQueryBuilder('material');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere(
        '(material.name LIKE :search OR material.description LIKE :search)',
        { search: `%${search}%` },
      );
    }

    // Apply active status filter
    if (isActive !== undefined) {
      queryBuilder.andWhere('material.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`material.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [materials, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      materials,
      total,
      page,
      limit,
      totalPages,
    };
  }

  /**
   * Get material by ID (Admin)
   */
  async findOne(id: string): Promise<Material> {
    const material = await this.materialRepository.findOne({
      where: { id },
    });

    if (!material) {
      throw new NotFoundException(`Material with id ${id} not found`);
    }

    return material;
  }

  /**
   * Create new material (Admin)
   */
  async create(createMaterialDto: CreateMaterialDto): Promise<Material> {
    const material = this.materialRepository.create(createMaterialDto);
    return this.materialRepository.save(material);
  }

  /**
   * Update material (Admin)
   */
  async update(
    id: string,
    updateMaterialDto: UpdateMaterialDto,
  ): Promise<Material> {
    const material = await this.findOne(id);

    Object.assign(material, updateMaterialDto);

    return this.materialRepository.save(material);
  }

  /**
   * Toggle active status (Admin)
   */
  async toggleActive(id: string): Promise<Material> {
    const material = await this.findOne(id);
    material.isActive = !material.isActive;
    return this.materialRepository.save(material);
  }

  /**
   * Soft delete material (Admin)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify material exists
    await this.materialRepository.softDelete(id);
  }
}
