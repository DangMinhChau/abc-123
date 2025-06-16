import { Controller, Get, Param } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiParam,
  ApiExtraModels,
  getSchemaPath,
} from '@nestjs/swagger';
import { VariantsService } from './variants.service';
import { VariantResponseDto } from './dto/responses/variant-response.dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Variants (Public)')
@ApiExtraModels(VariantResponseDto, BaseResponseDto)
@Controller('variants')
export class VariantsController {
  constructor(private readonly variantsService: VariantsService) {}

  /**
   * Lấy thông tin variant theo ID - Public
   * GET /variants/:id
   */
  @Get(':id')
  @ApiOperation({
    summary: 'Get variant by ID',
    description:
      'Get variant details by ID. Public endpoint for adding to cart.',
  })
  @ApiParam({ name: 'id', description: 'Variant ID (UUID)' })
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
      message: 'Variant retrieved successfully',
      data: plainToInstance(VariantResponseDto, variant),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
