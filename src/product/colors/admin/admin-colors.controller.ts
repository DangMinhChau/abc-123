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
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiQuery,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AdminColorsService } from 'src/product/colors/admin/admin-colors.service';
import {
  CreateColorDto,
  UpdateColorDto,
  ColorQueryDto,
  ColorResponseDto,
} from '../dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/constants/user-role.enum';

@ApiTags('Admin Colors')
@ApiExtraModels(ColorResponseDto, BaseResponseDto, PaginatedResponseDto)
@Controller('admin/colors')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminColorsController {
  constructor(private readonly adminColorsService: AdminColorsService) {}

  /**
   * Lấy tất cả màu với bộ lọc - Admin only
   * GET /admin/colors
   */
  @Get()
  @ApiOperation({
    summary: 'Get all colors with filters',
    description:
      'Get all colors with pagination and filtering options. Admin access required.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'search',
    required: false,
    description: 'Search in color name or description',
  })
  @ApiQuery({
    name: 'isActive',
    required: false,
    description: 'Filter by active status',
  })
  @ApiQuery({
    name: 'sortBy',
    required: false,
    enum: ['name', 'createdAt', 'updatedAt'],
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
              items: { $ref: getSchemaPath(ColorResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() queryDto: ColorQueryDto,
  ): Promise<PaginatedResponseDto<ColorResponseDto>> {
    console.log('AdminColorsController.findAll called with query:', queryDto);

    const result = await this.adminColorsService.findAll(queryDto);

    console.log('Service result:', result);

    return {
      message: 'Colors retrieved successfully',
      data: result.colors.map((color) =>
        plainToInstance(ColorResponseDto, color),
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
   * Lấy màu theo ID - Admin only
   * GET /admin/colors/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get color by ID',
    description: 'Get color details by ID. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Color ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ColorResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<ColorResponseDto>> {
    const color = await this.adminColorsService.findOne(id);

    return {
      message: 'Color retrieved successfully',
      data: plainToInstance(ColorResponseDto, color),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Tạo mới màu - Admin only
   * POST /admin/colors
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new color',
    description:
      'Create a new color with name, code, and hexCode. Admin access required.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ColorResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @Body() createColorDto: CreateColorDto,
  ): Promise<BaseResponseDto<ColorResponseDto>> {
    const color = await this.adminColorsService.create(createColorDto);

    return {
      message: 'Color created successfully',
      data: plainToInstance(ColorResponseDto, color),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Cập nhật màu - Admin only
   * PATCH /admin/colors/:id
   */
  @Patch(':id')
  @ApiOperation({
    summary: 'Update color',
    description: 'Update an existing color. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Color ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ColorResponseDto) },
          },
        },
      ],
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateColorDto: UpdateColorDto,
  ): Promise<BaseResponseDto<ColorResponseDto>> {
    const color = await this.adminColorsService.update(id, updateColorDto);

    return {
      message: 'Color updated successfully',
      data: plainToInstance(ColorResponseDto, color),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xoá mềm màu - Admin only
   * DELETE /admin/colors/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete color',
    description: 'Soft delete a color. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Color ID (UUID)' })
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
    await this.adminColorsService.remove(id);
    return {
      message: 'Color deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
