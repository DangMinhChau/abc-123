import { Controller, Get } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import { plainToInstance } from 'class-transformer';
import { SizesService } from './sizes.service';
import { SizeResponseDto } from './dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';

@ApiTags('Sizes (Public)')
@ApiExtraModels(SizeResponseDto, BaseResponseDto)
@ApiBearerAuth()
@Controller('sizes')
export class SizesController {
  constructor(private readonly sizesService: SizesService) {}

  /**
   * Lấy danh sách size đang hoạt động - Public
   * GET /sizes
   */ @Get()
  @ApiOperation({
    summary: 'Get all active sizes',
    description:
      'Get all active sizes available for selection. Public endpoint.',
  })
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
  async findActive(): Promise<BaseResponseDto<SizeResponseDto[]>> {
    const sizes = await this.sizesService.findActive();

    return {
      message: 'Active sizes retrieved successfully',
      data: sizes.map((size) => plainToInstance(SizeResponseDto, size)),
      meta: {
        timestamp: new Date().toISOString(),
        total: sizes.length,
      },
    };
  }
}
