import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import { MaterialsService } from './materials.service';
import { MaterialResponseDto } from './dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Materials (Public)')
@ApiExtraModels(MaterialResponseDto, BaseResponseDto)
@ApiBearerAuth()
@Controller('materials')
export class MaterialsController {
  constructor(private readonly materialsService: MaterialsService) {}

  /**
   * Lấy danh sách chất liệu đang hoạt động - Public
   * GET /materials
   */ @Get()
  @ApiOperation({
    summary: 'Get all active materials',
    description: 'Get all materials with isActive = true. Public endpoint.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
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
  async findActive(): Promise<BaseResponseDto<MaterialResponseDto[]>> {
    const materials = await this.materialsService.findActive();

    return {
      message: 'Active materials retrieved successfully',
      data: materials.map((material) =>
        plainToInstance(MaterialResponseDto, material),
      ),
      meta: {
        timestamp: new Date().toISOString(),
        total: materials.length,
      },
    };
  }

  /**
   * Lấy chi tiết chất liệu theo slug - Public
   * GET /materials/:slug
   */ @Get(':slug')
  @ApiOperation({
    summary: 'Get material by slug',
    description: 'Get material details by slug. Public endpoint.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Material slug (e.g., "cotton")',
    example: 'cotton',
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
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<MaterialResponseDto>> {
    const material = await this.materialsService.findBySlug(slug);

    return {
      message: 'Material retrieved successfully',
      data: plainToInstance(MaterialResponseDto, material),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
