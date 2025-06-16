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
  ApiCreatedResponse,
  ApiParam,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { AdminTagsService } from './admin-tags.service';
import {
  CreateTagDto,
  UpdateTagDto,
  TagQueryDto,
  TagResponseDto,
} from '../dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { RolesGuard } from 'src/common/guards/roles.guard';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/constants/user-role.enum';

@ApiTags('tags (Admin)')
@ApiExtraModels(TagResponseDto, BaseResponseDto, PaginatedResponseDto)
@Controller('admin/tags')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
export class AdminTagsController {
  constructor(private readonly adminTagsService: AdminTagsService) {}
  /**
   * Lấy tất cả tag với bộ lọc - Admin only
   * GET /admin/tags
   */
  @Get()
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get all tags with filters',
    description:
      'Get all tags with pagination and filtering options. Admin access required.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(TagResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() queryDto: TagQueryDto,
  ): Promise<PaginatedResponseDto<TagResponseDto>> {
    const result = await this.adminTagsService.findAll(queryDto);

    return {
      message: 'Tags retrieved successfully',
      data: result.tags.map((tag) => plainToInstance(TagResponseDto, tag)),
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
   * Lấy tag theo ID - Admin only
   * GET /admin/tags/:id
   */
  @Get(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Get tag by ID',
    description:
      'Get detailed information about a specific tag. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Tag ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TagResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.adminTagsService.findOne(id);

    return {
      message: 'Tag retrieved successfully',
      data: plainToInstance(TagResponseDto, tag),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Tạo mới tag - Admin only
   * POST /admin/tags
   */
  @Post()
  @ApiBearerAuth('JWT-auth')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new tag',
    description: 'Create a new tag. Admin access required.',
  })
  @ApiCreatedResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TagResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @Body() createTagDto: CreateTagDto,
  ): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.adminTagsService.create(createTagDto);

    return {
      message: 'Tag created successfully',
      data: plainToInstance(TagResponseDto, tag),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Cập nhật tag - Admin only
   * PUT /admin/tags/:id
   */
  @Put(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Update tag',
    description: 'Update an existing tag. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Tag ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TagResponseDto) },
          },
        },
      ],
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateTagDto: UpdateTagDto,
  ): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.adminTagsService.update(id, updateTagDto);

    return {
      message: 'Tag updated successfully',
      data: plainToInstance(TagResponseDto, tag),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Bật/tắt trạng thái isActive - Admin only
   * PATCH /admin/tags/:id/toggle
   */
  @Patch(':id/toggle')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Toggle tag active status',
    description: 'Toggle the active status of a tag. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Tag ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(TagResponseDto) },
          },
        },
      ],
    },
  })
  async toggleActive(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.adminTagsService.toggleActive(id);

    return {
      message: `Tag ${tag.isActive ? 'activated' : 'deactivated'} successfully`,
      data: plainToInstance(TagResponseDto, tag),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Xoá mềm tag - Admin only
   * DELETE /admin/tags/:id
   */ @Delete(':id')
  @ApiBearerAuth('JWT-auth')
  @ApiOperation({
    summary: 'Delete tag',
    description: 'Soft delete a tag. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Tag ID (UUID)' })
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
    await this.adminTagsService.remove(id);
    return {
      message: 'Tag deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
