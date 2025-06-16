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
import { StylesService } from './styles.service';
import { StyleResponseDto } from './dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Styles (Public)')
@ApiExtraModels(StyleResponseDto, BaseResponseDto)
@ApiBearerAuth()
@Controller('styles')
export class StylesController {
  constructor(private readonly stylesService: StylesService) {}

  /**
   * Lấy danh sách style đang hoạt động - Public
   * GET /styles
   */ @Get()
  @ApiOperation({
    summary: 'Get all active styles',
    description: 'Get all styles with isActive = true. Public endpoint.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
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
  async findActive(): Promise<BaseResponseDto<StyleResponseDto[]>> {
    const styles = await this.stylesService.findActive();

    return {
      message: 'Active styles retrieved successfully',
      data: styles.map((style) => plainToInstance(StyleResponseDto, style)),
      meta: {
        timestamp: new Date().toISOString(),
        total: styles.length,
      },
    };
  }

  /**
   * Lấy chi tiết style theo slug - Public
   * GET /styles/:slug
   */
  @Get(':slug')
  @ApiOperation({
    summary: 'Get style by slug',
    description: 'Get style details by slug. Public endpoint.',
  })
  @ApiParam({
    name: 'slug',
    description: 'Style slug (e.g., "minimalist")',
    example: 'minimalist',
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
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<StyleResponseDto>> {
    const style = await this.stylesService.findBySlug(slug);

    return {
      message: 'Style retrieved successfully',
      data: plainToInstance(StyleResponseDto, style),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
