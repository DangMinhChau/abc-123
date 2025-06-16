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
import { TagsService } from './tags.service';
import { TagResponseDto } from './dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Tags')
@ApiExtraModels(TagResponseDto, BaseResponseDto)
@ApiBearerAuth()
@Controller('tags')
export class TagsController {
  constructor(private readonly tagsService: TagsService) {}

  /**
   * Lấy danh sách tag đang hoạt động
   * GET /tags
   */ @Get()
  @ApiOperation({
    summary: 'Get all active tags',
    description: 'Get list of all active tags for public use',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
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
  async findActive(): Promise<BaseResponseDto<TagResponseDto[]>> {
    const tags = await this.tagsService.findActive();

    return {
      message: 'Active tags retrieved successfully',
      data: tags.map((tag) => plainToInstance(TagResponseDto, tag)),
      meta: {
        timestamp: new Date().toISOString(),
        total: tags.length,
      },
    };
  }

  /**
   * Lấy chi tiết tag theo slug
   * GET /tags/:slug
   */ @Get(':slug')
  @ApiOperation({
    summary: 'Get tag by slug',
    description:
      'Get detailed information about a specific active tag by its slug',
  })
  @ApiParam({ name: 'slug', description: 'Tag slug', example: 'casual' })
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
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<TagResponseDto>> {
    const tag = await this.tagsService.findBySlug(slug);

    return {
      message: 'Tag retrieved successfully',
      data: plainToInstance(TagResponseDto, tag),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
