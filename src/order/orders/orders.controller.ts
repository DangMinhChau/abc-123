import {
  Controller,
  Post,
  Body,
  Get,
  Param,
  Query,
  UseGuards,
  HttpStatus,
  ParseUUIDPipe,
} from '@nestjs/common';
import { OrdersService } from './orders.service';
import { CreateOrderDto } from './dto/requests/create-order.dto';
import { OptionalJwtAuthGuard } from 'src/common/guards/optional-jwt-auth.guard';
import { JwtAuthGuard } from 'src/common/guards/jwt-auth.guard';
import { GetUser } from 'src/common/decorators/get-user.decorator';
import { User } from 'src/user/users/entities/user.entity';

@Controller('orders')
export class OrdersController {
  constructor(private readonly ordersService: OrdersService) {}

  @Post()
  @UseGuards(OptionalJwtAuthGuard) // Allow both authenticated and guest users
  async createOrder(
    @Body() createOrderDto: CreateOrderDto,
    @GetUser() user: User | null,
  ) {
    try {
      // Set userId from JWT if authenticated
      if (user && !createOrderDto.userId) {
        createOrderDto.userId = user.id;
      }

      const order = await this.ordersService.createOrder(createOrderDto);

      return {
        statusCode: HttpStatus.CREATED,
        message: 'Đã tạo đơn hàng thành công',
        data: order,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        statusCode: HttpStatus.BAD_REQUEST,
        message: 'Không thể tạo đơn hàng',
        data: null,
        error: errorMessage,
      };
    }
  }
  @Get(':id')
  @UseGuards(OptionalJwtAuthGuard)
  async getOrderById(
    @Param('id', ParseUUIDPipe) id: string,
    @GetUser() user: User | null,
  ) {
    try {
      const order = await this.ordersService.findOrderById(id);

      // Check if user has permission to view this order
      if (order.user && user && order.user.id !== user.id) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Bạn không có quyền xem đơn hàng này',
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Lấy thông tin đơn hàng thành công',
        data: order,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Không tìm thấy đơn hàng',
        data: null,
        error: errorMessage,
      };
    }
  }
  @Get('number/:orderNumber')
  @UseGuards(OptionalJwtAuthGuard)
  async getOrderByNumber(
    @Param('orderNumber') orderNumber: string,
    @GetUser() user: User | null,
  ) {
    try {
      const order = await this.ordersService.findOrderByNumber(orderNumber);

      // Check if user has permission to view this order
      if (order.user && user && order.user.id !== user.id) {
        return {
          statusCode: HttpStatus.FORBIDDEN,
          message: 'Bạn không có quyền xem đơn hàng này',
          data: null,
        };
      }

      return {
        statusCode: HttpStatus.OK,
        message: 'Lấy thông tin đơn hàng thành công',
        data: order,
        meta: {
          timestamp: new Date().toISOString(),
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        statusCode: HttpStatus.NOT_FOUND,
        message: 'Không tìm thấy đơn hàng',
        data: null,
        error: errorMessage,
      };
    }
  }
  @Get('user/me')
  @UseGuards(JwtAuthGuard) // Require authentication
  async getMyOrders(
    @Query('page') page = 1,
    @Query('limit') limit = 10,
    @GetUser() user: User,
  ) {
    try {
      const result = await this.ordersService.findOrdersByUser(
        user.id,
        Number(page),
        Number(limit),
      );

      return {
        statusCode: HttpStatus.OK,
        message: 'Lấy danh sách đơn hàng thành công',
        data: result.orders,
        meta: {
          timestamp: new Date().toISOString(),
          pagination: {
            page: result.page,
            limit: result.limit,
            total: result.total,
            totalPages: result.totalPages,
          },
        },
      };
    } catch (error) {
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error';
      return {
        statusCode: HttpStatus.INTERNAL_SERVER_ERROR,
        message: 'Không thể lấy danh sách đơn hàng',
        data: null,
        error: errorMessage,
      };
    }
  }
}
