import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseGuards,
  UseInterceptors,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  ApiConsumes,
  getSchemaPath,
} from '@nestjs/swagger';
import { FilesInterceptor } from '@nestjs/platform-express';
import { VariantsService } from './variants.service';
import {
  CreateVariantDto,
  UpdateVariantDto,
  VariantQueryDto,
  VariantResponseDto,
  UpdateStockDto,
} from './dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('variants (Admin)')
@ApiExtraModels(VariantResponseDto, BaseResponseDto, PaginatedResponseDto)
@Controller('admin/variants')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth()
export class AdminVariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  // ====== CRUD CƠ BẢN ======
  @Post()
  @ApiOperation({ summary: 'Tạo mới một variant' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(VariantResponseDto) },
          },
        },
      ],
    },
  })
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images'))
  async create(
    @Body() createVariantDto: CreateVariantDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<BaseResponseDto<VariantResponseDto>> {
    if (images && images.length > 0) {
      createVariantDto.images = images;
    }
    const variant = await this.variantsService.create(createVariantDto);
    return {
      message: 'Variant được tạo thành công',
      data: plainToInstance(VariantResponseDto, variant, {
        excludeExtraneousValues: true,
      }),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get()
  @ApiOperation({ summary: 'Lấy danh sách variants với filter' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(VariantResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() queryDto: VariantQueryDto,
  ): Promise<PaginatedResponseDto<VariantResponseDto>> {
    const result = await this.variantsService.findAll(queryDto);
    return {
      message: 'Danh sách variants được lấy thành công',
      data: plainToInstance(VariantResponseDto, result.variants, {
        excludeExtraneousValues: true,
      }),
      meta: {
        timestamp: new Date().toISOString(),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
  @Get(':id')
  @ApiOperation({ summary: 'Lấy chi tiết 1 variant' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(VariantResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<VariantResponseDto>> {
    const variant = await this.variantsService.findOne(id);
    return {
      message: 'Chi tiết variant',
      data: plainToInstance(VariantResponseDto, variant, {
        excludeExtraneousValues: true,
      }),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Cập nhật toàn bộ thông tin variant' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(VariantResponseDto) },
          },
        },
      ],
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateVariantDto: UpdateVariantDto,
  ): Promise<BaseResponseDto<VariantResponseDto>> {
    const variant = await this.variantsService.update(id, updateVariantDto);
    return {
      message: 'Variant được cập nhật thành công',
      data: plainToInstance(VariantResponseDto, variant, {
        excludeExtraneousValues: true,
      }),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Xoá variant' })
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
    await this.variantsService.remove(id);
    return {
      message: 'Variant được xoá thành công',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id/stock')
  @ApiOperation({ summary: 'Cập nhật số lượng tồn kho của variant' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(VariantResponseDto) },
          },
        },
      ],
    },
  })
  async updateStock(
    @Param('id') id: string,
    @Body() updateStockDto: UpdateStockDto,
  ): Promise<BaseResponseDto<VariantResponseDto>> {
    const variant = await this.variantsService.updateStock(id, updateStockDto);
    return {
      message: 'Số lượng tồn kho được cập nhật thành công',
      data: plainToInstance(VariantResponseDto, variant, {
        excludeExtraneousValues: true,
      }),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
