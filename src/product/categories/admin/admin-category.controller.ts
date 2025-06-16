import {
  Controller,
  Get,
  Post,
  Body,
  Put,
  Param,
  Delete,
  Query,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiParam,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { CategoryAdminService } from './category-admin.service';
import { AdminSizesService } from '../../sizes/admin/admin-sizes.service';
import { CreateCategoryDto } from '../dto/requests/create-category.dto';
import { UpdateCategoryDto } from '../dto/requests/update-category.dto';
import { CategoryQueryDto } from '../dto/requests/category-query.dto';
import { CategoryResponseDto } from '../dto/responses/category-response.dto';
import { SizeResponseDto } from '../../sizes/dto/responses/size-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('categories (Admin)')
@ApiExtraModels(
  CategoryResponseDto,
  SizeResponseDto,
  BaseResponseDto,
  PaginatedResponseDto,
)
@Controller('admin/categories')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
@UseGuards(JwtAuthGuard, RolesGuard)
export class AdminCategoryController {
  constructor(
    private readonly categoryAdminService: CategoryAdminService,
    private readonly adminSizesService: AdminSizesService,
  ) {}

  /**
   * Tạo mới category - Admin only
   * POST /admin/categories
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new category',
    description: 'Create a new category. Admin access required.',
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
  @ApiBearerAuth('JWT-auth')
  async create(
    @Body() createCategoryDto: CreateCategoryDto,
  ): Promise<BaseResponseDto<CategoryResponseDto>> {
    const category = await this.categoryAdminService.create(createCategoryDto);
    return {
      message: 'Category created successfully',
      data: plainToInstance(CategoryResponseDto, category),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Lấy tất cả categories (bao gồm cả inactive) - Admin only
   * GET /admin/categories
   */
  @Get()
  @ApiOperation({
    summary: 'Get all categories with pagination',
    description:
      'Get all categories including inactive ones. Admin access required.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
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
  async findAll(
    @Query() queryDto: CategoryQueryDto,
  ): Promise<PaginatedResponseDto<CategoryResponseDto>> {
    const { categories, page, limit, total, totalPages } =
      await this.categoryAdminService.findAll(queryDto);

    return {
      message: 'Categories retrieved successfully',
      data: categories.map((category) =>
        plainToInstance(CategoryResponseDto, category),
      ),
      meta: {
        timestamp: new Date().toISOString(),
        page,
        limit,
        total,
        totalPages,
      },
    };
  }

  /**
   * Lấy chi tiết category theo ID - Admin only
   * GET /admin/categories/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get category by ID',
    description: 'Get category details by ID. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Category ID (UUID)' })
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
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<CategoryResponseDto>> {
    const category = await this.categoryAdminService.findById(id);
    return {
      message: 'Category retrieved successfully',
      data: plainToInstance(CategoryResponseDto, category),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Cập nhật category theo ID - Admin only
   * PUT /admin/categories/:id
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update category by ID',
    description: 'Update category by ID. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Category ID (UUID)' })
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
  async update(
    @Param('id') id: string,
    @Body() updateCategoryDto: UpdateCategoryDto,
  ): Promise<BaseResponseDto<CategoryResponseDto>> {
    const category = await this.categoryAdminService.update(
      id,
      updateCategoryDto,
    );
    return {
      message: 'Category updated successfully',
      data: plainToInstance(CategoryResponseDto, category),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xoá category (soft delete) theo ID - Admin only
   * DELETE /admin/categories/:id
   */ @Delete(':id')
  @ApiOperation({
    summary: 'Delete category by ID',
    description: 'Soft delete category by ID. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Category ID (UUID)' })
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
  async remove(@Param('id') id: string): Promise<BaseResponseDto<null>> {
    await this.categoryAdminService.remove(id);
    return {
      message: 'Category deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Lấy danh mục con theo ID cha - Admin only
   * GET /admin/categories/:id/children
   */
  @Get(':id/children')
  @ApiOperation({
    summary: 'Get category children by parent ID',
    description:
      'Get all child categories of a parent category. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Parent Category ID (UUID)' })
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
  async getChildren(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<CategoryResponseDto[]>> {
    const children = await this.categoryAdminService.getChildrenById(id);

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
   * Lấy danh mục cha theo ID con - Admin only
   * GET /admin/categories/:id/parent
   */
  @Get(':id/parent')
  @ApiOperation({
    summary: 'Get category parent by child ID',
    description:
      'Get parent category of a child category. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Child Category ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              oneOf: [
                { $ref: getSchemaPath(CategoryResponseDto) },
                { type: 'null' },
              ],
            },
          },
        },
      ],
    },
  })
  async getParent(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<CategoryResponseDto | null>> {
    const parent = await this.categoryAdminService.getParentById(id);

    return {
      message: parent
        ? 'Category parent retrieved successfully'
        : 'Category has no parent (is root category)',
      data: parent ? plainToInstance(CategoryResponseDto, parent) : null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Lấy danh sách sản phẩm theo category ID - Admin only
   * GET /admin/categories/:id/products
   */
  @Get(':id/products')
  @ApiOperation({
    summary: 'Get products by category ID',
    description:
      'Get all products belonging to a category. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Category ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  async getProducts(
    @Param('id') id: string,
    @Query('page') page: number = 1,
    @Query('limit') limit: number = 10,
  ): Promise<BaseResponseDto<any>> {
    const products = await this.categoryAdminService.getProductsById(
      id,
      page,
      limit,
    );

    return {
      message: 'Category products retrieved successfully',
      data: products,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Lấy danh sách size theo category ID (bao gồm cả inactive) - Admin only
   * GET /admin/categories/:categoryId/sizes
   */
  @Get(':categoryId/sizes')
  @ApiOperation({
    summary: 'Get sizes by category ID',
    description:
      'Get all sizes belonging to a category (including inactive). Admin access required.',
  })
  @ApiParam({ name: 'categoryId', description: 'Category ID (UUID)' })
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
  async getSizes(
    @Param('categoryId') categoryId: string,
  ): Promise<BaseResponseDto<SizeResponseDto[]>> {
    const sizes = await this.adminSizesService.findAllByCategoryId(categoryId);

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
