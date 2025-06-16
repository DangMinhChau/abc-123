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
import { AdminMaterialsService } from 'src/product/materials/admin/admin-materials.service';
import {
  CreateMaterialDto,
  UpdateMaterialDto,
  MaterialQueryDto,
  MaterialResponseDto,
} from '../dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/constants/user-role.enum';

@ApiTags('Admin Materials')
@ApiExtraModels(MaterialResponseDto, BaseResponseDto, PaginatedResponseDto)
@Controller('admin/materials')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-token')
export class AdminMaterialsController {
  constructor(private readonly adminMaterialsService: AdminMaterialsService) {}

  /**
   * Lấy tất cả chất liệu với bộ lọc - Admin only
   * GET /admin/materials
   */
  @Get()
  @ApiOperation({
    summary: 'Get all materials with filters',
    description:
      'Get all materials with pagination and filtering options. Admin access required.',
  })
  @ApiQuery({ name: 'page', required: false, example: 1 })
  @ApiQuery({ name: 'limit', required: false, example: 20 })
  @ApiQuery({ name: 'search', required: false, description: 'Search by name' })
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
              items: { $ref: getSchemaPath(MaterialResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() queryDto: MaterialQueryDto,
  ): Promise<PaginatedResponseDto<MaterialResponseDto>> {
    const result = await this.adminMaterialsService.findAll(queryDto);

    return {
      message: 'Materials retrieved successfully',
      data: result.materials.map((material) =>
        plainToInstance(MaterialResponseDto, material),
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
   * Lấy chất liệu theo ID - Admin only
   * GET /admin/materials/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get material by ID',
    description:
      'Get detailed information about a specific material. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Material ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(MaterialResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<MaterialResponseDto>> {
    const material = await this.adminMaterialsService.findOne(id);

    return {
      message: 'Material retrieved successfully',
      data: plainToInstance(MaterialResponseDto, material),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Tạo mới chất liệu - Admin only
   * POST /admin/materials
   */
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new material',
    description: 'Create a new material. Admin access required.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(MaterialResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @Body() createMaterialDto: CreateMaterialDto,
  ): Promise<BaseResponseDto<MaterialResponseDto>> {
    const material = await this.adminMaterialsService.create(createMaterialDto);

    return {
      message: 'Material created successfully',
      data: plainToInstance(MaterialResponseDto, material),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Cập nhật chất liệu - Admin only
   * PUT /admin/materials/:id
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update material',
    description: 'Update an existing material. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Material ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(MaterialResponseDto) },
          },
        },
      ],
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateMaterialDto: UpdateMaterialDto,
  ): Promise<BaseResponseDto<MaterialResponseDto>> {
    const material = await this.adminMaterialsService.update(
      id,
      updateMaterialDto,
    );

    return {
      message: 'Material updated successfully',
      data: plainToInstance(MaterialResponseDto, material),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Bật/tắt trạng thái isActive - Admin only
   * PATCH /admin/materials/:id/toggle
   */
  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'Toggle material active status',
    description:
      'Toggle the active status of a material. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Material ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(MaterialResponseDto) },
          },
        },
      ],
    },
  })
  async toggleActive(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<MaterialResponseDto>> {
    const material = await this.adminMaterialsService.toggleActive(id);

    return {
      message: `Material ${material.isActive ? 'activated' : 'deactivated'} successfully`,
      data: plainToInstance(MaterialResponseDto, material),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xoá mềm chất liệu - Admin only
   * DELETE /admin/materials/:id
   */
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete material',
    description: 'Soft delete a material. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Material ID (UUID)' })
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
    await this.adminMaterialsService.remove(id);
    return {
      message: 'Material deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
