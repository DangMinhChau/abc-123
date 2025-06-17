import {
  Controller,
  Post,
  Body,
  Get,
  Param,
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
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/requests/create-order.dto';
import { OptionalJwtAuthGuard, JwtAuthGuard } from '../../common/guards';
import { GetUser } from '../../common/decorators/get-user.decorator';
import { User } from '../../user/users/entities/user.entity';
import { BaseResponseDto, PaginatedResponseDto } from '../../common/dto';
import { OrderResponseDto } from './dto/responses';

@ApiTags('Orders')
@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  @ApiOperation({ summary: 'Create a new order' })
  @ApiResponse({
    status: 201,
    description: 'Order created successfully',
    type: BaseResponseDto<OrderResponseDto>,
  })
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: User | null,
  ): Promise<BaseResponseDto<OrderResponseDto>> {
    try {
      // Set userId from JWT if authenticated
      if (user && !createOrderDto.userId) {
        createOrderDto.userId = user.id;
      }

      const order = await this.ordersService.createOrder(createOrderDto);

      return {
        message: 'Đã tạo đơn hàng thành công',
        data: order,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Không thể tạo đơn hàng: ${errorMessage}`);
    }
  }

  @Post('paypal')
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  @ApiOperation({ summary: 'Create a new order with PayPal payment' })
  @ApiResponse({
    status: 201,
    description: 'PayPal order created successfully',
    type: BaseResponseDto<{ orderId: string; approvalUrl: string }>,
  })
  async createPayPalOrder(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: User | null,
  ): Promise<BaseResponseDto<{ orderId: string; approvalUrl: string }>> {
    try {
      // Set userId from JWT if authenticated
      if (user && !createOrderDto.userId) {
        createOrderDto.userId = user.id;
      }

      const result =
        await this.ordersService.createOrderWithPayPal(createOrderDto);

      return {
        message: 'Đã tạo đơn hàng PayPal thành công',
        data: {
          orderId: result.order.id,
          approvalUrl: result.approvalUrl,
        },
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Không thể tạo đơn hàng PayPal: ${errorMessage}`);
    }
  }

  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get order by ID' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: BaseResponseDto<OrderResponseDto>,
  })
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User | null,
  ): Promise<BaseResponseDto<OrderResponseDto>> {
    const order = await this.ordersService.findOrderById(id);

    // Check if user has permission to view this order
    if (order.user && user && order.user.id !== user.id) {
      throw new Error('Bạn không có quyền xem đơn hàng này');
    }

    return {
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('number/:orderNumber')
  @UseGuards(OptionalJwtAuthGuard)
  @ApiOperation({ summary: 'Get order by order number' })
  @ApiResponse({
    status: 200,
    description: 'Order retrieved successfully',
    type: BaseResponseDto<OrderResponseDto>,
  })
  async getOrderByNumber(
    @Param('orderNumber') orderNumber: string,
    @GetUser() user: User | null,
  ): Promise<BaseResponseDto<OrderResponseDto>> {
    const order = await this.ordersService.findOrderByNumber(orderNumber);

    // Check if user has permission to view this order
    if (order.user && user && order.user.id !== user.id) {
      throw new Error('Bạn không có quyền xem đơn hàng này');
    }

    return {
      message: 'Lấy thông tin đơn hàng thành công',
      data: order,
      meta: {
        timestamp: new Date().toISOString(),
      },
    };
  }

  @Get('user/me')
  @UseGuards(JwtAuthGuard) // Require authentication
  @ApiBearerAuth()
  @ApiOperation({ summary: 'Get current user orders with pagination' })
  @ApiResponse({
    status: 200,
    description: 'Orders retrieved successfully',
    type: PaginatedResponseDto<OrderResponseDto>,
  })
  async getMyOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @GetUser() user: User,
  ): Promise<PaginatedResponseDto<OrderResponseDto>> {
    const result = await this.ordersService.findOrdersByUser(
      user.id,
      Number(page),
      Number(limit),
    );

    return {
      message: 'Lấy danh sách đơn hàng thành công',
      data: result.orders,
      meta: {
        timestamp: new Date().toISOString(),
        page: result.page,
        limit: result.limit,
        total: result.total,
        totalPages: result.totalPages,
      },
    };
  }
}
