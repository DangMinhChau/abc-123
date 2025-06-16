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
  HttpCode,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import { ReviewsService } from './reviews.service';
import { CreateReviewDto } from './dto/create-review.dto';
import { UpdateReviewDto } from './dto/update-review.dto';
import { ReviewQueryDto } from './dto/review-query.dto';
import { ReviewResponseDto } from './dto/responses';
import {
  BulkDeleteDto,
  BulkVerifyDto,
  ModerateReviewDto,
} from './dto/bulk-review.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles, GetUser } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { User } from 'src/user/users/entities/user.entity';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';

@ApiTags('Reviews')
@ApiExtraModels(ReviewResponseDto, BaseResponseDto, PaginatedResponseDto)
@ApiBearerAuth()
@Controller('reviews')
export class ReviewsController {
  constructor(private readonly reviewsService: ReviewsService) {}

  @Post()
  @HttpCode(HttpStatus.CREATED)
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Create a new review' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ReviewResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @Body() createReviewDto: CreateReviewDto,
    @GetUser() user: User,
  ) {
    return this.reviewsService.create(createReviewDto, user.id);
  }

  @Get()
  @ApiOperation({ summary: 'Get all reviews with pagination' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(ReviewResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(@Query() query: ReviewQueryDto) {
    return this.reviewsService.findAll(query);
  }

  @Get('analytics')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getAnalytics() {
    return this.reviewsService.getAnalytics();
  }

  @Get('moderation/summary')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  async getModerationSummary() {
    return this.reviewsService.getModerationSummary();
  }

  @Get('product/:productId/stats')
  async getProductStats(@Param('productId', ParseUUIDPipe) productId: string) {
    return this.reviewsService.getProductStats(productId);
  }

  @Get('product/:productId/summary')
  async getProductReviewSummary(
    @Param('productId', ParseUUIDPipe) productId: string,
  ) {
    return this.reviewsService.getProductReviewSummary(productId);
  }

  @Get('user/:userId')
  findByUserId(
    @Param('userId') userId: string,
    @Query() query: ReviewQueryDto,
  ) {
    return this.reviewsService.findByUserId(userId, query);
  }

  @Get('can-review/:productId')
  @UseGuards(JwtAuthGuard)
  async canReview(
    @Param('productId', ParseUUIDPipe) productId: string,
    @GetUser() user: User,
  ) {
    return this.reviewsService.canUserReview(user.id, productId);
  }

  @Get(':id')
  findOne(@Param('id', ParseUUIDPipe) id: string) {
    return this.reviewsService.findOne(id);
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard)
  update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateReviewDto: UpdateReviewDto,
    @GetUser() user: User,
  ) {
    return this.reviewsService.update(id, updateReviewDto, user.id, user.role);
  }

  @Delete(':id')
  @UseGuards(JwtAuthGuard)
  remove(@Param('id', ParseUUIDPipe) id: string, @GetUser() user: User) {
    return this.reviewsService.remove(id, user.id);
  }
  @Patch(':id/moderate')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  moderate(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() moderateReviewDto: ModerateReviewDto,
  ) {
    return this.reviewsService.moderate(id, moderateReviewDto);
  }
  @Patch('bulk/verify')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkVerify(@Body() bulkVerifyDto: BulkVerifyDto) {
    return this.reviewsService.bulkVerify(bulkVerifyDto);
  }

  @Delete('bulk/delete')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  bulkDelete(@Body() bulkDeleteDto: BulkDeleteDto) {
    return this.reviewsService.bulkDelete(bulkDeleteDto);
  }
}
