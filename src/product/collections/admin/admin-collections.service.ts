import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { In, Repository } from 'typeorm';
import { Collection } from '../entities/collection.entity';
import { Product } from 'src/product/products/entities/product.entity';
import { CloudinaryService } from 'src/common/services/cloudinary/cloudinary.service';
import { CollectionsService } from '../collections.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  CollectionQueryDto,
  AssignProductsDto,
} from '../dto';
import { ImageService } from 'src/media/images/images.service';
@Injectable()
export class AdminCollectionsService {
  constructor(
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    private readonly cloudinaryService: CloudinaryService,
    private readonly collectionsService: CollectionsService,
    private readonly imageService: ImageService,
  ) {}
  /**
   * Get all collections with pagination and filtering (Admin)
   */
  async findAll(queryDto: CollectionQueryDto = {}): Promise<{
    collections: Collection[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    // Use shared method from collections service (no forced isActive filter for admin)
    return await this.collectionsService.findAllWithQuery(queryDto);
  }

  /**
   * Find collection by ID (Admin)
   */
  async findOne(id: string): Promise<Collection> {
    const collection = await this.collectionRepository.findOne({
      where: { id },
      relations: ['products'],
    });
    if (!collection) {
      throw new NotFoundException(`Collection with ID ${id} not found`);
    }
    return collection;
  }

  /**
   * Create new collection (Admin)
   */
  async create(createCollectionDto: CreateCollectionDto): Promise<Collection> {
    // Extract images from DTO to handle separately
    const { images, ...collectionData } = createCollectionDto;

    const collection = this.collectionRepository.create(collectionData);

    if (images && images.length > 0) {
      const uploadedImages = await this.imageService.createMultiple(
        images,
        collection.name,
      );
      collection.images = uploadedImages;
    }

    return await this.collectionRepository.save(collection);
  }
  /**
   * Update collection (Admin)
   */
  async update(
    id: string,
    updateCollectionDto: UpdateCollectionDto,
  ): Promise<Collection> {
    const collection = await this.findOne(id);

    // Extract images from DTO to handle separately
    const { images, ...updateData } = updateCollectionDto;

    this.collectionRepository.merge(collection, updateData);

    // Handle images if provided
    if (images && images.length > 0) {
      const uploadedImages = await this.imageService.createMultiple(
        images,
        collection.name,
      );
      collection.images = uploadedImages;
    }

    return this.collectionRepository.save(collection);
  }

  async replaceProducts(
    collectionId: string,
    assignProductsDto: AssignProductsDto,
  ): Promise<Collection> {
    const collection = await this.findOne(collectionId);

    // Verify all products exist
    const products = await this.productRepository.find({
      where: { id: In(assignProductsDto.productIds) },
    });

    if (products.length !== assignProductsDto.productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = assignProductsDto.productIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new NotFoundException(
        `Products with IDs [${missingIds.join(', ')}] not found`,
      );
    }

    // Replace products
    collection.products = products;
    return this.collectionRepository.save(collection);
  }

  /**
   * Add products to collection (Admin)
   */
  async addProducts(
    collectionId: string,
    assignProductsDto: AssignProductsDto,
  ): Promise<Collection> {
    const collection = await this.findOne(collectionId);

    // Verify all products exist
    const products = await this.productRepository.find({
      where: { id: In(assignProductsDto.productIds) },
    });

    if (products.length !== assignProductsDto.productIds.length) {
      const foundIds = products.map((p) => p.id);
      const missingIds = assignProductsDto.productIds.filter(
        (id) => !foundIds.includes(id),
      );
      throw new NotFoundException(
        `Products with IDs [${missingIds.join(', ')}] not found`,
      );
    }

    // Add only new products (avoid duplicates)
    const currentProductIds = collection.products.map((p) => p.id);
    const newProducts = products.filter(
      (p) => !currentProductIds.includes(p.id),
    );

    collection.products.push(...newProducts);
    return this.collectionRepository.save(collection);
  }

  /**
   * Remove specific product from collection (Admin)
   */
  async removeProduct(
    collectionId: string,
    productId: string,
  ): Promise<Collection> {
    const collection = await this.findOne(collectionId);

    // Check if product exists in collection
    const productIndex = collection.products.findIndex(
      (p) => p.id === productId,
    );
    if (productIndex === -1) {
      throw new BadRequestException(
        `Product with ID ${productId} is not in this collection`,
      );
    }

    // Remove product
    collection.products.splice(productIndex, 1);
    return this.collectionRepository.save(collection);
  }

  /**
   * Soft delete collection (Admin)
   */
  async remove(id: string): Promise<void> {
    await this.collectionRepository.softDelete(id);
  }
}
