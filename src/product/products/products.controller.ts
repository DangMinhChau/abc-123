import { Controller, Get, Body, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
  ApiQuery,
  ApiParam,
} from '@nestjs/swagger';
import { ProductsService } from './products.service';
import { ProductFilterService } from './services/product-filter.service';
import { ProductFilterDto } from './dto/requests/product-filter.dto';
import { ProductResponseDto, ProductFiltersResponseDto } from './dto/responses';
import { CloudinaryService } from 'src/common/services/cloudinary/cloudinary.service';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('products (Public)')
@ApiExtraModels(
  ProductResponseDto,
  BaseResponseDto,
  PaginatedResponseDto,
  ProductFiltersResponseDto,
)
@ApiBearerAuth()
@Controller('products')
export class ProductsController {
  constructor(
    private readonly productsService: ProductsService,
    private readonly productFilterService: ProductFilterService,
    private readonly cloudinaryService: CloudinaryService,
  ) {}
  // Admin routes have been moved to admin/admin-products.controller.ts  @Get()
  @ApiOperation({
    summary: 'Get all products with advanced filtering, search and pagination',
    description:
      'Retrieve products with comprehensive filtering options including category, price range, materials, collections, styles, tags, colors, sizes, search functionality, and more.',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Items per page (max 100)',
  })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search by product name, description, or SKU',
  })
  @ApiQuery({
    name: 'q',
    required: false,
    description: 'Search query (alternative to search parameter)',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category slug (e.g., ao-thun)',
  })
  @ApiQuery({
    name: 'material',
    required: false,
    description:
      'Filter by material slugs (multiple values supported, comma-separated)',
    example: 'cotton,polyester',
  })
  @ApiQuery({
    name: 'style',
    required: false,
    description:
      'Filter by style slugs (multiple values supported, comma-separated)',
    example: 'casual,formal',
  })
  @ApiQuery({
    name: 'collection',
    required: false,
    description:
      'Filter by collection slugs (multiple values supported, comma-separated)',
    example: 'summer-2024,winter-2024',
  })
  @ApiQuery({
    name: 'tag',
    required: false,
    description:
      'Filter by tag slugs (multiple values supported, comma-separated)',
    example: 'trending,sale',
  })
  @ApiQuery({
    name: 'priceMin',
    required: false,
    description: 'Minimum price filter',
  })
  @ApiQuery({
    name: 'priceMax',
    required: false,
    description: 'Maximum price filter',
  })
  @ApiQuery({
    name: 'size',
    required: false,
    description:
      'Filter by size names (multiple values supported, comma-separated: M,L,XL)',
    example: 'M,L,XL',
  })
  @ApiQuery({
    name: 'color',
    required: false,
    description:
      'Filter by color codes (multiple values supported, comma-separated: RED,BLUE,GREEN)',
    example: 'RED,BLUE',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: [
      'newest',
      'price_asc',
      'price_desc',
      'name_asc',
      'name_desc',
      'relevance',
    ],
    description: 'Sort products by',
  })
  @ApiQuery({
    name: 'inStock',
    required: false,
    description: 'Filter only products in stock',
  })
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
  @Get()
  async findAll(
    @Query() filterDto: ProductFilterDto,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    // Force isActive = true for public routes to only show active products
    const publicFilterDto: ProductFilterDto = {
      ...filterDto,
      isActive: true,
    };

    const result = await this.productsService.findAll(publicFilterDto);
    return {
      message: 'Products retrieved successfully',
      data: plainToInstance(ProductResponseDto, result.data, {
        excludeExtraneousValues: true,
      }),
      meta: {
        ...result.meta,
        totalPages: Math.ceil(result.meta.total / result.meta.limit),
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get('filter-options')
  @ApiOperation({
    summary: 'Get product metadata and filters',
    description:
      'Get available filter options for products. If category is provided, returns filters specific to that category.',
  })
  @ApiQuery({
    name: 'category',
    required: false,
    description: 'Filter by category slug to get category-specific options',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ProductFiltersResponseDto) },
          },
        },
      ],
    },
  })
  async getProductFilterOptions(
    @Query('category') categorySlug?: string,
  ): Promise<BaseResponseDto<ProductFiltersResponseDto>> {
    let filters;

    if (categorySlug) {
      filters =
        await this.productFilterService.getFilterOptionsByCategory(
          categorySlug,
        );
    } else {
      filters = await this.productFilterService.getFilterOptions();
    }
    return {
      message: categorySlug
        ? `Product filters for category '${categorySlug}' retrieved successfully`
        : 'Product metadata retrieved successfully',
      data: {
        categories: filters.categories,
        colors: filters.colors,
        sizes: filters.sizes,
        materials: filters.materials,
        collections: filters.collections,
        styles: filters.styles,
        tags: filters.tags,
        priceRange: filters.priceRange
          ? {
              min: filters.priceRange.minPrice,
              max: filters.priceRange.maxPrice,
            }
          : { min: 0, max: 0 },
      },
      meta: {
        timestamp: new Date().toISOString(),
        ...(categorySlug && { category: categorySlug }),
      },
    };
  }

  @Get(':slug')
  @ApiOperation({
    summary: 'Get product by slug',
    description:
      'Get product details by slug. Only returns active products for public access.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Product slug (URL-friendly identifier)',
    example: 'ao-thun-basic-trang',
  })
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
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<ProductResponseDto>> {
    // Use public method that only returns active products
    const product = await this.productsService.findBySlugPublic(slug);
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

  @Get('sale')
  @ApiOperation({
    summary: 'Get all products on sale',
    description:
      'Retrieve all products that have a discount percentage greater than 0',
  })
  @ApiQuery({
    name: 'page',
    required: false,
    example: 1,
    description: 'Page number',
  })
  @ApiQuery({
    name: 'limit',
    required: false,
    example: 20,
    description: 'Items per page',
  })
  @ApiQuery({
    name: 'sort',
    required: false,
    enum: ['newest', 'price_asc', 'price_desc', 'discount_desc'],
    description: 'Sort sale products by',
  })
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
  async getSaleProducts(
    @Query() query: any,
  ): Promise<PaginatedResponseDto<ProductResponseDto>> {
    const { page = 1, limit = 20, sort = 'discount_desc' } = query;

    const result = await this.productsService.getSaleProducts({
      page: Number(page),
      limit: Number(limit),
      sort: String(sort),
    });

    return {
      message: 'Sale products retrieved successfully',
      data: plainToInstance(ProductResponseDto, result.products, {
        excludeExtraneousValues: true,
      }),
      meta: {
        page: result.currentPage,
        limit: result.itemsPerPage,
        total: result.totalItems,
        totalPages: result.totalPages,
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('sale/statistics')
  @ApiOperation({ summary: 'Get sale products statistics' })
  @ApiOkResponse({
    description: 'Sale statistics retrieved successfully',
    schema: {
      type: 'object',
      properties: {
        message: { type: 'string' },
        data: {
          type: 'object',
          properties: {
            totalSaleProducts: { type: 'number' },
            maxDiscountPercent: { type: 'number' },
            averageDiscountPercent: { type: 'number' },
            totalDiscountValue: { type: 'number' },
          },
        },
        meta: {
          type: 'object',
          properties: {
            timestamp: { type: 'string' },
          },
        },
      },
    },
  })
  async getSaleStatistics(): Promise<{
    message: string;
    data: {
      totalSaleProducts: number;
      maxDiscountPercent: number;
      averageDiscountPercent: number;
      totalDiscountValue: number;
    };
    meta: {
      timestamp: string;
    };
  }> {
    const stats = await this.productsService.getSaleStatistics();

    return {
      message: 'Sale statistics retrieved successfully',
      data: stats,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
