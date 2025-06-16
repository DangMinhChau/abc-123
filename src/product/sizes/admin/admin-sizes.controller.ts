import {
  Controller,
  Get,
  Post,
  Put,
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
import { AdminSizesService } from './admin-sizes.service';
import {
  CreateSizeDto,
  UpdateSizeDto,
  FilterSizeDto,
  SizeResponseDto,
} from '../dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/constants/user-role.enum';

@ApiTags('Admin Sizes')
@ApiExtraModels(SizeResponseDto, BaseResponseDto, PaginatedResponseDto)
@Controller('admin/sizes')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminSizesController {
  constructor(private readonly adminSizesService: AdminSizesService) {}

  /**
   * Lấy tất cả size với bộ lọc - Admin only
   * GET /admin/sizes
   */
  @Get()
  @ApiOperation({
    summary: 'Get all sizes with filters',
    description:
      'Get all sizes with pagination and filtering options. Admin access required.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({
    name: 'categoryId',
    required: false,
    description: 'Filter by category ID',
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
              items: { $ref: getSchemaPath(SizeResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() filterDto: FilterSizeDto,
  ): Promise<PaginatedResponseDto<SizeResponseDto>> {
    const result = await this.adminSizesService.findAll(filterDto);
    return {
      message: 'Sizes retrieved successfully',
      data: result.sizes.map((size) => plainToInstance(SizeResponseDto, size)),
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
   * Lấy size theo ID - Admin only
   * GET /admin/sizes/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get size by ID',
    description:
      'Get detailed information about a specific size. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Size ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(SizeResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<SizeResponseDto>> {
    const size = await this.adminSizesService.findOne(id);

    return {
      message: 'Size retrieved successfully',
      data: plainToInstance(SizeResponseDto, size),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Tạo mới size - Admin only
   * POST /admin/sizes
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new size',
    description:
      'Create a new size for a specific category. Admin access required.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(SizeResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @Body() createSizeDto: CreateSizeDto,
  ): Promise<BaseResponseDto<SizeResponseDto>> {
    const size = await this.adminSizesService.create(createSizeDto);

    return {
      message: 'Size created successfully',
      data: plainToInstance(SizeResponseDto, size),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Cập nhật size - Admin only
   * PUT /admin/sizes/:id
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update size',
    description: 'Update an existing size. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Size ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(SizeResponseDto) },
          },
        },
      ],
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateSizeDto: UpdateSizeDto,
  ): Promise<BaseResponseDto<SizeResponseDto>> {
    const size = await this.adminSizesService.update(id, updateSizeDto);

    return {
      message: 'Size updated successfully',
      data: plainToInstance(SizeResponseDto, size),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Bật/tắt trạng thái isActive - Admin only
   * PATCH /admin/sizes/:id/toggle
   */
  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'Toggle size active status',
    description: 'Toggle the active status of a size. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Size ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(SizeResponseDto) },
          },
        },
      ],
    },
  })
  async toggleActive(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<SizeResponseDto>> {
    const size = await this.adminSizesService.toggleActive(id);

    return {
      message: `Size ${size.isActive ? 'activated' : 'deactivated'} successfully`,
      data: plainToInstance(SizeResponseDto, size),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xoá mềm size - Admin only
   * DELETE /admin/sizes/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete size',
    description: 'Soft delete a size. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Size ID (UUID)' })
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
  async remove(@Param('id') id: string): Promise<void> {
    await this.adminSizesService.remove(id);
  }
}
