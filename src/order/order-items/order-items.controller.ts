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
import { OrderItemsService } from './order-items.service';
import {
  CreateOrderItemDto,
  UpdateOrderItemDto,
  OrderItemResponseDto,
} from './dto';
import { BaseResponseDto } from 'src/common/dto/base-response.dto';
import { JwtAuthGuard, RolesGuard } from 'src/common/guards';
import { Roles } from 'src/common/decorators';
import { UserRole } from 'src/common/constants/user-role.enum';
import { plainToInstance } from 'class-transformer';

@ApiTags('Order Items')
@ApiExtraModels(OrderItemResponseDto, BaseResponseDto)
@ApiBearerAuth()
@Controller('order-items')
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}
  @Post()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Create new order item (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(OrderItemResponseDto) },
          },
        },
      ],
    },
  })
  create(@Body() createOrderItemDto: CreateOrderItemDto) {
    return this.orderItemsService.create(createOrderItemDto);
  }

  @Get()
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Get all order items (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(OrderItemResponseDto) },
            },
          },
        },
      ],
    },
  })
  findAll() {
    return this.orderItemsService.findAll();
  }

  @Get('by-order/:orderId')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order items by order ID' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: {
              type: 'array',
              items: { $ref: getSchemaPath(OrderItemResponseDto) },
            },
          },
        },
      ],
    },
  })
  findByOrderId(@Param('orderId') orderId: string) {
    return this.orderItemsService.findByOrderId(orderId);
  }
  @Get(':id')
  @UseGuards(JwtAuthGuard)
  @ApiOperation({ summary: 'Get order item by ID' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(OrderItemResponseDto) },
          },
        },
      ],
    },
  })
  findOne(
    @Param('id') id: string,
  ): Promise<BaseResponseDto<OrderItemResponseDto>> {
    return this.orderItemsService.findOne(id).then((orderItem) => ({
      message: 'Order item retrieved successfully',
      data: plainToInstance(OrderItemResponseDto, orderItem),
      meta: {
        timestamp: new Date().toISOString(),
      },
    }));
  }
  @Patch(':id')
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Update order item (Admin only)' })
  @ApiOkResponse({
    schema: {
      allOf: [
        { $ref: getSchemaPath(BaseResponseDto) },
        {
          properties: {
            data: { $ref: getSchemaPath(OrderItemResponseDto) },
          },
        },
      ],
    },
  })
  update(
    @Param('id') id: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
  ): Promise<BaseResponseDto<OrderItemResponseDto>> {
    return this.orderItemsService
      .update(id, updateOrderItemDto)
      .then((orderItem) => ({
        message: 'Order item updated successfully',
        data: plainToInstance(OrderItemResponseDto, orderItem),
        meta: {
          timestamp: new Date().toISOString(),
        },
      }));
  }
  @Delete(':id')
  @HttpCode(HttpStatus.NO_CONTENT)
  @UseGuards(JwtAuthGuard, RolesGuard)
  @Roles(UserRole.ADMIN)
  @ApiOperation({ summary: 'Delete order item (Admin only)' })
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
    await this.orderItemsService.remove(id);
    return {
      message: 'Order item deleted successfully',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
