import { Injectable, NotFoundException } from '@nestjs/common';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantQueryDto,
  UpdateStockDto,
} from './dto';
import { Repository, IsNull } from 'typeorm';
import { ProductVariant } from 'src/product/variants/entities/variant.entity';
import { Product } from 'src/product/products/entities/product.entity';
import { Color } from 'src/product/colors/entities/color.entity';
import { Size } from 'src/product/sizes/entities/size.entity';

import { InjectRepository } from '@nestjs/typeorm';
import { Image } from 'src/media/images/entities/image.entity';
import { ImageService } from 'src/media/images/images.service';

@Injectable()
export class VariantsService {
  constructor(
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Color)
    private readonly colorRepository: Repository<Color>,
    @InjectRepository(Size)
    private readonly sizeRepository: Repository<Size>,
    @InjectRepository(Image)
    private readonly imageRepository: Repository<Image>,
    private readonly imageService: ImageService,
  ) {}

  async findAll(queryDto: VariantQueryDto = {}): Promise<{
    variants: ProductVariant[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const {
      page = 1,
      limit = 10,
      search,
      productId,
      colorId,
      sizeId,
      isActive,
      minPrice,
      maxPrice,
      minStock,
      sortBy = 'createdAt',
      sortOrder = 'DESC',
    } = queryDto;
    const queryBuilder = this.variantRepository
      .createQueryBuilder('variant')
      .leftJoinAndSelect('variant.product', 'product')
      .leftJoinAndSelect('variant.color', 'color')
      .leftJoinAndSelect('variant.size', 'size')
      .leftJoinAndSelect('variant.images', 'images')
      .where('variant.deletedAt IS NULL');

    // Apply search filter
    if (search) {
      queryBuilder.andWhere('LOWER(variant.sku) LIKE :search', {
        search: `%${search.toLowerCase()}%`,
      });
    }

    // Apply filters
    if (productId) {
      queryBuilder.andWhere('variant.product.id = :productId', { productId });
    }

    if (colorId) {
      queryBuilder.andWhere('variant.color.id = :colorId', { colorId });
    }

    if (sizeId) {
      queryBuilder.andWhere('variant.size.id = :sizeId', { sizeId });
    }

    if (isActive !== undefined) {
      queryBuilder.andWhere('variant.isActive = :isActive', { isActive });
    }
    if (minPrice !== undefined) {
      queryBuilder.andWhere('product.basePrice >= :minPrice', { minPrice });
    }

    if (maxPrice !== undefined) {
      queryBuilder.andWhere('product.basePrice <= :maxPrice', { maxPrice });
    }

    if (minStock !== undefined) {
      queryBuilder.andWhere('variant.stockQuantity >= :minStock', { minStock });
    }

    // Apply sorting
    queryBuilder.orderBy(`variant.${sortBy}`, sortOrder);

    // Apply pagination
    const skip = (page - 1) * limit;
    queryBuilder.skip(skip).take(limit);

    const [variants, total] = await queryBuilder.getManyAndCount();
    const totalPages = Math.ceil(total / limit);

    return {
      variants,
      page,
      limit,
      total,
      totalPages,
    };
  }
  async findActive(): Promise<ProductVariant[]> {
    return this.variantRepository.find({
      where: { isActive: true, deletedAt: IsNull() },
      relations: ['product', 'color', 'size', 'images'],
      order: { sku: 'ASC' },
    });
  }
  async findOne(id: string): Promise<ProductVariant> {
    const variant = await this.variantRepository.findOne({
      where: { id, deletedAt: IsNull() },
      relations: ['product', 'color', 'size', 'images'],
    });
    if (!variant) {
      throw new NotFoundException(`Variant with id ${id} not found`);
    }
    return variant;
  }
  async create(createVariantDto: CreateVariantDto) {
    const { productId, colorId, sizeId, images, ...rest } = createVariantDto;
    const [product, color, size] = await Promise.all([
      this.productRepository.findOne({ where: { id: productId } }),
      this.colorRepository.findOne({ where: { id: colorId } }),
      this.sizeRepository.findOne({ where: { id: sizeId } }),
    ]);
    if (!product) throw new NotFoundException('Product not found');
    if (!color) throw new NotFoundException('Color not found');
    if (!size) throw new NotFoundException('Size not found');

    const sku = this.generateSku(product.baseSku, color.code, size.name);

    const variant = this.variantRepository.create({
      ...rest,
      product,
      color,
      size,
      sku,
    });

    // Save the variant first
    const savedVariant = await this.variantRepository.save(variant);

    // Handle images separately after variant is saved
    if (images && images.length > 0) {
      // Create image entities and associate them with the variant
      const altText = product.name + ' - ' + color.name + ' - ' + size.name;
      const imageEntities = await this.imageService.createMultiple(
        images,
        altText,
      );

      // Update each image to reference this variant
      for (const imageEntity of imageEntities) {
        imageEntity.variant = savedVariant;
      }

      // Save the updated images
      await this.imageRepository.save(imageEntities);

      // Update the variant with the images
      savedVariant.images = imageEntities;
    }

    return savedVariant;
  }

  async update(
    id: string,
    updateVariantDto: UpdateVariantDto,
  ): Promise<ProductVariant> {
    const variant = await this.findOne(id);

    // Update basic fields
    Object.assign(variant, updateVariantDto);

    // Update relationships if provided
    if (updateVariantDto.colorId) {
      const color = await this.colorRepository.findOne({
        where: { id: updateVariantDto.colorId },
      });
      if (!color) throw new NotFoundException('Color not found');
      variant.color = color;
    }

    if (updateVariantDto.sizeId) {
      const size = await this.sizeRepository.findOne({
        where: { id: updateVariantDto.sizeId },
      });
      if (!size) throw new NotFoundException('Size not found');
      variant.size = size;
    }

    // Regenerate SKU if color or size changed
    if (updateVariantDto.colorId || updateVariantDto.sizeId) {
      variant.sku = this.generateSku(
        variant.product.baseSku,
        variant.color.code,
        variant.size.name,
      );
    }

    return this.variantRepository.save(variant);
  }

  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify variant exists
    await this.variantRepository.softDelete(id);
  }

  async updateStock(
    id: string,
    updateStockDto: UpdateStockDto,
  ): Promise<ProductVariant> {
    const variant = await this.findOne(id);
    variant.stockQuantity = updateStockDto.stockQuantity;
    return this.variantRepository.save(variant);
  }

  private generateSku(
    baseSKU: string,
    color_code: string,
    size_code: string,
  ): string {
    return `${baseSKU}-${color_code}-${size_code}`;
  }
}
