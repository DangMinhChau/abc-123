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
  ParseUUIDPipe,
} from '@nestjs/common';
import {
  ApiTags,
  ApiOperation,
  ApiResponse,
  ApiBearerAuth,
} from '@nestjs/swagger';
import { JwtAuthGuard } from '../../common/guards';
import { GetUser } from '../../common/decorators';
import { User } from '../../user/users/entities/user.entity';
import { BaseResponseDto, PaginatedResponseDto } from '../../common/dto';
import { OrderItemsService } from './order-items.service';
import {
  CreateOrderItemDto,
  UpdateOrderItemDto,
  OrderItemQueryDto,
  OrderItemResponseDto,
} from './dto';

@ApiTags('Order Items')
@Controller('order-items')
@UseGuards(JwtAuthGuard)
@ApiBearerAuth()
export class OrderItemsController {
  constructor(private readonly orderItemsService: OrderItemsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new order item' })
  @ApiResponse({
    status: 201,
    description: 'Order item created successfully',
    type: BaseResponseDto<OrderItemResponseDto>,
  })
  async create(
    @Body() createOrderItemDto: CreateOrderItemDto,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<OrderItemResponseDto>> {
    const orderItem = await this.orderItemsService.create(
      createOrderItemDto,
      user,
    );

    return {
      message: 'Tạo order item thành công',
      data: orderItem,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get()
  @ApiOperation({ summary: 'Get all order items with optional filtering' })
  @ApiResponse({
    status: 200,
    description: 'Order items retrieved successfully',
    type: PaginatedResponseDto<OrderItemResponseDto>,
  })
  async findAll(
    @Query() query: OrderItemQueryDto,
    @GetUser() user: User,
  ): Promise<PaginatedResponseDto<OrderItemResponseDto>> {
    const orderItems = await this.orderItemsService.findAll(query, user);

    // In a real implementation, you would get pagination info from the service
    const page = query.page || 1;
    const limit = query.limit || 20;

    return {
      message: 'Lấy danh sách order items thành công',
      data: orderItems,
      meta: {
        timestamp: new Date().toISOString(),
        page,
        limit,
        total: orderItems.length, // This should come from the service
        totalPages: Math.ceil(orderItems.length / limit),
      },
    };
  }

  @Get(':id')
  @ApiOperation({ summary: 'Get order item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order item retrieved successfully',
    type: BaseResponseDto<OrderItemResponseDto>,
  })
  async findOne(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<OrderItemResponseDto>> {
    const orderItem = await this.orderItemsService.findOne(id, user);

    return {
      message: 'Lấy thông tin order item thành công',
      data: orderItem,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Patch(':id')
  @ApiOperation({ summary: 'Update order item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order item updated successfully',
    type: BaseResponseDto<OrderItemResponseDto>,
  })
  async update(
    @Param('id', ParseUUIDPipe) id: string,
    @Body() updateOrderItemDto: UpdateOrderItemDto,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<OrderItemResponseDto>> {
    const orderItem = await this.orderItemsService.update(
      id,
      updateOrderItemDto,
      user,
    );

    return {
      message: 'Cập nhật order item thành công',
      data: orderItem,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Delete(':id')
  @ApiOperation({ summary: 'Delete order item by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order item deleted successfully',
    type: BaseResponseDto<null>,
  })
  async remove(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User,
  ): Promise<BaseResponseDto<null>> {
    await this.orderItemsService.remove(id, user);

    return {
      message: 'Xóa order item thành công',
      data: null,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }
}
