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
import { CartsService } from './carts.service';
import {
  CreateCartDto,
  UpdateCartDto,
  MergeGuestCartDto,
  ShippingEstimateRequestDto,
} from './dto/requests';
import {
  CartResponseDto,
  CartSummaryResponseDto,
  CartRecommendationsResponseDto,
  ShippingEstimateResponseDto,
  CartWithItemsResponseDto,
} from './dto/responses';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { PaginatedResponseDto } from 'src/common/dto/paginated-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles, GetUserId } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';

@ApiTags('Carts')
@ApiExtraModels(
  CartResponseDto,
  CartSummaryResponseDto,
  CartRecommendationsResponseDto,
  ShippingEstimateResponseDto,
  CartWithItemsResponseDto,
  MergeGuestCartDto,
  BaseResponseDto,
  PaginatedResponseDto,
)
@ApiBearerAuth()
@Controller('carts')
@UseGuards(JwtAuthGuard)
export class CartsController {
  constructor(private readonly cartsService: CartsService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({ summary: 'Create new cart' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartResponseDto) },
          },
        },
      ],
    },
  })
  async create(
    @Body() createCartDto: CreateCartDto,
  ): Promise<BaseResponseDto<CartResponseDto>> {
    const cart = await this.cartsService.create(createCartDto);
    return {
      message: 'Cart created successfully',
      data: cart,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all carts (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(PaginatedResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CartResponseDto) },
            },
          },
        },
      ],
    },
  })
  async findAll(): Promise<PaginatedResponseDto<CartResponseDto>> {
    return await this.cartsService.findAll();
  }
  @Get('my-cart')
  @ApiOperation({ summary: 'Get current user cart' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartResponseDto) },
          },
        },
      ],
    },
  })
  async getMyCart(
    @GetUserId() userId: string,
  ): Promise<BaseResponseDto<CartResponseDto>> {
    return await this.cartsService.getMyCart(userId);
  }
  @Get('summary')
  @ApiOperation({ summary: 'Get cart summary for current user' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartSummaryResponseDto) },
          },
        },
      ],
    },
  })
  async getCartSummary(
    @GetUserId() userId: string,
  ): Promise<BaseResponseDto<CartSummaryResponseDto>> {
    return await this.cartsService.getCartSummary(userId);
  }
  @Get('recommendations')
  @ApiOperation({ summary: 'Get cart recommendations for current user' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartRecommendationsResponseDto) },
          },
        },
      ],
    },
  })
  getCartRecommendations(@GetUserId() userId: string) {
    return this.cartsService.getCartRecommendations(userId);
  }
  @Get(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get cart by ID (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartResponseDto) },
          },
        },
      ],
    },
  })
  async findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<CartResponseDto>> {
    return await this.cartsService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({ summary: 'Update cart' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartResponseDto) },
          },
        },
      ],
    },
  })
  async update(
    @Param('id') id: string,
    @Body() updateCartDto: UpdateCartDto,
  ): Promise<BaseResponseDto<CartResponseDto>> {
    const cart = await this.cartsService.update(id, updateCartDto);
    return {
      message: 'Cart updated successfully',
      data: this.cartsService.convertToCartResponseDto(cart),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Post('merge-guest-cart')
  @ApiOperation({ summary: 'Merge guest cart with user cart' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartResponseDto) },
          },
        },
      ],
    },
  })
  async mergeGuestCart(
    @GetUserId() userId: string,
    @Body() mergeGuestCartDto: MergeGuestCartDto,
  ): Promise<BaseResponseDto<CartResponseDto>> {
    const cart = await this.cartsService.mergeGuestCart(
      userId,
      mergeGuestCartDto.items,
    );
    return {
      message: 'Guest cart merged successfully',
      data: this.cartsService.convertToCartResponseDto(cart),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Post('shipping-estimate')
  @ApiOperation({ summary: 'Get shipping estimate for cart' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(ShippingEstimateResponseDto) },
          },
        },
      ],
    },
  })
  async getShippingEstimate(
    @GetUserId() userId: string,
    @Body() shippingEstimateDto: ShippingEstimateRequestDto,
  ): Promise<BaseResponseDto<ShippingEstimateResponseDto>> {
    return await this.cartsService.getShippingEstimate(
      userId,
      shippingEstimateDto,
    );
  }
  @Delete(':id/clear')
  @ApiOperation({ summary: 'Clear cart by ID' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartResponseDto) },
          },
        },
      ],
    },
  })
  async clearCart(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<CartResponseDto>> {
    const cart = await this.cartsService.clearCart(id);
    return {
      message: 'Cart cleared successfully',
      data: this.cartsService.convertToCartResponseDto(cart),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete('my-cart/clear')
  @ApiOperation({ summary: 'Clear current user cart' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartResponseDto) },
          },
        },
      ],
    },
  })
  async clearMyCart(
    @GetUserId() userId: string,
  ): Promise<BaseResponseDto<CartResponseDto>> {
    const cart = await this.cartsService.clearCartByUserId(userId);
    return {
      message: 'Your cart cleared successfully',
      data: this.cartsService.convertToCartResponseDto(cart),
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
  @Delete(':id')
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete cart (Admin only)' })
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
    await this.cartsService.remove(id);
    return {
      message: 'Cart deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
