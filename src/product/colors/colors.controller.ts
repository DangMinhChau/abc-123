import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { ColorsService } from './colors.service';
import { ColorResponseDto } from './dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Colors (Public)')
@ApiExtraModels(ColorResponseDto, BaseResponseDto)
@Controller('colors')
export class ColorsController {
  constructor(private readonly colorsService: ColorsService) {}

  /**
   * Lấy danh sách màu đang hoạt động - Public
   * GET /colors
   */ @Get()
  @ApiOperation({
    summary: 'Get all active colors',
    description: 'Get all colors with isActive = true. Public endpoint.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
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
  async findActive(): Promise<BaseResponseDto<ColorResponseDto[]>> {
    const colors = await this.colorsService.findActive();

    return {
      message: 'Active colors retrieved successfully',
      data: colors.map((color) => plainToInstance(ColorResponseDto, color)),
      meta: {
        timestamp: new Date().toISOString(),
        total: colors.length,
      },
    };
  }

  /**
   * Lấy chi tiết màu theo code - Public
   * GET /colors/:code
   */ @Get(':code')
  @ApiOperation({
    summary: 'Get color by code',
    description:
      'Get color details by code (e.g., RED, BLUE). Public endpoint.',
  })
  @ApiParam({
    name: 'code',
    description: 'Color code (e.g., "RED", "BLUE")',
    example: 'RED',
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
  async findByCode(
    @Param('code') code: string,
  ): Promise<BaseResponseDto<ColorResponseDto>> {
    const color = await this.colorsService.findByCode(code);

    return {
      message: 'Color retrieved successfully',
      data: plainToInstance(ColorResponseDto, color),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
