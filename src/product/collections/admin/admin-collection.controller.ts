import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  Query,
  UseInterceptors,
  UseGuards,
  Put,
  UploadedFiles,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiBearerAuth,
  ApiExtraModels,
  getSchemaPath,
  ApiConsumes,
} from '@nestjs/swagger';
import { FileInterceptor, FilesInterceptor } from '@nestjs/platform-express';
import { AdminCollectionsService } from './admin-collections.service';
import {
  CreateCollectionDto,
  UpdateCollectionDto,
  CollectionQueryDto,
  AssignProductsDto,
  CollectionResponseDto,
} from '../dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { plainToInstance } from 'class-transformer';

@ApiTags('Admin - Collections')
@ApiExtraModels(CollectionResponseDto, BaseResponseDto, PaginatedResponseDto)
@Controller('admin/collections')
@UseGuards(JwtAuthGuard, RolesGuard)
@Roles(UserRole.ADMIN)
@ApiBearerAuth('JWT-auth')
export class AdminCollectionController {
  constructor(
    private readonly adminCollectionsService: AdminCollectionsService,
  ) {}
  @Post()
  @ApiOperation({ summary: 'Create a new collection' })
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
  @ApiConsumes('multipart/form-data')
  @UseInterceptors(FilesInterceptor('images', 10)) // Allow up to 10 images
  async create(
    @Body() createCollectionDto: CreateCollectionDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<BaseResponseDto<CollectionResponseDto>> {
    if (images && images.length > 0) {
      createCollectionDto.images = images;
    }
    const collection =
      await this.adminCollectionsService.create(createCollectionDto);
    return {
      message: 'Collection created successfully',
      data: plainToInstance(CollectionResponseDto, collection),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get()
  @ApiOperation({
    summary: 'Get all collections with filtering and pagination',
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
    const result = await this.adminCollectionsService.findAll(queryDto);
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
  @Get(':id')
  @ApiOperation({ summary: 'Get collection by ID' })
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
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<CollectionResponseDto>> {
    const collection = await this.adminCollectionsService.findOne(id);
    return {
      message: 'Collection retrieved successfully',
      data: plainToInstance(CollectionResponseDto, collection),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update collection by ID' })
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
  @UseInterceptors(FileInterceptor('images'))
  async update(
    @Param('id') id: string,
    @Body() updateCollectionDto: UpdateCollectionDto,
    @UploadedFiles() images?: Express.Multer.File[],
  ): Promise<BaseResponseDto<CollectionResponseDto>> {
    if (images) {
      updateCollectionDto.images = images;
    }
    const collection = await this.adminCollectionsService.update(
      id,
      updateCollectionDto,
    );
    return {
      message: 'Collection updated successfully',
      data: plainToInstance(CollectionResponseDto, collection),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Put(':id/products')
  @ApiOperation({ summary: 'Replace all products in collection' })
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
  async replaceProducts(
    @Param('id') id: string,
    @Body() assignProductsDto: AssignProductsDto,
  ): Promise<BaseResponseDto<CollectionResponseDto>> {
    const collection = await this.adminCollectionsService.replaceProducts(
      id,
      assignProductsDto,
    );
    return {
      message: 'Collection products replaced successfully',
      data: plainToInstance(CollectionResponseDto, collection),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Post(':id/products')
  @ApiOperation({ summary: 'Add products to collection' })
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
  async addProducts(
    @Param('id') id: string,
    @Body() assignProductsDto: AssignProductsDto,
  ): Promise<BaseResponseDto<CollectionResponseDto>> {
    const collection = await this.adminCollectionsService.addProducts(
      id,
      assignProductsDto,
    );
    return {
      message: 'Products added to collection successfully',
      data: plainToInstance(CollectionResponseDto, collection),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Delete(':id/products/:productId')
  @ApiOperation({ summary: 'Remove product from collection' })
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
  async removeProduct(
    @Param('id') id: string,
    @Param('productId') productId: string,
  ): Promise<BaseResponseDto<CollectionResponseDto>> {
    const collection = await this.adminCollectionsService.removeProduct(
      id,
      productId,
    );
    return {
      message: 'Product removed from collection successfully',
      data: plainToInstance(CollectionResponseDto, collection),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Delete(':id')
  @ApiOperation({ summary: 'Delete collection by ID' })
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
    await this.adminCollectionsService.remove(id);
    return {
      message: 'Collection deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
