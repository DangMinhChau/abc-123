import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, In, DataSource } from 'typeorm';

import { Product } from '../entities/product.entity';
import { Material } from '../../materials/entities/material.entity';
import { Style } from '../../styles/entities/style.entity';
import { Tag } from '../../tags/entities/tag.entity';
import { Category } from '../../categories/entities/category.entity';
import { Collection } from '../../collections/entities/collection.entity';
import { ProductVariant } from '../../variants/entities/variant.entity';
import { CreateProductDto } from '../dto/requests/create-product.dto';
import { UpdateProductDto } from '../dto/requests/update-product.dto';
import { ProductQueryDto } from '../dto/requests/product-query.dto';
import { AssignVariantsDto } from '../dto/requests/assign-variants.dto';
import { ImageService } from 'src/media/images/images.service';
@Injectable()
export class AdminProductsService {
  constructor(
    @InjectRepository(Product)
    private readonly productRepository: Repository<Product>,
    @InjectRepository(Category)
    private readonly categoryRepository: Repository<Category>,
    @InjectRepository(Material)
    private readonly materialRepository: Repository<Material>,
    @InjectRepository(Style)
    private readonly styleRepository: Repository<Style>,
    @InjectRepository(Collection)
    private readonly collectionRepository: Repository<Collection>,
    @InjectRepository(Tag)
    private readonly tagRepository: Repository<Tag>,
    @InjectRepository(ProductVariant)
    private readonly variantRepository: Repository<ProductVariant>,
    private readonly imageService: ImageService,
    private readonly dataSource: DataSource,
  ) {}
  /**
   * Lấy tất cả sản phẩm (bao gồm cả inactive) - Admin only
   */
  async findAll(queryDto: ProductQueryDto): Promise<{
    products: Product[];
    page: number;
    limit: number;
    total: number;
    totalPages: number;
  }> {
    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.materials', 'materials')
      .leftJoinAndSelect('product.styles', 'styles')
      .leftJoinAndSelect('product.collections', 'collections')
      .leftJoinAndSelect('product.tags', 'tags')
      .leftJoinAndSelect('product.variants', 'variants')
      .leftJoinAndSelect('variants.color', 'color')
      .leftJoinAndSelect('variants.size', 'size')
      .leftJoinAndSelect('variants.images', 'variantImages')
      .leftJoinAndSelect('product.image', 'image');

    // Admin có thể filter theo isActive hoặc xem tất cả
    if (queryDto.isActive !== undefined) {
      queryBuilder.andWhere('product.isActive = :isActive', {
        isActive: queryDto.isActive,
      });
    } // Áp dụng các filter khác
    if (queryDto.categoryId) {
      queryBuilder.andWhere('category.id = :categoryId', {
        categoryId: queryDto.categoryId,
      });
    }

    if (queryDto.search) {
      queryBuilder.andWhere(
        '(product.name ILIKE :search OR product.description ILIKE :search OR product.baseSku ILIKE :search)',
        { search: `%${queryDto.search}%` },
      );
    }

    // Filter by colors
    if (queryDto.colorIds) {
      const colorIds = queryDto.colorIds.split(',').map((id) => id.trim());
      queryBuilder.andWhere('color.id IN (:...colorIds)', { colorIds });
    }

    // Filter by sizes
    if (queryDto.sizeIds) {
      const sizeIds = queryDto.sizeIds.split(',').map((id) => id.trim());
      queryBuilder.andWhere('size.id IN (:...sizeIds)', { sizeIds });
    }

    // Filter by materials
    if (queryDto.materialIds) {
      const materialIds = queryDto.materialIds
        .split(',')
        .map((id) => id.trim());
      queryBuilder.andWhere('materials.id IN (:...materialIds)', {
        materialIds,
      });
    }

    // Filter by styles
    if (queryDto.styleIds) {
      const styleIds = queryDto.styleIds.split(',').map((id) => id.trim());
      queryBuilder.andWhere('styles.id IN (:...styleIds)', { styleIds });
    }

    // Filter by collections
    if (queryDto.collectionIds) {
      const collectionIds = queryDto.collectionIds
        .split(',')
        .map((id) => id.trim());
      queryBuilder.andWhere('collections.id IN (:...collectionIds)', {
        collectionIds,
      });
    }

    // Filter by tags
    if (queryDto.tagIds) {
      const tagIds = queryDto.tagIds.split(',').map((id) => id.trim());
      queryBuilder.andWhere('tags.id IN (:...tagIds)', { tagIds });
    }

    // Filter by price range
    if (queryDto.minPrice !== undefined) {
      queryBuilder.andWhere('product.basePrice >= :minPrice', {
        minPrice: queryDto.minPrice,
      });
    }

    if (queryDto.maxPrice !== undefined) {
      queryBuilder.andWhere('product.basePrice <= :maxPrice', {
        maxPrice: queryDto.maxPrice,
      });
    }

    // Filter by minimum stock (based on variants)
    if (queryDto.minStock !== undefined) {
      queryBuilder.andWhere('variants.stockQuantity >= :minStock', {
        minStock: queryDto.minStock,
      });
    }

    // Pagination
    const page = queryDto.page || 1;
    const limit = queryDto.limit || 20;
    const skip = (page - 1) * limit;

    // Sorting
    const sortBy = queryDto.sortBy || 'createdAt';
    const sortOrder = queryDto.sortOrder || 'DESC';
    queryBuilder.orderBy(`product.${sortBy}`, sortOrder);

    const [products, total] = await queryBuilder
      .skip(skip)
      .take(limit)
      .getManyAndCount();

    return {
      products,
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Lấy sản phẩm theo ID - Admin only
   */
  async findOne(id: string): Promise<Product> {
    const product = await this.productRepository.findOne({
      where: { id },
      relations: [
        'category',
        'materials',
        'styles',
        'collections',
        'tags',
        'variants',
        'variants.color',
        'variants.size',
        'variants.images',
        'image',
      ],
    });

    if (!product) {
      throw new NotFoundException(`Product with ID ${id} not found`);
    }
    return product;
  }

  /**
   * Tạo sản phẩm mới với image upload - Admin only
   */ async create(createProductDto: CreateProductDto): Promise<Product> {
    const {
      categoryId,
      materialIds = [],
      tagIds = [],
      collectionIds = [],
      styleIds = [],
      ...productData
    } = createProductDto;

    // Validate category (required)
    if (!categoryId) {
      throw new BadRequestException('Category ID is required');
    }

    const category = await this.categoryRepository.findOne({
      where: { id: categoryId },
    });
    if (!category) {
      throw new BadRequestException(`Category with ID ${categoryId} not found`);
    }

    // Validate materials
    const materials =
      materialIds.length > 0
        ? await this.materialRepository.findBy({ id: In(materialIds) })
        : [];

    if (materialIds.length !== materials.length) {
      throw new BadRequestException('One or more material IDs are invalid');
    }

    // Validate tags
    const tags =
      tagIds.length > 0
        ? await this.tagRepository.findBy({ id: In(tagIds) })
        : [];

    if (tagIds.length !== tags.length) {
      throw new BadRequestException('One or more tag IDs are invalid');
    }

    // Validate collections
    const collections =
      collectionIds.length > 0
        ? await this.collectionRepository.findBy({ id: In(collectionIds) })
        : [];

    if (collectionIds.length !== collections.length) {
      throw new BadRequestException('One or more collection IDs are invalid');
    }

    // Validate styles
    const styles =
      styleIds.length > 0
        ? await this.styleRepository.findBy({ id: In(styleIds) })
        : [];

    if (styleIds.length !== styles.length) {
      throw new BadRequestException('One or more style IDs are invalid');
    }

    if (!createProductDto.image) {
      throw new BadRequestException('Image is required');
    }
    const img = await this.imageService.create(
      createProductDto.image,
      productData.name,
    ); // Create product with uploaded image data
    const product = this.productRepository.create({
      ...productData,
      image: img,
      category,
      materials,
      tags,
      collections,
      styles,
    });
    // Save product to database
    const savedProduct = await this.productRepository.save(product);

    return savedProduct;
  }

  /**
   * Cập nhật sản phẩm - Admin only
   */ async update(
    id: string,
    updateProductDto: UpdateProductDto,
    image?: Express.Multer.File,
  ): Promise<Product> {
    const product = await this.findOne(id);

    const {
      categoryId,
      materialIds,
      tagIds,
      collectionIds,
      styleIds,
      ...productData
    } = updateProductDto;

    // Update basic product data
    Object.assign(product, productData); // Update category if provided
    if (categoryId !== undefined) {
      if (categoryId) {
        const category = await this.categoryRepository.findOne({
          where: { id: categoryId },
        });
        if (!category) {
          throw new BadRequestException(
            `Category with ID ${categoryId} not found`,
          );
        }
        product.category = category;
      }
      // Note: Can't set category to null as it's required (nullable: false)
    }
    // Update materials if provided
    if (materialIds !== undefined) {
      const materials =
        materialIds.length > 0
          ? await this.materialRepository.findBy({ id: In(materialIds) })
          : [];

      if (materialIds.length !== materials.length) {
        throw new BadRequestException('One or more material IDs are invalid');
      }
      product.materials = materials;
    }

    // Update tags if provided
    if (tagIds !== undefined) {
      const tags =
        tagIds.length > 0
          ? await this.tagRepository.findBy({ id: In(tagIds) })
          : [];

      if (tagIds.length !== tags.length) {
        throw new BadRequestException('One or more tag IDs are invalid');
      }
      product.tags = tags;
    }

    // Update collections if provided
    if (collectionIds !== undefined) {
      const collections =
        collectionIds.length > 0
          ? await this.collectionRepository.findBy({ id: In(collectionIds) })
          : [];

      if (collectionIds.length !== collections.length) {
        throw new BadRequestException('One or more collection IDs are invalid');
      }
      product.collections = collections;
    }

    // Update styles if provided
    if (styleIds !== undefined) {
      const styles =
        styleIds.length > 0
          ? await this.styleRepository.findBy({ id: In(styleIds) })
          : [];

      if (styleIds.length !== styles.length) {
        throw new BadRequestException('One or more style IDs are invalid');
      }
      product.styles = styles;
    }

    // Update image if provided
    if (image) {
      // Delete old image if it exists
      if (product.image) {
        await this.imageService.delete(product.image.publicId);
      }
      // Create new image
      const newImage = await this.imageService.create(image, product.name);
      product.image = newImage;
    }
    return await this.productRepository.save(product);
  }

  /**
   * Gán variants cho sản phẩm - Admin only
   */ async assignVariants(
    id: string,
    assignVariantsDto: AssignVariantsDto,
  ): Promise<Product> {
    const product = await this.findOne(id);

    // Implementation depends on your variant assignment logic
    console.log(`Assigning variants to product ${id}:`, assignVariantsDto);

    return product;
  }
  /**
   * Xóa mềm sản phẩm - Admin only
   */
  async remove(id: string): Promise<void> {
    await this.findOne(id); // Verify product exists
    await this.productRepository.softDelete(id);
  }

  /**
   * Khôi phục sản phẩm - Admin only
   */
  async restore(id: string): Promise<Product> {
    await this.productRepository.restore(id);
    return await this.findOne(id);
  }

  // =============================================================================
  // COLLECTION MANAGEMENT METHODS
  // =============================================================================

  /**
   * Lấy tất cả products trong một collection
   */
  async getProductsInCollection(
    collectionId: string,
    page: number = 1,
    limit: number = 20,
  ): Promise<{
    products: Product[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    // Verify collection exists
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId },
    });
    if (!collection) {
      throw new NotFoundException(
        `Collection with id ${collectionId} not found`,
      );
    }

    const queryBuilder = this.productRepository
      .createQueryBuilder('product')
      .leftJoinAndSelect('product.collections', 'collections')
      .leftJoinAndSelect('product.category', 'category')
      .leftJoinAndSelect('product.variants', 'variants')
      .where('collections.id = :collectionId', { collectionId });

    // Get total count
    const total = await queryBuilder.getCount();

    // Get paginated results
    const products = await queryBuilder
      .skip((page - 1) * limit)
      .take(limit)
      .getMany();

    return {
      products,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  /**
   * Thêm products vào collection (bulk)
   */
  async addProductsToCollection(
    collectionId: string,
    productIds: string[],
  ): Promise<{
    added: number;
    addedProductIds: string[];
    failedProductIds: string[];
  }> {
    // Verify collection exists
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId },
    });
    if (!collection) {
      throw new NotFoundException(
        `Collection with id ${collectionId} not found`,
      );
    }

    const addedProductIds: string[] = [];
    const failedProductIds: string[] = [];

    // Process each product
    for (const productId of productIds) {
      try {
        const product = await this.productRepository.findOne({
          where: { id: productId },
          relations: ['collections'],
        });

        if (!product) {
          failedProductIds.push(productId);
          continue;
        }

        // Check if product is already in collection
        const isAlreadyInCollection = product.collections.some(
          (c) => c.id === collectionId,
        );

        if (!isAlreadyInCollection) {
          product.collections.push(collection);
          await this.productRepository.save(product);
          addedProductIds.push(productId);
        } else {
          // Already in collection, consider as success
          addedProductIds.push(productId);
        }
      } catch (error) {
        failedProductIds.push(productId);
      }
    }

    return {
      added: addedProductIds.length,
      addedProductIds,
      failedProductIds,
    };
  }

  /**
   * Xóa products khỏi collection (bulk)
   */
  async removeProductsFromCollection(
    collectionId: string,
    productIds: string[],
  ): Promise<{
    removed: number;
    removedProductIds: string[];
    failedProductIds: string[];
  }> {
    // Verify collection exists
    const collection = await this.collectionRepository.findOne({
      where: { id: collectionId },
    });
    if (!collection) {
      throw new NotFoundException(
        `Collection with id ${collectionId} not found`,
      );
    }

    const removedProductIds: string[] = [];
    const failedProductIds: string[] = [];

    // Process each product
    for (const productId of productIds) {
      try {
        const product = await this.productRepository.findOne({
          where: { id: productId },
          relations: ['collections'],
        });

        if (!product) {
          failedProductIds.push(productId);
          continue;
        }

        // Remove collection from product
        product.collections = product.collections.filter(
          (c) => c.id !== collectionId,
        );
        await this.productRepository.save(product);
        removedProductIds.push(productId);
      } catch (error) {
        failedProductIds.push(productId);
      }
    }

    return {
      removed: removedProductIds.length,
      removedProductIds,
      failedProductIds,
    };
  }

  /**
   * Bulk management - thêm và xóa products khỏi collection trong một operation
   */
  async bulkManageCollectionProducts(
    collectionId: string,
    addProductIds?: string[],
    removeProductIds?: string[],
  ): Promise<{
    added: number;
    removed: number;
    addedProductIds: string[];
    removedProductIds: string[];
    failedProductIds: string[];
  }> {
    let addResult = {
      added: 0,
      addedProductIds: [] as string[],
      failedProductIds: [] as string[],
    };
    let removeResult = {
      removed: 0,
      removedProductIds: [] as string[],
      failedProductIds: [] as string[],
    };

    // Add products if provided
    if (addProductIds && addProductIds.length > 0) {
      addResult = await this.addProductsToCollection(
        collectionId,
        addProductIds,
      );
    }

    // Remove products if provided
    if (removeProductIds && removeProductIds.length > 0) {
      removeResult = await this.removeProductsFromCollection(
        collectionId,
        removeProductIds,
      );
    }

    return {
      added: addResult.added,
      removed: removeResult.removed,
      addedProductIds: addResult.addedProductIds,
      removedProductIds: removeResult.removedProductIds,
      failedProductIds: [
        ...addResult.failedProductIds,
        ...removeResult.failedProductIds,
      ],
    };
  }

  // =============================================================================
  // MATERIALS MANAGEMENT METHODS
  // =============================================================================

  /**
   * Thêm materials vào product
   */
  async addMaterialsToProduct(
    productId: string,
    materialIds: string[],
  ): Promise<{
    added: number;
    addedIds: string[];
    failedIds: string[];
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['materials'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const addedIds: string[] = [];
    const failedIds: string[] = [];

    for (const materialId of materialIds) {
      try {
        const material = await this.materialRepository.findOne({
          where: { id: materialId },
        });

        if (!material) {
          failedIds.push(materialId);
          continue;
        }

        const isAlreadyAdded = product.materials.some(
          (m) => m.id === materialId,
        );
        if (!isAlreadyAdded) {
          product.materials.push(material);
          addedIds.push(materialId);
        } else {
          addedIds.push(materialId); // Consider as success
        }
      } catch (error) {
        failedIds.push(materialId);
      }
    }

    await this.productRepository.save(product);

    return {
      added: addedIds.length,
      addedIds,
      failedIds,
    };
  }

  /**
   * Xóa materials khỏi product
   */
  async removeMaterialsFromProduct(
    productId: string,
    materialIds: string[],
  ): Promise<{
    removed: number;
    removedIds: string[];
    failedIds: string[];
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['materials'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const removedIds: string[] = [];
    const failedIds: string[] = [];

    for (const materialId of materialIds) {
      try {
        const existingMaterial = product.materials.find(
          (m) => m.id === materialId,
        );
        if (existingMaterial) {
          product.materials = product.materials.filter(
            (m) => m.id !== materialId,
          );
          removedIds.push(materialId);
        } else {
          failedIds.push(materialId);
        }
      } catch (error) {
        failedIds.push(materialId);
      }
    }

    await this.productRepository.save(product);

    return {
      removed: removedIds.length,
      removedIds,
      failedIds,
    };
  }

  // =============================================================================
  // STYLES MANAGEMENT METHODS
  // =============================================================================

  /**
   * Thêm styles vào product
   */
  async addStylesToProduct(
    productId: string,
    styleIds: string[],
  ): Promise<{
    added: number;
    addedIds: string[];
    failedIds: string[];
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['styles'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const addedIds: string[] = [];
    const failedIds: string[] = [];

    for (const styleId of styleIds) {
      try {
        const style = await this.styleRepository.findOne({
          where: { id: styleId },
        });

        if (!style) {
          failedIds.push(styleId);
          continue;
        }

        const isAlreadyAdded = product.styles.some((s) => s.id === styleId);
        if (!isAlreadyAdded) {
          product.styles.push(style);
          addedIds.push(styleId);
        } else {
          addedIds.push(styleId); // Consider as success
        }
      } catch (error) {
        failedIds.push(styleId);
      }
    }

    await this.productRepository.save(product);

    return {
      added: addedIds.length,
      addedIds,
      failedIds,
    };
  }

  /**
   * Xóa styles khỏi product
   */
  async removeStylesFromProduct(
    productId: string,
    styleIds: string[],
  ): Promise<{
    removed: number;
    removedIds: string[];
    failedIds: string[];
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['styles'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const removedIds: string[] = [];
    const failedIds: string[] = [];

    for (const styleId of styleIds) {
      try {
        const existingStyle = product.styles.find((s) => s.id === styleId);
        if (existingStyle) {
          product.styles = product.styles.filter((s) => s.id !== styleId);
          removedIds.push(styleId);
        } else {
          failedIds.push(styleId);
        }
      } catch (error) {
        failedIds.push(styleId);
      }
    }

    await this.productRepository.save(product);

    return {
      removed: removedIds.length,
      removedIds,
      failedIds,
    };
  }

  // =============================================================================
  // TAGS MANAGEMENT METHODS
  // =============================================================================

  /**
   * Thêm tags vào product
   */
  async addTagsToProduct(
    productId: string,
    tagIds: string[],
  ): Promise<{
    added: number;
    addedIds: string[];
    failedIds: string[];
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['tags'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const addedIds: string[] = [];
    const failedIds: string[] = [];

    for (const tagId of tagIds) {
      try {
        const tag = await this.tagRepository.findOne({
          where: { id: tagId },
        });

        if (!tag) {
          failedIds.push(tagId);
          continue;
        }

        const isAlreadyAdded = product.tags.some((t) => t.id === tagId);
        if (!isAlreadyAdded) {
          product.tags.push(tag);
          addedIds.push(tagId);
        } else {
          addedIds.push(tagId); // Consider as success
        }
      } catch (error) {
        failedIds.push(tagId);
      }
    }

    await this.productRepository.save(product);

    return {
      added: addedIds.length,
      addedIds,
      failedIds,
    };
  }

  /**
   * Xóa tags khỏi product
   */
  async removeTagsFromProduct(
    productId: string,
    tagIds: string[],
  ): Promise<{
    removed: number;
    removedIds: string[];
    failedIds: string[];
  }> {
    const product = await this.productRepository.findOne({
      where: { id: productId },
      relations: ['tags'],
    });

    if (!product) {
      throw new NotFoundException(`Product with id ${productId} not found`);
    }

    const removedIds: string[] = [];
    const failedIds: string[] = [];

    for (const tagId of tagIds) {
      try {
        const existingTag = product.tags.find((t) => t.id === tagId);
        if (existingTag) {
          product.tags = product.tags.filter((t) => t.id !== tagId);
          removedIds.push(tagId);
        } else {
          failedIds.push(tagId);
        }
      } catch (error) {
        failedIds.push(tagId);
      }
    }

    await this.productRepository.save(product);

    return {
      removed: removedIds.length,
      removedIds,
      failedIds,
    };
  }

  // =============================================================================
  // BULK ATTRIBUTES MANAGEMENT
  // =============================================================================
  /**
   * Bulk management cho materials, styles, tags
   */
  async bulkManageProductAttributes(
    productId: string,
    operations: {
      materials?: { add?: string[]; remove?: string[] };
      styles?: { add?: string[]; remove?: string[] };
      tags?: { add?: string[]; remove?: string[] };
    },
  ): Promise<{
    materials?: {
      added: number;
      removed: number;
      addedIds: string[];
      removedIds: string[];
      failedIds: string[];
    };
    styles?: {
      added: number;
      removed: number;
      addedIds: string[];
      removedIds: string[];
      failedIds: string[];
    };
    tags?: {
      added: number;
      removed: number;
      addedIds: string[];
      removedIds: string[];
      failedIds: string[];
    };
  }> {
    const results: {
      materials?: {
        added: number;
        removed: number;
        addedIds: string[];
        removedIds: string[];
        failedIds: string[];
      };
      styles?: {
        added: number;
        removed: number;
        addedIds: string[];
        removedIds: string[];
        failedIds: string[];
      };
      tags?: {
        added: number;
        removed: number;
        addedIds: string[];
        removedIds: string[];
        failedIds: string[];
      };
    } = {};

    // Handle materials
    if (operations.materials) {
      const materialResults = {
        added: 0,
        removed: 0,
        addedIds: [] as string[],
        removedIds: [] as string[],
        failedIds: [] as string[],
      };

      if (operations.materials.add?.length) {
        const addResult = await this.addMaterialsToProduct(
          productId,
          operations.materials.add,
        );
        materialResults.added = addResult.added;
        materialResults.addedIds = addResult.addedIds;
        materialResults.failedIds.push(...addResult.failedIds);
      }

      if (operations.materials.remove?.length) {
        const removeResult = await this.removeMaterialsFromProduct(
          productId,
          operations.materials.remove,
        );
        materialResults.removed = removeResult.removed;
        materialResults.removedIds = removeResult.removedIds;
        materialResults.failedIds.push(...removeResult.failedIds);
      }

      results.materials = materialResults;
    }

    // Handle styles
    if (operations.styles) {
      const styleResults = {
        added: 0,
        removed: 0,
        addedIds: [] as string[],
        removedIds: [] as string[],
        failedIds: [] as string[],
      };

      if (operations.styles.add?.length) {
        const addResult = await this.addStylesToProduct(
          productId,
          operations.styles.add,
        );
        styleResults.added = addResult.added;
        styleResults.addedIds = addResult.addedIds;
        styleResults.failedIds.push(...addResult.failedIds);
      }

      if (operations.styles.remove?.length) {
        const removeResult = await this.removeStylesFromProduct(
          productId,
          operations.styles.remove,
        );
        styleResults.removed = removeResult.removed;
        styleResults.removedIds = removeResult.removedIds;
        styleResults.failedIds.push(...removeResult.failedIds);
      }

      results.styles = styleResults;
    }

    // Handle tags
    if (operations.tags) {
      const tagResults = {
        added: 0,
        removed: 0,
        addedIds: [] as string[],
        removedIds: [] as string[],
        failedIds: [] as string[],
      };

      if (operations.tags.add?.length) {
        const addResult = await this.addTagsToProduct(
          productId,
          operations.tags.add,
        );
        tagResults.added = addResult.added;
        tagResults.addedIds = addResult.addedIds;
        tagResults.failedIds.push(...addResult.failedIds);
      }

      if (operations.tags.remove?.length) {
        const removeResult = await this.removeTagsFromProduct(
          productId,
          operations.tags.remove,
        );
        tagResults.removed = removeResult.removed;
        tagResults.removedIds = removeResult.removedIds;
        tagResults.failedIds.push(...removeResult.failedIds);
      }

      results.tags = tagResults;
    }

    return results;
  }
}
