import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { CategoryClientService } from './category.service';
import { CategoryResponseDto } from './dto/responses/category-response.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { plainToInstance } from 'class-transformer';
import { SizesService } from '../sizes/sizes.service';
import { SizeResponseDto } from '../sizes/dto/responses/size-response.dto';

@ApiTags('categories (Public)')
@ApiExtraModels(CategoryResponseDto, SizeResponseDto, BaseResponseDto)
@Controller('categories')
export class CategoryController {
  constructor(
    private readonly categoryClientService: CategoryClientService,
    private readonly sizesService: SizesService,
  ) {}

  /**
   * Lấy danh sách categories đang hoạt động - Public
   * GET /categories
   */ @Get()
  @ApiOperation({
    summary: 'Get active categories',
    description:
      'Get list of active categories (isActive: true). Public endpoint.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CategoryResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findActiveCategories(): Promise<
    BaseResponseDto<CategoryResponseDto[]>
  > {
    const categories = await this.categoryClientService.findActiveCategories();

    return {
      message: 'Active categories retrieved successfully',
      data: categories.map((category) =>
        plainToInstance(CategoryResponseDto, category),
      ),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Lấy toàn bộ cây danh mục (TreeRepository) - Public
   * GET /categories/tree
   */ @Get('tree')
  @ApiOperation({
    summary: 'Get category tree structure',
    description:
      'Get complete category tree structure using TreeRepository. Public endpoint.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CategoryResponseDto) },
            },
          },
        },
      ],
    },
  })
  async getCategoryTree(
    @Query('activeOnly') activeOnly: boolean = true,
  ): Promise<BaseResponseDto<CategoryResponseDto[]>> {
    const categoryTree =
      await this.categoryClientService.getCategoryTree(activeOnly);

    return {
      message: 'Category tree retrieved successfully',
      data: categoryTree.map((category) =>
        plainToInstance(CategoryResponseDto, category),
      ),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Lấy chi tiết category theo slug - Public
   * GET /categories/:slug
   */ @Get(':slug')
  @ApiOperation({
    summary: 'Get category by slug',
    description: 'Get category details by slug. Public endpoint.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Category slug (e.g., "ao-thun")',
    example: 'ao-thun',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CategoryResponseDto) },
          },
        },
      ],
    },
  })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<CategoryResponseDto>> {
    const category = await this.categoryClientService.findBySlug(slug);

    return {
      message: 'Category retrieved successfully',
      data: plainToInstance(CategoryResponseDto, category),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Lấy các category con theo slug cha - Public
   * GET /categories/:slug/children
   */ @Get(':slug/children')
  @ApiOperation({
    summary: 'Get category children by parent slug',
    description:
      'Get all active child categories of a parent category by slug. Public endpoint.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Parent category slug (e.g., "thoi-trang")',
    example: 'thoi-trang',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CategoryResponseDto) },
            },
          },
        },
      ],
    },
  })
  async getChildrenBySlug(
    @Param('slug') slug: string,
    @Query('activeOnly') activeOnly: boolean = true,
  ): Promise<BaseResponseDto<CategoryResponseDto[]>> {
    const children = await this.categoryClientService.findChildrenBySlug(
      slug,
      activeOnly,
    );

    return {
      message: 'Category children retrieved successfully',
      data: children.map((child) =>
        plainToInstance(CategoryResponseDto, child),
      ),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Lấy danh sách size theo category slug - Public
   * GET /categories/:slug/sizes
   */ @Get(':slug/sizes')
  @ApiOperation({
    summary: 'Get active sizes by category slug',
    description:
      'Get all active sizes for a specific category by slug. Public endpoint.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Category slug (e.g., "ao-thun")',
    example: 'ao-thun',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(SizeResponseDto) },
            },
          },
        },
      ],
    },
  })
  async getSizesBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<SizeResponseDto[]>> {
    const sizes = await this.sizesService.findActiveByCategorySlug(slug);

    return {
      message: 'Category sizes retrieved successfully',
      data: sizes.map((size) => plainToInstance(SizeResponseDto, size)),
      meta: {
        timestamp: new Date().toISOString(),
        total: sizes.length,
      },
    };
  }
}
