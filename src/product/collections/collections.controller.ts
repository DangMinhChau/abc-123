import { Controller, Get, Param, Query } from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import { CollectionsService } from './collections.service';
import { CollectionResponseDto, CollectionQueryDto } from './dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Collections')
@ApiExtraModels(CollectionResponseDto, BaseResponseDto, PaginatedResponseDto)
@ApiBearerAuth()
@Controller('collections')
export class CollectionsController {
  constructor(private readonly collectionsService: CollectionsService) {}
  @Get()
  @ApiOperation({
    summary: 'Get all active collections with pagination and filtering',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CollectionResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(
    @Query() queryDto: CollectionQueryDto,
  ): Promise<PaginatedResponseDto<CollectionResponseDto>> {
    const result = await this.collectionsService.findAll(queryDto);
    return {
      message: 'Collections retrieved successfully',
      data: plainToInstance(CollectionResponseDto, result.collections),
      meta: {
        timestamp: new Date().toISOString(),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }

  @Get(':slug')
  @ApiOperation({ summary: 'Get active collection by slug' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CollectionResponseDto) },
          },
        },
      ],
    },
  })
  async findBySlug(
    @Param('slug') slug: string,
  ): Promise<BaseResponseDto<CollectionResponseDto>> {
    const collection = await this.collectionsService.findBySlug(slug);
    return {
      message: 'Collection retrieved successfully',
      data: plainToInstance(CollectionResponseDto, collection),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
