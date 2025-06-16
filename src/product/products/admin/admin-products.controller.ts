import {
  Controller,
  Get,
  Post,
  Patch,
  Delete,
  Body,
  Param,
  Query,
  HttpCode,
  HttpStatus,
  UseGuards,
  UseInterceptors,
  UploadedFile,
  ParseUUIDPipe,
  BadRequestException,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiCreatedResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiExtraModels,
  ApiConsumes,
  getSchemaPath,
} from '@nestjs/swagger';
import { FileInterceptor } from '@nestjs/platform-express';
import { plainToInstance } from 'class-transformer';
import { AdminProductsService } from './admin-products.service';
import {
  CreateProductDto,
  UpdateProductDto,
  ProductQueryDto,
  ProductResponseDto,
  AddProductsToCollectionDto,
  RemoveProductsFromCollectionDto,
  BulkManageCollectionProductsDto,
  CollectionProductsResponseDto,
  AddMaterialsToProductDto,
  RemoveMaterialsFromProductDto,
  AddStylesToProductDto,
  RemoveStylesFromProductDto,
  AddTagsToProductDto,
  RemoveTagsFromProductDto,
  BulkManageProductAttributesDto,
  ProductAttributesResponseDto,
} from '../dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/constants/user-role.enum';

@ApiTags('products (Admin)')
@ApiExtraModels(
  ProductResponseDto,
  BaseResponseDto,
  PaginatedResponseDto,
  CollectionProductsResponseDto,
  ProductAttributesResponseDto,
)
@Controller('admin/products')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminProductsController {
  constructor(private readonly adminProductsService: AdminProductsService) {}

  /**
   * Lấy tất cả sản phẩm với bộ lọc - Admin only
   * GET /admin/products
   */
  @Get()
  @ApiOperation({
    summary: 'Get all products with filters',
    description:
      'Get all products with pagination and filtering options. Admin access required.',
  })
  @ApiQuery({ name: 'sortOrder', required: false, enum: ['ASC', 'DESC'] })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ProductResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() queryDto: ProductQueryDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const result = await this.adminProductsService.findAll(queryDto);
    return {
      message: 'Products retrieved successfully',
      data: result.products.map((product) =>
        plainToInstance(ProductResponseDto, product, {
          excludeExtraneousValues: true,
        }),
      ),
      meta: {
        timestamp: new Date().toISOString(),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Lấy sản phẩm theo ID - Admin only
   * GET /admin/products/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get product by ID',
    description:
      'Get detailed information about a specific product. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BaseResponseDto<ProductResponseDto>> {
    const product = await this.adminProductsService.findOne(id);
    return {
      message: 'Product retrieved successfully',
      data: plainToInstance(ProductResponseDto, product, {
        excludeExtraneousValues: true,
      }),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Tạo mới sản phẩm - Admin only
   * POST /admin/products
   */
  @Post()
  @ApiConsumes('multipart/form-data')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new product with image',
    description:
      'Create a new product with main image upload. Admin access required.',
  })
  @ApiCreatedResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductResponseDto) },
          },
        },
      ],
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async create(
    @Body() createProductDto: CreateProductDto,
    @UploadedFile() image: Express.Multer.File,
  ): Promise<BaseResponseDto<ProductResponseDto>> {
    if (!image) {
      throw new BadRequestException('Image file is required');
    }
    createProductDto.image = image; // Store the filename in DTO
    const product = await this.adminProductsService.create(createProductDto);

    return {
      message: 'Product created successfully',
      data: plainToInstance(ProductResponseDto, product),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Cập nhật sản phẩm - Admin only
   * PATCH /admin/products/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update product',
    description: 'Update an existing product. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductResponseDto) },
          },
        },
      ],
    },
  })
  @UseInterceptors(FileInterceptor('image'))
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateProductDto: UpdateProductDto,
    @UploadedFile() image?: Express.Multer.File,
  ): Promise<BaseResponseDto<ProductResponseDto>> {
    const product = await this.adminProductsService.update(
      id,
      updateProductDto,
      image,
    );

    return {
      message: 'Product updated successfully',
      data: plainToInstance(ProductResponseDto, product),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xóa mềm sản phẩm - Admin only
   * DELETE /admin/products/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete product',
    description: 'Soft delete a product. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'null' },
          },
        },
      ],
    },
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BaseResponseDto<null>> {
    await this.adminProductsService.remove(id);

    return {
      message: 'Product deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Khôi phục sản phẩm đã xóa - Admin only
   * PATCH /admin/products/:id/restore
   */
  @Patch(':id/restore')
  @ApiOperation({
    summary: 'Restore deleted product',
    description: 'Restore a soft-deleted product. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductResponseDto) },
          },
        },
      ],
    },
  })
  async restore(
    @Param('id', ParseUUIDPipe) id: string,
  ): Promise<BaseResponseDto<ProductResponseDto>> {
    const product = await this.adminProductsService.restore(id);

    return {
      message: 'Product restored successfully',
      data: plainToInstance(ProductResponseDto, product),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // =============================================================================
  // COLLECTION MANAGEMENT ROUTES
  // =============================================================================

  /**
   * Lấy products trong collection - Admin only
   * GET /admin/products/collection/:collectionId
   */
  @Get('collection/:collectionId')
  @ApiOperation({
    summary: 'Get products in collection',
    description:
      'Get all products in a specific collection with pagination. Admin access required.',
  })
  @ApiParam({ name: 'collectionId', description: 'Collection ID (UUID)' })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ProductResponseDto) },
            },
          },
        },
      ],
    },
  })
  async getProductsInCollection(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 20,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const result = await this.adminProductsService.getProductsInCollection(
      collectionId,
      page,
      limit,
    );

    return {
      message: 'Products in collection retrieved successfully',
      data: result.products.map((product) =>
        plainToInstance(ProductResponseDto, product, {
          excludeExtraneousValues: true,
        }),
      ),
      meta: {
        timestamp: new Date().toISOString(),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  /**
   * Thêm products vào collection - Admin only
   * POST /admin/products/collection/:collectionId/add
   */
  @Post('collection/:collectionId/add')
  @ApiOperation({
    summary: 'Add products to collection',
    description:
      'Add multiple products to a collection. Admin access required.',
  })
  @ApiParam({ name: 'collectionId', description: 'Collection ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CollectionProductsResponseDto) },
          },
        },
      ],
    },
  })
  async addProductsToCollection(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Body() addProductsDto: AddProductsToCollectionDto,
  ): Promise<BaseResponseDto<CollectionProductsResponseDto>> {
    const result = await this.adminProductsService.addProductsToCollection(
      collectionId,
      addProductsDto.productIds,
    );

    return {
      message: 'Products added to collection successfully',
      data: {
        added: result.added,
        removed: 0,
        addedProductIds: result.addedProductIds,
        removedProductIds: [],
        failedProductIds: result.failedProductIds,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xóa products khỏi collection - Admin only
   * DELETE /admin/products/collection/:collectionId/remove
   */
  @Delete('collection/:collectionId/remove')
  @ApiOperation({
    summary: 'Remove products from collection',
    description:
      'Remove multiple products from a collection. Admin access required.',
  })
  @ApiParam({ name: 'collectionId', description: 'Collection ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CollectionProductsResponseDto) },
          },
        },
      ],
    },
  })
  async removeProductsFromCollection(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Body() removeProductsDto: RemoveProductsFromCollectionDto,
  ): Promise<BaseResponseDto<CollectionProductsResponseDto>> {
    const result = await this.adminProductsService.removeProductsFromCollection(
      collectionId,
      removeProductsDto.productIds,
    );

    return {
      message: 'Products removed from collection successfully',
      data: {
        added: 0,
        removed: result.removed,
        addedProductIds: [],
        removedProductIds: result.removedProductIds,
        failedProductIds: result.failedProductIds,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Bulk manage products trong collection - Admin only
   * PATCH /admin/products/collection/:collectionId/bulk
   */
  @Patch('collection/:collectionId/bulk')
  @ApiOperation({
    summary: 'Bulk manage products in collection',
    description:
      'Add and/or remove multiple products from a collection in one operation. Admin access required.',
  })
  @ApiParam({ name: 'collectionId', description: 'Collection ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CollectionProductsResponseDto) },
          },
        },
      ],
    },
  })
  async bulkManageCollectionProducts(
    @Param('collectionId', ParseUUIDPipe) collectionId: string,
    @Body() bulkManageDto: BulkManageCollectionProductsDto,
  ): Promise<BaseResponseDto<CollectionProductsResponseDto>> {
    const result = await this.adminProductsService.bulkManageCollectionProducts(
      collectionId,
      bulkManageDto.addProductIds,
      bulkManageDto.removeProductIds,
    );
    return {
      message: 'Collection products managed successfully',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // =============================================================================
  // MATERIALS MANAGEMENT ROUTES
  // =============================================================================

  /**
   * Thêm materials vào product - Admin only
   * POST /admin/products/:productId/materials/add
   */
  @Post(':productId/materials/add')
  @ApiOperation({
    summary: 'Add materials to product',
    description:
      'Add one or more materials to a product. Admin access required.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductAttributesResponseDto) },
          },
        },
      ],
    },
  })
  async addMaterialsToProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() addMaterialsDto: AddMaterialsToProductDto,
  ): Promise<BaseResponseDto<ProductAttributesResponseDto>> {
    const result = await this.adminProductsService.addMaterialsToProduct(
      productId,
      addMaterialsDto.materialIds,
    );

    return {
      message: 'Materials added to product successfully',
      data: {
        added: result.added,
        removed: 0,
        addedIds: result.addedIds,
        removedIds: [],
        failedIds: result.failedIds,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xóa materials khỏi product - Admin only
   * DELETE /admin/products/:productId/materials/remove
   */
  @Delete(':productId/materials/remove')
  @ApiOperation({
    summary: 'Remove materials from product',
    description:
      'Remove one or more materials from a product. Admin access required.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductAttributesResponseDto) },
          },
        },
      ],
    },
  })
  async removeMaterialsFromProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() removeMaterialsDto: RemoveMaterialsFromProductDto,
  ): Promise<BaseResponseDto<ProductAttributesResponseDto>> {
    const result = await this.adminProductsService.removeMaterialsFromProduct(
      productId,
      removeMaterialsDto.materialIds,
    );

    return {
      message: 'Materials removed from product successfully',
      data: {
        added: 0,
        removed: result.removed,
        addedIds: [],
        removedIds: result.removedIds,
        failedIds: result.failedIds,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // =============================================================================
  // STYLES MANAGEMENT ROUTES
  // =============================================================================

  /**
   * Thêm styles vào product - Admin only
   * POST /admin/products/:productId/styles/add
   */
  @Post(':productId/styles/add')
  @ApiOperation({
    summary: 'Add styles to product',
    description: 'Add one or more styles to a product. Admin access required.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductAttributesResponseDto) },
          },
        },
      ],
    },
  })
  async addStylesToProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() addStylesDto: AddStylesToProductDto,
  ): Promise<BaseResponseDto<ProductAttributesResponseDto>> {
    const result = await this.adminProductsService.addStylesToProduct(
      productId,
      addStylesDto.styleIds,
    );

    return {
      message: 'Styles added to product successfully',
      data: {
        added: result.added,
        removed: 0,
        addedIds: result.addedIds,
        removedIds: [],
        failedIds: result.failedIds,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xóa styles khỏi product - Admin only
   * DELETE /admin/products/:productId/styles/remove
   */
  @Delete(':productId/styles/remove')
  @ApiOperation({
    summary: 'Remove styles from product',
    description:
      'Remove one or more styles from a product. Admin access required.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductAttributesResponseDto) },
          },
        },
      ],
    },
  })
  async removeStylesFromProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() removeStylesDto: RemoveStylesFromProductDto,
  ): Promise<BaseResponseDto<ProductAttributesResponseDto>> {
    const result = await this.adminProductsService.removeStylesFromProduct(
      productId,
      removeStylesDto.styleIds,
    );

    return {
      message: 'Styles removed from product successfully',
      data: {
        added: 0,
        removed: result.removed,
        addedIds: [],
        removedIds: result.removedIds,
        failedIds: result.failedIds,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // =============================================================================
  // TAGS MANAGEMENT ROUTES
  // =============================================================================

  /**
   * Thêm tags vào product - Admin only
   * POST /admin/products/:productId/tags/add
   */
  @Post(':productId/tags/add')
  @ApiOperation({
    summary: 'Add tags to product',
    description: 'Add one or more tags to a product. Admin access required.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductAttributesResponseDto) },
          },
        },
      ],
    },
  })
  async addTagsToProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() addTagsDto: AddTagsToProductDto,
  ): Promise<BaseResponseDto<ProductAttributesResponseDto>> {
    const result = await this.adminProductsService.addTagsToProduct(
      productId,
      addTagsDto.tagIds,
    );

    return {
      message: 'Tags added to product successfully',
      data: {
        added: result.added,
        removed: 0,
        addedIds: result.addedIds,
        removedIds: [],
        failedIds: result.failedIds,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xóa tags khỏi product - Admin only
   * DELETE /admin/products/:productId/tags/remove
   */
  @Delete(':productId/tags/remove')
  @ApiOperation({
    summary: 'Remove tags from product',
    description:
      'Remove one or more tags from a product. Admin access required.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductAttributesResponseDto) },
          },
        },
      ],
    },
  })
  async removeTagsFromProduct(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() removeTagsDto: RemoveTagsFromProductDto,
  ): Promise<BaseResponseDto<ProductAttributesResponseDto>> {
    const result = await this.adminProductsService.removeTagsFromProduct(
      productId,
      removeTagsDto.tagIds,
    );

    return {
      message: 'Tags removed from product successfully',
      data: {
        added: 0,
        removed: result.removed,
        addedIds: [],
        removedIds: result.removedIds,
        failedIds: result.failedIds,
      },
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  // =============================================================================
  // BULK ATTRIBUTES MANAGEMENT ROUTE
  // =============================================================================

  /**
   * Bulk manage product attributes - Admin only
   * PATCH /admin/products/:productId/attributes/bulk
   */
  @Patch(':productId/attributes/bulk')
  @ApiOperation({
    summary: 'Bulk manage product attributes',
    description:
      'Add and/or remove multiple materials, styles, and tags from a product in one operation. Admin access required.',
  })
  @ApiParam({ name: 'productId', description: 'Product ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'object',
              properties: {
                materials: {
                  $ref: getSchemaPath(ProductAttributesResponseDto),
                },
                styles: { $ref: getSchemaPath(ProductAttributesResponseDto) },
                tags: { $ref: getSchemaPath(ProductAttributesResponseDto) },
              },
            },
          },
        },
      ],
    },
  })
  async bulkManageProductAttributes(
    @Param('productId', ParseUUIDPipe) productId: string,
    @Body() bulkManageDto: BulkManageProductAttributesDto,
  ): Promise<BaseResponseDto<any>> {
    const operations = {
      materials: bulkManageDto.materials,
      styles: bulkManageDto.styles,
      tags: bulkManageDto.tags,
    };

    const result = await this.adminProductsService.bulkManageProductAttributes(
      productId,
      operations,
    );

    return {
      message: 'Product attributes managed successfully',
      data: result,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
