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
import { CartItemsService } from './cart-items.service';
import {
  CreateCartItemDto,
  UpdateCartItemDto,
  AddToCartDto,
} from './dto/requests';
import {
  CartItemResponseDto,
  CartValidationResponseDto,
  CartItemsSummaryResponseDto,
} from './dto/responses';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles, GetUserId } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { CartItem } from './entities/cart-item.entity';

@ApiTags('Cart Items')
@ApiExtraModels(
  CartItemResponseDto,
  CartValidationResponseDto,
  CartItemsSummaryResponseDto,
  BaseResponseDto,
)
@Controller('cart-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class CartItemsController {
  constructor(private readonly cartItemsService: CartItemsService) {}
  @Post()
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Create cart item',
    description: 'Create a new cart item',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartItemResponseDto) },
          },
        },
      ],
    },
  })
  create(
    @Body() createCartItemDto: CreateCartItemDto,
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    return this.cartItemsService.create(createCartItemDto);
  }
  @Post('add-to-cart')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Add item to cart',
    description: 'Add a product variant to user cart',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartItemResponseDto) },
          },
        },
      ],
    },
  })
  addToCart(
    @GetUserId() userId: string,
    @Body() addToCartDto: AddToCartDto,
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    return this.cartItemsService.addToCart(
      userId,
      addToCartDto.variantId,
      addToCartDto.quantity,
    );
  }
  @Post('bulk-add-to-cart')
  @HttpCode(HttpStatus.CREATED)
  @ApiOperation({
    summary: 'Bulk add items to cart',
    description: 'Add multiple product variants to user cart',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CartItemResponseDto) },
            },
          },
        },
      ],
    },
  })
  bulkAddToCart(
    @GetUserId() userId: string,
    @Body() body: { items: { variantId: string; quantity: number }[] },
  ): Promise<BaseResponseDto<CartItemResponseDto[]>> {
    return this.cartItemsService.bulkAddToCart(userId, body.items);
  }
  @Post('validate-cart')
  @ApiOperation({
    summary: 'Validate cart items',
    description: 'Validate all cart items for user',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartValidationResponseDto) },
          },
        },
      ],
    },
  })
  validateCart(
    @GetUserId() userId: string,
  ): Promise<BaseResponseDto<CartValidationResponseDto>> {
    return this.cartItemsService.validateCartItems(userId);
  }
  @Get()
  @UseGuards(RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({
    summary: 'Get all cart items (Admin)',
    description: 'Retrieve all cart items. Admin access required.',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CartItemResponseDto) },
            },
          },
        },
      ],
    },
  })
  findAll(): Promise<BaseResponseDto<CartItemResponseDto[]>> {
    return this.cartItemsService.findAll();
  }
  @Get('my-cart-items')
  @ApiOperation({
    summary: 'Get my cart items',
    description: 'Get cart items for current user',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CartItemResponseDto) },
            },
          },
        },
      ],
    },
  })
  getMyCartItems(
    @GetUserId() userId: string,
  ): Promise<BaseResponseDto<CartItemResponseDto[]>> {
    return this.cartItemsService.findByUserId(userId);
  }
  @Get('cart/:cartId')
  @ApiOperation({
    summary: 'Get cart items by cart ID',
    description: 'Get all items in a specific cart',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(CartItemResponseDto) },
            },
          },
        },
      ],
    },
  })
  findByCartId(@Param('cartId') cartId: string): Promise<CartItem[]> {
    return this.cartItemsService.findByCartId(cartId);
  }
  @Get('my-cart-summary')
  @ApiOperation({
    summary: 'Get cart summary',
    description: 'Get cart items summary for current user',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartItemsSummaryResponseDto) },
          },
        },
      ],
    },
  })
  getCartItemsSummary(@GetUserId() userId: string) {
    return this.cartItemsService.getCartItemsSummary(userId);
  }
  @Get(':id')
  @ApiOperation({
    summary: 'Get cart item by ID',
    description: 'Get a specific cart item by ID',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartItemResponseDto) },
          },
        },
      ],
    },
  })
  findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    return this.cartItemsService.findOne(id);
  }
  @Patch(':id')
  @ApiOperation({
    summary: 'Update cart item',
    description: 'Update a cart item (e.g., quantity)',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartItemResponseDto) },
          },
        },
      ],
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateCartItemDto: UpdateCartItemDto,
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    return this.cartItemsService.update(id, updateCartItemDto);
  }
  @Patch(':id/quantity')
  @ApiOperation({
    summary: 'Update cart item quantity',
    description: 'Update the quantity of a cart item',
  })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(CartItemResponseDto) },
          },
        },
      ],
    },
  })
  updateQuantity(
    @Param('id') id: string,
    @Body() body: { quantity: number },
  ): Promise<BaseResponseDto<CartItemResponseDto>> {
    return this.cartItemsService.updateQuantity(id, body.quantity);
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Delete cart item',
    description: 'Remove a cart item by ID',
  })
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
  async remove(@Param('id') id: string): Promise<void> {
    await this.cartItemsService.remove(id);
  }
  @Delete('my-cart-items/:variantId')
  @HttpCode(HttpStatus.NO_CONTENT)
  @ApiOperation({
    summary: 'Remove item from my cart',
    description: 'Remove a product variant from current user cart',
  })
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
  async removeFromMyCart(
    @GetUserId() userId: string,
    @Param('variantId') variantId: string,
  ): Promise<void> {
    await this.cartItemsService.removeFromCart(userId, variantId);
  }

  @Delete('my-cart-items/clear')
  @HttpCode(HttpStatus.NO_CONTENT)
  async clearMyCartItems(@GetUserId() userId: string): Promise<void> {
    await this.cartItemsService.clearMyCartItems(userId);
  }
}
