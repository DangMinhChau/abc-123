import {
  Controller,
  Get,
  Post,
  Body,
  Patch,
  Param,
  Delete,
  UseGuards,
  HttpCode,
  HttpStatus,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiOkResponse,
  ApiExtraModels,
  ApiBearerAuth,
  getSchemaPath,
} from '@nestjs/swagger';
import { WishlistsService } from './wishlists.service';
import {
  CreateWishlistDto,
  UpdateWishlistDto,
  AddToWishlistDto,
  MoveToCartDto,
  WishlistResponseDto,
} from './dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles, GetUserId } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';

@ApiTags('Wishlists')
@ApiExtraModels(WishlistResponseDto, BaseResponseDto)
@ApiBearerAuth()
@Controller('wishlists')
@UseGuards(JwtAuthGuard)
export class WishlistsController {
  constructor(private readonly wishlistsService: WishlistsService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new wishlist' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(WishlistResponseDto) },
          },
        },
      ],
    },
  })
  create(@Body() createWishlistDto: CreateWishlistDto) {
    return this.wishlistsService.create(createWishlistDto);
  }
  @Post('add')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Add item to wishlist' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(WishlistResponseDto) },
          },
        },
      ],
    },
  })
  addToWishlist(
    @GetUserId() userId: string,
    @Body() addToWishlistDto: AddToWishlistDto,
  ) {
    return this.wishlistsService.addToWishlist(userId, addToWishlistDto);
  }
  @Post('toggle/:productId')
  @HttpCode(HttpStatus.OK)
  @ApiOperation({ summary: 'Toggle product in wishlist' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { type: 'object' },
          },
        },
      ],
    },
  })
  toggleWishlist(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.toggleWishlist(userId, productId);
  }

  @Patch('move-to-cart/:productId')
  @HttpCode(HttpStatus.OK)
  moveToCart(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
    @Body() moveToCartDto: Omit<MoveToCartDto, 'productId'>,
  ) {
    return this.wishlistsService.moveToCart(userId, {
      productId,
      ...moveToCartDto,
    });
  }
  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all wishlists (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(WishlistResponseDto) },
            },
          },
        },
      ],
    },
  })
  findAll() {
    return this.wishlistsService.findAll();
  }

  @Get('my-wishlist')
  @ApiOperation({ summary: 'Get current user wishlist' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(WishlistResponseDto) },
          },
        },
      ],
    },
  })
  getMyWishlist(@GetUserId() userId: string) {
    return this.wishlistsService.findByUserId(userId);
  }

  @Get('count')
  getWishlistCount(@GetUserId() userId: string) {
    return this.wishlistsService.getWishlistCount(userId);
  }

  @Get('check/:productId')
  checkInWishlist(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.isInWishlist(userId, productId);
  }

  @Get(':id')
  findOne(@Param('id') id: string) {
    return this.wishlistsService.findOne(id);
  }

  @Patch(':id')
  update(
    @Param('id') id: string,
    @Body() updateWishlistDto: UpdateWishlistDto,
  ) {
    return this.wishlistsService.update(id, updateWishlistDto);
  }

  @Delete('clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  clearWishlist(@GetUserId() userId: string) {
    return this.wishlistsService.clearWishlist(userId);
  }

  @Delete('remove/:productId')
  @HttpCode(HttpStatus.NO_CONTENT)
  removeFromWishlist(
    @GetUserId() userId: string,
    @Param('productId') productId: string,
  ) {
    return this.wishlistsService.removeFromWishlist(userId, productId);
  }

  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  remove(@Param('id') id: string) {
    return this.wishlistsService.remove(id);
  }
}
