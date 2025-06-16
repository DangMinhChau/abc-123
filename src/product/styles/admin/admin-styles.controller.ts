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
import { AdminStylesService } from './admin-styles.service';
import {
  CreateStyleDto,
  UpdateStyleDto,
  StyleQueryDto,
  StyleResponseDto,
} from '../dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators/roles.decorator';
import { UserRole } from 'src/common/constants/user-role.enum';

@ApiTags('Admin Styles')
@ApiExtraModels(StyleResponseDto, BaseResponseDto, PaginatedResponseDto)
@Controller('admin/styles')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminStylesController {
  constructor(private readonly adminStylesService: AdminStylesService) {}

  /**
   * Lấy tất cả style với bộ lọc - Admin only
   * GET /admin/styles
   */
  @Get()
  @ApiOperation({
    summary: 'Get all styles with filters',
    description:
      'Get all styles with pagination and filtering options. Admin access required.',
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
              items: { $ref: getSchemaPath(StyleResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() queryDto: StyleQueryDto,
  ): Promise<PaginatedResponseDto<StyleResponseDto>> {
    const result = await this.adminStylesService.findAll(queryDto);

    return {
      message: 'Styles retrieved successfully',
      data: result.styles.map((style) =>
        plainToInstance(StyleResponseDto, style),
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
   * Lấy style theo ID - Admin only
   * GET /admin/styles/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get style by ID',
    description:
      'Get detailed information about a specific style. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Style ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(StyleResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<StyleResponseDto>> {
    const style = await this.adminStylesService.findOne(id);

    return {
      message: 'Style retrieved successfully',
      data: plainToInstance(StyleResponseDto, style),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Tạo mới style - Admin only
   * POST /admin/styles
   */ @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create new style',
    description: 'Create a new style. Admin access required.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(StyleResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @Body() createStyleDto: CreateStyleDto,
  ): Promise<BaseResponseDto<StyleResponseDto>> {
    const style = await this.adminStylesService.create(createStyleDto);

    return {
      message: 'Style created successfully',
      data: plainToInstance(StyleResponseDto, style),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Cập nhật style - Admin only
   * PUT /admin/styles/:id
   */
  @Put(':id')
  @ApiOperation({
    summary: 'Update style',
    description: 'Update an existing style. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Style ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(StyleResponseDto) },
          },
        },
      ],
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateStyleDto: UpdateStyleDto,
  ): Promise<BaseResponseDto<StyleResponseDto>> {
    const style = await this.adminStylesService.update(id, updateStyleDto);

    return {
      message: 'Style updated successfully',
      data: plainToInstance(StyleResponseDto, style),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  /**
   * Bật/tắt trạng thái isActive - Admin only
   * PATCH /admin/styles/:id/toggle
   */
  @Patch(':id/toggle')
  @ApiOperation({
    summary: 'Toggle style active status',
    description: 'Toggle the active status of a style. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Style ID (UUID)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(StyleResponseDto) },
          },
        },
      ],
    },
  })
  async toggleActive(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<StyleResponseDto>> {
    const style = await this.adminStylesService.toggleActive(id);
    return {
      message: `Style ${style.isActive ? 'activated' : 'deactivated'} successfully`,
      data: plainToInstance(StyleResponseDto, style),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  /**
   * Xoá mềm style - Admin only
   * DELETE /admin/styles/:id
   */ @Delete(':id')
  @ApiOperation({
    summary: 'Delete style',
    description: 'Soft delete a style. Admin access required.',
  })
  @ApiParam({ name: 'id', description: 'Style ID (UUID)' })
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
    await this.adminStylesService.remove(id);
    return {
      message: 'Style deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
