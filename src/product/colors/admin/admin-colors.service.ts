import { Injectable, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { Color } from '../entities/color.entity';
import { CreateColorDto } from '../dto/create-color.dto';
import { UpdateColorDto, ColorQueryDto } from 'src/product/colors/dto';
@Injectable()
export class AdminColorsService {
  constructor(
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
  ) {}

  /**
   * Get all colors with filters (Admin)
   */ async findAll(queryDto: ColorQueryDto = {}): Promise<{
    colors: Color[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    console.log('AdminColorsService.findAll called with:', queryDto);

    const {
      page = 1,
      limit = 20,
      search,
      isActive,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;

    console.log('Query parameters:', {
      page,
      limit,
      search,
      isActive,
      sortBy,
      sortOrder,
    });
    const queryBuilder = this.colorRepository.createQueryBuilder('color');

    // Apply search filter
    if (search) {
      queryBuilder.where(
        '(LOWER(color.name) LIKE :search OR LOWER(color.code) LIKE :search)',
        { search: `%${search.toLowerCase()}%` },
      );
    }

    // Apply active filter
    if (isActive !== undefined) {
      const method = search ? 'andWhere' : 'where';
      queryBuilder[method]('color.isActive = :isActive', { isActive });
    }

    // Apply sorting
    queryBuilder.orderBy(`color.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);
    const [colors, total] = await queryBuilder.getManyAndCount();
    console.log('Query result:', { colorsCount: colors.length, total });
    console.log('Colors found:', colors);

    const totalPages = Math.ceil(total / limit);

    return {
      colors,
      page,
      limit,
      total,
      totalPages,
    };
  }
  /**
   * Get color by ID (Admin)
   */
  async findOne(id: string): Promise<Color> {
    const color = await this.colorRepository.findOne({
      where: { id },
    });

    if (!color) {
      throw new NotFoundException(`Color with ID ${id} not found`);
    }

    return color;
  }

  /**
   * Create new color (Admin)
   */
  async create(createColorDto: CreateColorDto): Promise<Color> {
    const color = this.colorRepository.create({
      ...createColorDto,
      code: createColorDto.code.toUpperCase(),
    });

    return this.colorRepository.save(color);
  }

  /**
   * Update color (Admin)
   */
  async update(id: string, updateColorDto: UpdateColorDto): Promise<Color> {
    const color = await this.findOne(id);

    // Update the color with new data
    Object.assign(color, {
      ...updateColorDto,
      ...(updateColorDto.code && { code: updateColorDto.code.toUpperCase() }),
    });

    return this.colorRepository.save(color);
  }

  /**
   * Soft delete color (Admin)
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify color exists
    await this.colorRepository.softDelete(id);
  }
}
